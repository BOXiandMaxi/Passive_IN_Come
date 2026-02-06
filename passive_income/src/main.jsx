import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from "react-router-dom"; // เพิ่มบรรทัดนี้
import App from './App'
import StockDetail from './StockDetail/StockDetail'; // import หน้ากราฟมา
import './index.css'



ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/stock/:symbol" element={<StockDetail />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)