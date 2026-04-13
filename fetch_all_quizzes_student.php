<?php
header('Content-Type: application/json');
include 'db_connect.php';

$student_email = trim($_GET['email'] ?? '');

$result = $conn->query(
    "SELECT q.id, q.quiz_title, q.duration_mins, q.created_at, u.fullname AS teacher_name, q.teacher_email,
            a.score AS last_score, a.total_questions, a.retake_requested, a.retake_allowed, 
            IF(a.id IS NULL, 0, 1) AS already_taken
     FROM quizzes q
     LEFT JOIN users u ON u.email = q.teacher_email
     LEFT JOIN quiz_attempts a ON a.quiz_id = q.id AND a.student_email = '" . $conn->real_escape_string($student_email) . "'
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
        unset($q['correct_option']);
        $questions[] = $q;
    }
    $qstmt->close();
    $quiz['questions'] = $questions;
    $quizzes[] = $quiz;
}

echo json_encode(["success" => true, "quizzes" => $quizzes]);
?>
