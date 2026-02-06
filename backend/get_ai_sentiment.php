<?php
// backend/get_ai_sentiment.php

// ปิด Error Report หน้าเว็บ (ส่งเป็น JSON อย่างเดียว)
error_reporting(0);
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: POST");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// รับข้อมูล
$inputJSON = file_get_contents("php://input");
$data = json_decode($inputJSON);

// 1. เช็คว่ามีข้อมูลส่งมาไหม
if (!isset($data->news) || empty(trim($data->news))) {
    echo json_encode(["score" => 0, "advice" => "ไม่มีข้อมูลข่าวส่งมา", "trend" => "Neutral"]);
    exit();
}

// ===========================================================
// 🧠 ระบบความจำ (CACHING SYSTEM) - ห้ามเอาออกเด็ดขาดบน Server จริง!
// ===========================================================
// สร้าง Folder cache อัตโนมัติถ้ายังไม่มี
if (!is_dir('cache')) { mkdir('cache', 0777, true); }

// สร้าง ID ให้ข่าวชุดนี้
$newsHash = md5($data->news);
$cacheFile = "cache/sentiment_" . $newsHash . ".json";

// กติกา: ถ้ามีไฟล์จำไว้แล้ว และเก่าไม่เกิน 1 ชั่วโมง -> ดึงของเดิมมาตอบเลย!
if (file_exists($cacheFile) && (time() - filemtime($cacheFile) < 3600)) {
    echo file_get_contents($cacheFile);
    exit(); // จบงานตรงนี้ ประหยัดโควตา
}
// ===========================================================
function loadEnv($path) {
    if (!file_exists($path)) return;
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) continue;
        list($name, $value) = explode('=', $line, 2);
        putenv(trim($name) . "=" . trim($value));
    }
}
loadEnv(__DIR__ . '/.env'); // โหลดไฟล์ .env
// 🔥 API Key ของคุณ
$apiKey = getenv('GEMINI_API_KEY');

// ✅ ใช้ gemini-1.5-flash (เสถียรและเร็วสุดสำหรับข่าว)
$apiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" . $apiKey;

// Cleaning Data
$cleanNews = iconv('UTF-8', 'UTF-8//IGNORE', $data->news);
$newsText = substr($cleanNews, 0, 4000);

// Prompt
$prompt = "
Role: Financial Analyst.
Task: Analyze the sentiment of the following news headlines for a stock.
Output: Return ONLY a raw JSON object (no markdown) with keys:
- 'score': integer (-100 to 100)
- 'trend': string ('Bullish', 'Bearish', or 'Neutral')
- 'advice': string (Summarize the reason in Thai language, max 2 sentences)

News Data:
$newsText
";

$bodyArray = [
    "contents" => [
        [ "parts" => [ ["text" => $prompt] ] ]
    ]
];

$jsonBody = json_encode($bodyArray, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

if ($jsonBody === false) {
    echo json_encode(["score" => 0, "advice" => "Format ข่าวผิดพลาด", "trend" => "Error"]);
    exit();
}

$ch = curl_init($apiUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $jsonBody);
curl_setopt($ch, CURLOPT_HTTPHEADER, ["Content-Type: application/json"]);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false); 
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);

$response = curl_exec($ch);

if (curl_errno($ch)) {
    echo json_encode(["score" => 0, "advice" => "Server Error: " . curl_error($ch), "trend" => "Error"]);
    exit();
}

curl_close($ch);

$result = json_decode($response, true);

if (isset($result['candidates'][0]['content']['parts'][0]['text'])) {
    $rawText = $result['candidates'][0]['content']['parts'][0]['text'];
    $cleanJson = str_replace(['```json', '```', "\n", "\r"], '', $rawText);
    
    // ✅ บันทึกความจำลง Cache
    file_put_contents($cacheFile, $cleanJson);
    
    echo $cleanJson;
} else {
    // กรณี AI Error (เช่น Server ฝั่ง Google เต็ม)
    // ลองกู้ชีพ: เอา Cache เก่า (แม้จะหมดอายุ) มาโชว์แก้ขัด
    if (file_exists($cacheFile)) {
        $oldData = json_decode(file_get_contents($cacheFile), true);
        $oldData['advice'] .= " (Cached)"; 
        echo json_encode($oldData);
        exit();
    }

    $advice = "AI ไม่ตอบสนอง (ลองใหม่)";
    if (isset($result['error']['message'])) {
        $advice = "AI Error: " . substr($result['error']['message'], 0, 50);
    }
    
    echo json_encode([
        "score" => 0, 
        "advice" => $advice, 
        "trend" => "Neutral"
    ]);
}
?>