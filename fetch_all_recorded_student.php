<?php
header('Content-Type: application/json');
include 'db_connect.php';

// All video uploads from all teachers
$result = $conn->query(
    "SELECT cu.id, cu.original_filename, cu.stored_filename, cu.file_size_bytes, cu.uploaded_at,
            u.fullname AS teacher_name
     FROM content_uploads cu
     LEFT JOIN users u ON u.email = cu.uploader_email
     WHERE cu.file_type LIKE 'video/%'
        OR cu.original_filename LIKE '%.mp4'
        OR cu.original_filename LIKE '%.avi'
        OR cu.original_filename LIKE '%.mov'
        OR cu.original_filename LIKE '%.mkv'
        OR cu.original_filename LIKE '%.webm'
     ORDER BY cu.uploaded_at DESC"
);

$videos = [];
while ($row = $result->fetch_assoc()) {
    $videos[] = $row;
}

echo json_encode(["success" => true, "videos" => $videos]);
?>
