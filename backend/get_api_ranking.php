<?php
// C:\xampp\htdocs\passive_income\backend\get_api_ranking.php

// ปิด Error ใน Production (แต่เปิดไว้เทสก่อน)
error_reporting(E_ALL);
ini_set('display_errors', 0); // ปิดไม่ให้ Error PHP กวน JSON

header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

// --------------------------------------------------------------------------
// 🔥 เปลี่ยน API: ไม่ใช้แบบระบุชื่อแล้ว แต่ใช้แบบ "Screener" (Top Gainers)
// scrIds=day_gainers แปลว่า ขอหุ้นที่บวกแรงสุดในวันนี้
// count=20 แปลว่า ขอ 20 ตัว
// --------------------------------------------------------------------------
$url = "https://query2.finance.yahoo.com/v1/finance/screener/predefined/saved?scrIds=day_gainers&count=20";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);

// Header สำคัญมาก! ต้องหลอกว่าเป็น Browser
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept: application/json",
    "Origin: https://finance.yahoo.com",
    "Referer: https://finance.yahoo.com/screener/predefined/day_gainers"
]);

$response = curl_exec($ch);
curl_close($ch);

$data = json_decode($response, true);
$ranking = [];

// โครงสร้าง JSON ของ Screener จะต่างจาก Quote ปกตินิดหน่อย
// มันจะอยู่ที่ $data['finance']['result'][0]['quotes']
if ($data && isset($data['finance']['result'][0]['quotes'])) {
    
    foreach ($data['finance']['result'][0]['quotes'] as $stock) {
        // กรองเอาเฉพาะที่มีราคา (บางตัวข้อมูลไม่ครบ)
        if (!isset($stock['regularMarketPrice'])) continue;

        $ranking[] = [
            'symbol' => $stock['symbol'],
            'price'  => $stock['regularMarketPrice'],
            'change' => isset($stock['regularMarketChangePercent']) ? $stock['regularMarketChangePercent'] : 0,
            'name'   => $stock['shortName'] ?? $stock['symbol']
        ];
    }

} else {
    // 🚨 FALLBACK: กรณี Yahoo บล็อก หรือ API ล่มจริงๆ ค่อยเอาของเก่ามาโชว์แก้ขัด
    $ranking = [
        ['symbol' => 'NVDA', 'price' => 145.20, 'change' => 5.8, 'name' => 'NVIDIA'],
        ['symbol' => 'TSLA', 'price' => 240.00, 'change' => 4.2, 'name' => 'Tesla'],
        ['symbol' => 'COIN', 'price' => 250.00, 'change' => 8.5, 'name' => 'Coinbase'],
        ['symbol' => 'MSTR', 'price' => 1600.00, 'change' => 10.5, 'name' => 'MicroStrategy'],
        ['symbol' => 'AMD', 'price' => 170.00, 'change' => 3.2, 'name' => 'AMD'],
        ['symbol' => 'PLTR', 'price' => 45.00, 'change' => 6.1, 'name' => 'Palantir']
    ];
}

// ส่ง JSON กลับไป (API ส่งมาเรียงให้อยู่แล้ว ไม่ต้อง sort ซ้ำก็ได้ แต่ถ้าอยากชัวร์ก็ sort ได้)
echo json_encode($ranking);
?>