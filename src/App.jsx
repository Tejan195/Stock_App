import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function App() {
  const [watchlistStocks, setWatchlistStocks] = useState([
    { symbol: 'TSLA', name: 'Tesla, Inc', price: 417.41, change: '+12.2%', logo: 'T' },
    { symbol: 'INTC', name: 'Intel Corporation', price: 118.15, change: '+8.6%', logo: 'IN' },
    { symbol: 'AAPL', name: 'Apple Inc', price: 102.32, change: '-1.2%', logo: 'A' },
    { symbol: 'GTOFF', name: 'GT Capital', price: 192.40, change: '-7.1%', logo: 'G' }
  ]);

  const [selectedStock, setSelectedStock] = useState({
    symbol: 'TSLA',
    name: 'Tesla, Inc',
    ticker: 'TSLA',
    currentPrice: 417.41,
    priceChange: 14.25,
    percentChange: 3.53,
    preMarketPrice: 412.02,
    preMarketChange: 5.38,
    preMarketPercentChange: 1.29,
    closeDate: 'December 27 at 4:00:00 PM EST',
    preMarketTime: '4:34:17 AM EST',
  });

  const [chartData, setChartData] = useState({
    labels: Array.from({ length: 20 }, (_, i) => i + 12),
    datasets: [
      {
        label: 'Portfolio Value',
        data: Array.from({ length: 20 }, () => Math.random() * 100 + 300),
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4
      },
      {
        label: 'Moving Average',
        data: Array.from({ length: 20 }, () => Math.random() * 50 + 320),
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        tension: 0.4
      }
    ]
  });

  const [stockDetails, setStockDetails] = useState({
    previousClose: 431.66,
    open: 419.20,
    bid: '416.45 x 100',
    ask: '418.08 x 100',
    daysRange: '415.75 - 427.00',
    weekRange: '138.80 - 488.54',
    volume: '62,625,165',
    avgVolume: '92,519,436',
    marketCap: '1.34T',
    beta: '2.30',
    peRatio: '114.99',
    eps: '3.63',
    earningsDate: 'Jan 24 - Feb 3, 2025',
    forwardDividend: '--',
    exDividendDate: '--',
    targetEst: '283.88'
  });

  const [incomeData, setIncomeData] = useState({
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
    revenue: [35, 42, 30, 35, 25, 40, 45, 38],
    netIncome: [20, 28, 18, 22, 15, 25, 30, 22]
  });

  const [capitalization, setCapitalization] = useState({
    totalEnterpriseValue: 195.58,
    totalCapital: 73.18,
    netLiability: 60.20,
    marketCap: 145.30,
    commonEquity: 42.63,
    totalLiability: 30.55
  });

  const [indexMetrics, setIndexMetrics] = useState({
    latestValue: 0,
    change: 0,
    percentChange: 0,
    previousValue: 0,
    highestValue: 0,
    lowestValue: 0,
    avgValue: 0
  });

  const [selectedIndex, setSelectedIndex] = useState('');
  const [indices, setIndices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        Papa.parse('/dump.csv', {
          download: true,
          header: true,
          dynamicTyping: true,
          complete: (results) => {
            const data = results.data;
            const filteredData = data.filter(row => row.index_name);
            const uniqueIndices = [...new Set(filteredData.map(row => row.index_name))];
            setIndices(uniqueIndices);
            if (uniqueIndices.length > 0) {
              setSelectedIndex(uniqueIndices[0]);
            }
            setLoading(false);
          },
          error: (err) => {
            setError(err);
            setLoading(false);
          }
        });
      } catch (err) {
        setError(err);
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (!selectedIndex) return;
    const fetchStockData = async () => {
      setLoading(true);
      try {
        Papa.parse('/dump.csv', {
          download: true,
          header: true,
          dynamicTyping: true,
          complete: (results) => {
            const filteredData = results.data.filter(row => row.index_name === selectedIndex && row.closing_index_value !== null);
            filteredData.sort((a, b) => new Date(a.index_date) - new Date(b.index_date));
            const dates = filteredData.map(row => row.index_date);
            const closePrices = filteredData.map(row => row.closing_index_value);
            const openPrices = filteredData.map(row => row.open_index_value);
            const highPrices = filteredData.map(row => row.high_index_value);
            const lowPrices = filteredData.map(row => row.low_index_value);
            const volumes = filteredData.map(row => row.volume);
            const labels = filteredData.map(row => {
              const date = new Date(row.index_date);
              return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
            });
            const values = filteredData.map(row => row.closing_index_value);
            if (values.length > 0) {
              const latest = values[values.length - 1];
              const previous = values.length > 1 ? values[values.length - 2] : latest;
              const change = latest - previous;
              const percentChange = (change / previous) * 100;
              setSelectedStock({
                symbol: selectedIndex,
                name: selectedIndex,
                ticker: selectedIndex,
                currentPrice: latest,
                priceChange: change,
                percentChange: percentChange,
                preMarketPrice: latest,
                preMarketChange: change,
                preMarketPercentChange: percentChange,
                closeDate: labels[labels.length - 1],
                preMarketTime: labels[labels.length - 1]
              });
              setIndexMetrics({
                latestValue: latest.toFixed(2),
                change: change.toFixed(2),
                percentChange: percentChange.toFixed(2),
                previousValue: previous.toFixed(2),
                highestValue: Math.max(...values).toFixed(2),
                lowestValue: Math.min(...values).toFixed(2),
                avgValue: (values.reduce((sum, val) => sum + val, 0) / values.length).toFixed(2)
              });
            }
            setChartData({
              labels: dates,
              datasets: [
                {
                  label: 'Close Price',
                  data: closePrices,
                  borderColor: 'rgba(75, 192, 192, 1)',
                  backgroundColor: 'rgba(75, 192, 192, 0.2)',
                  tension: 0.4
                },
                {
                  label: 'Open Price',
                  data: openPrices,
                  borderColor: 'rgba(54, 162, 235, 1)',
                  backgroundColor: 'rgba(54, 162, 235, 0.2)',
                  tension: 0.4
                },
                {
                  label: 'High Price',
                  data: highPrices,
                  borderColor: 'rgba(255, 99, 132, 1)',
                  backgroundColor: 'rgba(255, 99, 132, 0.2)',
                  tension: 0.4
                },
                {
                  label: 'Low Price',
                  data: lowPrices,
                  borderColor: 'rgba(255, 206, 86, 1)',
                  backgroundColor: 'rgba(255, 206, 86, 0.2)',
                  tension: 0.4
                },
                {
                  label: 'Volume',
                  data: volumes,
                  borderColor: 'rgba(153, 102, 255, 1)',
                  backgroundColor: 'rgba(153, 102, 255, 0.2)',
                  tension: 0.4
                }
              ]
            });
            setLoading(false);
          },
          error: (err) => {
            setError(err);
            setLoading(false);
          }
        });
      } catch (err) {
        setError(err);
        setLoading(false);
      }
    };
    fetchStockData();
  }, [selectedIndex]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        ticks: { color: '#aaa' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      },
      x: {
        ticks: { color: '#aaa' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' }
      }
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#aaa' }
      }
    }
  };

  const incomeChartData = {
    labels: incomeData.months,
    datasets: [
      {
        label: 'Revenue',
        data: incomeData.revenue,
        backgroundColor: 'rgba(75, 192, 192, 0.8)',
      },
      {
        label: 'Net Income',
        data: incomeData.netIncome,
        backgroundColor: 'rgba(54, 162, 235, 0.8)',
      }
    ]
  };

  const CapitalizationBar = ({ label, value, maxValue, color }) => {
    const percentage = (value / maxValue) * 100;
    return (
      <div className="cap-bar mb-2">
        <div className="d-flex justify-content-between mb-1">
          <span className="text-light">{label}</span>
          <span className="text-light">{value}B</span>
        </div>
        <div className="progress" style={{ height: '20px', backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
          <div 
            className="progress-bar" 
            style={{ 
              width: `${percentage}%`, 
              backgroundColor: color
            }}
          />
        </div>
      </div>
    );
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="container-fluid p-0" style={{ backgroundColor: '#1e1e1e', minHeight: '100vh', color: 'white' }}>
      <div className="row g-0">
        <div className="col-auto d-none d-lg-block" style={{ width: '240px', backgroundColor: '#121212', minHeight: '100vh', borderRight: '1px solid #333' }}>
          <div className="p-3">
            <div className="d-flex align-items-center mb-4">
              <div className="me-2 text-white fw-bold fs-5">
                <span className="badge bg-dark">⬜</span> Stockboard
              </div>
            </div>
            <div className="position-relative mb-4">
              <input 
                type="text" 
                className="form-control bg-dark text-light border-0" 
                placeholder="Search" 
                style={{ paddingLeft: '30px' }}
              />
              <span style={{ position: 'absolute', top: '8px', left: '10px', color: '#777' }}>🔍</span>
              <span style={{ position: 'absolute', top: '8px', right: '10px', color: '#777' }}>⌘K</span>
            </div>
            <ul className="nav flex-column mb-4">
              <li className="nav-item mb-2">
                <a className="nav-link d-flex align-items-center text-light" href="#">
                  <span className="me-2">📊</span> Dashboard
                </a>
              </li>
              <li className="nav-item mb-2">
                <a className="nav-link d-flex align-items-center text-light" href="#">
                  <span className="me-2">📁</span> Portfolio
                </a>
              </li>
              <li className="nav-item mb-2">
                <a className="nav-link d-flex align-items-center text-light" href="#">
                  <span className="me-2">🔄</span> Transactions
                </a>
              </li>
              <li className="nav-item mb-2">
                <a className="nav-link d-flex align-items-center text-light" href="#">
                  <span className="me-2">📈</span> Market Overview
                </a>
              </li>
              <li className="nav-item mb-2">
                <a className="nav-link d-flex align-items-center text-light" href="#">
                  <span className="me-2">📰</span> Insights & News
                </a>
              </li>
              <li className="nav-item mb-2">
                <a className="nav-link d-flex align-items-center text-light" href="#">
                  <span className="me-2">❓</span> Help & Center
                </a>
              </li>
              <li className="nav-item mb-2">
                <a className="nav-link d-flex align-items-center text-light" href="#">
                  <span className="me-2">⚙️</span> Settings
                </a>
              </li>
            </ul>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="text-light m-0">MY WATCHLIST</h6>
              <span style={{ color: '#777' }}>⋮</span>
            </div>
            <div className="watchlist">
              {watchlistStocks.map((stock) => (
                <div 
                  key={stock.symbol} 
                  className="d-flex justify-content-between align-items-center p-2 mb-1 rounded"
                  style={{ backgroundColor: stock.symbol === selectedStock.symbol ? '#2a2a2a' : 'transparent' }}
                >
                  <div className="d-flex align-items-center">
                    <div className="stock-logo me-2 rounded text-center" style={{ width: '24px', height: '24px', backgroundColor: '#f55', color: 'white', lineHeight: '24px', fontSize: '12px' }}>
                      {stock.logo}
                    </div>
                    <span>{stock.symbol}</span>
                  </div>
                  <div className="text-end">
                    <div>{stock.price.toFixed(2)}</div>
                    <div style={{ color: stock.change.startsWith('+') ? 'lightgreen' : 'red' }}>{stock.change}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="position-fixed bottom-0 start-0" style={{ width: '240px' }}>
            <div className="m-2 p-3 rounded" style={{ backgroundColor: '#2a2a2a' }}>
              <div className="d-flex justify-content-between">
                <span className="badge bg-dark">⬆️</span>
                <span>×</span>
              </div>
              <p className="fw-bold mt-2 mb-1">Upgrade to pro ↗</p>
              <p className="small text-muted">Upgrade and unlock all features now</p>
            </div>
          </div>
        </div>
        <div className="col">
          <nav className="navbar navbar-dark" style={{ backgroundColor: '#121212', borderBottom: '1px solid #333' }}>
            <div className="container-fluid">
              <div className="d-flex">
                <span className="text-secondary me-2">Dashboard</span>
                <span className="text-secondary mx-1">/</span>
                <span className="text-light">Details Stock</span>
              </div>
              <div className="d-flex">
                <button className="btn btn-dark me-2">
                  <span className="me-1">🔍</span> Analyze Stock
                </button>
                <button className="btn btn-dark me-2">🔖</button>
                <button className="btn btn-dark me-2">🔗</button>
                <button className="btn btn-dark">⋮</button>
              </div>
            </div>
          </nav>
          <div className="container-fluid p-4">
            <div className="mb-4">
              <div className="d-flex align-items-center mb-2">
                <div className="stock-logo me-3 rounded text-center" style={{ width: '36px', height: '36px', backgroundColor: '#f55', color: 'white', lineHeight: '36px', fontSize: '16px' }}>
                  T
                </div>
                <h5 className="m-0">{selectedStock.name} • ({selectedStock.ticker})</h5>
              </div>
              <div className="row">
                <div className="col-md-6">
                  <div className="d-flex align-items-baseline">
                    <h2 className="me-2">{selectedStock.currentPrice}</h2>
                    <span style={{ color: 'lightgreen' }}>+{selectedStock.priceChange} (+{selectedStock.percentChange}%)</span>
                  </div>
                  <div className="text-secondary">At close: {selectedStock.closeDate}</div>
                </div>
                <div className="col-md-6">
                  <div className="d-flex align-items-baseline">
                    <h4 className="me-2">{selectedStock.preMarketPrice}</h4>
                    <span style={{ color: 'lightgreen' }}>+{selectedStock.preMarketChange} (+{selectedStock.preMarketPercentChange}%)</span>
                  </div>
                  <div className="text-secondary">Pre-Market: {selectedStock.preMarketTime}</div>
                </div>
              </div>
              <div className="row mt-3">
                <div className="col-md-12">
                  <button className="btn btn-outline-secondary me-2">
                    <span className="me-1">📊</span> Compare Stock
                  </button>
                  <button className="btn btn-outline-secondary me-2">📈</button>
                  <button className="btn btn-outline-secondary me-2">📉</button>
                  <button className="btn btn-outline-secondary">📊</button>
                </div>
              </div>
            </div>
            <div style={{ height: '300px', marginBottom: '20px' }}>
              <Line data={chartData} options={chartOptions} />
            </div>
            <div className="mb-4">
              <div className="d-flex">
                <button className="btn btn-dark me-2">1D</button>
                <button className="btn btn-dark me-2">1W</button>
                <button className="btn btn-dark me-2 active">1M</button>
                <button className="btn btn-dark me-2">3M</button>
                <button className="btn btn-dark me-2">1Y</button>
                <button className="btn btn-dark me-2">5Y</button>
                <button className="btn btn-dark">ALL</button>
              </div>
            </div>
            <div className="row mb-4">
              <div className="col-md-3 mb-3">
                <div className="card text-light" style={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
                  <div className="card-body p-3">
                    <h6 className="text-secondary mb-2">Previous Close</h6>
                    <p className="m-0">{stockDetails.previousClose}</p>
                  </div>
                </div>
              </div>
              <div className="col-md-3 mb-3">
                <div className="card text-light" style={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
                  <div className="card-body p-3">
                    <h6 className="text-secondary mb-2">Day's Range</h6>
                    <p className="m-0">{stockDetails.daysRange}</p>
                  </div>
                </div>
              </div>
              <div className="col-md-3 mb-3">
                <div className="card text-light" style={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
                  <div className="card-body p-3">
                    <h6 className="text-secondary mb-2">Market Cap (Intraday)</h6>
                    <p className="m-0">{stockDetails.marketCap}</p>
                  </div>
                </div>
              </div>
              <div className="col-md-3 mb-3">
                <div className="card text-light" style={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
                  <div className="card-body p-3">
                    <h6 className="text-secondary mb-2">Earnings Date</h6>
                    <p className="m-0">{stockDetails.earningsDate}</p>
                  </div>
                </div>
              </div>
              <div className="col-md-3 mb-3">
                <div className="card text-light" style={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
                  <div className="card-body p-3">
                    <h6 className="text-secondary mb-2">Open</h6>
                    <p className="m-0">{stockDetails.open}</p>
                  </div>
                </div>
              </div>
              <div className="col-md-3 mb-3">
                <div className="card text-light" style={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
                  <div className="card-body p-3">
                    <h6 className="text-secondary mb-2">52 Week Range</h6>
                    <p className="m-0">{stockDetails.weekRange}</p>
                  </div>
                </div>
              </div>
              <div className="col-md-3 mb-3">
                <div className="card text-light" style={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
                  <div className="card-body p-3">
                    <h6 className="text-secondary mb-2">Beta (5Y Monthly)</h6>
                    <p className="m-0">{stockDetails.beta}</p>
                  </div>
                </div>
              </div>
              <div className="col-md-3 mb-3">
                <div className="card text-light" style={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
                  <div className="card-body p-3">
                    <h6 className="text-secondary mb-2">Forward Dividend & Yield</h6>
                    <p className="m-0">{stockDetails.forwardDividend}</p>
                  </div>
                </div>
              </div>
              <div className="col-md-3 mb-3">
                <div className="card text-light" style={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
                  <div className="card-body p-3">
                    <h6 className="text-secondary mb-2">Bid</h6>
                    <p className="m-0">{stockDetails.bid}</p>
                  </div>
                </div>
              </div>
              <div className="col-md-3 mb-3">
                <div className="card text-light" style={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
                  <div className="card-body p-3">
                    <h6 className="text-secondary mb-2">Volume</h6>
                    <p className="m-0">{stockDetails.volume}</p>
                  </div>
                </div>
              </div>
              <div className="col-md-3 mb-3">
                <div className="card text-light" style={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
                  <div className="card-body p-3">
                    <h6 className="text-secondary mb-2">PE Ratio (TTM)</h6>
                    <p className="m-0">{stockDetails.peRatio}</p>
                  </div>
                </div>
              </div>
              <div className="col-md-3 mb-3">
                <div className="card text-light" style={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
                  <div className="card-body p-3">
                    <h6 className="text-secondary mb-2">Ex-Dividend Date</h6>
                    <p className="m-0">{stockDetails.exDividendDate}</p>
                  </div>
                </div>
              </div>
              <div className="col-md-3 mb-3">
                <div className="card text-light" style={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
                  <div className="card-body p-3">
                    <h6 className="text-secondary mb-2">Ask</h6>
                    <p className="m-0">{stockDetails.ask}</p>
                  </div>
                </div>
              </div>
              <div className="col-md-3 mb-3">
                <div className="card text-light" style={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
                  <div className="card-body p-3">
                    <h6 className="text-secondary mb-2">Avg. Volume</h6>
                    <p className="m-0">{stockDetails.avgVolume}</p>
                  </div>
                </div>
              </div>
              <div className="col-md-3 mb-3">
                <div className="card text-light" style={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
                  <div className="card-body p-3">
                    <h6 className="text-secondary mb-2">EPS (TTM)</h6>
                    <p className="m-0">{stockDetails.eps}</p>
                  </div>
                </div>
              </div>
              <div className="col-md-3 mb-3">
                <div className="card text-light" style={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
                  <div className="card-body p-3">
                    <h6 className="text-secondary mb-2">1y Target Est</h6>
                    <p className="m-0">{stockDetails.targetEst}</p>
                  </div>
                </div>
              </div>
            </div>
            <h5 className="mb-3">Market Overview</h5>
            <div className="row">
              <div className="col-md-6 mb-4">
                <div className="card text-light" style={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
                  <div className="card-body p-3">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="m-0 d-flex align-items-center">
                        <span className="me-2">📋</span> Income Statements
                      </h6>
                      <div>
                        <span className="badge bg-primary me-2">Revenue</span>
                        <span className="badge bg-info">Net Income</span>
                      </div>
                    </div>
                    <div style={{ height: '200px' }}>
                      <div className="d-flex justify-content-between" style={{ height: '100%' }}>
                        {incomeData.months.map((month, index) => (
                          <div key={month} className="d-flex flex-column align-items-center" style={{ width: `${100 / incomeData.months.length}%` }}>
                            <div className="d-flex flex-column-reverse" style={{ height: '80%', width: '100%' }}>
                              <div style={{ height: `${incomeData.revenue[index] * 2}px`, backgroundColor: 'rgba(75, 192, 192, 0.8)', width: '60%', margin: '0 auto' }}></div>
                              <div style={{ height: `${incomeData.netIncome[index] * 2}px`, backgroundColor: 'rgba(54, 162, 235, 0.8)', width: '60%', margin: '0 auto', marginBottom: '5px' }}></div>
                            </div>
                            <div className="text-center mt-2">
                              <div style={{ fontSize: '12px' }}>{month}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-6 mb-4">
                <div className="card text-light" style={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
                  <div className="card-body p-3">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="m-0 d-flex align-items-center">
                        <span className="me-2">📊</span> Capitalizations Overview
                      </h6>
                      <span>⋮</span>
                    </div>
                    <div className="mt-4">
                      <CapitalizationBar label="Net Liability" value={capitalization.netLiability} maxValue={200} color="#4dabf7" />
                      <CapitalizationBar label="Market Cap" value={capitalization.marketCap} maxValue={200} color="#4dabf7" />
                      <CapitalizationBar label="Common Equity" value={capitalization.commonEquity} maxValue={200} color="#82c91e" />
                      <CapitalizationBar label="Total Liability" value={capitalization.totalLiability} maxValue={200} color="#82c91e" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;