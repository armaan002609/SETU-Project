<?php
header('Content-Type: application/json');
include 'db_connect.php';

$email = $_GET['email'] ?? '';
if (empty($email)) {
    echo json_encode(["success" => false, "error" => "Missing email."]);
    exit;
}

$stmt = $conn->prepare("SELECT id, session_title, session_link, status, created_at FROM live_sessions WHERE teacher_email = ? ORDER BY id DESC");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

$sessions = [];
while ($row = $result->fetch_assoc()) {
    $sessions[] = $row;
}
$stmt->close();

echo json_encode(["success" => true, "sessions" => $sessions]);
?>
