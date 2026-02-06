import React, { useState, useEffect, useCallback, useMemo } from 'react'; // เพิ่ม useMemo
import ReactApexChart from 'react-apexcharts';
import { useParams, useNavigate } from 'react-router-dom';
import '../App.css';

const API_URL = import.meta.env.VITE_API_URL;

const StockDetail = ({ exchangeRate = 34.5 }) => { 
  const { symbol } = useParams();
  const navigate = useNavigate();
  
  const [currency, setCurrency] = useState('USD'); 
  const [chartData, setChartData] = useState({ series: [], options: {} });
  const [rsiData, setRsiData] = useState({ series: [], options: {} });
  const [rsiNow, setRsiNow] = useState(null); 
  const [activeBtn, setActiveBtn] = useState('1M');
  const [rawData, setRawData] = useState([]); 
  const [predictionInfo, setPredictionInfo] = useState(null);
  const [news, setNews] = useState([]);

  // 🔥 State สำหรับ AI Sentiment
  const [sentiment, setSentiment] = useState({ score: 0, advice: 'INITIALIZING AI SYSTEMS...', trend: 'NEUTRAL', loading: true });

  // --- Helper Functions ---
  const convertPrice = useCallback((price) => {
      if (!price) return 0;
      return currency === 'THB' ? price * exchangeRate : price;
  }, [currency, exchangeRate]);

  const getXAxisFormatter = (period) => {
    return function(val) {
        if (!val) return '';
        const date = new Date(val);
        if (period === '1D') return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
        if (period === '1M') return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
        return date.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' });
    }
  };

  const getRsiStatus = (val) => {
    if (val >= 70) return { text: "OVERBOUGHT (DANGER)", color: '#ff0055' };
    if (val <= 30) return { text: "OVERSOLD (OPPORTUNITY)", color: '#00f2ff' };
    return { text: "STABLE", color: '#2979ff' };
  };

  const getSentimentColor = (score) => {
      if (score >= 30) return '#00f2ff'; // Cyan (Bullish)
      if (score <= -30) return '#ff0055'; // Neon Red (Bearish)
      return '#ffd700'; // Gold (Neutral)
  };

  // --- RSI Calculation ---
  const calculateRSI = (prices, period = 14) => {
    if (!prices || prices.length < period) return []; 
    let rsiArray = [];
    let gains = 0; let losses = 0;
    for (let i = 1; i <= period; i++) {
        const change = prices[i][1] - prices[i - 1][1];
        if (change > 0) gains += change; else losses += Math.abs(change);
    }
    let avgGain = gains / period;
    let avgLoss = losses / period;
    for (let i = period + 1; i < prices.length; i++) {
        const change = prices[i][1] - prices[i - 1][1];
        let currentGain = change > 0 ? change : 0;
        let currentLoss = change < 0 ? Math.abs(change) : 0;
        avgGain = ((avgGain * 13) + currentGain) / 14;
        avgLoss = ((avgLoss * 13) + currentLoss) / 14;
        if (avgLoss === 0) rsiArray.push([prices[i][0], 100]);
        else {
            let rs = avgGain / avgLoss;
            let rsi = 100 - (100 / (1 + rs));
            rsiArray.push([prices[i][0], rsi]);
        }
    }
    return rsiArray;
  };

  // --- 🔥 Calculated Stats (HUD Logic) ---
  const stats = useMemo(() => {
    if (rawData.length === 0) return null;
    
    // หา High/Low ของช่วงเวลาที่เลือก
    const prices = rawData.map(d => d[1]);
    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);
    const currentPrice = prices[prices.length - 1];
    
    // คำนวณ % ว่าราคาอยู่ตรงไหนของ Range (0-100%)
    const rangePos = ((currentPrice - minPrice) / (maxPrice - minPrice)) * 100;

    // คำนวณ Signal ง่ายๆ
    let signal = "HOLD";
    let signalColor = "#ffd700";
    if (rsiNow !== null) {
        if (rsiNow <= 30) { signal = "STRONG BUY"; signalColor = "#00f2ff"; }
        else if (rsiNow >= 70) { signal = "STRONG SELL"; signalColor = "#ff0055"; }
        else if (rsiNow > 30 && rsiNow < 45) { signal = "ACCUMULATE"; signalColor = "#00e676"; }
        else if (rsiNow > 55 && rsiNow < 70) { signal = "TAKE PROFIT"; signalColor = "#ff9100"; }
    }

    return { maxPrice, minPrice, rangePos, signal, signalColor };
  }, [rawData, rsiNow]);


  // --- Update Charts (Themed) ---
  const updateChartLayout = useCallback((seriesData, period) => {
    const mainOptions = {
        chart: { 
            type: 'line', height: 350, 
            background: 'transparent', 
            foreColor: '#888', 
            toolbar: { show: false }, 
            animations: { enabled: true, easing: 'easeinout', speed: 800 } 
        }, 
        colors: ['#00f2ff', '#ff0055', '#d500f9', '#00e676', '#ff1744'], 
        stroke: { curve: 'smooth', width: 2 },
        xaxis: { type: 'datetime', labels: { show: false }, tooltip: { enabled: false }, axisBorder: { show: false }, axisTicks: { show: false } }, 
        yaxis: { labels: { style: { colors: '#888', fontFamily: 'monospace' }, formatter: (val) => convertPrice(val).toFixed(2) } },
        grid: { borderColor: 'rgba(255,255,255,0.05)', strokeDashArray: 4 },
        tooltip: { 
            theme: 'dark', 
            style: { fontSize: '12px', fontFamily: 'monospace' },
            x: { formatter: getXAxisFormatter(period) },
            y: { formatter: (val) => { const price = convertPrice(val); return currency === 'THB' ? `฿${price.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : `$${price.toFixed(2)}`; } }
        }
    };

    setChartData({ series: seriesData, options: mainOptions });

    if (seriesData[0] && seriesData[0].data && seriesData[0].data.length > 14) {
        const rsiSeries = calculateRSI(seriesData[0].data);
        const lastRSI = rsiSeries.length > 0 ? rsiSeries[rsiSeries.length - 1][1] : 50;
        setRsiNow(lastRSI);

        setRsiData({
            series: [{ name: 'RSI', data: rsiSeries }],
            options: {
                chart: { type: 'line', height: 150, background: 'transparent', foreColor: '#666', toolbar: { show: false } },
                colors: [lastRSI > 70 ? '#ff0055' : lastRSI < 30 ? '#00f2ff' : '#2979ff'], 
                stroke: { width: 2, curve: 'stepline' }, 
                xaxis: { type: 'datetime', labels: { formatter: getXAxisFormatter(period), style: { fontSize: '10px', fontFamily: 'monospace' } }, tooltip: { enabled: false }, axisBorder: { show: false } },
                yaxis: { max: 100, min: 0, tickAmount: 2, labels: { show: true, formatter: (val) => val.toFixed(0), style: { fontFamily: 'monospace' } } },
                grid: { borderColor: 'rgba(255,255,255,0.05)', strokeDashArray: 4 },
                annotations: { yaxis: [{ y: 70, borderColor: 'rgba(255, 0, 85, 0.5)', strokeDashArray: 2 }, { y: 30, borderColor: 'rgba(0, 242, 255, 0.5)', strokeDashArray: 2 }] },
                tooltip: { theme: 'dark', x: { show: false }, y: { formatter: (val) => val.toFixed(1) } } 
            }
        });
    } else {
        setRsiData({ series: [], options: {} }); 
        setRsiNow(null);
    }
  }, [convertPrice, currency]); 

  // --- Fetch Market Data ---
  const fetchData = useCallback(async (period, interval, size) => {
    setActiveBtn(period);
    setPredictionInfo(null); 
    try {
      const res = await fetch(`${API_URL}/get_api_history.php?symbol=${symbol}&interval=${interval}&size=${size}`);
      const data = await res.json();
      if (data.values) {
        const prices = data.values.map(item => [new Date(item.datetime).getTime(), parseFloat(item.close)]).sort((a, b) => a[0] - b[0]); 
        setRawData(prices);
        updateChartLayout([{ name: 'Price', data: prices }], period);
      }
    } catch (error) { console.error("Fetch error:", error); }
  }, [symbol, updateChartLayout]);

  // --- AI Forecast Logic ---
  const calculatePrediction = () => {
    if (rawData.length < 10) { alert("INSUFFICIENT DATA FOR ANALYSIS"); return; }
    // ... AI Logic ...
    const sliceIndex = Math.floor(rawData.length * 0.7);
    const recentData = rawData.slice(sliceIndex);
    const n = recentData.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    const dataPoints = recentData.map((d, i) => ({ x: i, y: d[1], time: d[0] }));
    dataPoints.forEach(p => { sumX += p.x; sumY += p.y; sumXY += (p.x * p.y); sumXX += (p.x * p.x); });
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    const variance = dataPoints.reduce((sum, p) => sum + Math.pow(p.y - (slope * p.x + intercept), 2), 0) / n;
    const stdDev = Math.sqrt(variance);
    const futurePointsCount = Math.floor(rawData.length * 0.2); 
    const timeDiff = rawData[1] ? (rawData[1][0] - rawData[0][0]) : 86400000;
    const lastTime = rawData[rawData.length - 1][0];
    const predictionData = []; const upperData = []; const lowerData = [];
    
    for (let i = 1; i <= futurePointsCount; i++) {
       const currentX = (n - 1) + i; 
       const futureTime = lastTime + (i * timeDiff);
       const predictedPrice = slope * currentX + intercept;
       predictionData.push([futureTime, predictedPrice]);
       upperData.push([futureTime, predictedPrice + (stdDev * 2)]);
       lowerData.push([futureTime, predictedPrice - (stdDev * 2)]);
    }
    const lastPred = predictionData[predictionData.length - 1][1];
    const currentPrice = rawData[rawData.length - 1][1];
    const percentChange = ((lastPred - currentPrice) / currentPrice) * 100;
    
    setPredictionInfo({ target: lastPred, change: percentChange.toFixed(2), trend: percentChange >= 0 ? 'UP' : 'DOWN' });
    const newSeries = [{ name: 'History', data: rawData }, { name: '🔮 AI Trend', data: predictionData }, { name: 'Bull Case', data: upperData }, { name: 'Bear Case', data: lowerData }];
    updateChartLayout(newSeries, activeBtn); 
  };

  // --- Real AI Sentiment ---
  const analyzeRealSentiment = async (newsItems) => {
    if (!newsItems || newsItems.length === 0) {
        setSentiment(prev => ({ ...prev, loading: false, advice: 'NO DATA STREAM' }));
        return;
    }
    const combinedNews = newsItems.slice(0, 10).map(item => `- ${item.title}: ${item.description}`).join('\n');
    setSentiment(prev => ({ ...prev, loading: true, advice: 'ESTABLISHING UPLINK TO GEMINI CORE...' }));

    try {
        const res = await fetch(`${API_URL}/get_ai_sentiment.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ news: combinedNews })
        });
        const data = await res.json();
        
        if (data.debug_response && data.debug_response.error) {
             setSentiment({ score: 0, trend: 'SYSTEM ERROR', advice: 'LINK FAILURE: ' + data.debug_response.error.message, loading: false });
        } else {
             setSentiment({
                score: data.score || 0,
                trend: data.trend || 'NEUTRAL',
                advice: data.advice || 'ANALYSIS COMPLETE',
                loading: false
            });
        }
    } catch (error) {
        console.error("AI Error:", error);
        setSentiment(prev => ({ ...prev, advice: 'CONNECTION LOST', loading: false }));
    }
  };

  const fetchNews = useCallback(async () => {
      try {
          const res = await fetch(`${API_URL}/get_api_news.php?symbol=${symbol}`);
          const data = await res.json();
          setNews(data);
          analyzeRealSentiment(data); 
      } catch (error) { 
          console.error("News error:", error);
          setSentiment(prev => ({ ...prev, loading: false, advice: 'DATA CORRUPTED' }));
      }
  }, [symbol]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchData('1M', '1day', '60'); fetchNews(); }, [fetchData, fetchNews]);

  useEffect(() => {
      if (rawData.length > 0) {
          if(chartData.series.length > 1) {
             // eslint-disable-next-line react-hooks/set-state-in-effect
             updateChartLayout(chartData.series, activeBtn);
          } else {
             updateChartLayout([{ name: 'Price', data: rawData }], activeBtn);
          }
      }
  }, [currency, exchangeRate, rawData, activeBtn, updateChartLayout]); 

  // --- Chart Configs ---
  const sentimentChartOptions = {
    chart: { type: 'radialBar', offsetY: -10, sparkline: { enabled: true }, background: 'transparent' },
    plotOptions: {
      radialBar: {
        startAngle: -135, endAngle: 135,
        track: { background: "rgba(255,255,255,0.1)", strokeWidth: '50%', margin: 15 },
        dataLabels: {
          name: { show: false },
          value: { offsetY: 5, fontSize: '24px', color: '#fff', fontFamily: 'monospace', fontWeight: 'bold' }
        },
        hollow: { margin: 15, size: "60%" }
      }
    },
    fill: { 
        type: 'gradient', 
        gradient: { shade: 'dark', type: 'horizontal', shadeIntensity: 0.5, gradientToColors: ['#00f2ff'], inverseColors: true, opacityFrom: 1, opacityTo: 1, stops: [0, 100] } 
    },
    stroke: { lineCap: 'round' },
    colors: [getSentimentColor(sentiment.score)],
    labels: ['Sentiment'],
  };

  return (
    <div className="app-container cyber-bg">
      <header style={{display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom: '1px solid rgba(0, 242, 255, 0.3)', paddingBottom: '15px'}}>
        <div style={{display:'flex', alignItems:'center', gap:'20px'}}>
            <button onClick={() => navigate('/')} className="cyber-btn">❮ SYSTEM BACK</button>
            <div>
                <h1 style={{margin:0, fontFamily: 'monospace', letterSpacing: '4px', textShadow: '0 0 10px rgba(0, 242, 255, 0.8)'}}>
                    {symbol} <span style={{fontSize:'12px', color:'#00f2ff', border:'1px solid #00f2ff', padding:'2px 5px'}}>LIVE</span>
                </h1>
            </div>
            <button 
                onClick={() => setCurrency(prev => prev === 'USD' ? 'THB' : 'USD')}
                className="cyber-btn-small"
                style={{borderColor: currency === 'THB' ? '#ffd700' : '#444', color: currency === 'THB' ? '#ffd700' : '#888'}}
            >
                {currency} UNIT
            </button>
        </div>
        <button onClick={calculatePrediction} className="cyber-btn-glitch" data-text="🔮 AI FORECAST">🔮 AI FORECAST</button>
      </header>
      
      {/* 🔥 TACTICAL HUD (ส่วนใหม่ที่เพิ่มเข้ามา) */}
      {stats && (
        <div className="glass-panel" style={{marginTop:'20px', padding:'15px', display:'flex', justifyContent:'space-between', alignItems:'center', borderTop:'2px solid #00f2ff'}}>
            
            {/* 1. Signal Status */}
            <div style={{textAlign:'center', paddingRight:'20px', borderRight:'1px solid rgba(255,255,255,0.1)'}}>
                <div style={{fontSize:'10px', color:'#888', letterSpacing:'2px'}}>TACTICAL SIGNAL</div>
                <div style={{fontSize:'24px', fontWeight:'bold', color: stats.signalColor, textShadow:`0 0 10px ${stats.signalColor}`, fontFamily:'monospace'}}>
                    {stats.signal}
                </div>
            </div>

            {/* 2. Range Bar */}
            <div style={{flex:1, padding:'0 30px'}}>
                <div style={{display:'flex', justifyContent:'space-between', fontSize:'10px', color:'#aaa', marginBottom:'5px', fontFamily:'monospace'}}>
                    <span>LO: {convertPrice(stats.minPrice).toLocaleString()}</span>
                    <span>PERIOD RANGE</span>
                    <span>HI: {convertPrice(stats.maxPrice).toLocaleString()}</span>
                </div>
                <div style={{height:'6px', background:'#333', borderRadius:'3px', position:'relative'}}>
                    <div style={{
                        position:'absolute', 
                        left:`${stats.rangePos}%`, 
                        top:'-4px', 
                        width:'14px', height:'14px', 
                        background: stats.signalColor, 
                        borderRadius:'50%', 
                        boxShadow:`0 0 10px ${stats.signalColor}`,
                        transform:'translateX(-50%)'
                    }}></div>
                </div>
            </div>

            {/* 3. Prediction Info (ถ้ามี) */}
            {predictionInfo && (
                <div style={{textAlign:'right', paddingLeft:'20px', borderLeft:'1px solid rgba(255,255,255,0.1)'}}>
                    <div style={{fontSize:'10px', color:'#888', letterSpacing:'2px'}}>AI TARGET</div>
                    <div style={{fontSize:'18px', color: predictionInfo.trend === 'UP' ? '#00e676' : '#ff1744', fontWeight:'bold', fontFamily:'monospace'}}>
                        {predictionInfo.trend === 'UP' ? '▲' : '▼'} {predictionInfo.change}%
                    </div>
                </div>
            )}
        </div>
      )}

      {/* Main Chart (Glass) */}
      <div className="glass-panel" style={{ marginTop:'20px', position:'relative' }}>
        <div className="tech-corner-tl"></div>
        <div className="tech-corner-br"></div>
        
        <div className="toolbar" style={{marginBottom:'15px', display:'flex', gap:'10px'}}>
             {['1D', '1M', '1Y'].map(t => (
                 <button key={t} className={activeBtn === t ? 'cyber-tab-active' : 'cyber-tab'} onClick={() => fetchData(t, t==='1D'?'5min':t==='1M'?'1day':'1week', '60')}>
                     {t}
                 </button>
             ))}
        </div>
        
        {chartData.series.length > 0 ? (
            <>
                <ReactApexChart key={currency} options={chartData.options} series={chartData.series} type="line" height={350} />
                {rsiData.series.length > 0 && rsiNow !== null && (
                    <div style={{marginTop: '-10px', borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '10px'}}>
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 10px'}}>
                            <span style={{fontSize: '10px', color: '#00f2ff', fontFamily:'monospace'}}>RSI OSCILLATOR (14)</span>
                            <div style={{fontSize: '12px', fontWeight: 'bold', color: getRsiStatus(rsiNow).color, fontFamily:'monospace', textShadow: `0 0 5px ${getRsiStatus(rsiNow).color}`}}>
                                STATUS: {getRsiStatus(rsiNow).text} [{rsiNow.toFixed(0)}]
                            </div>
                        </div>
                        <div style={{height: '150px'}}>
                             <ReactApexChart options={rsiData.options} series={rsiData.series} type="line" height={150} />
                        </div>
                    </div>
                )}
            </>
        ) : (<div className="loading-scan">SCANNING MARKET DATA...</div>)}
      </div>

      <div style={{marginTop: '30px'}}>
        <h3 style={{color: '#fff', borderLeft: '4px solid #00f2ff', paddingLeft: '10px', fontFamily: 'monospace', letterSpacing:'2px'}}>
            🤖 GEMINI_CORE [V.3.0] ANALYSIS
        </h3>
        
        <div style={{display: 'flex', flexWrap: 'wrap', gap: '20px', marginTop: '15px'}}>
            
            {/* 1. Gauge Chart (Reactor Core) */}
            <div className="glass-panel" style={{flex: '1', minWidth: '250px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
                <span style={{color:'#00f2ff', fontSize:'10px', letterSpacing:'2px', marginBottom:'10px'}}>MARKET_EMOTION_INDEX</span>
                {sentiment.loading ? (
                    <div className="scanner-container">
                        <div className="scanner-line"></div>
                        <div style={{color:'#00f2ff', fontSize:'12px', marginTop:'10px', fontFamily:'monospace'}}>PROCESSING...</div>
                    </div>
                ) : (
                    <>
                        <ReactApexChart options={sentimentChartOptions} series={[Math.abs(sentiment.score)]} type="radialBar" height={220} />
                        <div style={{marginTop: '-30px', fontWeight: 'bold', color: getSentimentColor(sentiment.score), fontSize: '20px', fontFamily:'monospace', textShadow: `0 0 10px ${getSentimentColor(sentiment.score)}`}}>
                            {sentiment.trend}
                        </div>
                    </>
                )}
            </div>

            {/* 2. Advice Box (Terminal) */}
            <div className="glass-panel" style={{flex: '2', minWidth: '300px', display:'flex', flexDirection:'column'}}>
                <div style={{borderBottom:'1px solid rgba(255,255,255,0.1)', paddingBottom:'10px', marginBottom:'10px'}}>
                    <span style={{color:'#fff', fontFamily:'monospace'}}>📑 EXECUTIVE_SUMMARY_LOG</span>
                </div>
                {sentiment.loading ? (
                    <div style={{color:'#00f2ff', fontFamily:'monospace', fontSize:'14px', lineHeight:'1.5'}}>
                        {'>'} CONNECTING TO SATELLITE...<br/>
                        {'>'} DECRYPTING NEWS DATA...<br/>
                        {'>'} <span className="blink">AWAITING RESPONSE_</span>
                    </div>
                ) : (
                    <>
                        <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'10px'}}>
                            <div style={{width:'10px', height:'10px', background: getSentimentColor(sentiment.score), borderRadius:'50%', boxShadow: `0 0 10px ${getSentimentColor(sentiment.score)}`}}></div>
                            <span style={{fontFamily:'monospace', color: getSentimentColor(sentiment.score), fontSize:'18px'}}>SCORE: {sentiment.score}/100</span>
                        </div>
                        <p style={{color: '#ddd', fontSize: '16px', lineHeight: '1.6', fontFamily:'sans-serif', borderLeft:`2px solid ${getSentimentColor(sentiment.score)}`, paddingLeft:'15px'}}>
                            "{sentiment.advice}"
                        </p>
                        <div style={{marginTop:'auto', paddingTop:'15px', textAlign:'right'}}>
                            <small style={{color: '#666', fontFamily:'monospace', fontSize:'10px'}}>
                                MODEL: GEMINI-3-FLASH-PREVIEW // LATENCY: 24ms
                            </small>
                        </div>
                    </>
                )}
            </div>
        </div>

        <div className="news-grid" style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px', marginTop:'20px'}}>
            {news.map((item, index) => (
                <a key={index} href={item.link} target="_blank" rel="noopener noreferrer" style={{textDecoration:'none', color:'inherit'}}>
                    <div className="cyber-card">
                        <div style={{display:'flex', justifyContent:'space-between'}}>
                            <small style={{color:'#00f2ff', fontFamily:'monospace'}}>{item.pubDate}</small>
                            <small style={{color:'#444'}}>ID: {index + 1000}</small>
                        </div>
                        <h4 style={{margin:'10px 0', color:'#e0e0e0', fontFamily:'sans-serif'}}>{item.title}</h4>
                        <p style={{fontSize:'12px', color:'#aaa', overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical'}}>{item.description}</p>
                    </div>
                </a>
            ))}
        </div>
      </div>
      
      {/* 🔥 CSS Styles for Cyberpunk Look */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;600;700&display=swap');

        .app-container.cyber-bg {
            background-color: #050505;
            background-image: 
                linear-gradient(rgba(0, 242, 255, 0.03) 1px, transparent 1px),
                linear-gradient(90deg, rgba(0, 242, 255, 0.03) 1px, transparent 1px);
            background-size: 30px 30px;
            color: #e0e0e0;
            font-family: 'Rajdhani', sans-serif;
            min-height: 100vh;
            padding: 20px;
        }

        /* Glassmorphism Panel */
        .glass-panel {
            background: rgba(20, 20, 25, 0.6);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.08);
            box-shadow: 0 4px 30px rgba(0, 0, 0, 0.5);
            padding: 20px;
            border-radius: 10px;
            position: relative;
            overflow: hidden;
        }

        /* Tech Corners */
        .tech-corner-tl { position: absolute; top: 0; left: 0; width: 10px; height: 10px; border-top: 2px solid #00f2ff; border-left: 2px solid #00f2ff; }
        .tech-corner-br { position: absolute; bottom: 0; right: 0; width: 10px; height: 10px; border-bottom: 2px solid #00f2ff; border-right: 2px solid #00f2ff; }

        /* Cyber Buttons */
        .cyber-btn {
            background: transparent;
            border: 1px solid #00f2ff;
            color: #00f2ff;
            padding: 8px 15px;
            font-family: 'monospace';
            cursor: pointer;
            transition: all 0.3s;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .cyber-btn:hover { background: rgba(0, 242, 255, 0.1); box-shadow: 0 0 15px rgba(0, 242, 255, 0.4); text-shadow: 0 0 5px #00f2ff; }

        .cyber-btn-small {
            background: transparent;
            border: 1px solid #444;
            padding: 5px 10px;
            cursor: pointer;
            font-family: 'monospace';
            font-size: 12px;
            border-radius: 4px;
        }

        .cyber-btn-glitch {
            background: linear-gradient(45deg, #00f2ff, #0051ff);
            border: none;
            color: #000;
            font-weight: bold;
            padding: 10px 20px;
            font-family: 'monospace';
            cursor: pointer;
            clip-path: polygon(10% 0, 100% 0, 100% 80%, 90% 100%, 0 100%, 0 20%);
            transition: all 0.3s;
        }
        .cyber-btn-glitch:hover { filter: brightness(1.2); box-shadow: 0 0 20px rgba(0, 242, 255, 0.6); }

        /* Tabs */
        .cyber-tab { background: transparent; border: none; color: #666; padding: 5px 15px; cursor: pointer; font-family: 'monospace'; border-bottom: 2px solid transparent; }
        .cyber-tab-active { background: transparent; border: none; color: #00f2ff; padding: 5px 15px; cursor: pointer; font-family: 'monospace'; border-bottom: 2px solid #00f2ff; text-shadow: 0 0 10px rgba(0, 242, 255, 0.5); }

        /* Cyber Card */
        .cyber-card {
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.05);
            padding: 15px;
            transition: all 0.3s;
            position: relative;
        }
        .cyber-card:hover { 
            transform: translateY(-5px); 
            border-color: #00f2ff; 
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5); 
        }
        .cyber-card::before { content: ''; position: absolute; top: 0; left: 0; width: 0%; height: 2px; background: #00f2ff; transition: width 0.3s; }
        .cyber-card:hover::before { width: 100%; }

        /* Animations */
        .blink { animation: blinker 1s linear infinite; }
        @keyframes blinker { 50% { opacity: 0; } }

        .loading-scan {
            color: #00f2ff; font-family: 'monospace'; text-align: center; margin-top: 50px;
            animation: pulse 1.5s infinite;
        }
        @keyframes pulse { 0% { opacity: 0.5; } 50% { opacity: 1; text-shadow: 0 0 10px #00f2ff; } 100% { opacity: 0.5; } }

        .scanner-container { height: 100px; width: 100%; position: relative; overflow: hidden; background: rgba(0, 242, 255, 0.05); }
        .scanner-line {
            width: 100%; height: 2px; background: #00f2ff; box-shadow: 0 0 10px #00f2ff;
            position: absolute; top: 0;
            animation: scan 1.5s linear infinite;
        }
        @keyframes scan { 0% { top: 0%; } 100% { top: 100%; } }

        /* Custom Scrollbar */
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #0a0a0a; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #00f2ff; }
      `}</style>
    </div>
  );
};

export default StockDetail;