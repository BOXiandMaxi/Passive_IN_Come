# 🌐 MY_WEALTH PRO: Cyberpunk Stock Portfolio & AI Analyzer
> **The High-Performance Full-Stack Monorepo for Smart Asset Management**

![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)
![Vite](https://img.shields.io/badge/Vite-6.0-646CFF?style=for-the-badge&logo=vite)
![PHP](https://img.shields.io/badge/PHP-8.2-777BB4?style=for-the-badge&logo=php)
![Gemini AI](https://img.shields.io/badge/Gemini_AI-1.5_Flash-4285F4?style=for-the-badge&logo=googlegemini)

---

## 📸 PROJECT SHOWCASE (ตัวอย่างหน้าตาเว็บไซต์)

| 🖥️ Main Dashboard (PC) | 📱 Mobile Interface |
| :---: | :---: |
| ![Main Dashboard](screenshots/dashboard_pc.png) | ![Mobile View](screenshots/dashboard_mobile.png) |
| *หน้าจอหลักพร้อมกราฟพอร์ตโฟลิโอและรายการหุ้น* | *ดีไซน์ตอบโจทย์มือถือ ดุดัน ใช้งานง่าย* |

| 🧠 AI Sentiment & Analysis | 📈 Technical Charts |
| :---: | :---: |
| ![AI Insights](screenshots/ai_analysis.png) | ![Technical Chart](screenshots/technical_chart.png) |
| *ระบบวิเคราะห์ข่าวด้วย Gemini AI* | *กราฟเทคนิคเชิงลึกพร้อม RSI และ Prediction* |

---

## 🚀 CORE FEATURES (คุณสมบัติเด่น)

### 📈 English Version
* **Cyber-Theme Dashboard**: A futuristic, high-contrast UI designed for clarity and impact, with a fully responsive layout for mobile (App_Mobile.css).
* **AI Sentiment Analysis**: Real-time news processing using **Google Gemini AI** to evaluate market mood (Bullish/Bearish) and provide professional advice.
* **Technical Analytics**: Interactive price charts with RSI indicators and automated price forecasting using Linear Regression.
* **Portfolio Management**: Multi-currency support (USD/THB) with automatic exchange rate conversion.

### 🇹🇭 ภาษาไทย
* **แดชบอร์ดธีม Cyberpunk**: อินเทอร์เฟซล้ำสมัยที่เน้นความชัดเจนและดุดัน พร้อมการรองรับการใช้งานบนมือถือเต็มรูปแบบ.
* **การวิเคราะห์อารมณ์ตลาดด้วย AI**: ประมวลผลข่าวแบบเรียลไทม์ด้วย **Gemini AI** เพื่อประเมินแนวโน้มตลาดพร้อมให้คำแนะนำระดับมือโปร.
* **การวิเคราะห์ทางเทคนิค**: กราฟราคาโต้ตอบได้พร้อมตัวชี้วัด RSI และระบบพยากรณ์ราคาล่วงหน้าด้วย Linear Regression.
* **การจัดการพอร์ตโฟลิโอ**: รองรับหลายสกุลเงิน (USD/THB) พร้อมระบบแปลงค่าเงินอัตโนมัติแบบเรียลไทม์.

---

## 🖼️ STOCK LOGO & IMAGE SYSTEM (ระบบแสดงโลโก้หุ้น)

เพื่อให้ประสบการณ์การใช้งานสมจริงที่สุด ระบบมีการดึงรูปภาพโลโก้มาแสดงผลแบบอัตโนมัติ:

* **Dynamic Fetching**: ดึง Favicon คุณภาพสูงจาก Google ตามชื่อย่อหุ้น (Symbol).
    * *Endpoint*: `https://www.google.com/s2/favicons?domain={symbol}.com&sz=64`
* **Fallback Mechanism**: ในกรณีที่ไม่มีรูปภาพ ระบบจะสลับไปใช้รูป Placeholder (Text-based Logo) ที่สร้างขึ้นใหม่ทันที.
* **Cyber-Styling**: รูปโลโก้ทั้งหมดจะถูกครอบด้วย `cyber-logo-wrapper` ที่มีเอฟเฟกต์ Neon Glow และขอบโปร่งแสง.

---

## 📦 PROJECT STRUCTURE (โครงสร้างโปรเจกต์)

```text
Passive_IN_Come/
├── passive_income/       # Frontend (React/Vite)
│   ├── src/              # Source code (App.jsx, StockDetail.jsx)
│   ├── public/           # Static assets & .htaccess for Routing
│   └── .env              # Frontend Environment Variables
└── backend/              # Backend (PHP APIs)
    ├── cache/            # AI Sentiment memory files
    ├── get_ai_sentiment.php
    ├── get_api_socket.php
    ├── get_api_news.php
    └── .env              # Backend Secret Keys (Gemini API)
