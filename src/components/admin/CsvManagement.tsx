import React, { useState, useRef } from 'react';
import { usePortfolio } from '../../context/PortfolioContext';
import supabaseApi from '../../api/supabaseApi';
import financialDatasets from '../../api/financialDatasets';
import Card from '../common/Card';
import Button from '../common/Button';
import ConfirmationModal from '../common/ConfirmationModal';

const CsvManagement: React.FC = () => {
  const { positions, refreshData } = usePortfolio();
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[] | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<number, string[]>>({});
  const [isImporting, setIsImporting] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle drag events
  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // Handle drop event
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  // Process the file
  const handleFile = (file: File) => {
    // Reset states
    setFile(file);
    setPreviewData(null);
    setValidationErrors({});
    setError(null);
    setSuccess(null);
    
    // Check if file is CSV
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }
    
    // Parse CSV
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        try {
          const text = e.target.result as string;
          const rows = text.split('\n');
          
          // Get headers
          const headers = rows[0].split(',').map(header => header.trim());
          const requiredHeaders = ['Ticker', 'Company Name', 'Shares', 'Purchase Date', 'Purchase Price', 'Sector'];
          
          // Check headers
          const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
          if (missingHeaders.length > 0) {
            setError(`CSV is missing required headers: ${missingHeaders.join(', ')}`);
            return;
          }
          
          // Parse data
          const data = rows.slice(1).filter(row => row.trim()).map((row, index) => {
            const values = row.split(',').map(value => value.trim());
            const record: Record<string, string> = {};
            headers.forEach((header, i) => {
              record[header] = values[i] || '';
            });
            return { line: index + 2, data: record };
          });
          
          // Validate data
          const errors: Record<number, string[]> = {};
          data.forEach(({ line, data }) => {
            const rowErrors: string[] = [];
            
            // Ticker validation
            if (!data.Ticker) {
              rowErrors.push('Ticker is required');
            }
            
            // Company Name validation
            if (!data['Company Name']) {
              rowErrors.push('Company Name is required');
            }
            
            // Shares validation
            if (!data.Shares) {
              rowErrors.push('Shares is required');
            } else if (isNaN(Number(data.Shares)) || Number(data.Shares) <= 0) {
              rowErrors.push('Shares must be a positive number');
            }
            
            // Purchase Date validation
            if (!data['Purchase Date']) {
              rowErrors.push('Purchase Date is required');
            } else {
              // Check if date is valid
              const date = new Date(data['Purchase Date']);
              if (isNaN(date.getTime())) {
                rowErrors.push('Purchase Date is invalid (use YYYY-MM-DD format)');
              }
            }
            
            // Purchase Price validation
            if (!data['Purchase Price']) {
              rowErrors.push('Purchase Price is required');
            } else if (isNaN(Number(data['Purchase Price'])) || Number(data['Purchase Price']) <= 0) {
              rowErrors.push('Purchase Price must be a positive number');
            }
            
            // Sector validation
            if (!data.Sector) {
              rowErrors.push('Sector is required');
            }
            
            if (rowErrors.length > 0) {
              errors[line] = rowErrors;
            }
          });
          
          if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
          }
          
          // Set preview data
          setPreviewData(data.map(item => item.data));
        } catch (error) {
          console.error('Error parsing CSV:', error);
          setError('Error parsing CSV file');
        }
      }
    };
    reader.readAsText(file);
  };

  // Download CSV template
  const handleDownloadTemplate = () => {
    // Create CSV content
    const headers = ['Ticker', 'Company Name', 'Shares', 'Purchase Date', 'Purchase Price', 'Sector', 'Notes'];
    const sampleRow = ['AAPL', 'Apple Inc.', '100', '2023-01-15', '150.25', 'Technology', 'Initial investment'];
    const content = [
      headers.join(','),
      sampleRow.join(',')
    ].join('\n');
    
    // Create download link
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'portfolio_positions_template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  // Download current portfolio
  const handleDownloadPortfolio = () => {
    // Create CSV content
    const headers = ['Ticker', 'Company Name', 'Shares', 'Purchase Date', 'Purchase Price', 'Sector', 'Notes'];
    const rows = positions.map(position => [
      position.ticker,
      position.companyName,
      position.shares,
      position.purchaseDate,
      position.purchasePrice,
      position.sector,
      position.notes || ''
    ]);
    const content = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Create download link
    const blob = new Blob([content], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `portfolio_positions_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Import positions
  const handleImport = async () => {
    if (!previewData || Object.keys(validationErrors).length > 0) return;
    
    setIsImporting(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Import positions
      for (const row of previewData) {
        const position = {
          ticker: row.Ticker.toUpperCase(),
          companyName: row['Company Name'],
          shares: Number(row.Shares),
          purchaseDate: row['Purchase Date'],
          purchasePrice: Number(row['Purchase Price']),
          sector: row.Sector,
          notes: row.Notes || null
        };
        
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
      }
      
      // Refresh data
      await refreshData();
      
      // Reset states
      setFile(null);
      setPreviewData(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      setSuccess(`Successfully imported ${previewData.length} positions`);
    } catch (error) {
      console.error('Error importing positions:', error);
      setError('Failed to import positions. Please try again.');
    } finally {
      setIsImporting(false);
      setShowConfirmation(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Download Section */}
      <Card title="Download Portfolio Data">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Download the current portfolio as a CSV file or get a template for importing new positions.
          </p>
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
            <Button
              variant="outline"
              onClick={handleDownloadTemplate}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                </svg>
              }
            >
              Download Template
            </Button>
            <Button
              variant="primary"
              onClick={handleDownloadPortfolio}
              disabled={positions.length === 0}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              }
            >
              Download Current Portfolio
            </Button>
          </div>
        </div>
      </Card>

      {/* Upload Section */}
      <Card title="Import Positions from CSV">
        {/* Error/Success Messages */}
        {error && (
          <div className="mb-4 p-3 bg-danger-50 border border-danger-200 text-danger-800 rounded-md">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-success-50 border border-success-200 text-success-800 rounded-md">
            {success}
          </div>
        )}

        {/* File Upload */}
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Upload a CSV file with position data to import. The CSV should have headers for Ticker, Company Name, Shares, Purchase Date, Purchase Price, and Sector.
          </p>
          
          <div
            className={`border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center ${
              dragActive ? 'border-primary-400 bg-primary-50' : 'border-gray-300'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10 text-gray-400 mb-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            
            <p className="text-sm text-gray-600 mb-2">
              {file ? file.name : 'Drag and drop CSV file here or click to select'}
            </p>
            
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileChange}
              ref={fileInputRef}
            />
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              Select File
            </Button>
          </div>
        </div>

        {/* Preview Data */}
        {previewData && previewData.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Preview</h3>
            
            {Object.keys(validationErrors).length > 0 && (
              <div className="mb-4 p-3 bg-danger-50 border border-danger-200 text-danger-800 rounded-md">
                <p className="font-medium">CSV has {Object.keys(validationErrors).length} validation errors:</p>
                <ul className="mt-2 list-disc list-inside">
                  {Object.entries(validationErrors).map(([line, errors]) => (
                    <li key={line}>
                      Line {line}: {errors.join(', ')}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="overflow-x-auto bg-gray-50 rounded-md">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    {Object.keys(previewData[0]).map((header) => (
                      <th
                        key={header}
                        className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {previewData.map((row, index) => (
                    <tr key={index}>
                      {Object.values(row).map((value, i) => (
                        <td key={i} className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                          {value}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-4 flex justify-end">
              <Button
                variant="primary"
                onClick={() => setShowConfirmation(true)}
                disabled={Object.keys(validationErrors).length > 0 || isImporting}
                isLoading={isImporting}
              >
                Import Positions
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmation}
        title="Confirm Import"
        message={`Are you sure you want to import ${previewData?.length} positions? This will add new positions to your portfolio.`}
        confirmButtonText="Import"
        onConfirm={handleImport}
        onCancel={() => setShowConfirmation(false)}
        isLoading={isImporting}
      />
    </div>
  );
};

export default CsvManagement;
