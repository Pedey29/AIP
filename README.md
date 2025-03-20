# Investment Portfolio Tracker

A comprehensive portfolio tracking application for a university Applied Investments class managing $1.2 million in assets.

## Features

- **Portfolio Dashboard**: Real-time overview of portfolio performance, holdings, and risk metrics
- **Performance Tracking**: Compare portfolio against benchmark with various time periods
- **Holdings Management**: View and manage position details with admin access
- **Risk Analytics**: Track key risk metrics like Sharpe ratio, beta, and maximum drawdown
- **Sector Allocation**: Visualize portfolio allocation by sector with benchmark comparison
- **Automated Reporting**: Generate comprehensive PDF reports with AI-generated commentary
- **CSV Import/Export**: Easily manage portfolio data in bulk
- **Scheduled Updates**: Automatic daily price updates and monthly report generation

## Technology Stack

- **Frontend**: React.js (v18+) with TypeScript
- **State Management**: React Context API
- **CSS Framework**: Tailwind CSS
- **Data Visualization**: Recharts library
- **PDF Generation**: jsPDF + html2canvas
- **API Integration**: financialdatasets.ai for price data
- **Database**: Supabase
- **Hosting**: Deployed via lovable.dev

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account
- financialdatasets.ai API key
- OpenAI API key (for report commentary)

### Installation

1. Clone the repository:
```
git clone https://github.com/yourusername/portfolio-tracker.git
cd portfolio-tracker
```

2. Install dependencies:
```
npm install
```

3. Create a `.env` file with the following environment variables:
```
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
REACT_APP_FINANCIAL_DATASETS_API_KEY=your_financialdatasets_api_key
```

4. Start the development server:
```
npm start
```

### Deployment on lovable.dev

1. In the Lovable Editor, click "Connect Supabase" in the navbar
2. Select your organization and project
3. Wait for confirmation in the chat that integration is complete
4. Deploy your application through the lovable.dev interface

## Database Setup

The application requires several Supabase tables:

1. `positions` - Stock positions
2. `price_history` - Historical price data
3. `benchmark_history` - Benchmark price data
4. `settings` - Application settings
5. `reports` - Generated reports

Database migrations are included in the `supabase/migrations` directory.

## Scheduled Jobs

The application uses Supabase scheduled functions:

1. **Daily Price Update**: Runs daily at 6 PM to update all position prices
2. **Monthly Report Generation**: Generates comprehensive PDF reports on a specified day each month

## Admin Access

The admin interface is protected by a password (default: 'admin'). Admin users can:

1. Add, edit, and delete positions
2. Import/export portfolio data via CSV
3. Update benchmark settings and risk-free rate
4. Manually trigger price updates and report generation

## License

This project is licensed under the MIT License - see the LICENSE file for details.
