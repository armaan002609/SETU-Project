<?php
header('Content-Type: application/json');
include 'db_connect.php';

$json = file_get_contents('php://input');
$data = json_decode($json, true);

$action   = $data['action'] ?? '';
$quiz_id  = intval($data['quiz_id'] ?? 0);
$email    = trim($data['email'] ?? ''); // Student email for request, Teacher email for approval

if (!$quiz_id || !$email) {
    echo json_encode(["success" => false, "error" => "Missing parameters."]);
    exit;
}

if ($action === 'request_retake') {
    // Student requests re-take
    $stmt = $conn->prepare("UPDATE quiz_attempts SET retake_requested = 1 WHERE quiz_id = ? AND student_email = ?");
    $stmt->bind_param("is", $quiz_id, $email);
    if ($stmt->execute()) {
        echo json_encode(["success" => true]);
    } else {
        echo json_encode(["success" => false, "error" => "Request failed."]);
    }
    $stmt->close();

} elseif ($action === 'approve_retake') {
    // Teacher approves re-take
    $student_email = trim($data['student_email'] ?? '');
    if (!$student_email) {
        echo json_encode(["success" => false, "error" => "Missing student email."]);
        exit;
    }
    
    // We mark it as allowed and reset the request flag.
    $stmt = $conn->prepare("UPDATE quiz_attempts SET retake_allowed = 1, retake_requested = 0 WHERE quiz_id = ? AND student_email = ?");
    $stmt->bind_param("is", $quiz_id, $student_email);
    if ($stmt->execute()) {
        echo json_encode(["success" => true]);
    } else {
        echo json_encode(["success" => false, "error" => "Approval failed."]);
    }
    $stmt->close();

} elseif ($action === 'reject_retake') {
    // Teacher rejects re-take
    $student_email = trim($data['student_email'] ?? '');
    $stmt = $conn->prepare("UPDATE quiz_attempts SET retake_requested = 0 WHERE quiz_id = ? AND student_email = ?");
    $stmt->bind_param("is", $quiz_id, $student_email);
    if ($stmt->execute()) {
        echo json_encode(["success" => true]);
    } else {
        echo json_encode(["success" => false, "error" => "Rejection failed."]);
    }
    $stmt->close();

} elseif ($action === 'fetch_requests') {
    // Teacher fetches all pending requests for their quizzes
    $stmt = $conn->prepare(
        "SELECT a.quiz_id, a.student_email, a.student_name, q.quiz_title, a.score, a.total_questions 
         FROM quiz_attempts a
         JOIN quizzes q ON q.id = a.quiz_id
         WHERE q.teacher_email = ? AND a.retake_requested = 1"
    );
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $res = $stmt->get_result();
    $requests = [];
    while ($row = $res->fetch_assoc()) {
        $requests[] = $row;
    }
    echo json_encode(["success" => true, "requests" => $requests]);
    $stmt->close();

} else {
    echo json_encode(["success" => false, "error" => "Invalid action."]);
}
?>
