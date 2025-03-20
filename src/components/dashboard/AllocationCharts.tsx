import React from 'react';
import { usePortfolio } from '../../context/PortfolioContext';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  TooltipProps
} from 'recharts';

// Custom colors for sectors
const COLORS = [
  '#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444',
  '#8b5cf6', '#a855f7', '#ec4899', '#14b8a6', '#f97316',
  '#64748b', '#6b7280', '#4b5563', '#374151'
];

// Generate colors for sectors
const generateColor = (index: number) => {
  return COLORS[index % COLORS.length];
};

// Custom tooltip component
const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border border-gray-200 shadow-md rounded-md">
        <p className="text-sm font-medium">{data.sector}</p>
        <p className="text-sm mt-1">
          <span className="font-medium">Portfolio Weight: </span>
          <span>{data.weight.toFixed(2)}%</span>
        </p>
        <p className="text-sm">
          <span className="font-medium">Benchmark Weight: </span>
          <span>{data.benchmarkWeight.toFixed(2)}%</span>
        </p>
        <p className="text-sm">
          <span className="font-medium">Difference: </span>
          <span className={data.difference >= 0 ? 'text-success-600' : 'text-danger-600'}>
            {data.difference >= 0 ? '+' : ''}{data.difference.toFixed(2)}%
          </span>
        </p>
      </div>
    );
  }

  return null;
};

// Custom legend component
interface CustomLegendProps {
  payload?: Array<{
    value: string;
    type: string;
    id: string;
    color: string;
    payload: {
      sector: string;
      weight: number;
    };
  }>;
}

const CustomLegend: React.FC<CustomLegendProps> = ({ payload }) => {
  return (
    <ul className="grid grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2 mt-2">
      {payload?.map((entry, index) => (
        <li key={`item-${index}`} className="flex items-center">
          <div
            className="w-3 h-3 rounded-full mr-2"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-xs text-gray-800 truncate">
            {entry.payload.sector}
          </span>
          <span className="text-xs text-gray-500 ml-1">
            ({entry.payload.weight.toFixed(1)}%)
          </span>
        </li>
      ))}
    </ul>
  );
};

const AllocationCharts: React.FC = () => {
  const { sectorAllocation } = usePortfolio();

  return (
    <div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={sectorAllocation}
              cx="50%"
              cy="50%"
              outerRadius={80}
              dataKey="weight"
              nameKey="sector"
              label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                const radius = innerRadius + (outerRadius - innerRadius) * 1.4;
                const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                
                return percent > 0.05 ? (
                  <text
                    x={x}
                    y={y}
                    fill="#333"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={12}
                  >
                    {`${(percent * 100).toFixed(1)}%`}
                  </text>
                ) : null;
              }}
            >
              {sectorAllocation.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={generateColor(index)} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Sector Over/Under Weight Table */}
      <div className="overflow-hidden mt-4 bg-gray-50 rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sector
              </th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Portfolio
              </th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Benchmark
              </th>
              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Difference
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {sectorAllocation.slice(0, 5).map((sector, index) => (
              <tr key={index} className="hover:bg-gray-100">
                <td className="px-4 py-2 text-sm font-medium text-gray-900">
                  {sector.sector}
                </td>
                <td className="px-4 py-2 text-sm text-gray-900 text-right">
                  {sector.weight.toFixed(2)}%
                </td>
                <td className="px-4 py-2 text-sm text-gray-900 text-right">
                  {sector.benchmarkWeight.toFixed(2)}%
                </td>
                <td className={`px-4 py-2 text-sm font-medium text-right ${
                  sector.difference >= 0 ? 'text-success-600' : 'text-danger-600'
                }`}>
                  {sector.difference >= 0 ? '+' : ''}{sector.difference.toFixed(2)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AllocationCharts;
