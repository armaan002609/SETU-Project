<?php
header('Content-Type: application/json');
include 'db_connect.php';

// Fetch ALL live sessions from all teachers, newest first
$result = $conn->query(
    "SELECT ls.id, ls.session_title, ls.session_link, ls.status, ls.created_at,
            u.fullname AS teacher_name
     FROM live_sessions ls
     LEFT JOIN users u ON u.email = ls.teacher_email
     ORDER BY ls.id DESC"
);

$sessions = [];
while ($row = $result->fetch_assoc()) {
    $sessions[] = $row;
}

echo json_encode(["success" => true, "sessions" => $sessions]);
?>
