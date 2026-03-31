<?php
header('Content-Type: application/json');
include 'db_connect.php';

$json = file_get_contents('php://input');
$data = json_decode($json);

$id = $data->id ?? '';
$email = $data->email ?? '';

if(empty($id) || empty($email)) {
    echo json_encode(["success" => false, "error" => "ID footprint mismatch tracking blocked!"]);
    exit;
}

$stmt = $conn->prepare("SELECT stored_filename FROM content_uploads WHERE id = ? AND uploader_email = ?");
$stmt->bind_param("is", $id, $email);
$stmt->execute();
$result = $stmt->get_result();
if($row = $result->fetch_assoc()) {
    $filepath = 'uploads/' . $row['stored_filename'];
    if(file_exists($filepath)){
        unlink($filepath);
    }
    
    $del = $conn->prepare("DELETE FROM content_uploads WHERE id = ?");
    $del->bind_param("i", $id);
    if($del->execute()){
         echo json_encode(["success" => true]);
    } else {
         echo json_encode(["success" => false, "error" => "Delete query tracking explicit missing SQL."]);
    }
    $del->close();
} else {
    echo json_encode(["success" => false, "error" => "Unauthorized explicit payload request."]);
}
$stmt->close();
?>
