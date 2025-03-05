import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, BarElement, ArcElement } from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import StockAnalysisSidebar from './components/StockAnalysisSidebar';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, BarElement, ArcElement);

function App() {
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

  const [monthlyPriceData, setMonthlyPriceData] = useState({
    months: [],
    avgClosePrices: [],
  });

  const [priceChangeDistribution, setPriceChangeDistribution] = useState({
    positiveDays: 0,
    negativeDays: 0,
    zeroDays: 0,
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
  const [searchHistory, setSearchHistory] = useState([]);
  const [historicalStockData, setHistoricalStockData] = useState([]);
  const [showAnalysisSidebar, setShowAnalysisSidebar] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const maxHistoryLength = 5;

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const savedHistory = localStorage.getItem('searchHistory');
        if (savedHistory) {
          setSearchHistory(JSON.parse(savedHistory));
        }

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
    localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
  }, [searchHistory]);

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
          closing_index_value: rows.reduce((sum, r) => sum + (Number(r.closing_index_value) || 0), 0) / rows.length,
          open_index_value: rows.reduce((sum, r) => sum + (Number(r.open_index_value) || 0), 0) / rows.length,
          high_index_value: rows.reduce((sum, r) => sum + (Number(r.high_index_value) || 0), 0) / rows.length,
          low_index_value: rows.reduce((sum, r) => sum + (Number(r.low_index_value) || 0), 0) / rows.length,
          volume: rows.reduce((sum, r) => sum + (Number(r.volume) || 0), 0) / rows.length,
          pe_ratio: rows.reduce((sum, r) => sum + (Number(r.pe_ratio) || 0), 0) / rows.length,
          pb_ratio: rows.reduce((sum, r) => sum + (Number(r.pb_ratio) || 0), 0) / rows.length,
          turnover_rs_cr: rows.reduce((sum, r) => sum + (Number(r.turnover_rs_cr) || 0), 0) / rows.length,
          points_change: rows.reduce((sum, r) => sum + (Number(r.points_change) || 0), 0) / rows.length,
          change_percent: rows.reduce((sum, r) => sum + (Number(r.change_percent) || 0), 0) / rows.length,
          div_yield: rows.reduce((sum, r) => sum + (Number(r.div_yield) || 0), 0) / rows.length,
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

 
    const monthlyData = {};
    filteredData.forEach(row => {
      const date = new Date(row.index_date);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          closePrices: [],
          date: date,
        };
      }
      monthlyData[monthKey].closePrices.push(Number(row.closing_index_value) || 0);
    });

    const months = [];
    const avgClosePrices = [];
    Object.entries(monthlyData)
      .sort((a, b) => new Date(a[1].date) - new Date(b[1].date))
      .slice(-8)
      .forEach(([key, value]) => {
        const date = new Date(key.split('-')[0], key.split('-')[1] - 1);
        months.push(date.toLocaleString('default', { month: 'short' }));
        const avgClose = value.closePrices.length > 0
          ? value.closePrices.reduce((sum, val) => sum + val, 0) / value.closePrices.length
          : 0;
        avgClosePrices.push(avgClose);
      });

    setMonthlyPriceData({
      months: months.length > 0 ? months : ['No Data'],
      avgClosePrices: avgClosePrices.length > 0 ? avgClosePrices : [0],
    });
    const latestMonthData = Object.entries(monthlyData)
      .sort((a, b) => new Date(b[1].date) - new Date(a[1].date))[0];

    let positiveDays = 0, negativeDays = 0, zeroDays = 0;
    if (latestMonthData) {
      const latestMonthKey = latestMonthData[0];
      const latestMonthFilteredData = filteredData.filter(row => {
        const date = new Date(row.index_date);
        return `${date.getFullYear()}-${date.getMonth() + 1}` === latestMonthKey;
      });

      latestMonthFilteredData.forEach(row => {
        const closePrice = Number(row.closing_index_value) || 0;
        const openPrice = Number(row.open_index_value) || 0;
        const priceChange = closePrice - openPrice;
        if (priceChange > 0) {
          positiveDays++;
        } else if (priceChange < 0) {
          negativeDays++;
        } else {
          zeroDays++;
        }
      });
    }

    setPriceChangeDistribution({
      positiveDays,
      negativeDays,
      zeroDays,
    });

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
    }

    if (processedData.length > 0) {
      const latest = processedData[processedData.length - 1];
      const previous = processedData.length > 1 ? processedData[processedData.length - 2] : latest;

      const lowValue = Number(latest.low_index_value) || 0;
      const highValue = Number(latest.high_index_value) || 0;

      setStockDetails({
        previousClose: Number(previous.closing_index_value) || 0,
        open: Number(latest.open_index_value) || 0,
        daysRange: `${lowValue.toFixed(2)} - ${highValue.toFixed(2)}`,
        volume: Number(latest.volume) || 0,
        peRatio: `${(Number(latest.pe_ratio) || 0).toFixed(2)}`,
        pbRatio: `${(Number(latest.pb_ratio) || 0).toFixed(2)}`,
        turnover: `${Number(latest.turnover_rs_cr) || 0}`,
        pointsChange: `${(Number(latest.points_change) || 0).toFixed(2)}`,
        changePercent: `${(Number(latest.change_percent) || 0).toFixed(2)}`,
        divyield: `${(Number(latest.div_yield) || 0).toFixed(2)}`,
      });
    }

    setChartData({
      labels: labels,
      datasets: [
        {
          label: 'Close Price',
          data: closePrices,
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.1)',
          tension: 0.4,
          yAxisID: 'y',
          borderWidth: 2,
          pointRadius: 2,
          pointHoverRadius: 6,
        },
        {
          label: 'Open Price',
          data: openPrices,
          borderColor: 'rgba(54, 162, 235, 1)',
          backgroundColor: 'rgba(54, 162, 235, 0.1)',
          tension: 0.4,
          yAxisID: 'y',
          borderWidth: 2,
          pointRadius: 2,
          pointHoverRadius: 6,
        },
        {
          label: 'High Price',
          data: highPrices,
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: 'rgba(255, 99, 132, 0.1)',
          tension: 0.4,
          yAxisID: 'y',
          borderWidth: 2,
          pointRadius: 2,
          pointHoverRadius: 6,
        },
        {
          label: 'Low Price',
          data: lowPrices,
          borderColor: 'rgba(255, 206, 86, 1)',
          backgroundColor: 'rgba(255, 206, 86, 0.1)',
          tension: 0.4,
          yAxisID: 'y',
          borderWidth: 2,
          pointRadius: 2,
          pointHoverRadius: 6,
        },
        {
          label: 'Volume',
          data: volumes,
          borderColor: 'rgba(153, 102, 255, 1)',
          backgroundColor: 'rgba(153, 102, 255, 0.1)',
          tension: 0.4,
          yAxisID: 'y1',
          borderWidth: 2,
          pointRadius: 2,
          pointHoverRadius: 6,
        },
      ],
      options: {
        responsive: true,
        plugins: {
          legend: {
            labels: {
              color: '#fff',
              font: {
                size: 14,
              },
              padding: 15,
            },
          },
          tooltip: {
            callbacks: {
              label: function(tooltipItem) {
                return `${tooltipItem.dataset.label}: ${tooltipItem.raw.toLocaleString()}`;
              }
            }
          }
        },
        scales: {
          y: {
            ticks: {
              color: '#fff',
              callback: function(value) {
                return Intl.NumberFormat('en-US', { notation: "compact" }).format(value);
              }
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.2)',
            },
          },
          y1: {
            position: 'right',
            ticks: {
              color: '#fff',
              callback: function(value) {
                return Intl.NumberFormat('en-US', { notation: "compact" }).format(value);
              }
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.2)',
            },
          },
          x: {
            ticks: {
              color: '#fff',
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.2)',
            },
          },
        },
      },
    });
  }, [selectedIndex, rawData, timeRange]);

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
        labels: { color: '#fff'
         },
         bocWidth:20,
         padding:15,
      },
    },
  };

  const monthlyPriceChartData = {
    labels: monthlyPriceData.months,
    datasets: [
      {
        label: 'Average Close Price',
        data: monthlyPriceData.avgClosePrices,
        backgroundColor: 'rgba(75, 192, 192, 0.8)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  const monthlyPriceChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#aaa',
          font: {
            size: 14,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function (tooltipItem) {
            return `${tooltipItem.dataset.label}: ${tooltipItem.raw.toLocaleString()}`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          color: '#aaa',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
      y: {
        ticks: {
          color: '#aaa',
          callback: function (value) {
            return Intl.NumberFormat('en-US', { notation: 'compact' }).format(value);
          },
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
        },
      },
    },
  };

  const priceChangeChartData = {
    labels: ['Positive Days', 'Negative Days', 'Zero Change Days'],
    datasets: [
      {
        label: 'Price Change Distribution',
        data: [
          priceChangeDistribution.positiveDays,
          priceChangeDistribution.negativeDays,
          priceChangeDistribution.zeroDays,
        ],
        backgroundColor: [
          'rgba(75, 192, 192, 0.8)', 
          'rgba(255, 99, 132, 0.8)', 
          'rgba(255, 206, 86, 0.8)', 
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(255, 206, 86, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const priceChangeChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: '#aaa',
          font: {
            size: 14,
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function (tooltipItem) {
            const label = tooltipItem.label || '';
            const value = tooltipItem.raw || 0;
            return `${label}: ${value} days`;
          },
        },
      },
    },
  };

  const getStockDetailsForIndex = (index) => {
    const data = rawData.filter(row => row.index_name === index && row.closing_index_value !== null);
    if (data.length === 0) {
      return { price: 0, change: '0', logo: index.charAt(0).toUpperCase() };
    }

    const sortedData = data.sort((a, b) => new Date(b.index_date) - new Date(a.index_date));
    const latest = sortedData[0];
    const previous = sortedData.length > 1 ? sortedData[1] : latest;

    const price = Number(latest.closing_index_value) || 0;
    const change = price - (Number(previous.closing_index_value) || 0);
    const percentChange = previous.closing_index_value !== 0 ? (change / previous.closing_index_value) * 100 : 0;

    return {
      price: price,
      change: `${change >= 0 ? '+' : ''}${change.toFixed(2)} (${percentChange.toFixed(2)}%)`,
      logo: index.charAt(0).toUpperCase(),
    };
  };

  const handleTimeRangeChange = range => {
    setTimeRange(range);
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

    setSearchHistory((prevHistory) => {
      const updatedHistory = prevHistory.filter((item) => item !== index);
      updatedHistory.unshift(index);
      return updatedHistory.slice(0, maxHistoryLength);
    });
  };
  const handleAnalyzeStock = () => {
    const indexData = rawData
      .filter(row => row.index_name === selectedIndex && row.closing_index_value !== null)
      .sort((a, b) => new Date(a.index_date) - new Date(b.index_date))
      .slice(-30)
      .map(row => ({
        date: row.index_date,
        closePrice: Number(row.closing_index_value)
      }));
  
    if (indexData.length > 0) {
      setHistoricalStockData(indexData);
      setShowAnalysisSidebar(true);
    } else {
      console.warn('No historical stock data available for', selectedIndex);
    }
  };
  const toggleAnalysisSidebar = () => {
    setShowAnalysisSidebar(!showAnalysisSidebar);
  };
  const toggleSidebar = () => { 
    setSidebarOpen(!sidebarOpen);
  };

  if (loading) return <div className="loading-container">
    <div className="spinner-border text-light" role="status">
      <span className="visually-hidden">Loading...</span>
    </div>
    <p className="text-light mt-2">Fetching...</p>
      </div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="container-fluid p-0" style={{ backgroundColor: '#1e1e1e', minHeight: '100vh', color: 'white' }}>
      {sidebarOpen &&(
        <div className="sidebar-overlay"
        style={{ position:'fixed',top:0, left:0, width:'100%', height:'100%', backgroundColor:'rgba(0,0,0,0.5)', zIndex:999}}
        onClick={toggleSidebar}
        ></div>
      )}
      <div className="row g-0">
      <div className={`col-auto sidebar ${sidebarOpen ? 'open' : ''} d-lg-block`} style={{ width: '240px', backgroundColor: '#121212', minHeight: '100vh', borderRight: '1px solid #333' }}>
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
              {searchHistory.length === 0 ? (
                <div className="p-2 text-light">No recent searches</div>
              ) : (
                searchHistory.map((index) => {
                  const { price, change, logo } = getStockDetailsForIndex(index);
                  return (
                    <div
                      key={index}
                      className="d-flex justify-content-between align-items-center p-2 mb-1 rounded cursor-pointer"
                      style={{ backgroundColor: index === selectedIndex ? '#2a2a2a' : 'transparent' }}
                      onClick={() => setSelectedIndex(index)}
                    >
                      <div className="d-flex align-items-center">
                        <div
                          className="stock-logo me-2 rounded text-center"
                          style={{ width: '24px', height: '24px', backgroundColor: '#f55', color: 'white', lineHeight: '24px', fontSize: '12px' }}
                        >
                          {logo}
                        </div>
                        <span>{index}</span>
                      </div>
                      <div className="text-end">
                        <div>{price.toFixed(2)}</div>
                        <div style={{ color: change.startsWith('+') ? 'lightgreen' : 'red' }}>{change}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
        <div className="col">
          <nav className="navbar navbar-dark" style={{ backgroundColor: '#121212', borderBottom: '1px solid #333' }}>
            <div className="container-fluid">
              <div className="d-flex align-items-center navbar-left">
              <button className="btn btn-dark d-lg-none me-2 navbar-hamburger" onClick={toggleSidebar}>
                  ☰
                </button>
                <span className="text-secondary me-2">Dashboard</span>
                <span className="text-secondary mx-1">/</span>
                <span className="text-light">Details Stock</span>
              </div>
              <div className="d-flex navbar-right">
                <button className="btn btn-dark me-2 navbar-btn"onClick={handleAnalyzeStock}>
                  <span className="me-1">🤖</span>AI Analyzer
                </button>
                <button className="btn btn-dark me-2 navbar-btn">🔖</button>
                <button className="btn btn-dark me-2 navbar-btn">🔗</button>
                <button className="btn btn-dark navbar-btn">⋮</button>
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
                  {selectedIndex ? selectedIndex.charAt(0).toUpperCase() : 'T'}
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
                        <span className="me-2">📈</span> Monthly Price Trends
                      </h6>
                      <div>
                        <span className="badge bg-primary me-2">Avg Close Price</span>
                      </div>
                    </div>
                    <div style={{ height: '200px' }}>
                      <Bar data={monthlyPriceChartData} options={monthlyPriceChartOptions} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-6 mb-4">
                <div className="card text-light" style={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}>
                  <div className="card-body p-3">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h6 className="m-0 d-flex align-items-center">
                        <span className="me-2">📊</span> Latest Month Price Change Distribution
                      </h6>
                      <span>⋮</span>
                    </div>
                    <div style={{ height: '200px' }}>
                      <Pie data={priceChangeChartData} options={priceChangeChartOptions} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <StockAnalysisSidebar
        isOpen={showAnalysisSidebar}
        toggleSidebar={toggleAnalysisSidebar}
        stockData={historicalStockData}
        stockName={selectedIndex}
      />
    </div>
  );
}

export default App;