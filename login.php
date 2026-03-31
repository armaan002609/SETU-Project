<?php
header('Content-Type: application/json');

include 'db_connect.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $json = file_get_contents('php://input');
    $data = json_decode($json);

    if (isset($data->email)) {
        $email = trim($data->email);
        $password = $data->password;
        $role = trim($data->role);
    } else {
        $email = trim($_POST['email'] ?? '');
        $password = $_POST['password'] ?? '';
        $role = trim($_POST['role'] ?? '');
    }

    if (empty($email) || empty($password)) {
        http_response_code(400);
        echo json_encode(["success" => false, "error" => "Email and password are required."]);
        exit;
    }

    // Explicit parameterized security protocol using unique email mapping intrinsically tracking role datasets
    $stmt = $conn->prepare("SELECT id, fullname, role, subject, emp_id, school_name, class_name, roll_no, password FROM users WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        $row = $result->fetch_assoc();
        
        // Verify the secure hash exactly mitigating timing attacks safely!
        if (password_verify($password, $row['password'])) {
            
            // Set user to active state (Fail-safe check if column exists)
            try {
                $update_stmt = $conn->prepare("UPDATE users SET is_logged_in = 1 WHERE id = ?");
                if ($update_stmt) {
                    $update_stmt->bind_param("i", $row['id']);
                    $update_stmt->execute();
                    $update_stmt->close();
                }
            } catch (Exception $e) {
                // Silently ignore if column hasn't been added yet
            }

            echo json_encode([
                "success" => true,
                "fullname" => $row['fullname'],
                "role" => $row['role'],
                "subject" => $row['subject'],
                "emp_id" => $row['emp_id'],
                "school_name" => $row['school_name'],
                "class_name" => $row['class_name'],
                "roll_no" => $row['roll_no']
            ]);
        } else {
            http_response_code(401);
            echo json_encode(["success" => false, "error" => "Incorrect password!"]);
        }
    } else {
        http_response_code(404);
        echo json_encode(["success" => false, "error" => "No account found matching that email and role!"]);
    }

    $stmt->close();
} else {
    http_response_code(405);
    echo json_encode(["success" => false, "error" => "Invalid Request Format."]);
}

$conn->close();
?>
