<?php
// C:\xampp\htdocs\passive_income\backend\get_api_history.php
// ใส่ไว้ใต้ <?php บรรทัดแรกเลยครับ
date_default_timezone_set('Asia/Bangkok');

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

$symbol = isset($_GET['symbol']) ? strtoupper($_GET['symbol']) : 'AAPL';
$interval = isset($_GET['interval']) ? $_GET['interval'] : '1day';
$range = '1mo'; // ค่า Default

// แปลงค่า Interval ของ TwelveData ให้เป็นภาษา Yahoo
// React ส่ง: 1day, 1week, 1month, 5min
// Yahoo รับ: 1d, 1wk, 1mo, 5m
$yInterval = '1d';
$yRange = '3mo'; // ย้อนหลัง default

if ($interval == '1day') { $yInterval = '1d'; $yRange = '1y'; }
else if ($interval == '1week') { $yInterval = '1wk'; $yRange = '2y'; }
else if ($interval == '1month') { $yInterval = '1mo'; $yRange = '5y'; }
else if ($interval == '5min') { $yInterval = '5m'; $yRange = '1d'; }

// จัดการเรื่อง Start Date / End Date (สำหรับการ Compare เดือน)
// ถ้า React ส่ง start_date มา เราต้องคำนวณ Range ให้ Yahoo หรือใช้ period1/period2
$url = "";
if (isset($_GET['start_date']) && isset($_GET['end_date'])) {
    $period1 = strtotime($_GET['start_date']);
    $period2 = strtotime($_GET['end_date']) + 86400; // บวก 1 วันให้ครอบคลุม
    $url = "https://query1.finance.yahoo.com/v8/finance/chart/$symbol?period1=$period1&period2=$period2&interval=$yInterval";
} else if (isset($_GET['start_date'])) {
    // กรณีขอเดือนนี้ (ถึงปัจจุบัน)
    $period1 = strtotime($_GET['start_date']);
    $period2 = time(); 
    $url = "https://query1.finance.yahoo.com/v8/finance/chart/$symbol?period1=$period1&period2=$period2&interval=$yInterval";
} else {
    // กรณีปกติ (กดปุ่ม 1D, 1M, 1Y)
    $url = "https://query1.finance.yahoo.com/v8/finance/chart/$symbol?interval=$yInterval&range=$yRange";
}

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0');
$response = curl_exec($ch);
curl_close($ch);

$data = json_decode($response, true);

if (!$data || !isset($data['chart']['result'][0])) {
    echo json_encode(["values" => []]); // ส่งอาเรย์ว่างกลับไปถ้า error
    exit;
}

$resultData = $data['chart']['result'][0];
$timestamps = $resultData['timestamp'];
$quotes = $resultData['indicators']['quote'][0]['close'];

$formattedValues = [];

// *** หัวใจสำคัญ: แปลงข้อมูลจาก Yahoo ให้เป็นท่า TwelveData ***
// React คาดหวัง: { values: [ { datetime: "2024-01-01", close: 100.50 }, ... ] }
foreach ($timestamps as $index => $ts) {
    if (isset($quotes[$index]) && $quotes[$index] != null) {
        $formattedValues[] = [
            // แปลง Unix Timestamp เป็น String (YYYY-MM-DD HH:mm:ss)
            "datetime" => date("Y-m-d H:i:s", $ts), 
            "close" => number_format($quotes[$index], 2, '.', '')
        ];
    }
}

// ส่งกลับใน key ชื่อ 'values' เหมือนเดิม
echo json_encode(["values" => $formattedValues]);
?>