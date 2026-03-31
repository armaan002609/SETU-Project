<?php
header('Content-Type: application/json');
include 'db_connect.php';

$json = file_get_contents('php://input');
$data = json_decode($json, true);

$quiz_id   = intval($data['quiz_id'] ?? 0);
$email     = trim($data['email'] ?? '');
$questions = $data['questions'] ?? [];

if (!$quiz_id || empty($email) || empty($questions)) {
    echo json_encode(["success" => false, "error" => "Missing quiz_id, email, or questions."]);
    exit;
}

// Verify this quiz belongs to this teacher
$check = $conn->prepare("SELECT id FROM quizzes WHERE id = ? AND teacher_email = ?");
$check->bind_param("is", $quiz_id, $email);
$check->execute();
if ($check->get_result()->num_rows === 0) {
    echo json_encode(["success" => false, "error" => "Unauthorized access to quiz."]);
    exit;
}
$check->close();

$stmt = $conn->prepare(
    "INSERT INTO quiz_questions (quiz_id, question_text, option_a, option_b, option_c, option_d, correct_option)
     VALUES (?, ?, ?, ?, ?, ?, ?)"
);

$saved = 0;
foreach ($questions as $q) {
    $qtext   = trim($q['question_text'] ?? '');
    $opt_a   = trim($q['option_a'] ?? '');
    $opt_b   = trim($q['option_b'] ?? '');
    $opt_c   = trim($q['option_c'] ?? '');
    $opt_d   = trim($q['option_d'] ?? '');
    $correct = strtoupper(trim($q['correct_option'] ?? 'A'));

    if (empty($qtext) || empty($opt_a) || empty($opt_b)) continue; // need at least 2 options

    $stmt->bind_param("issssss", $quiz_id, $qtext, $opt_a, $opt_b, $opt_c, $opt_d, $correct);
    if ($stmt->execute()) $saved++;
}
$stmt->close();

echo json_encode(["success" => true, "saved" => $saved]);
?>
