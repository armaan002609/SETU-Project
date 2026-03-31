<?php
header('Content-Type: application/json');
include 'db_connect.php';

$json = file_get_contents('php://input');
$data = json_decode($json, true);

$id    = intval($data['id'] ?? 0);
$email = trim($data['email'] ?? '');

if (!$id || empty($email)) {
    echo json_encode(["success" => false, "error" => "Missing id or email."]);
    exit;
}

// Verify ownership
$check = $conn->prepare("SELECT id FROM live_sessions WHERE id = ? AND teacher_email = ?");
$check->bind_param("is", $id, $email);
$check->execute();
if ($check->get_result()->num_rows === 0) {
    echo json_encode(["success" => false, "error" => "Unauthorized or session not found."]);
    exit;
}
$check->close();

$del = $conn->prepare("DELETE FROM live_sessions WHERE id = ? AND teacher_email = ?");
$del->bind_param("is", $id, $email);
if ($del->execute()) {
    echo json_encode(["success" => true]);
} else {
    echo json_encode(["success" => false, "error" => $del->error]);
}
$del->close();
?>
