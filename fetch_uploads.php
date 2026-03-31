<?php
header('Content-Type: application/json');
include 'db_connect.php';

$email = $_GET['email'] ?? '';

if(empty($email)) {
    echo json_encode(["success" => false, "error" => "Missing email authentication."]);
    exit;
}

$stmt = $conn->prepare("SELECT id, original_filename, stored_filename, file_type, file_size_bytes, uploaded_at FROM content_uploads WHERE uploader_email = ? ORDER BY uploaded_at DESC");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

$files = [];
while ($row = $result->fetch_assoc()) {
    $files[] = $row;
}
$stmt->close();

echo json_encode(["success" => true, "files" => $files]);
?>
