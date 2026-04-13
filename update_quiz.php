<?php
header('Content-Type: application/json');
include 'db_connect.php';

$json = file_get_contents('php://input');
$data = json_decode($json, true);

$quiz_id   = intval($data['quiz_id'] ?? 0);
$email     = trim($data['email'] ?? '');
$title     = trim($data['title'] ?? '');
$duration  = intval($data['duration'] ?? 0);
$questions = $data['questions'] ?? [];

if (!$quiz_id || empty($email) || empty($title) || !$duration) {
    echo json_encode(["success" => false, "error" => "Missing required fields."]);
    exit;
}

// Verify ownership
$check = $conn->prepare("SELECT id FROM quizzes WHERE id = ? AND teacher_email = ?");
$check->bind_param("is", $quiz_id, $email);
$check->execute();
if ($check->get_result()->num_rows === 0) {
    echo json_encode(["success" => false, "error" => "Unauthorized."]);
    exit;
}
$check->close();

// Update quiz meta
$upd = $conn->prepare("UPDATE quizzes SET quiz_title = ?, duration_mins = ? WHERE id = ?");
$upd->bind_param("sii", $title, $duration, $quiz_id);
$upd->execute();
$upd->close();

// Delete old questions, then re-insert updated ones
$conn->query("DELETE FROM quiz_questions WHERE quiz_id = $quiz_id");

if (!empty($questions)) {
    $qstmt = $conn->prepare(
        "INSERT INTO quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option, explanation) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
    );
    foreach ($questions as $q) {
        $qtext   = trim($q['question_text'] ?? '');
        $opt_a   = trim($q['option_a'] ?? '');
        $opt_b   = trim($q['option_b'] ?? '');
        $opt_c   = trim($q['option_c'] ?? '');
        $opt_d   = trim($q['option_d'] ?? '');
        $correct = strtoupper(trim($q['correct_option'] ?? 'A'));
        $expl    = trim($q['explanation'] ?? '');
        if (empty($qtext) || empty($opt_a) || empty($opt_b)) continue;
        $qstmt->bind_param("isssssss", $quiz_id, $qtext, $opt_a, $opt_b, $opt_c, $opt_d, $correct, $expl);
        $qstmt->execute();
    }
    $qstmt->close();
}

echo json_encode(["success" => true]);
?>
