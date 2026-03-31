<?php
header('Content-Type: application/json'); // Respond entirely via JSON for UI interaction mapping

include 'db_connect.php';

// Ensure the incoming request validates properly
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    
    // Decrypt the raw frontend fetch JSON payload 
    $json = file_get_contents('php://input');
    $data = json_decode($json);

    if (isset($data->fullname)) {
        $fullname = trim($data->fullname);
        $email = trim($data->email);
        $password = $data->password;
        $role = trim($data->role);
        $subject = isset($data->subject) ? trim($data->subject) : null;
        $school_name = isset($data->school_name) ? trim($data->school_name) : null;
        $class_name = isset($data->class_name) ? trim($data->class_name) : null;
    } else {
        // Fallback for isolated legacy HTML requests 
        $fullname = trim($_POST['fullname'] ?? '');
        $email = trim($_POST['email'] ?? '');
        $password = $_POST['password'] ?? '';
        $role = trim($_POST['role'] ?? '');
        $subject = trim($_POST['subject'] ?? '');
        $school_name = trim($_POST['school_name'] ?? '');
        $class_name = trim($_POST['class_name'] ?? '');
    }

    // Safety Parameter Guard
    if (empty($fullname) || empty($email) || empty($password) || empty($role)) {
        echo json_encode(["error" => "All fields are absolutely required!"]);
        exit;
    }

    // Modern highly secured backend salting mechanism natively via PHP BCrypt architecture
    $hashed_password = password_hash($password, PASSWORD_BCRYPT);

    // Stage 1: Security Validation -> Search for active Email footprints in storage to negate constraint collapses securely
    $stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $stmt->store_result();

    if ($stmt->num_rows > 0) {
        echo json_encode(["error" => "This email account is already registered!"]);
        $stmt->close();
        exit;
    }
    $stmt->close();

    // Stage 2: Verified Secure Write Deployment!
    $insert_stmt = $conn->prepare("INSERT INTO users (fullname, email, role, password, subject, school_name, class_name) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $insert_stmt->bind_param("sssssss", $fullname, $email, $role, $hashed_password, $subject, $school_name, $class_name);

    if ($insert_stmt->execute()) {
        $new_id = $insert_stmt->insert_id;
        
        // Dynamically assign the EMP auto-identifier directly binding to row ID
        if ($role === 'Teacher') {
            $emp_id = "EMP" . str_pad($new_id, 3, "0", STR_PAD_LEFT);
            try {
                $update_emp = $conn->prepare("UPDATE users SET emp_id = ? WHERE id = ?");
                if($update_emp) {
                    $update_emp->bind_param("si", $emp_id, $new_id);
                    $update_emp->execute();
                    $update_emp->close();
                }
            } catch(Exception $e){}
        }

        echo json_encode(["success" => true, "message" => "Registration successful! Data sent to MySQL."]);
    } else {
        echo json_encode(["error" => "Error registering user: " . $insert_stmt->error]);
    }

    $insert_stmt->close();
} else {
    echo json_encode(["error" => "Invalid Request Format Method."]);
}

$conn->close();
?>
