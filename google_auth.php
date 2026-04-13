<?php
session_start();
header('Content-Type: application/json');
include 'db_connect.php';
include 'config.php';

$json = file_get_contents('php://input');
$data = json_decode($json, true);

$id_token = $data['id_token'] ?? '';

if (!$id_token) {
    echo json_encode(["success" => false, "error" => "ID token is missing."]);
    exit;
}

// Verify ID token via Google's tokeninfo endpoint
// (For production, manually verify the JWT or use the Google PHP Client Library)
$url = "https://oauth2.googleapis.com/tokeninfo?id_token=" . $id_token;
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
$response = curl_exec($ch);
$info = json_decode($response, true);
curl_close($ch);

if (!isset($info['aud']) || $info['aud'] !== GOOGLE_CLIENT_ID) {
    echo json_encode(["success" => false, "error" => "Invalid ID token."]);
    exit;
}

$email    = $info['email'];
$fullname = $info['name'];
$profile_pic = $info['picture'] ?? '';

// Check if user exists
$stmt = $conn->prepare("SELECT id, fullname, role, subject, emp_id, school_name, class_name, roll_no FROM users WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$res = $stmt->get_result();
$user = $res->fetch_assoc();
$stmt->close();

if (!$user) {
    // AUTO-REGISTER new user as 'Student' by default
    $default_role = "Student";
    $dummy_pass   = password_hash(bin2hex(random_bytes(10)), PASSWORD_DEFAULT);
    
    $istmt = $conn->prepare("INSERT INTO users (fullname, email, role, password, is_verified) VALUES (?, ?, ?, ?, 1)");
    $istmt->bind_param("ssss", $fullname, $email, $default_role, $dummy_pass);
    
    if ($istmt->execute()) {
        $user = [
            'id' => $istmt->insert_id,
            'fullname' => $fullname,
            'role' => $default_role,
            'subject' => '',
            'emp_id' => '',
            'school_name' => '',
            'class_name' => '',
            'roll_no' => ''
        ];
    } else {
        echo json_encode(["success" => false, "error" => "Registration via Google failed."]);
        exit;
    }
    $istmt->close();
}

// Set Session
$_SESSION['user_id'] = $user['id'];
$_SESSION['email']   = $email;
$_SESSION['role']    = $user['role'];

echo json_encode([
    "success"     => true,
    "fullname"    => $user['fullname'],
    "role"        => $user['role'],
    "subject"     => $user['subject'] ?? '',
    "emp_id"      => $user['emp_id'] ?? '',
    "school_name" => $user['school_name'] ?? '',
    "class_name"  => $user['class_name'] ?? '',
    "roll_no"     => $user['roll_no'] ?? ''
]);
?>
