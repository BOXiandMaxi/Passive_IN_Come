import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactApexChart from 'react-apexcharts';
import Sidebar from './Sidebar/Sidebar'; 
import './App.css';

const API_URL = import.meta.env.VITE_API_URL;

// Component ไอคอน SVG
const MenuIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 12H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 6H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

function App() {
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [currency, setCurrency] = useState('USD'); 
  const [exchangeRate, setExchangeRate] = useState(34.5); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); 

  useEffect(() => {
  const savedStocks = localStorage.getItem('myPortfolio');
  if (savedStocks) setStocks(JSON.parse(savedStocks));

  // เรียกผ่าน proxy ที่เราตั้งไว้
  fetch(`${API_URL}/get_api_socket.php?symbol=USDTHB=X`)
    .then(res => res.json()) // <--- ต้องมีบรรทัดนี้เพื่อแปลงเป็น JSON ก่อน
    .then(data => {
      if (data && data[0] && data[0].price) {
        setExchangeRate(data[0].price);
      }
    })
    .catch(err => console.error("Error fetching rate:", err));
  }, []);

  useEffect(() => {
    if (stocks.length > 0) {
      localStorage.setItem('myPortfolio', JSON.stringify(stocks));
    }
  }, [stocks]);

  const displayMoney = (amount) => {
    if (currency === 'THB') {
      return `฿${(amount * exchangeRate).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    }
    return `$${amount.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
  };

  const addStock = async () => {
    if (!input) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/get_api_socket.php?symbol=${input}`);
      const data = await res.json();

      if (data && data.length > 0 && !data.error) {
        const newStock = { 
          ...data[0], 
          amount: 0, 
          avgCost: 0,
          dividendYield: data[0].dividendYield || 0 
        };
        
        setStocks(prev => {
          if (prev.find(s => s.symbol === newStock.symbol)) {
            alert('SYSTEM ALERT: Stock already in portfolio module.');
            return prev;
          }
          return [...prev, newStock];
        });
        setInput(''); 
      } else {
        alert('DATA NOT FOUND');
      }
    } catch (error) {
      console.error(error);
      alert('CONNECTION ERROR');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = (symbol, field, value) => {
      setStocks(prev => prev.map(s => 
        s.symbol === symbol ? { ...s, [field]: value } : s
      ));
  };

  const removeStock = (e, symbol) => {
    e.stopPropagation();
    if (window.confirm(`CONFIRM DELETION: ${symbol}?`)) {
      const updated = stocks.filter(s => s.symbol !== symbol);
      setStocks(updated);
      localStorage.setItem('myPortfolio', JSON.stringify(updated));
    }
  };

  const dashboardData = useMemo(() => {
    let totalValue = 0;
    let totalCost = 0;
    let totalDividend = 0;

    stocks.forEach(s => {
      const amount = parseFloat(s.amount) || 0;
      const costPrice = parseFloat(s.avgCost) || 0;
      const val = s.price * amount;
      const cost = costPrice * amount;
      const yieldPercent = s.dividendYield || 0; 
      const div = val * (yieldPercent / 100);

      totalValue += val;
      totalCost += cost;
      totalDividend += div;
    });

    const totalProfit = totalValue - totalCost;
    const profitPercent = totalCost > 0 ? (totalProfit / totalCost) * 100 : 0;

    return { totalValue, totalCost, totalProfit, profitPercent, totalDividend };
  }, [stocks]);

  const pieChartData = {
    series: stocks.map(s => s.price * (s.amount || 0)),
    options: {
      labels: stocks.map(s => s.symbol),
      colors: ['#00f2ff', '#7000ff', '#ff0055', '#ffe600', '#00e676', '#fff'],
      chart: { type: 'donut', background: 'transparent' },
      stroke: { show: true, width: 2, colors: ['#000'] },
      theme: { mode: 'dark' },
      legend: { position: 'bottom', fontFamily: 'monospace', labels: { colors: '#ccc' } },
      dataLabels: { enabled: false },
      plotOptions: { donut: { size: '70%', labels: { show: false } } },
    }
  };

  return (
    <div className="main-layout cyber-theme">
      
      <Sidebar 
        isOpen={isSidebarOpen} 
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
        currency={currency}
        exchangeRate={exchangeRate}
      />

      <div className="content-area">
        <div className="app-container">
          
          <header style={{borderBottom:'1px solid rgba(0, 242, 255, 0.3)', paddingBottom:'20px'}}>
            <div style={{display:'flex', alignItems:'center', gap:'20px'}}>
                <button 
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
                  className="cyber-btn-icon"
                >
                  <MenuIcon />
                </button>

                <h1 style={{margin:0, fontFamily: 'Rajdhani', letterSpacing: '3px', textShadow: '0 0 10px rgba(0, 242, 255, 0.8)', fontSize:'28px'}}>
                  <span style={{color:'#00f2ff'}}>MY_WEALTH</span> <span style={{fontSize:'12px', border:'1px solid #ff0055', padding:'2px 5px', color:'#ff0055', borderRadius:'3px'}}>PRO</span>
                </h1>
            </div>
            
            <div className="search-box-cyber">
                <button 
                    onClick={() => setCurrency(prev => prev === 'USD' ? 'THB' : 'USD')}
                    className="cyber-currency-btn"
                >
                    {currency}
                </button>
                <div style={{position:'relative', width:'100%'}}>
                    <input 
                        type="text" 
                        placeholder="SEARCH STOCK SYMBOL..." 
                        value={input}
                        onChange={(e) => setInput(e.target.value.toUpperCase())}
                        onKeyDown={(e) => e.key === 'Enter' && addStock()}
                        className="cyber-input"
                    />
                    <div className="scan-line"></div>
                </div>
                <button onClick={addStock} disabled={loading} className="cyber-add-btn">
                    {loading ? '...' : '+ ADD'}
                </button>
            </div>
          </header>

          {/* --- DASHBOARD SECTION --- */}
          {stocks.length > 0 && (
              <div className="dashboard-grid">
                  <div className="glass-panel" style={{display:'flex', justifyContent:'center', alignItems:'center', position:'relative'}}>
                      <div className="tech-corner-tl"></div>
                      <div style={{width: '100%', maxWidth:'300px'}}>
                        <ReactApexChart options={pieChartData.options} series={pieChartData.series} type="donut" height={240} />
                      </div>
                  </div>

                  <div className="glass-panel" style={{display:'flex', flexDirection:'column', justifyContent:'center', position:'relative'}}>
                      <div className="tech-corner-tr"></div>
                      <span className="cyber-label">TOTAL PORTFOLIO VALUE</span>
                      <h1 className="cyber-big-number">{displayMoney(dashboardData.totalValue)}</h1>
                      
                      <div style={{marginTop: '15px', display:'flex', gap:'20px', borderTop:'1px dashed #333', paddingTop:'15px'}}>
                          <div>
                              <span className="cyber-label-small">PROFIT/LOSS</span>
                              <p className={dashboardData.totalProfit >= 0 ? 'cyber-text-up' : 'cyber-text-down'}>
                                  {dashboardData.totalProfit >= 0 ? '▲' : '▼'} {displayMoney(dashboardData.totalProfit)}
                              </p>
                          </div>
                          <div>
                              <span className="cyber-label-small">RETURN</span>
                              <p className={dashboardData.profitPercent >= 0 ? 'cyber-text-up' : 'cyber-text-down'}>
                                  {dashboardData.profitPercent.toFixed(2)}%
                              </p>
                          </div>
                      </div>
                  </div>

                  <div className="glass-panel dividend-glow" style={{position:'relative'}}>
                      <div className="tech-corner-br"></div>
                      <span className="cyber-label" style={{color:'#ffe600'}}>💰 EST. ANNUAL DIVIDEND</span>
                      <h2 style={{color: '#ffe600', fontSize:'2rem', margin: '10px 0', fontFamily:'monospace', textShadow:'0 0 10px rgba(255, 230, 0, 0.5)'}}>
                          {displayMoney(dashboardData.totalDividend)} <span style={{fontSize:'12px'}}>/YR</span>
                      </h2>
                      <p style={{color:'#888', fontSize:'0.8rem', fontFamily:'monospace'}}>
                          YIELD: <span style={{color:'#fff'}}>{(stocks.length > 0 ? (dashboardData.totalDividend / dashboardData.totalValue * 100) : 0).toFixed(2)}%</span>
                      </p>
                      <div className="cyber-progress-bar">
                          <div className="cyber-fill" style={{width: '25%'}}></div>
                      </div>
                      <p style={{fontSize:'0.7rem', color:'#666', marginTop:'5px', textAlign:'right'}}>TARGET: {displayMoney(100000)}</p>
                  </div>
              </div>
          )}

          {/* --- STOCK LIST --- */}
          <div className="stock-grid">
            {stocks.map((stock, index) => {
              const isDailyUp = parseFloat(stock.change) >= 0;
              const totalValue = stock.price * (stock.amount || 0);
              const totalCost = (stock.avgCost || 0) * (stock.amount || 0);
              const profit = totalValue - totalCost;
              const isProfit = profit >= 0;
              const fallbackImage = `https://placehold.co/50x50/000/fff?text=${stock.symbol}`;

              // 🔥 คำนวณราคาเมื่อวาน (Previous Close) = ราคาปัจจุบัน - การเปลี่ยนแปลง
              const prevPrice = stock.price - parseFloat(stock.change);

              return (
                <div key={index} className="cyber-card" onClick={() => navigate(`/stock/${stock.symbol}`)}>
                  <div className="card-overlay"></div>
                  <button className="cyber-delete-btn" title="Remove" onClick={(e) => removeStock(e, stock.symbol)}>
                    <TrashIcon />
                  </button>

                  <div style={{display:'flex', alignItems:'center', gap:'15px', marginBottom:'15px'}}>
                    <div className="cyber-logo-wrapper">
                        <img 
                        src={stock.image && stock.image !== "" ? stock.image : fallbackImage} 
                        alt={stock.symbol} 
                        className="stock-logo" 
                        // ใส่ style ให้รูปกลม
                        style={{borderRadius: '50%', objectFit: 'cover'}}
                        onError={(e) => { e.target.onerror = null; e.target.src = fallbackImage; }}
                        />
                    </div>
                    <div>
                        <h3 style={{margin:0, color:'#fff', fontFamily:'Rajdhani', fontSize:'22px'}}>{stock.symbol}</h3>
                        <span style={{fontSize:'0.7rem', color:'#ffe600', background:'rgba(255, 230, 0, 0.1)', padding:'2px 6px', border:'1px solid rgba(255, 230, 0, 0.3)'}}>
                            YIELD: {(stock.dividendYield || 0).toFixed(2)}%
                        </span>
                    </div>
                  </div>
                  
                  {/* 🔥 แก้ไขส่วนแสดงราคา (เพิ่มราคาเมื่อวาน) */}
                  <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:'10px', background:'rgba(0,0,0,0.2)', padding:'5px', borderRadius:'5px'}}>
                      <div style={{display:'flex', flexDirection:'column'}}>
                          <span style={{color:'#888', fontSize:'10px', marginBottom:'2px'}}>MARKET PRICE</span>
                          <span style={{color:'#ff9100', fontSize:'10px', textShadow:'0 0 5px #ff9100'}}>PAST PRICE</span>
                      </div>
                      <div style={{textAlign:'right'}}>
                          <p className={`cyber-price ${isDailyUp ? 'up' : 'down'}`} style={{fontSize:'1.3rem', lineHeight:'1'}}>
                            {displayMoney(stock.price)}
                          </p>
                          <p style={{color:'#ff9100', fontSize:'1.1rem', fontWeight:'bold', textShadow:'0 0 8px rgba(255, 145, 0, 0.6)', margin:0, fontFamily:'monospace'}}>
                            {displayMoney(prevPrice)}
                          </p>
                      </div>
                  </div>

                  <div className="cyber-input-area" onClick={(e) => e.stopPropagation()}>
                    <div className="cyber-field">
                        <label>AMOUNT</label>
                        <input type="number" step="any" placeholder="0" value={stock.amount || ''} 
                          onChange={(e) => handleUpdate(stock.symbol, 'amount', e.target.value)} />
                    </div>
                    <div className="cyber-field">
                        <label>AVG ({currency})</label>
                        <input 
                          type="number" step="any" placeholder="0.00" 
                          value={stock.avgCost === undefined ? '' : stock.avgCost} 
                          onChange={(e) => handleUpdate(stock.symbol, 'avgCost', e.target.value)} 
                        />
                    </div>
                  </div>

                  {stock.amount > 0 && (
                    <div className={`cyber-profit-display ${isProfit ? 'up' : 'down'}`}>
                      <div style={{display:'flex', justifyContent:'space-between'}}>
                          <span>TOTAL</span>
                          <span style={{color:'#fff'}}>{displayMoney(totalValue)}</span>
                      </div>
                      <div style={{display:'flex', justifyContent:'space-between', marginTop:'5px'}}>
                          <span>P/L</span>
                          <span style={{fontWeight:'bold', color: isProfit ? '#00e676' : '#ff1744'}}>
                             {isProfit ? '+' : ''}{displayMoney(profit)}
                          </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;600;700&display=swap');

        /* Main Theme */
        .main-layout.cyber-theme {
            background-color: #050505;
            background-image: 
                linear-gradient(rgba(0, 242, 255, 0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0, 242, 255, 0.03) 1px, transparent 1px);
            background-size: 40px 40px;
            font-family: 'Rajdhani', sans-serif;
            color: #e0e0e0;
        }

        /* Glass Panel */
        .glass-panel {
            background: rgba(15, 15, 20, 0.7);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.05);
            padding: 20px;
            border-radius: 2px;
            box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5);
        }
        .dividend-glow { box-shadow: 0 0 20px rgba(255, 230, 0, 0.05); border: 1px solid rgba(255, 230, 0, 0.1); }

        /* Typography */
        .cyber-label { color: #00f2ff; font-size: 12px; letter-spacing: 2px; font-family: 'monospace'; }
        .cyber-label-small { color: #666; font-size: 10px; display:block; letter-spacing: 1px; }
        .cyber-big-number { font-size: 2.8rem; margin: 5px 0; color: #fff; text-shadow: 0 0 15px rgba(255, 255, 255, 0.3); font-weight: 700; }
        .cyber-text-up { color: #00e676; font-weight: bold; font-size: 1.2rem; text-shadow: 0 0 8px rgba(0, 230, 118, 0.4); }
        .cyber-text-down { color: #ff1744; font-weight: bold; font-size: 1.2rem; text-shadow: 0 0 8px rgba(255, 23, 68, 0.4); }

        /* Search Box */
        .search-box-cyber { display: flex; gap: 10px; margin-top: 15px; }
        .cyber-input {
            background: rgba(0,0,0,0.5); border: 1px solid #333; color: #fff; width: 100%; padding: 10px 15px;
            font-family: 'Rajdhani', sans-serif; font-size: 18px; outline: none; transition: 0.3s;
        }
        .cyber-input:focus { border-color: #00f2ff; box-shadow: 0 0 15px rgba(0, 242, 255, 0.2); }
        .cyber-add-btn {
            background: #00f2ff; color: #000; border: none; font-weight: bold; padding: 0 20px; cursor: pointer;
            font-family: 'monospace'; clip-path: polygon(10% 0, 100% 0, 100% 70%, 90% 100%, 0 100%, 0 30%);
            transition: 0.2s;
        }
        .cyber-add-btn:hover { background: #fff; box-shadow: 0 0 15px #00f2ff; }
        .cyber-currency-btn { background: transparent; border: 1px solid #444; color: #ffd700; cursor: pointer; font-family: 'monospace'; }

        /* Card Styling */
        .cyber-card {
            background: rgba(25, 25, 30, 0.8); border: 1px solid rgba(255, 255, 255, 0.05);
            padding: 20px; position: relative; transition: 0.3s; overflow: hidden;
        }
        .cyber-card:hover { transform: translateY(-5px); border-color: #00f2ff; box-shadow: 0 5px 20px rgba(0, 242, 255, 0.15); }
        .card-overlay {
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            background: linear-gradient(135deg, transparent 0%, rgba(0, 242, 255, 0.02) 50%, transparent 100%);
            pointer-events: none;
        }
        
        .cyber-delete-btn {
            position: absolute; top: 5px; right: 5px; background: rgba(255, 0, 0, 0.1); border: none; color: #ff1744;
            width: 30px; height: 30px; cursor: pointer; transition: 0.2s; border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
        }
        .cyber-delete-btn:hover { background: #ff1744; color: #fff; transform: scale(1.1); box-shadow: 0 0 10px #ff1744; }

        /* 🔥 ปรับโลโก้ให้ดูดีใน Dark Theme */
        .cyber-logo-wrapper { 
            width: 50px; height: 50px; 
            background: rgba(255,255,255,0.05); /* เปลี่ยนจากสีขาวเป็นกระจกมืด */
            border: 1px solid rgba(255,255,255,0.2); 
            border-radius: 50%; 
            padding: 5px; 
            display:flex; align-items:center; justify-content:center; 
            box-shadow: 0 0 15px rgba(0,0,0,0.5);
        }
        .stock-logo { object-fit: contain; }

        .cyber-price { font-size: 1.4rem; font-weight: bold; margin: 0; }
        .cyber-price.up { color: #00e676; text-shadow: 0 0 5px rgba(0, 230, 118, 0.5); }
        .cyber-price.down { color: #ff1744; text-shadow: 0 0 5px rgba(255, 23, 68, 0.5); }

        /* Inputs in Card */
        .cyber-input-area { background: rgba(0,0,0,0.3); padding: 10px; border-radius: 4px; border: 1px solid rgba(255,255,255,0.05); }
        .cyber-field { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; }
        .cyber-field label { font-size: 10px; color: #666; font-family: 'monospace'; }
        .cyber-field input { 
            background: transparent; border: none; border-bottom: 1px solid #444; color: #00f2ff; 
            text-align: right; width: 80px; font-family: 'monospace'; outline: none;
        }
        .cyber-field input:focus { border-bottom-color: #00f2ff; }

        .cyber-profit-display { margin-top: 10px; padding-top: 10px; border-top: 1px dashed #333; font-size: 12px; color: #aaa; font-family: 'monospace'; }
        
        /* Tech Corners */
        .tech-corner-tl { position: absolute; top: 0; left: 0; width: 8px; height: 8px; border-top: 2px solid #00f2ff; border-left: 2px solid #00f2ff; }
        .tech-corner-tr { position: absolute; top: 0; right: 0; width: 8px; height: 8px; border-top: 2px solid #00f2ff; border-right: 2px solid #00f2ff; }
        .tech-corner-br { position: absolute; bottom: 0; right: 0; width: 8px; height: 8px; border-bottom: 2px solid #ffe600; border-right: 2px solid #ffe600; }

        /* 🔥 แก้ไขปุ่ม Hamburger ให้เป็นวงกลม */
        .cyber-btn-icon { 
            background: transparent; border: 1px solid #00f2ff; color: #00f2ff; 
            width: 45px; height: 45px; /* กำหนดขนาดคงที่ */
            border-radius: 50%; /* ทำให้กลม */
            cursor: pointer; transition: 0.2s; 
            display: flex; align-items: center; justify-content: center;
        }
        .cyber-btn-icon:hover { background: #00f2ff; color: #000; box-shadow: 0 0 10px #00f2ff; }

        .cyber-progress-bar { width: 100%; height: 4px; background: #333; margin-top: 10px; }
        .cyber-fill { height: 100%; background: #ffe600; box-shadow: 0 0 10px #ffe600; }
      `}</style>
    </div>
  );
}

export default App;