<?php
header('Content-Type: application/json');
include 'db_connect.php';

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $json = file_get_contents('php://input');
    $data = json_decode($json);

    $action = $data->action ?? '';
    $email = $data->email ?? '';

    if (empty($email) || empty($action)) {
        die(json_encode(["success" => false, "error" => "Missing core routing footprints tracking requests gracefully!"]));
    }

    if ($action === "start_live") {
        $title = trim($data->title ?? '');
        $link = trim($data->link ?? '');
        if (empty($title)) die(json_encode(["success" => false, "error" => "Session title is required."]));

        $conn->query("UPDATE live_sessions SET status = 'Ended' WHERE teacher_email = '$email'");

        $stmt = $conn->prepare("INSERT INTO live_sessions (teacher_email, session_title, session_link, status) VALUES (?, ?, ?, 'Live')");
        $stmt->bind_param("sss", $email, $title, $link);
        if ($stmt->execute()) {
            echo json_encode(["success" => true, "message" => "Live Session Deployed!"]);
        } else {
            echo json_encode(["success" => false, "error" => $stmt->error]);
        }
        $stmt->close();

    } else if ($action === "post_quiz") {
        $title = trim($data->title ?? '');
        $duration = intval($data->duration ?? 0);
        if (empty($title) || $duration <= 0) die(json_encode(["success" => false, "error" => "Valid Quiz Title and Duration mapped heavily requested."]));

        $stmt = $conn->prepare("INSERT INTO quizzes (teacher_email, quiz_title, duration_mins) VALUES (?, ?, ?)");
        $stmt->bind_param("ssi", $email, $title, $duration);
        if ($stmt->execute()) {
            $new_quiz_id = $stmt->insert_id;
            echo json_encode(["success" => true, "message" => "Quiz Generated and Deployed!", "quiz_id" => $new_quiz_id]);
        } else {
            echo json_encode(["success" => false, "error" => $stmt->error]);
        }
        $stmt->close();
    } else {
        echo json_encode(["success" => false, "error" => "Unknown Action Routing Isolated!"]);
    }
}
?>
