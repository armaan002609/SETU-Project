<?php
header('Content-Type: application/json');
include 'db_connect.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = trim($_POST['email'] ?? '');
    
    if (empty($email)) {
        die(json_encode(["success" => false, "error" => "Unauthenticated user session!"]));
    }

    if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
        die(json_encode(["success" => false, "error" => "No file attached or file exceeds PHP POST payload limit sizes!"]));
    }

    $uploadDir = 'uploads/';
    // Securely spawn the uploads tracking path implicitly flawlessly routing directories
    if (!is_dir($uploadDir)) {
        mkdir($uploadDir, 0777, true);
    }

    $file = $_FILES['file'];
    $originalName = basename($file['name']);
    $fileType = $file['type'];
    $fileSize = $file['size'];
    
    $ext = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
    $storedFilename = md5(uniqid(rand(), true)) . '.' . $ext;
    
    $targetPath = $uploadDir . $storedFilename;

    if (move_uploaded_file($file['tmp_name'], $targetPath)) {
        $stmt = $conn->prepare("INSERT INTO content_uploads (uploader_email, original_filename, stored_filename, file_type, file_size_bytes) VALUES (?, ?, ?, ?, ?)");
        $stmt->bind_param("ssssi", $email, $originalName, $storedFilename, $fileType, $fileSize);
        if ($stmt->execute()) {
            echo json_encode(["success" => true, "message" => "File stored securely!", "filename" => $originalName]);
        } else {
            unlink($targetPath); // Rollback
            echo json_encode(["success" => false, "error" => "SQL Log failed: " . $stmt->error]);
        }
        $stmt->close();
    } else {
        echo json_encode(["success" => false, "error" => "File access permission moving path isolated!"]);
    }
}
?>
