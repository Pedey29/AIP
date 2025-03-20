import React from 'react';
import { usePortfolio } from '../../context/PortfolioContext';
import { format, parseISO } from 'date-fns';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  TooltipProps
} from 'recharts';
import { TimePeriod } from '../../types';

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 shadow-md rounded-md">
        <p className="text-sm font-medium">{format(parseISO(label), 'MMM d, yyyy')}</p>
        <div className="mt-2">
          {payload.map((entry, index) => (
            <div key={`item-${index}`} className="flex items-center">
              <div
                className="w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: entry.color }}
              />
              <p className="text-sm">
                <span className="font-medium">{entry.name}: </span>
                <span>{entry.value?.toFixed(2)}%</span>
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
};

// Time period selector button
interface PeriodButtonProps {
  period: TimePeriod;
  active: boolean;
  onClick: () => void;
}

const PeriodButton: React.FC<PeriodButtonProps> = ({ period, active, onClick }) => (
  <button
    className={`px-3 py-1 text-sm rounded-md ${
      active
        ? 'bg-primary-100 text-primary-800 font-medium'
        : 'text-gray-600 hover:bg-gray-100'
    }`}
    onClick={onClick}
  >
    {period}
  </button>
);

const PerformanceChart: React.FC = () => {
  const { performanceData, timePeriod, setTimePeriod } = usePortfolio();

  // Time periods
  const periods: TimePeriod[] = ['1D', '1W', '1M', '3M', '6M', '1Y', 'YTD', 'MAX'];

  // Format x-axis ticks
  const formatXAxis = (tickItem: string) => {
    try {
      const date = parseISO(tickItem);
      
      // Format based on time period
      if (timePeriod === '1D') {
        return format(date, 'h:mm a');
      } else if (timePeriod === '1W' || timePeriod === '1M') {
        return format(date, 'MMM d');
      } else {
        return format(date, 'MMM yyyy');
      }
    } catch (error) {
      return tickItem;
    }
  };

  return (
    <div>
      {/* Time period selector */}
      <div className="flex space-x-2 mb-4 overflow-x-auto pb-2">
        {periods.map((period) => (
          <PeriodButton
            key={period}
            period={period}
            active={period === timePeriod}
            onClick={() => setTimePeriod(period)}
          />
        ))}
      </div>
      
      {/* Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={performanceData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              tickFormatter={formatXAxis}
              minTickGap={30}
              tick={{ fontSize: 12 }}
            />
            <YAxis
              tickFormatter={(value) => `${value.toFixed(2)}%`}
              domain={['auto', 'auto']}
              tick={{ fontSize: 12 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="portfolioPercentChange"
              name="Portfolio"
              stroke="#4f46e5"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="benchmarkPercentChange"
              name="Benchmark"
              stroke="#64748b"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      {/* Date range display */}
      <div className="mt-2 text-sm text-gray-500 text-center">
        {performanceData.length > 0 && (
          <span>
            {format(parseISO(performanceData[0].date), 'MMM d, yyyy')} - 
            {' '}{format(parseISO(performanceData[performanceData.length - 1].date), 'MMM d, yyyy')}
          </span>
        )}
      </div>
    </div>
  );
};

export default PerformanceChart;
