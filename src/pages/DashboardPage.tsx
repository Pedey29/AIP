import React from 'react';
import { usePortfolio } from '../context/PortfolioContext';

// Components
import Card from '../components/common/Card';
import PortfolioSummary from '../components/dashboard/PortfolioSummary';
import PerformanceChart from '../components/dashboard/PerformanceChart';
import HoldingsTable from '../components/dashboard/HoldingsTable';
import AllocationCharts from '../components/dashboard/AllocationCharts';
import RiskMetricsPanel from '../components/dashboard/RiskMetricsPanel';
import RecentReports from '../components/dashboard/RecentReports';

const DashboardPage: React.FC = () => {
  const { refreshData } = usePortfolio();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Portfolio Dashboard</h1>
        <button
          onClick={() => refreshData()}
          className="text-primary-600 hover:text-primary-800 flex items-center"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-1"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
              clipRule="evenodd"
            />
          </svg>
          Refresh Data
        </button>
      </div>

      {/* Portfolio Summary */}
      <PortfolioSummary />

      {/* Performance Chart */}
      <Card title="Performance" className="fade-in">
        <PerformanceChart />
      </Card>

      {/* Holdings Table */}
      <Card title="Holdings" className="fade-in">
        <HoldingsTable />
      </Card>

      {/* Allocation and Risk Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Sector Allocation" className="fade-in">
          <AllocationCharts />
        </Card>
        <Card title="Risk Metrics" className="fade-in">
          <RiskMetricsPanel />
        </Card>
      </div>

      {/* Recent Reports */}
      <Card title="Recent Reports" className="fade-in">
        <RecentReports />
      </Card>
    </div>
  );
};

export default DashboardPage;
