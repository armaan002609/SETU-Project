<?php
header('Content-Type: application/json');
include 'config.php';

$key = defined('GEMINI_API_KEY') ? GEMINI_API_KEY : '';

if (empty($key) || $key === 'YOUR_GEMINI_API_KEY_HERE') {
    echo json_encode(["status" => "Error", "message" => "API Key is missing in config.php"]);
    exit;
}

$url = "https://generativelanguage.googleapis.com/v1beta/models?key=" . $key;
$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 200) {
    $data = json_decode($response, true);
    $models = array_map(function($m) { return $m['name']; }, $data['models'] ?? []);
    echo json_encode(["status" => "List Success", "available_models" => $models]);
} else {
    echo json_encode([
        "status" => "List Error",
        "code" => $httpCode,
        "details" => json_decode($response, true)
    ]);
}
?>
