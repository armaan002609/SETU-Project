<?php
header('Content-Type: application/json');
include 'db_connect.php';

$email = $_GET['email'] ?? '';
if (empty($email)) {
    echo json_encode(["success" => false, "error" => "Missing email."]);
    exit;
}

// Fetch only video/recorded files for this teacher
$stmt = $conn->prepare(
    "SELECT id, original_filename, stored_filename, file_type, file_size_bytes, uploaded_at
     FROM content_uploads
     WHERE uploader_email = ?
       AND (file_type LIKE 'video/%'
            OR original_filename LIKE '%.mp4'
            OR original_filename LIKE '%.avi'
            OR original_filename LIKE '%.mov'
            OR original_filename LIKE '%.mkv'
            OR original_filename LIKE '%.webm')
     ORDER BY uploaded_at DESC"
);
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

$videos = [];
while ($row = $result->fetch_assoc()) {
    $videos[] = $row;
}
$stmt->close();

echo json_encode(["success" => true, "videos" => $videos]);
?>
