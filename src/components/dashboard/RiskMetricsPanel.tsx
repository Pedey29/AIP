import React from 'react';
import { usePortfolio } from '../../context/PortfolioContext';

interface MetricCardProps {
  title: string;
  value: string | number;
  description: string;
  icon?: React.ReactNode;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, description, icon }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-center mb-2">
        {icon && <div className="mr-2 text-primary-600">{icon}</div>}
        <h3 className="font-medium text-gray-900">{title}</h3>
      </div>
      <div className="font-bold text-2xl text-gray-900 mb-1">{value}</div>
      <p className="text-xs text-gray-500">{description}</p>
    </div>
  );
};

// Icons (these would be imported from react-icons in a real project)
const SharpIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
  </svg>
);

const BetaIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
  </svg>
);

const VolatilityIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
  </svg>
);

const DrawdownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M12 13a1 1 0 100 2h5a1 1 0 001-1V9a1 1 0 10-2 0v2.586l-4.293-4.293a1 1 0 00-1.414 0L8 9.586 3.707 5.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L11 9.414 14.586 13H12z" clipRule="evenodd" />
  </svg>
);

const RiskFreeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.736 6.979C9.208 6.193 9.696 6 10 6c.304 0 .792.193 1.264.979a1 1 0 001.715-1.029C12.279 4.784 11.232 4 10 4s-2.279.784-2.979 1.95c-.285.475-.507 1-.67 1.55H6a1 1 0 000 2h.013a9.358 9.358 0 000 1H6a1 1 0 100 2h.351c.163.55.385 1.075.67 1.55C7.721 15.216 8.768 16 10 16s2.279-.784 2.979-1.95a1 1 0 10-1.715-1.029c-.472.786-.96.979-1.264.979-.304 0-.792-.193-1.264-.979a4.265 4.265 0 01-.393-.977H12a1 1 0 100-2H8.41c-.027-.166-.04-.334-.04-.5 0-.166.013-.334.04-.5H12a1 1 0 100-2H8.343c.07-.376.214-.717.393-.977z" clipRule="evenodd" />
  </svg>
);

const RiskMetricsPanel: React.FC = () => {
  const { riskMetrics } = usePortfolio();

  if (!riskMetrics) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">Loading risk metrics...</p>
      </div>
    );
  }

  const { sharpeRatio, beta, standardDeviation, maxDrawdown, riskFreeRate } = riskMetrics;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MetricCard
          title="Sharpe Ratio"
          value={sharpeRatio.toFixed(2)}
          description="Risk-adjusted return relative to risk-free rate"
          icon={<SharpIcon />}
        />
        <MetricCard
          title="Beta"
          value={beta.toFixed(2)}
          description="Volatility compared to benchmark"
          icon={<BetaIcon />}
        />
        <MetricCard
          title="Standard Deviation"
          value={`${standardDeviation.toFixed(2)}%`}
          description="Annualized volatility of returns"
          icon={<VolatilityIcon />}
        />
        <MetricCard
          title="Maximum Drawdown"
          value={`${(maxDrawdown * 100).toFixed(2)}%`}
          description="Largest peak-to-trough decline"
          icon={<DrawdownIcon />}
        />
      </div>

      <div className="bg-gray-50 p-4 rounded-lg mt-4">
        <div className="flex items-center">
          <div className="mr-2 text-primary-600">
            <RiskFreeIcon />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">Risk-Free Rate</h3>
            <p className="text-gray-600">{(riskFreeRate * 100).toFixed(2)}%</p>
          </div>
        </div>
      </div>
      
      <div className="mt-4 text-sm text-gray-500">
        <h4 className="font-medium text-gray-700 mb-1">Risk Metrics Explained</h4>
        <ul className="list-disc list-inside space-y-1">
          <li><span className="font-medium">Sharpe Ratio:</span> Higher is better. Measures excess return per unit of risk.</li>
          <li><span className="font-medium">Beta:</span> 1.0 = same as market. Higher = more volatile than market.</li>
          <li><span className="font-medium">Standard Deviation:</span> Lower is better. Measures portfolio volatility.</li>
          <li><span className="font-medium">Maximum Drawdown:</span> Lower is better. Shows worst historical loss.</li>
        </ul>
      </div>
    </div>
  );
};

export default RiskMetricsPanel;
