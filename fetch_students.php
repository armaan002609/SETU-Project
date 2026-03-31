<?php
header('Content-Type: application/json');
include 'db_connect.php';

$stmt = $conn->prepare("SELECT fullname, school_name, class_name, roll_no, email FROM users WHERE role = 'Student' ORDER BY fullname ASC");
$stmt->execute();
$result = $stmt->get_result();

$students = [];
while ($row = $result->fetch_assoc()) {
    $students[] = $row;
}
$stmt->close();

echo json_encode(["success" => true, "students" => $students]);
?>
