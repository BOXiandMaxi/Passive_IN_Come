<?php
// C:\xampp\htdocs\passive_income\backend\get_api_news.php
// ใส่ไว้ใต้ <?php บรรทัดแรกเลยครับ
date_default_timezone_set('Asia/Bangkok');

error_reporting(0);
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

$symbol = isset($_GET['symbol']) ? strtoupper($_GET['symbol']) : 'AAPL';

// 1. ดึงข่าวจาก Yahoo RSS (ภาษาอังกฤษ)
$url = "https://feeds.finance.yahoo.com/rss/2.0/headline?s=" . $symbol . "&region=US&lang=en-US";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0');
$xmlResponse = curl_exec($ch);
curl_close($ch);

if (!$xmlResponse) {
    echo json_encode([]);
    exit;
}

$rss = simplexml_load_string($xmlResponse);
$newsList = [];

// --- 🔥 ฟังก์ชันแปลภาษา (Google Translate Hack) ---
function translateToThai($text) {
    // ถ้าข้อความว่าง หรือสั้นเกินไป ไม่ต้องแปล
    if (empty($text) || strlen($text) < 3) return $text;

    // URL ลับของ Google Translate (ใช้ฟรีได้สำหรับข้อความสั้นๆ)
    $url = "https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=th&dt=t&q=" . urlencode($text);

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0');
    $response = curl_exec($ch);
    curl_close($ch);

    $result = json_decode($response, true);

    // Google จะส่ง Array ซ้อนกันมา เราต้องแกะเอาเฉพาะคำแปล
    $translatedText = "";
    if (isset($result[0])) {
        foreach ($result[0] as $sentence) {
            $translatedText .= $sentence[0];
        }
    }

    return $translatedText ? $translatedText : $text; // ถ้าแปลไม่ได้ ให้ใช้คำเดิม
}

if ($rss && $rss->channel->item) {
    $count = 0;
    foreach ($rss->channel->item as $item) {
        // จำกัดแค่ 3 ข่าวพอ (เพราะการแปลมันใช้เวลา เดี๋ยวเว็บโหลดช้า)
        if ($count >= 3) break; 

        // แปลหัวข้อข่าว
        $thaiTitle = translateToThai((string)$item->title);
        
        // แปลเนื้อหา (ตัด HTML tag ออกก่อนแปล)
        $cleanDesc = strip_tags((string)$item->description);
        $thaiDesc = translateToThai($cleanDesc);

        $newsList[] = [
            'title' => $thaiTitle, // ส่งภาษาไทยกลับไป
            'original_title' => (string)$item->title, // เก็บภาษาอังกฤษไว้เผื่ออยากโชว์
            'link' => (string)$item->link,
            'pubDate' => date("d M Y, H:i", strtotime((string)$item->pubDate)),
            'description' => $thaiDesc
        ];
        $count++;
    }
}

echo json_encode($newsList);
?>