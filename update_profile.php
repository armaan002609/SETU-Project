<?php
header('Content-Type: application/json');
include 'db_connect.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $json = file_get_contents('php://input');
    $data = json_decode($json);

    $email = trim($data->email ?? '');
    
    if(empty($email)) {
        echo json_encode(["success" => false, "error" => "Email validation tracking missing."]);
        exit;
    }

    $updates = [];
    $types = "";
    $params = [];

    if (!empty($data->fullname)) {
        $updates[] = "fullname = ?";
        $types .= "s";
        $params[] = trim($data->fullname);
    }
    
    if (isset($data->subject)) { 
        $updates[] = "subject = ?";
        $types .= "s";
        $params[] = trim($data->subject);
    }
    
    if (isset($data->school_name)) {
        $updates[] = "school_name = ?";
        $types .= "s";
        $params[] = trim($data->school_name);
    }
    
    if (isset($data->class_name)) {
        $updates[] = "class_name = ?";
        $types .= "s";
        $params[] = trim($data->class_name);
    }
    
    if (isset($data->roll_no)) {
        $updates[] = "roll_no = ?";
        $types .= "s";
        $params[] = trim($data->roll_no);
    }

    if(count($updates) == 0) {
         echo json_encode(["success" => true, "message" => "No SQL updates dispatched."]);
         exit;
    }

    $types .= "s";
    $params[] = $email;

    $sql = "UPDATE users SET " . implode(", ", $updates) . " WHERE email = ?";
    $update_stmt = $conn->prepare($sql);
    
    if($update_stmt) {
        $update_stmt->bind_param($types, ...$params);
        if($update_stmt->execute()) {
            echo json_encode(["success" => true]);
        } else {
            echo json_encode(["success" => false, "error" => "Database update blocked natively!"]);
        }
        $update_stmt->close();
    } else {
        echo json_encode(["success" => false, "error" => "SQL preparation array failed."]);
    }
}
?>
