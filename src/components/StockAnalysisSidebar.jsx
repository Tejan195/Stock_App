import React, { useState, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import './StockAnalysisSidebar.css';

const StockAnalysisSidebar = ({ isOpen, toggleSidebar, stockData, stockName }) => {
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const stripMarkdown = (text) => {
    return text
      .replace(/\#{1,6}\s*/g, '') 
      .replace(/\*\*/g, '')        
      .replace(/\*/g, '')         
      .replace(/`{1,3}/g, '')     
      .replace(/\[(.*?)\]\(.*?\)/g, '$1');
  };

  useEffect(() => {
    if (!isOpen || !stockData || stockData.length === 0) return;

    const fetchAnalysis = async () => {
      setLoading(true);
      setError(null);
      setAnalysis('');

      try {
        const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const historicalData = stockData.slice(-30).map((data, index) => ({
          date: data.date,
          closePrice: data.closePrice,
        }));

        const prompt = `
          You are a financial expert AI designed to analyze stock price data and predict future trends.
          Below is the historical stock price data for ${stockName} over the last 30 days:

          ${JSON.stringify(historicalData, null, 2)}

          Please analyze this data and provide:
          1. A detailed analysis of the stock's recent performance, including trends, volatility, and key patterns.
          2. A prediction for the stock's price movement over the next 30 days, including potential high and low points.
          3. Any recommendations for investors (e.g., buy, sell, hold) based on your analysis.

          Ensure your response is in plain text format. Do not use any Markdown syntax (e.g., avoid using #, ##, **, etc.).
        `;
        const result = await model.generateContent(prompt);
        const responseText = result.response.text();

        const cleanedAnalysis = stripMarkdown(responseText);
        setAnalysis(cleanedAnalysis);
      } catch (err) {
        console.error('Error fetching analysis from Gemini API:', err);
        setError('Failed to analyze stock data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [isOpen, stockData, stockName]);

  return (
    <div className={`stock-analysis-sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <h5>Stock Analysis AI</h5>
        <button className="close-btn" onClick={toggleSidebar}>
          ×
        </button>
      </div>
      <div className="sidebar-content">
        <div className="analysis-section">
          <h6>Analysis for {stockName}</h6>
          {loading && (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
              <div className="spinner-border text-light" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          )}
          {error && <div className="text-danger text-center">{error}</div>}
          {analysis && !loading && !error && (
            <div className="analysis-text">
              <p>{analysis}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StockAnalysisSidebar;