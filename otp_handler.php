<?php
header('Content-Type: application/json');
include 'db_connect.php';

$json = file_get_contents('php://input');
$data = json_decode($json, true);

$action = $data['action'] ?? '';
$email  = trim($data['email'] ?? '');
$code   = trim($data['code'] ?? '');

if (!$email) {
    echo json_encode(["success" => false, "error" => "Email is required."]);
    exit;
}

if ($action === 'send_otp') {
    // Generate a 6-digit code
    $otp = str_pad(rand(0, 999999), 6, '0', STR_PAD_LEFT);
    
    // Clear old codes for this email
    $conn->query("DELETE FROM user_verifications WHERE email = '$email'");
    
    // Store new code
    $stmt = $conn->prepare("INSERT INTO user_verifications (email, otp_code) VALUES (?, ?)");
    $stmt->bind_param("ss", $email, $otp);
    
    if ($stmt->execute()) {
        // MOCK EMAIL SENDING: In a real app, use PHPMailer here.
        // For local development, we return the OTP so the user can see it in console/alert.
        echo json_encode([
            "success" => true, 
            "message" => "OTP generated successfully.",
            "mode"    => "MOCK",
            "otp"     => $otp // Only for local testing!
        ]);
    } else {
        echo json_encode(["success" => false, "error" => "Failed to generate OTP."]);
    }
    $stmt->close();

} elseif ($action === 'verify_otp') {
    if (!$code) {
        echo json_encode(["success" => false, "error" => "OTP code is required."]);
        exit;
    }
    
    $stmt = $conn->prepare("SELECT id FROM user_verifications WHERE email = ? AND otp_code = ? AND expires_at > NOW()");
    $stmt->bind_param("ss", $email, $code);
    $stmt->execute();
    $res = $stmt->get_result();
    
    if ($res->num_rows > 0) {
        // OTP is valid!
        // Mark user as verified if they already exist
        $conn->query("UPDATE users SET is_verified = 1 WHERE email = '$email'");
        
        // Clean up
        $conn->query("DELETE FROM user_verifications WHERE email = '$email'");
        
        echo json_encode(["success" => true, "message" => "Verification successful!"]);
    } else {
        echo json_encode(["success" => false, "error" => "Invalid or expired OTP."]);
    }
    $stmt->close();

} else {
    echo json_encode(["success" => false, "error" => "Invalid action."]);
}
?>
