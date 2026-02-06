import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css'; 

const API_URL = import.meta.env.VITE_API_URL;
// SVG Icon สำหรับปิดเมนู
const CloseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M15 19L8 12L15 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const Sidebar = ({ isOpen, toggleSidebar, currency, exchangeRate }) => {
  const navigate = useNavigate();
  const [marketData, setMarketData] = useState([]);

  // ดึงข้อมูล Top 20
  useEffect(() => {
    fetch(`${API_URL}/get_api_ranking.php`)
      .then(res => res.json())
      .then(data => setMarketData(data))
      .catch(err => console.error(err));
  }, []);

  const displayPrice = (price) => {
    if (!price) return "..."; 
    if (currency === 'THB') {
      return `฿${(price * exchangeRate).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    }
    return `$${price.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
  };

  return (
    <div className={`sidebar-container cyber-sidebar ${isOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <h3 style={{fontFamily: 'Rajdhani', letterSpacing: '2px'}}>🔥 MARKET_LOGS</h3>
        <button onClick={toggleSidebar} className="close-mini-btn">
            <CloseIcon />
        </button>
      </div>

      <div className="sidebar-scroll">
        {marketData.length === 0 ? (
            <div style={{color:'#00f2ff', fontFamily:'monospace', textAlign:'center', marginTop:'20px'}}>
                INITIALIZING DATA...
            </div>
        ) : (
            marketData.map((stock, index) => {
            const isUp = parseFloat(stock.change) >= 0;
            return (
                <div 
                key={index} 
                className="market-item cyber-item" 
                onClick={() => navigate(`/stock/${stock.symbol}`)}
                title={stock.name || stock.symbol} 
                >
                <div className="market-info">
                    <span className="stock-name" style={{fontFamily:'monospace', color:'#00f2ff'}}>{stock.symbol}</span>
                    <span style={{fontSize: '0.7rem', color: '#666', display:'block', maxWidth:'120px', fontFamily:'sans-serif'}}>
                        {stock.name}
                    </span>
                    <span className="stock-price" style={{fontFamily:'monospace', color:'#ccc'}}>
                        {displayPrice(stock.price)}
                    </span>
                </div>
                <div className={`market-change ${isUp ? 'bg-green' : 'bg-red'}`} style={{fontFamily:'monospace'}}>
                    {isUp ? '+' : ''}{stock.change.toFixed(2)}%
                </div>
                </div>
            );
            })
        )}
      </div>
      
      <style>{`
        .sidebar-container.cyber-sidebar {
            background: #0a0a0a;
            border-right: 1px solid rgba(0, 242, 255, 0.2);
            box-shadow: 5px 0 20px rgba(0, 0, 0, 0.8);
        }
        .sidebar-header {
            border-bottom: 1px solid rgba(0, 242, 255, 0.2);
            background: rgba(0, 242, 255, 0.05);
            display: flex;
            align-items: center;
            justify-content: space-between;
        }
        .close-mini-btn {
            background: transparent;
            border: 1px solid #444;
            color: #666;
            cursor: pointer;
            padding: 5px;
            display: flex; align-items: center; justify-content: center;
            transition: 0.3s;
        }
        .close-mini-btn:hover {
            border-color: #ff1744; color: #ff1744; box-shadow: 0 0 10px #ff1744;
        }

        .cyber-item {
            background: transparent !important;
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 0 !important;
            transition: 0.2s;
            position: relative;
            overflow: hidden;
        }
        .cyber-item:hover {
            background: rgba(0, 242, 255, 0.05) !important;
            padding-left: 20px;
        }
        .cyber-item::before {
            content: ''; position: absolute; left: 0; top: 0; width: 2px; height: 100%;
            background: #00f2ff; opacity: 0; transition: 0.2s;
        }
        .cyber-item:hover::before { opacity: 1; }
        
        .bg-green { background: transparent !important; color: #00e676 !important; border: 1px solid #00e676; box-shadow: 0 0 5px rgba(0, 230, 118, 0.2); }
        .bg-red { background: transparent !important; color: #ff1744 !important; border: 1px solid #ff1744; box-shadow: 0 0 5px rgba(255, 23, 68, 0.2); }
      `}</style>
    </div>
  );
};

export default Sidebar;