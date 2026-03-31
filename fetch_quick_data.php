<?php
header('Content-Type: application/json');
include 'db_connect.php';

$email = $_GET['email'] ?? '';

if(empty($email)) {
    echo json_encode(["success" => false, "error" => "Authentication mapping absent."]);
    exit;
}

// Extract the freshest live session natively
$live_stmt = $conn->prepare("SELECT session_title, session_link FROM live_sessions WHERE teacher_email = ? AND status='Live' ORDER BY id DESC LIMIT 1");
$live_stmt->bind_param("s", $email);
$live_stmt->execute();
$live_res = $live_stmt->get_result();
$live = $live_res->fetch_assoc();
$live_stmt->close();

// Extract all quiz tracking data cleanly
$quiz_stmt = $conn->prepare("SELECT id, quiz_title, duration_mins, created_at FROM quizzes WHERE teacher_email = ? ORDER BY id DESC");
$quiz_stmt->bind_param("s", $email);
$quiz_stmt->execute();
$quiz_res = $quiz_stmt->get_result();
$quizzes = [];
while($row = $quiz_res->fetch_assoc()) {
    $quizzes[] = $row;
}
$quiz_stmt->close();

echo json_encode(["success" => true, "live" => $live, "quizzes" => $quizzes]);
?>
