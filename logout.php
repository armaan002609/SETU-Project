<?php
header('Content-Type: application/json');
include 'db_connect.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $json = file_get_contents('php://input');
    $data = json_decode($json);

    if (isset($data->email)) {
        $email = trim($data->email);
        
        // Remove active state
        try {
            $update_stmt = $conn->prepare("UPDATE users SET is_logged_in = 0 WHERE email = ?");
            if ($update_stmt) {
                $update_stmt->bind_param("s", $email);
                $update_stmt->execute();
                $update_stmt->close();
            }
        } catch (Exception $e) {
            // Silently ignore if column hasn't been added yet
        }
        
        echo json_encode(["success" => true]);
    } else {
        echo json_encode(["success" => false, "error" => "No email provided"]);
    }
} else {
    echo json_encode(["error" => "Invalid Request Format"]);
}

$conn->close();
?>
