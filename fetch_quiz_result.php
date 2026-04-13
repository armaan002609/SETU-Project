<?php
header('Content-Type: application/json');
include 'db_connect.php';

$quiz_id       = intval($_GET['quiz_id'] ?? 0);
$student_email = trim($_GET['email'] ?? '');

if (!$quiz_id || !$student_email) {
    echo json_encode(["success" => false, "error" => "Missing parameters."]);
    exit;
}

// 1. Fetch the attempt summary
$astmt = $conn->prepare("SELECT id, score, total_questions FROM quiz_attempts WHERE quiz_id = ? AND student_email = ?");
$astmt->bind_param("is", $quiz_id, $student_email);
$astmt->execute();
$ares = $astmt->get_result();
$attempt = $ares->fetch_assoc();
$astmt->close();

if (!$attempt) {
    echo json_encode(["success" => false, "error" => "No attempt found."]);
    exit;
}

$attempt_id = $attempt['id'];

// 2. Fetch full details: questions joined with student's answers
$dstmt = $conn->prepare("
    SELECT q.id, q.question_text, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_option, q.explanation, 
           IFNULL(sa.selected_option, '') as student_answer
    FROM quiz_questions q
    LEFT JOIN quiz_student_answers sa ON sa.question_id = q.id AND sa.attempt_id = ?
    WHERE q.quiz_id = ?
    ORDER BY q.id ASC
");
$dstmt->bind_param("ii", $attempt_id, $quiz_id);
$dstmt->execute();
$dres = $dstmt->get_result();
$review_data = [];
while ($row = $dres->fetch_assoc()) {
    $review_data[] = $row;
}
$dstmt->close();

$score = $attempt['score'];
$total = $attempt['total_questions'];

echo json_encode([
    "success"     => true,
    "score"       => $score,
    "total"       => $total,
    "percent"     => $total > 0 ? round(($score / $total) * 100) : 0,
    "review_data" => $review_data
]);
?>
