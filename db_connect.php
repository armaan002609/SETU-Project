<?php
// Centralized Database Connection Module
ini_set('display_errors', 0);
error_reporting(0);

$host = "localhost";
$username = "root";  // Default XAMPP username
$password = "";      // Default XAMPP password is empty
$database = "setu_db";

// Create connection
$conn = new mysqli($host, $username, $password, $database);

// Check connection and gracefully handle errors
if ($conn->connect_error) {
    die(json_encode(["error" => "MySQL Connection Failed: " . $conn->connect_error]));
}

// Auto-migrate schema updates safely trapping errors!
try {
    $check_login = $conn->query("SHOW COLUMNS FROM users LIKE 'is_logged_in'");
    if ($check_login && $check_login->num_rows == 0) {
        $conn->query("ALTER TABLE users ADD COLUMN is_logged_in TINYINT(1) DEFAULT 0");
    }

    $check_subject = $conn->query("SHOW COLUMNS FROM users LIKE 'subject'");
    if ($check_subject && $check_subject->num_rows == 0) {
        $conn->query("ALTER TABLE users ADD COLUMN subject VARCHAR(255) DEFAULT NULL");
    }
    
    $check_emp = $conn->query("SHOW COLUMNS FROM users LIKE 'emp_id'");
    if ($check_emp && $check_emp->num_rows == 0) {
        $conn->query("ALTER TABLE users ADD COLUMN emp_id VARCHAR(50) DEFAULT NULL");
    }

    $check_school = $conn->query("SHOW COLUMNS FROM users LIKE 'school_name'");
    if ($check_school && $check_school->num_rows == 0) {
        $conn->query("ALTER TABLE users ADD COLUMN school_name VARCHAR(255) DEFAULT NULL");
        $conn->query("ALTER TABLE users ADD COLUMN class_name VARCHAR(255) DEFAULT NULL");
        $conn->query("ALTER TABLE users ADD COLUMN roll_no VARCHAR(50) DEFAULT NULL");
    }

    // Auto-migrate content_uploads tracking logic dynamically isolating directories
    $conn->query("CREATE TABLE IF NOT EXISTS content_uploads (
        id INT AUTO_INCREMENT PRIMARY KEY,
        uploader_email VARCHAR(255) NOT NULL,
        original_filename VARCHAR(255) NOT NULL,
        stored_filename VARCHAR(255) NOT NULL,
        file_type VARCHAR(50) NOT NULL,
        file_size_bytes BIGINT NOT NULL,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    // Auto-migrate quick actions tracking logic seamlessly targeting local XAMPP environments!
    $conn->query("CREATE TABLE IF NOT EXISTS live_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        teacher_email VARCHAR(255) NOT NULL,
        session_title VARCHAR(255) NOT NULL,
        session_link VARCHAR(255) DEFAULT '',
        status VARCHAR(50) DEFAULT 'Live',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    $conn->query("CREATE TABLE IF NOT EXISTS quizzes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        teacher_email VARCHAR(255) NOT NULL,
        quiz_title VARCHAR(255) NOT NULL,
        duration_mins INT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )");

    $conn->query("CREATE TABLE IF NOT EXISTS quiz_questions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        quiz_id INT NOT NULL,
        question_text TEXT NOT NULL,
        option_a VARCHAR(255) NOT NULL,
        option_b VARCHAR(255) NOT NULL,
        option_c VARCHAR(255) DEFAULT NULL,
        option_d VARCHAR(255) DEFAULT NULL,
        correct_option CHAR(1) NOT NULL DEFAULT 'A',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE
    )");
} catch (Exception $e) {
    // Silently ignore permission/structural exceptions natively gracefully 
}
?>
