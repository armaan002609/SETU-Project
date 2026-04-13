<?php
header('Content-Type: application/json');
include 'db_connect.php';

// Auto-create quiz_attempts table if it doesn't exist
$conn->query("CREATE TABLE IF NOT EXISTS quiz_attempts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    quiz_id INT NOT NULL,
    student_email VARCHAR(255) NOT NULL,
    student_name VARCHAR(255),
    score INT NOT NULL,
    total_questions INT NOT NULL,
    retake_requested TINYINT DEFAULT 0,
    retake_allowed TINYINT DEFAULT 0,
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
)");

// Auto-create quiz_student_answers table if it doesn't exist
$conn->query("CREATE TABLE IF NOT EXISTS quiz_student_answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    attempt_id INT NOT NULL,
    question_id INT NOT NULL,
    selected_option CHAR(1),
    FOREIGN KEY (attempt_id) REFERENCES quiz_attempts(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES quiz_questions(id) ON DELETE CASCADE
)");

$json = file_get_contents('php://input');
$data = json_decode($json, true);

$quiz_id       = intval($data['quiz_id'] ?? 0);
$student_email = trim($data['student_email'] ?? '');
$student_name  = trim($data['student_name'] ?? 'Unknown');
$answers       = $data['answers'] ?? []; // [{ question_id, selected }]

if (!$quiz_id || empty($student_email)) {
    echo json_encode(["success" => false, "error" => "Missing required fields."]);
    exit;
}

// Fetch correct answers
$qstmt = $conn->prepare("SELECT id, correct_option FROM quiz_questions WHERE quiz_id = ?");
$qstmt->bind_param("i", $quiz_id);
$qstmt->execute();
$qres = $qstmt->get_result();
$correct_map = [];
while ($row = $qres->fetch_assoc()) {
    $correct_map[$row['id']] = $row['correct_option'];
}
$qstmt->close();

// Grade
$score = 0;
foreach ($answers as $ans) {
    $qid      = intval($ans['question_id']);
    $selected = strtoupper(trim($ans['selected'] ?? ''));
    if (isset($correct_map[$qid]) && $correct_map[$qid] === $selected) {
        $score++;
    }
}
$total = count($correct_map);

// Check if attempt already exists for UPSERT logic
$checkstmt = $conn->prepare("SELECT id FROM quiz_attempts WHERE quiz_id = ? AND student_email = ?");
$checkstmt->bind_param("is", $quiz_id, $student_email);
$checkstmt->execute();
$checkres = $checkstmt->get_result();
$existing = $checkres->fetch_assoc();
$checkstmt->close();

$attempt_id = 0;
if ($existing) {
    $attempt_id = $existing['id'];
    // Update existing attempt and RESET retake flags
    $stmt = $conn->prepare(
        "UPDATE quiz_attempts SET score = ?, total_questions = ?, retake_allowed = 0, retake_requested = 0, attempted_at = CURRENT_TIMESTAMP WHERE id = ?"
    );
    $stmt->bind_param("iii", $score, $total, $attempt_id);
    $stmt->execute();
    $stmt->close();
} else {
    // Store new attempt
    $stmt = $conn->prepare(
        "INSERT INTO quiz_attempts (quiz_id, student_email, student_name, score, total_questions) VALUES (?, ?, ?, ?, ?)"
    );
    $stmt->bind_param("issii", $quiz_id, $student_email, $student_name, $score, $total);
    $stmt->execute();
    $attempt_id = $stmt->insert_id;
    $stmt->close();
}

// Clear old answers for this attempt and SAVE new ones
$conn->query("DELETE FROM quiz_student_answers WHERE attempt_id = $attempt_id");
if (!empty($answers)) {
    $astmt = $conn->prepare("INSERT INTO quiz_student_answers (attempt_id, question_id, selected_option) VALUES (?, ?, ?)");
    foreach ($answers as $ans) {
        $qid = intval($ans['question_id']);
        $sel = strtoupper(trim($ans['selected'] ?? ''));
        $astmt->bind_param("iis", $attempt_id, $qid, $sel);
        $astmt->execute();
    }
    $astmt->close();
}

// Fetch full details for review
$dstmt = $conn->prepare("SELECT q.id, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_option, q.explanation, IFNULL(sa.selected_option, '') as student_answer
                        FROM quiz_questions q
                        LEFT JOIN quiz_student_answers sa ON sa.question_id = q.id AND sa.attempt_id = ?
                        WHERE q.quiz_id = ?");
$dstmt->bind_param("ii", $attempt_id, $quiz_id);
$dstmt->execute();
$dres = $dstmt->get_result();
$review_data = [];
while ($row = $dres->fetch_assoc()) {
    $review_data[] = $row;
}
$dstmt->close();

echo json_encode([
    "success"     => true,
    "score"       => $score,
    "total"       => $total,
    "percent"     => $total > 0 ? round(($score / $total) * 100) : 0,
    "review_data" => $review_data,
    "attempt_id"  => $attempt_id
]);
?>
