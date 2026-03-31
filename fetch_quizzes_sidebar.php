<?php
header('Content-Type: application/json');
include 'db_connect.php';

$email = $_GET['email'] ?? '';
if (empty($email)) {
    echo json_encode(["success" => false, "error" => "Missing email."]);
    exit;
}

$stmt = $conn->prepare(
    "SELECT id, quiz_title, duration_mins, created_at FROM quizzes WHERE teacher_email = ? ORDER BY id DESC"
);
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

$quizzes = [];
while ($quiz = $result->fetch_assoc()) {
    // Fetch questions for this quiz
    $qstmt = $conn->prepare(
        "SELECT id, question_text, option_a, option_b, option_c, option_d, correct_option FROM quiz_questions WHERE quiz_id = ? ORDER BY id ASC"
    );
    $qstmt->bind_param("i", $quiz['id']);
    $qstmt->execute();
    $qres = $qstmt->get_result();
    $questions = [];
    while ($q = $qres->fetch_assoc()) {
        $questions[] = $q;
    }
    $qstmt->close();
    $quiz['questions'] = $questions;
    $quizzes[] = $quiz;
}
$stmt->close();

echo json_encode(["success" => true, "quizzes" => $quizzes]);
?>
