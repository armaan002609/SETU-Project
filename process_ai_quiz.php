<?php
header('Content-Type: application/json');
include 'db_connect.php';
include 'config.php';

// Using the key from config.php
$API_KEY = (defined('GEMINI_API_KEY') && GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY_HERE') ? GEMINI_API_KEY : ''; 

if (empty($API_KEY)) {
    echo json_encode(["success" => false, "error" => "Gemini API Key is not configured in config.php. Please add your key!"]);
    exit;
}

if (!isset($_FILES['file'])) {
    echo json_encode(["success" => false, "error" => "No file was received on the server."]);
    exit;
}

$file = $_FILES['file'];
$fileName = $file['name'];
$tmpPath = $file['tmp_name'];
$fileType = $file['type'];

// Helper function to extract text from DOCX (it is just a ZIP of XML)
function extractDocxText($filename) {
    $zip = new ZipArchive();
    if ($zip->open($filename) === true) {
        $xml = $zip->getFromName("word/document.xml");
        $zip->close();
        if ($xml) {
            return strip_tags($xml);
        }
    }
    return false;
}

$fileData = file_get_contents($tmpPath);
$docxText = ($fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') ? extractDocxText($tmpPath) : false;

$prompt = "You are an expert Academic Assistant. Your task is to analyze the provided document and extract ALL Multiple Choice Questions (MCQs).

CRITICAL INSTRUCTIONS FOR ACCURACY:
1. IDENTIFY THE CORRECT ANSWER: Carefully look for indicators of the correct answer:
   - Explicit labels like 'Answer: A' or 'Ans: B'.
   - Formatting like **Bold Text**, Underlining, or Checkmarks next to an option.
   - Symbols like stars (*) or brackets [X] next to the correct choice.
   - If no obvious mark exists, read the 'Explanation/Solution' section of the document to determine which option is correct.

2. EXTRACT THE SOLUTION: Find the detailed explanation or reasoning for the answer.

3. STRUCTURE: Return ONLY a valid JSON array of objects.
   Format: [{\"question_text\": \"...\", \"option_a\": \"...\", \"option_b\": \"...\", \"option_c\": \"...\", \"option_d\": \"...\", \"correct_option\": \"A\", \"explanation\": \"...\"}]

4. NO HALLUCINATION: Only return questions that actually exist in the document. Do not invent new questions.";

// Prepare payload parts
if ($docxText) {
    $parts = [["text" => $prompt . "\n\nDocument Content:\n" . $docxText]];
} else {
    $parts = [
        ["text" => $prompt],
        ["inline_data" => ["mime_type" => "application/pdf", "data" => base64_encode($fileData)]]
    ];
}

$payload = [
    "contents" => [["parts" => $parts]],
    "generationConfig" => ["temperature" => 0.1, "response_mime_type" => "application/json"]
];

// Fallback combinations based on the user's available models list
$versions = ['v1beta', 'v1'];
$models = ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-flash-latest', 'gemini-1.5-flash-latest'];
$successfulResponse = null;
$lastErrorDetails = null;

foreach ($versions as $ver) {
    foreach ($models as $mod) {
        $url = "https://generativelanguage.googleapis.com/{$ver}/models/{$mod}:generateContent?key=" . $API_KEY;
        
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
        curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); 
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode === 200) {
            $successfulResponse = json_decode($response, true);
            break 2; // Success! Exit both loops.
        } else {
            $lastErrorDetails = [
                "version" => $ver,
                "model" => $mod,
                "code" => $httpCode,
                "response" => json_decode($response, true)
            ];
        }
    }
}

if (!$successfulResponse) {
    echo json_encode([
        "success" => false, 
        "error" => "AI Extraction failed (All models tried).", 
        "message" => "Google's AI models are currently unavailable for this account or file. Please wait 1-2 minutes for the new API key to activate and try again.",
        "last_attempt" => $lastErrorDetails
    ]);
    exit;
}

$aiText = $successfulResponse['candidates'][0]['content']['parts'][0]['text'] ?? '';

// Clean up markdown markers if present
$aiText = trim($aiText);
if (strpos($aiText, '```json') === 0) { $aiText = substr($aiText, 7, -3); }
elseif (strpos($aiText, '```') === 0) { $aiText = substr($aiText, 3, -3); }

$questions = json_decode(trim($aiText), true);

if (!$questions) {
    echo json_encode(["success" => false, "error" => "AI generated incompatible format.", "raw" => $aiText]);
    exit;
}

echo json_encode(["success" => true, "questions" => $questions]);
?>
