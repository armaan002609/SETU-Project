<?php
header('Content-Type: application/json');
include 'db_connect.php';

// All quizzes from all teachers with their questions
$result = $conn->query(
    "SELECT q.id, q.quiz_title, q.duration_mins, q.created_at, u.fullname AS teacher_name, q.teacher_email
     FROM quizzes q
     LEFT JOIN users u ON u.email = q.teacher_email
     ORDER BY q.id DESC"
);

$quizzes = [];
while ($quiz = $result->fetch_assoc()) {
    $qstmt = $conn->prepare(
        "SELECT id, question_text, option_a, option_b, option_c, option_d, correct_option
         FROM quiz_questions WHERE quiz_id = ? ORDER BY id ASC"
    );
    $qstmt->bind_param("i", $quiz['id']);
    $qstmt->execute();
    $qres = $qstmt->get_result();
    $questions = [];
    while ($q = $qres->fetch_assoc()) {
        // Hide correct_option from student-facing API
        unset($q['correct_option']);
        $questions[] = $q;
    }
    $qstmt->close();
    $quiz['questions'] = $questions;
    $quizzes[] = $quiz;
}

echo json_encode(["success" => true, "quizzes" => $quizzes]);
?>
