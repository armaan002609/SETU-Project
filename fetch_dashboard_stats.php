<?php
header('Content-Type: application/json');
include 'db_connect.php';

$email = $_GET['email'] ?? '';
if (empty($email)) {
    echo json_encode(["success" => false, "error" => "Missing email."]);
    exit;
}

// Total registered students (all, not just this teacher's)
$r1 = $conn->query("SELECT COUNT(*) AS cnt FROM users WHERE role = 'Student'");
$total_students = $r1->fetch_assoc()['cnt'] ?? 0;

// Active live sessions for THIS teacher right now
$s2 = $conn->prepare("SELECT COUNT(*) AS cnt FROM live_sessions WHERE teacher_email = ? AND status = 'Live'");
$s2->bind_param("s", $email);
$s2->execute();
$active_sessions = $s2->get_result()->fetch_assoc()['cnt'] ?? 0;
$s2->close();

// Total uploaded content by THIS teacher
$s3 = $conn->prepare("SELECT COUNT(*) AS cnt FROM content_uploads WHERE uploader_email = ?");
$s3->bind_param("s", $email);
$s3->execute();
$uploaded_content = $s3->get_result()->fetch_assoc()['cnt'] ?? 0;
$s3->close();

// Total quizzes by THIS teacher
$s4 = $conn->prepare("SELECT COUNT(*) AS cnt FROM quizzes WHERE teacher_email = ?");
$s4->bind_param("s", $email);
$s4->execute();
$total_quizzes = $s4->get_result()->fetch_assoc()['cnt'] ?? 0;
$s4->close();

echo json_encode([
    "success"          => true,
    "total_students"   => (int)$total_students,
    "active_sessions"  => (int)$active_sessions,
    "uploaded_content" => (int)$uploaded_content,
    "total_quizzes"    => (int)$total_quizzes
]);
?>
