<?php
// C:\xampp\htdocs\passive_income\backend\get_api_socket.php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

// รับชื่อหุ้น (ถ้าไม่ส่งมา ให้ใช้ AAPL)
$symbol = isset($_GET['symbol']) ? strtoupper($_GET['symbol']) : 'AAPL';

// แปลงชื่อหุ้นไทยให้ Yahoo เข้าใจ (เช่น PTT -> PTT.BK)
// แต่ถ้าเป็นหุ้นนอกก็ใช้ชื่อเดิม
// (ในที่นี้สมมติว่าเป็นหุ้นนอกก่อน ถ้าจะเล่นหุ้นไทยต้องมี Logic เติม .BK)

// URL ของ Yahoo Finance (V8)
$url = "https://query1.finance.yahoo.com/v8/finance/chart/" . $symbol . "?interval=1d&range=1d";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
// ต้องใส่ User Agent เพื่อหลอก Yahoo ว่าเราคือ Browser
curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3');
$response = curl_exec($ch);
curl_close($ch);

$data = json_decode($response, true);

// เช็คว่า Error ไหม
if (!$data || !isset($data['chart']['result'][0])) {
    echo json_encode(["error" => "ไม่พบข้อมูลหุ้น $symbol"]);
    exit;
}

// ดึงข้อมูลดิบจาก Yahoo
$meta = $data['chart']['result'][0]['meta'];
$quote = $data['chart']['result'][0]['indicators']['quote'][0];

// คำนวณราคาและการเปลี่ยนแปลง
$currentPrice = $meta['regularMarketPrice'];
$prevClose = $meta['chartPreviousClose'];
$change = $currentPrice - $prevClose;
$percentChange = ($change / $prevClose) * 100;

// หาโลโก้ (ใช้ Clearbit API ฟรี แทน TwelveData)
// หาโลโก้ (ใช้ Google Favicons แทน Clearbit เพราะเสถียรกว่า)
$logoUrl = "https://www.google.com/s2/favicons?domain=" . strtolower($symbol) . ".com&sz=64";
// หรือถ้าหาไม่เจอให้ใช้ Placeholder เดิมของคุณ
// $logoUrl = "https://placehold.co/50x50?text=" . $symbol; 

// *** จัดรูปแบบให้เหมือน Twelve Data เป๊ะๆ เพื่อให้ React ไม่พัง ***
$result = [
    "symbol" => $meta['symbol'],
    "companyName" => $meta['symbol'], // Yahoo ตัวฟรีไม่ส่งชื่อเต็มบริษัทมา ใช้ Symbol แทนไปก่อน
    "price" => $currentPrice,       
    "change" => number_format($change, 2, '.', ''),
    "percentChange" => number_format($percentChange, 2, '.', ''),
    "image" => $logoUrl,
    "description" => "ตลาด: " . $meta['exchangeName'] . " (ข้อมูลจาก Yahoo Finance)"
];

// React ของคุณเขียนดักไว้เป็น Array [0] ดังนั้นเราต้องส่งเป็น Array
echo json_encode([$result]);
?>