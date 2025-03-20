import React, { useState } from 'react';
import { usePortfolio } from '../../context/PortfolioContext';
import supabaseApi from '../../api/supabaseApi';
import financialDatasets from '../../api/financialDatasets';
import { Position } from '../../types';

// Components
import Card from '../common/Card';
import Button from '../common/Button';
import PositionForm from './PositionForm';
import ConfirmationModal from '../common/ConfirmationModal';

const PositionManagement: React.FC = () => {
  const { positions, refreshData } = usePortfolio();
  const [isAddingPosition, setIsAddingPosition] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [deletingPosition, setDeletingPosition] = useState<Position | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle add position
  const handleAddPosition = async (position: Omit<Position, 'id' | 'createdAt' | 'updatedAt' | 'marketValue' | 'weight'>) => {
    setLoading(true);
    setError(null);
    
    try {
      // Add position
      await supabaseApi.addPosition(position);
      
      // Fetch historical price data
      try {
        const today = new Date().toISOString().split('T')[0];
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        const startDate = oneYearAgo.toISOString().split('T')[0];
        
        await financialDatasets.getHistoricalPrices(position.ticker, startDate, today);
      } catch (error) {
        console.error('Error fetching historical data:', error);
        // Continue even if historical data fetch fails
      }
      
      // Refresh data
      await refreshData();
      setIsAddingPosition(false);
    } catch (error) {
      console.error('Error adding position:', error);
      setError('Failed to add position. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle edit position
  const handleEditPosition = async (id: string, position: Partial<Position>) => {
    setLoading(true);
    setError(null);
    
    try {
      await supabaseApi.updatePosition(id, position);
      await refreshData();
      setEditingPosition(null);
    } catch (error) {
      console.error('Error updating position:', error);
      setError('Failed to update position. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle delete position
  const handleDeletePosition = async () => {
    if (!deletingPosition) return;
    
    setLoading(true);
    setError(null);
    
    try {
      await supabaseApi.deletePosition(deletingPosition.id);
      await refreshData();
      setDeletingPosition(null);
    } catch (error) {
      console.error('Error deleting position:', error);
      setError('Failed to delete position. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setIsAddingPosition(false);
    setEditingPosition(null);
    setDeletingPosition(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      {/* Add Position Button */}
      {!isAddingPosition && !editingPosition && (
        <div className="flex justify-end">
          <Button
            variant="primary"
            onClick={() => setIsAddingPosition(true)}
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            }
          >
            Add Position
          </Button>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-danger-50 border border-danger-200 text-danger-800 px-4 py-3 rounded relative">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {/* Add/Edit Form */}
      {(isAddingPosition || editingPosition) && (
        <Card title={isAddingPosition ? 'Add New Position' : 'Edit Position'}>
          <PositionForm
            position={editingPosition}
            onSubmit={isAddingPosition ? handleAddPosition : (values) => handleEditPosition(editingPosition!.id, values)}
            onCancel={handleCancel}
            isLoading={loading}
          />
        </Card>
      )}

      {/* Positions List */}
      {!isAddingPosition && !editingPosition && (
        <Card title="Current Positions">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ticker
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Shares
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Purchase Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Purchase Price
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Price
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sector
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {positions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                      No positions found
                    </td>
                  </tr>
                ) : (
                  positions.map((position) => (
                    <tr key={position.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-600">
                        {position.ticker}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {position.companyName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {position.shares.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(position.purchaseDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${position.purchasePrice.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${position.currentPrice.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {position.sector}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => setEditingPosition(position)}
                          className="text-primary-600 hover:text-primary-900 mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => setDeletingPosition(position)}
                          className="text-danger-600 hover:text-danger-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deletingPosition !== null}
        title="Delete Position"
        message={`Are you sure you want to delete ${deletingPosition?.ticker} (${deletingPosition?.companyName})? This action cannot be undone.`}
        confirmButtonText="Delete"
        confirmButtonVariant="danger"
        onConfirm={handleDeletePosition}
        onCancel={() => setDeletingPosition(null)}
        isLoading={loading}
      />
    </div>
  );
};

export default PositionManagement;
