
# StockBoard

StockBoard is a comprehensive stock market dashboard built with React, designed to provide users with real-time insights and visualizations of stock index data. It integrates advanced features like AI-powered analysis, interactive charts, and a user-friendly interface to help users track and analyze market trends effectively.

Deployed Link: [https://tejstock-app.netlify.app/#](https://tejstock-app.netlify.app/#)

## Features

### AI Analyzer
- **AI-Powered Stock Analysis**: Leverage the built-in AI Analyzer to gain deeper insights into stock performance. Analyze historical data and trends for selected indices with a single click, providing actionable information for decision-making.

### Stock Data Visualization
- **Interactive Charts**: Visualize stock data with dynamic Line, Bar, and Pie charts powered by Chart.js.
  - **Line Chart**: Displays Close, Open, High, Low prices, and Volume over customizable time ranges 
  ( 1M, 3M, 1Y, 5Y).
  - **Bar Chart**: Shows monthly average close price trends for the last 8 months.
  - **Pie Chart**: Illustrates the latest month's price change distribution (Positive, Negative, Zero Change Days).
- **Customizable Time Ranges**: Switch between different time periods to analyze short-term and long-term trends.

### Stock Details
- **Detailed Metrics**: View key stock metrics including:
  - Previous Close
  - Open Price
  - Day's Range
  - Turnover
  - Points Change
  - Percentage Change
  - Volume
  - PE Ratio
  - PB Ratio
  - Dividend Yield
- **Real-Time Updates**: Displays current price, price change, and percentage change with color-coded indicators (green for positive, red for negative).

### Search and Watchlist
- **Search Functionality**: Search through available stock indices with real-time filtering and suggestions.
- **Watchlist**: Maintain a personalized watchlist of recently searched indices, limited to the last 5 searches, with quick access to price and change details.

### Sidebar Navigation
- **Collapsible Sidebar**: Access Dashboard, Portfolio, Transactions, Market Overview, Insights & News, Help & Center, and Settings through an intuitive sidebar (collapsible on mobile).
- **Responsive Design**: Optimized for both desktop and mobile devices with a hamburger menu for smaller screens.

### Data Handling
- **CSV Data Integration**: Loads and processes stock data from a CSV file (`dump.csv`) using Papa Parse, ensuring efficient data parsing and filtering.
- **Local Storage**: Persists search history across sessions using browser local storage.

### User Interface
- **Dark Theme**: Sleek, modern dark-themed UI with Bootstrap styling for a professional look and feel.
- **Loading States**: Displays a spinner during data fetching for a smooth user experience.
- **Error Handling**: Gracefully handles errors with informative messages.

## Tech Stack
- **React**: Front-end library for building the user interface.
- **Chart.js & react-chartjs-2**: For rendering interactive charts.
- **Papa Parse**: For parsing CSV data.
- **Bootstrap**: For responsive styling and layout.
- **Netlify**: Hosting platform for deployment.

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/stockboard.git
   ```
2. Navigate to the project directory:
   ```bash
   cd stockboard
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm start
   ```

### Deployment
The application is deployed on Netlify at [https://tejstock-app.netlify.app/#](https://tejstock-app.netlify.app/#). To deploy your own version:
1. Build the project:
   ```bash
   npm run build
   ```
2. Deploy the `build` folder to Netlify or your preferred hosting service.

## Usage
1. Open the app in your browser.
2. Use the search bar in the sidebar to find a stock index.
3. Select an index to view its detailed data and charts.
4. Click the "AI Analyzer" button to analyze the selected index's historical data.
5. Adjust the time range using the buttons ( 1M, 3M, 1Y, 5Y) to explore different periods.
6. Add indices to your watchlist by searching and selecting them.

## Future Enhancements
- Real-time API integration for live stock data.
- Additional AI-driven insights (e.g., predictive analytics).
- Portfolio management features.
- Customizable chart themes and options.

## Contributing
Contributions are welcome! Please fork the repository and submit a pull request with your changes.

## License
This project is licensed under the MIT License.
