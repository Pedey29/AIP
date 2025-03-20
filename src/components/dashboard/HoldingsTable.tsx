import React, { useState, useMemo } from 'react';
import { usePortfolio } from '../../context/PortfolioContext';
import { Position } from '../../types';

interface SortConfig {
  key: keyof Position | 'gainLossAmount' | 'gainLossPercent';
  direction: 'asc' | 'desc';
}

const HoldingsTable: React.FC = () => {
  const { positions, isAdmin } = usePortfolio();
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: 'weight',
    direction: 'desc'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Calculate gain/loss for each position
  const positionsWithPerformance = useMemo(() => {
    return positions.map(position => ({
      ...position,
      gainLossAmount: (position.currentPrice - position.purchasePrice) * position.shares,
      gainLossPercent: ((position.currentPrice / position.purchasePrice) - 1) * 100
    }));
  }, [positions]);

  // Filter positions based on search term
  const filteredPositions = useMemo(() => {
    return positionsWithPerformance.filter(position =>
      position.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
      position.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      position.sector.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [positionsWithPerformance, searchTerm]);

  // Sort positions
  const sortedPositions = useMemo(() => {
    return [...filteredPositions].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [filteredPositions, sortConfig]);

  // Paginate positions
  const paginatedPositions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedPositions.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedPositions, currentPage, itemsPerPage]);

  // Calculate total pages
  const totalPages = Math.ceil(filteredPositions.length / itemsPerPage);

  // Handle sort
  const handleSort = (key: SortConfig['key']) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Column header component
  interface ColumnHeaderProps {
    title: string;
    sortKey: SortConfig['key'];
  }

  const ColumnHeader: React.FC<ColumnHeaderProps> = ({ title, sortKey }) => {
    const isSorted = sortConfig.key === sortKey;
    const direction = sortConfig.direction;

    return (
      <th
        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
        onClick={() => handleSort(sortKey)}
      >
        <div className="flex items-center space-x-1">
          <span>{title}</span>
          <span className="text-gray-400">
            {isSorted && (direction === 'asc' ? '↑' : '↓')}
          </span>
        </div>
      </th>
    );
  };

  return (
    <div>
      {/* Search and filters */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <div className="relative">
          <input
            type="text"
            placeholder="Search holdings..."
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <div className="absolute left-3 top-2.5 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        <div className="text-sm text-gray-600">
          {filteredPositions.length} positions found
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto bg-white shadow rounded-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <ColumnHeader title="Ticker" sortKey="ticker" />
              <ColumnHeader title="Company Name" sortKey="companyName" />
              <ColumnHeader title="Current Price" sortKey="currentPrice" />
              <ColumnHeader title="Cost Basis" sortKey="costBasis" />
              <ColumnHeader title="Market Value" sortKey="marketValue" />
              <ColumnHeader title="Gain/Loss ($)" sortKey="gainLossAmount" />
              <ColumnHeader title="Gain/Loss (%)" sortKey="gainLossPercent" />
              <ColumnHeader title="Weight (%)" sortKey="weight" />
              <ColumnHeader title="Sector" sortKey="sector" />
              {isAdmin && (
                <>
                  <ColumnHeader title="Shares" sortKey="shares" />
                  <ColumnHeader title="Purchase Date" sortKey="purchaseDate" />
                </>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedPositions.length === 0 ? (
              <tr>
                <td colSpan={isAdmin ? 11 : 9} className="px-6 py-4 text-center text-gray-500">
                  No positions found
                </td>
              </tr>
            ) : (
              paginatedPositions.map((position) => {
                const isPositive = position.gainLossAmount >= 0;
                
                return (
                  <tr key={position.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-primary-700">
                      {position.ticker}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {position.companyName}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      ${position.currentPrice.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      ${position.costBasis.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      ${position.marketValue.toLocaleString()}
                    </td>
                    <td
                      className={`px-4 py-3 whitespace-nowrap text-sm font-medium ${
                        isPositive ? 'text-success-600' : 'text-danger-600'
                      }`}
                    >
                      {isPositive ? '+' : '-'}${Math.abs(position.gainLossAmount).toLocaleString()}
                    </td>
                    <td
                      className={`px-4 py-3 whitespace-nowrap text-sm font-medium ${
                        isPositive ? 'text-success-600' : 'text-danger-600'
                      }`}
                    >
                      {isPositive ? '+' : '-'}{Math.abs(position.gainLossPercent).toFixed(2)}%
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {position.weight.toFixed(2)}%
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {position.sector}
                    </td>
                    {isAdmin && (
                      <>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {position.shares.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                          {new Date(position.purchaseDate).toLocaleDateString()}
                        </td>
                      </>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredPositions.length)} of {filteredPositions.length} positions
          </div>
          <div className="flex space-x-2">
            <button
              className="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              Previous
            </button>
            <button
              className="px-3 py-1 rounded border border-gray-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HoldingsTable;
