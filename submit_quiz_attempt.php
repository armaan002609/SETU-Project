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
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
)");

$json = file_get_contents('php://input');
$data = json_decode($json, true);

$quiz_id       = intval($data['quiz_id'] ?? 0);
$student_email = trim($data['student_email'] ?? '');
$student_name  = trim($data['student_name'] ?? 'Unknown');
$answers       = $data['answers'] ?? []; // [{ question_id, selected }]

if (!$quiz_id || empty($student_email) || empty($answers)) {
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

// Store attempt
$stmt = $conn->prepare(
    "INSERT INTO quiz_attempts (quiz_id, student_email, student_name, score, total_questions) VALUES (?, ?, ?, ?, ?)"
);
$stmt->bind_param("issii", $quiz_id, $student_email, $student_name, $score, $total);
$stmt->execute();
$stmt->close();

echo json_encode([
    "success" => true,
    "score"   => $score,
    "total"   => $total,
    "percent" => $total > 0 ? round(($score / $total) * 100) : 0
]);
?>
