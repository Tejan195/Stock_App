import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { Line } from 'react-chartjs-2';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

function App() {
  const [watchlistStocks, setWatchlistStocks] = useState([
    { symbol: 'NIFTY 50', name: 'Nifty 50', price: 0, change: '0', logo: 'T' },
    { symbol: 'INTC', name: 'Intel Corporation', price: 0, change: '0', logo: 'IN' },
    { symbol: 'AAPL', name: 'Apple Inc', price: 0, change: '0', logo: 'A' },
    { symbol: 'GTOFF', name: 'GT Capital', price: 0, change: '0', logo: 'G' },
  ]);

  const [selectedStock, setSelectedStock] = useState({
    symbol: '',
    name: '',
    ticker: '',
    currentPrice: 0,
    priceChange: 0,
    percentChange: 0,
    preMarketPrice: 0,
    preMarketChange: 0,
    preMarketPercentChange: 0,
  });

  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [
      {
        label: 'Close Price',
        data: [],
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4,
        yAxisID: 'y',
        pointRadius: 0,
      },
      {
        label: 'Open Price',
        data: [],
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        tension: 0.4,
        yAxisID: 'y',
        pointRadius: 0,
      },
      {
        label: 'High Price',
        data: [],
        borderColor: 'rgba(255, 99, 132, 1)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.4,
        yAxisID: 'y',
        pointRadius: 0,
      },
      {
        label: 'Low Price',
        data: [],
        borderColor: 'rgba(255, 206, 86, 1)',
        backgroundColor: 'rgba(255, 206, 86, 0.2)',
        tension: 0.4,
        yAxisID: 'y',
        pointRadius: 0,
      },
      {
        label: 'Volume',
        data: [],
        borderColor: 'rgba(153, 102, 255, 1)',
        backgroundColor: 'rgba(153, 102, 255, 0.2)',
        tension: 0.4,
        yAxisID: 'y1',
        pointRadius: 0,
      },
    ],
  });

  const [stockDetails, setStockDetails] = useState({
    previousClose: 0,
    open: 0,
    pointsChange: 0,
    changePercent: 0,
    volume: 0,
    turnover: 0,
    pbRatio: 0,
    peRatio: 0,
    divyield: 0,
    daysRange: 'N/A',
  });

  const [incomeData, setIncomeData] = useState({
    months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'],
    revenue: [0, 0, 0, 0, 0, 0, 0, 0],
    netIncome: [0, 0, 0, 0, 0, 0, 0, 0],
  });

  const [capitalization, setCapitalization] = useState({
    totalEnterpriseValue: 0,
    totalCapital: 0,
    netLiability: 0,
    marketCap: 0,
    commonEquity: 0,
    totalLiability: 0,
  });

  const [indexMetrics, setIndexMetrics] = useState({
    latestValue: 0,
    change: 0,
    percentChange: 0,
    previousValue: 0,
    highestValue: 0,
    lowestValue: 0,
    avgValue: 0,
  });

  const [selectedIndex, setSelectedIndex] = useState('');
  const [indices, setIndices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('1M');
  const [rawData, setRawData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

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
            setRawData(filteredData);
            if (uniqueIndices.length > 0) {
              setSelectedIndex(uniqueIndices[0]);
            }
            setLoading(false);
          },
          error: (err) => {
            setError(err);
            setLoading(false);
          },
        });
      } catch (err) {
        setError(err);
        setLoading(false);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (!selectedIndex || !rawData.length) return;
  
    const filteredDataByTimeRange = (data, range) => {
      const now = new Date('2024-03-23');
      const startDate = new Date(now);
      switch (range) {
        case '1D':
          startDate.setDate(now.getDate() - 1);
          break;
        case '1W':
          startDate.setDate(now.getDate() - 7);
          break;
        case '1M':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case '3M':
          startDate.setMonth(now.getMonth() - 3);
          break;
        case '1Y':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
        case '5Y':
          startDate.setFullYear(now.getFullYear() - 5);
          break;
        case 'ALL':
          startDate = new Date('1900-01-01');
          break;
        default:
          startDate.setMonth(now.getMonth() - 1);
          break;
      }
  
      let filtered = data.filter(row => {
        const rowDate = new Date(row.index_date);
        return rowDate >= startDate && rowDate <= now;
      });
  
      if (filtered.length === 0) {
        console.warn(`No data found for ${range}. Falling back to all available data.`);
        filtered = data;
      }
  
      return filtered;
    };
  
    const aggregateData = (data, range) => {
      if (range === '1D' || range === '1W' || range === '1M' || range === '1Y') {
        return data;
      }
      const aggregated = [];
      const interval = range === '3M' ? 'week' : 'month';
  
      const groupedData = data.reduce((acc, row) => {
        const date = new Date(row.index_date);
        let key;
        if (interval === 'week') {
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = `${weekStart.getFullYear()}-${weekStart.getMonth() + 1}-${weekStart.getDate()}`;
        } else {
          key = `${date.getFullYear()}-${date.getMonth() + 1}`;
        }
        if (!acc[key]) {
          acc[key] = { rows: [], date };
        }
        acc[key].rows.push(row);
        return acc;
      }, {});
  
      Object.values(groupedData).forEach(group => {
        const rows = group.rows;
        const avgRow = {
          index_date: group.date,
          closing_index_value: rows.reduce((sum, r) => sum + (r.closing_index_value || 0), 0) / rows.length,
          open_index_value: rows.reduce((sum, r) => sum + (r.open_index_value || 0), 0) / rows.length,
          high_index_value: rows.reduce((sum, r) => sum + (r.high_index_value || 0), 0) / rows.length,
          low_index_value: rows.reduce((sum, r) => sum + (r.low_index_value || 0), 0) / rows.length,
          volume: rows.reduce((sum, r) => sum + (r.volume || 0), 0) / rows.length,
          pe_ratio: rows.reduce((sum, r) => sum + (r.pe_ratio || 0), 0) / rows.length,
          pb_ratio: rows.reduce((sum, r) => sum + (r.pb_ratio || 0), 0) / rows.length,
          turnover_rs_cr: rows.reduce((sum, r) => sum + (r.turnover_rs_cr || 0), 0) / rows.length,
          points_change: rows.reduce((sum, r) => sum + (r.points_change || 0), 0) / rows.length,
          change_percent: rows.reduce((sum, r) => sum + (r.change_percent || 0), 0) / rows.length,
          div_yield: rows.reduce((sum, r) => sum + (r.div_yield || 0), 0) / rows.length,
        };
        aggregated.push(avgRow);
      });
  
      return aggregated.sort((a, b) => new Date(a.index_date) - new Date(b.index_date));
    };
  
    const filteredData = filteredDataByTimeRange(
      rawData.filter(row => row.index_name === selectedIndex && row.closing_index_value !== null),
      timeRange
    );
    console.log(`Filtered data for ${timeRange}:`, filteredData);
  
    const processedData = aggregateData(filteredData, timeRange);
    console.log(`Processed data for ${timeRange}:`, processedData);
  
    if (processedData.length === 0) {
      console.warn(`No data available for ${timeRange}`);
      setChartData({
        labels: [],
        datasets: [
          { label: 'Close Price', data: [], borderColor: 'rgba(75, 192, 192, 1)', backgroundColor: 'rgba(75, 192, 192, 0.2)', tension: 0.4, yAxisID: 'y', pointRadius: 0 },
          { label: 'Open Price', data: [], borderColor: 'rgba(54, 162, 235, 1)', backgroundColor: 'rgba(54, 162, 235, 0.2)', tension: 0.4, yAxisID: 'y', pointRadius: 0 },
          { label: 'High Price', data: [], borderColor: 'rgba(255, 99, 132, 1)', backgroundColor: 'rgba(255, 99, 132, 0.2)', tension: 0.4, yAxisID: 'y', pointRadius: 0 },
          { label: 'Low Price', data: [], borderColor: 'rgba(255, 206, 86, 1)', backgroundColor: 'rgba(255, 206, 86, 0.2)', tension: 0.4, yAxisID: 'y', pointRadius: 0 },
          { label: 'Volume', data: [], borderColor: 'rgba(153, 102, 255, 1)', backgroundColor: 'rgba(153, 102, 255, 0.2)', tension: 0.4, yAxisID: 'y1', pointRadius: 0 },
        ],
      });
      return;
    }
  
    const dates = processedData.map(row => row.index_date);
    const closePrices = processedData.map(row => row.closing_index_value ?? 0);
    const openPrices = processedData.map(row => row.open_index_value ?? 0);
    const highPrices = processedData.map(row => row.high_index_value ?? 0);
    const lowPrices = processedData.map(row => row.low_index_value ?? 0);
    const volumes = processedData.map(row => row.volume ?? 0);
  
    processedData.sort((a, b) => new Date(a.index_date) - new Date(b.index_date));
    const labels = processedData.map(row => {
      const date = new Date(row.index_date);
      return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    });
    const values = processedData.map(row => row.closing_index_value ?? 0);
  
    if (values.length > 0) {
      const latest = values[values.length - 1];
      const previous = values.length > 1 ? values[values.length - 2] : latest;
      const change = latest - previous;
      const percentChange = previous !== 0 ? (change / previous) * 100 : 0;
  
      setSelectedStock(prevStock => ({
        ...prevStock,
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
        preMarketTime: labels[labels.length - 1],
      }));
  
      setIndexMetrics({
        latestValue: latest.toFixed(2),
        change: change.toFixed(2),
        percentChange: percentChange.toFixed(2),
        previousValue: previous.toFixed(2),
        highestValue: Math.max(...values).toFixed(2),
        lowestValue: Math.min(...values).toFixed(2),
        avgValue: (values.reduce((sum, val) => sum + val, 0) / values.length).toFixed(2),
      });
  
      setWatchlistStocks(prevStocks =>
        prevStocks.map(stock =>
          stock.symbol === selectedIndex
            ? {
                ...stock,
                price: latest,
                change: `${change >= 0 ? '+' : ''}${change.toFixed(2)} (${percentChange.toFixed(2)}%)`,
              }
            : stock
        )
      );
    }
  
    if (processedData.length > 0) {
      const latest = processedData[processedData.length - 1];
      const previous = processedData.length > 1 ? processedData[processedData.length - 2] : latest;
  
      setStockDetails({
        previousClose: previous.closing_index_value ?? 0,
        open: latest.open_index_value ?? 0,
        daysRange: `${latest.low_index_value.toFixed(2) ?? 0} - ${latest.high_index_value.toFixed(2) ?? 0}`,
        volume: latest.volume ?? 0,
        peRatio: `${latest.pe_ratio.toFixed(2) ?? 0}`,
        pbRatio: `${latest.pb_ratio.toFixed(2) ?? 0}`,
        turnover: `${latest.turnover_rs_cr ?? 0}`,
        pointsChange: `${latest.points_change.toFixed(2) ?? 0}`,
        changePercent: `${latest.change_percent.toFixed(2) ?? 0}`,
        divyield: `${latest.div_yield.toFixed(2) ?? 0}`,
      });
    }
  
    setChartData({
      labels: labels,
      datasets: [
        {
          label: 'Close Price',
          data: closePrices,
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          tension: 0.4,
          yAxisID: 'y',
          pointRadius: 0,
        },
        {
          label: 'Open Price',
          data: openPrices,
          borderColor: 'rgba(54, 162, 235, 1)',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          tension: 0.4,
          yAxisID: 'y',
          pointRadius: 0,
        },
        {
          label: 'High Price',
          data: highPrices,
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          tension: 0.4,
          yAxisID: 'y',
          pointRadius: 0,
        },
        {
          label: 'Low Price',
          data: lowPrices,
          borderColor: 'rgba(255, 206, 86, 1)',
          backgroundColor: 'rgba(255, 206, 86, 0.2)',
          tension: 0.4,
          yAxisID: 'y',
          pointRadius: 0,
        },
        {
          label: 'Volume',
          data: volumes,
          borderColor: 'rgba(153, 102, 255, 1)',
          backgroundColor: 'rgba(153, 102, 255, 0.2)',
          tension: 0.4,
          yAxisID: 'y1',
          pointRadius: 0,
        },
      ],
    });
  }, [selectedIndex, timeRange, rawData]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        type: 'linear',
        position: 'left',
        ticks: { color: '#aaa' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
      },
      y1: {
        type: 'linear',
        position: 'right',
        ticks: { color: '#aaa' },
        grid: { drawOnChartArea: false },
      },
      x: {
        ticks: { color: '#aaa' },
        grid: { color: 'rgba(255, 255, 255, 0.1)' },
      },
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#aaa' },
      },
    },
  };

  const handleTimeRangeChange = range => {
    setTimeRange(range);
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
      },
    ],
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
              backgroundColor: color,
            }}
          />
        </div>
      </div>
    );
  };

  const handleSearchChange = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    setShowSearchResults(query.length > 0);
    if (query.length > 0) {
      const filtered = indices.filter(index => index.toLowerCase().includes(query));
      setSearchResults(filtered);
    } else {
      setSearchResults([]);
    }
  };

  const handleSearchSelect = (index) => {
    setSelectedIndex(index);
    setSearchQuery('');
    setShowSearchResults(false);
    setSearchResults([]);
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
                value={searchQuery}
                onChange={handleSearchChange}
              />
              <span style={{ position: 'absolute', top: '8px', left: '10px', color: '#777' }}>🔍</span>
              {showSearchResults && (
                <div className="position-absolute w-100 bg-dark rounded mt-1" style={{ zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}>
                  {searchResults.length > 0 ? (
                    searchResults.map((result, idx) => (
                      <div
                        key={idx}
                        className="p-2 text-light hover-bg-secondary cursor-pointer"
                        style={{ borderBottom: '1px solid #333' }}
                        onClick={() => handleSearchSelect(result)}
                      >
                        {result}
                      </div>
                    ))
                  ) : (
                    <div className="p-2 text-light">No results found</div>
                  )}
                </div>
              )}
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
              {watchlistStocks.map(stock => (
                <div
                  key={stock.symbol}
                  className="d-flex justify-content-between align-items-center p-2 mb-1 rounded"
                  style={{ backgroundColor: stock.symbol === selectedStock.symbol ? '#2a2a2a' : 'transparent' }}
                >
                  <div className="d-flex align-items-center">
                    <div
                      className="stock-logo me-2 rounded text-center"
                      style={{ width: '24px', height: '24px', backgroundColor: '#f55', color: 'white', lineHeight: '24px', fontSize: '12px' }}
                    >
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
                <div
                  className="stock-logo me-3 rounded text-center"
                  style={{ width: '36px', height: '36px', backgroundColor: '#f55', color: 'white', lineHeight: '36px', fontSize: '16px' }}
                >
                  T
                </div>
                <h5 className="m-0">{selectedStock.name} • ({selectedStock.ticker})</h5>
              </div>
              <div className="row">
                <div className="col-md-6">
                  <div className="d-flex align-items-baseline">
                    <h2 className="me-2">{selectedStock.currentPrice.toFixed(2)}</h2>
                    <span style={{ color: selectedStock.priceChange >= 0 ? 'lightgreen' : 'red' }}>
                      {selectedStock.priceChange >= 0 ? '+' : ''}{selectedStock.priceChange.toFixed(2)} ({selectedStock.percentChange.toFixed(2)}%)
                    </span>
                  </div>
                  <div className="text-secondary">At close: {selectedStock.closeDate}</div>
                </div>
                <div className="col-md-6">
                  <div className="d-flex align-items-baseline">
                    <h4 className="me-2">{selectedStock.preMarketPrice.toFixed(2)}</h4>
                    <span style={{ color: selectedStock.preMarketChange >= 0 ? 'lightgreen' : 'red' }}>
                      {selectedStock.preMarketChange >= 0 ? '+' : ''}{selectedStock.preMarketChange.toFixed(2)} ({selectedStock.preMarketPercentChange.toFixed(2)}%)
                    </span>
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
                <button
                  className={`btn btn-dark me-2 ${timeRange === '1D' ? 'active' : ''}`}
                  onClick={() => handleTimeRangeChange('1D')}
                >
                  1D
                </button>
                <button
                  className={`btn btn-dark me-2 ${timeRange === '1W' ? 'active' : ''}`}
                  onClick={() => handleTimeRangeChange('1W')}
                >
                  1W
                </button>
                <button
                  className={`btn btn-dark me-2 ${timeRange === '1M' ? 'active' : ''}`}
                  onClick={() => handleTimeRangeChange('1M')}
                >
                  1M
                </button>
                <button
                  className={`btn btn-dark me-2 ${timeRange === '3M' ? 'active' : ''}`}
                  onClick={() => handleTimeRangeChange('3M')}
                >
                  3M
                </button>
                <button
                  className={`btn btn-dark me-2 ${timeRange === '1Y' ? 'active' : ''}`}
                  onClick={() => handleTimeRangeChange('1Y')}
                >
                  1Y
                </button>
                <button
                  className={`btn btn-dark me-2 ${timeRange === '5Y' ? 'active' : ''}`}
                  onClick={() => handleTimeRangeChange('5Y')}
                >
                  5Y
                </button>
                <button
                  className={`btn btn-dark ${timeRange === 'ALL' ? 'active' : ''}`}
                  onClick={() => handleTimeRangeChange('ALL')}
                >
                  ALL
                </button>
              </div>
            </div>
            <div className="row mb-4">
              <div className="col-md-3 mb-3">
                <div className="card text-light" style={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
                  <div className="card-body p-3">
                    <h6 className="text-secondary mb-2">Previous Close</h6>
                    <p className="m-0">{stockDetails.previousClose.toFixed(2)}</p>
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
                    <h6 className="text-secondary mb-2">Turnover</h6>
                    <p className="m-0">{stockDetails.turnover}</p>
                  </div>
                </div>
              </div>
              <div className="col-md-3 mb-3">
                <div className="card text-light" style={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
                  <div className="card-body p-3">
                    <h6 className="text-secondary mb-2">Points change</h6>
                    <p className="m-0">{stockDetails.pointsChange} %</p>
                  </div>
                </div>
              </div>
              <div className="col-md-3 mb-3">
                <div className="card text-light" style={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
                  <div className="card-body p-3">
                    <h6 className="text-secondary mb-2">Open</h6>
                    <p className="m-0">{stockDetails.open.toFixed(2)}</p>
                  </div>
                </div>
              </div>
              <div className="col-md-3 mb-3">
                <div className="card text-light" style={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
                  <div className="card-body p-3">
                    <h6 className="text-secondary mb-2">Percentage Change</h6>
                    <p className="m-0">{stockDetails.changePercent} %</p>
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
                    <h6 className="text-secondary mb-2">PE Ratio</h6>
                    <p className="m-0">{stockDetails.peRatio}</p>
                  </div>
                </div>
              </div>
              <div className="col-md-3 mb-3">
                <div className="card text-light" style={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
                  <div className="card-body p-3">
                    <h6 className="text-secondary mb-2">PB Ratio</h6>
                    <p className="m-0">{stockDetails.pbRatio}</p>
                  </div>
                </div>
              </div>
              <div className="col-md-3 mb-3">
                <div className="card text-light" style={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
                  <div className="card-body p-3">
                    <h6 className="text-secondary mb-2">Div yeild</h6>
                    <p className="m-0">{stockDetails.divyield}</p>
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
                              <div
                                style={{
                                  height: `${incomeData.revenue[index] * 2}px`,
                                  backgroundColor: 'rgba(75, 192, 192, 0.8)',
                                  width: '60%',
                                  margin: '0 auto',
                                }}
                              ></div>
                              <div
                                style={{
                                  height: `${incomeData.netIncome[index] * 2}px`,
                                  backgroundColor: 'rgba(54, 162, 235, 0.8)',
                                  width: '60%',
                                  margin: '0 auto',
                                  marginBottom: '5px',
                                }}
                              ></div>
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