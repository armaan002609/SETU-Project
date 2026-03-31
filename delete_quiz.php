<?php
header('Content-Type: application/json');
include 'db_connect.php';

$json = file_get_contents('php://input');
$data = json_decode($json, true);

$quiz_id = intval($data['quiz_id'] ?? 0);
$email   = trim($data['email'] ?? '');

if (!$quiz_id || empty($email)) {
    echo json_encode(["success" => false, "error" => "Missing quiz_id or email."]);
    exit;
}

// Verify ownership before deleting
$check = $conn->prepare("SELECT id FROM quizzes WHERE id = ? AND teacher_email = ?");
$check->bind_param("is", $quiz_id, $email);
$check->execute();
if ($check->get_result()->num_rows === 0) {
    echo json_encode(["success" => false, "error" => "Unauthorized or quiz not found."]);
    exit;
}
$check->close();

// quiz_questions will cascade-delete due to FOREIGN KEY ON DELETE CASCADE
$del = $conn->prepare("DELETE FROM quizzes WHERE id = ? AND teacher_email = ?");
$del->bind_param("is", $quiz_id, $email);
if ($del->execute()) {
    echo json_encode(["success" => true]);
} else {
    echo json_encode(["success" => false, "error" => $del->error]);
}
$del->close();
?>
