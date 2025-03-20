import React, { useState, useEffect } from 'react';
import { Position } from '../../types';
import financialDatasets from '../../api/financialDatasets';
import Button from '../common/Button';

interface PositionFormProps {
  position?: Position | null;
  onSubmit: (values: any) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const sectorOptions = [
  'Technology',
  'Healthcare',
  'Financials',
  'Consumer Discretionary',
  'Communication Services',
  'Industrials',
  'Consumer Staples',
  'Energy',
  'Utilities',
  'Real Estate',
  'Materials',
  'Other'
];

const PositionForm: React.FC<PositionFormProps> = ({
  position,
  onSubmit,
  onCancel,
  isLoading
}) => {
  const [values, setValues] = useState({
    ticker: '',
    companyName: '',
    shares: '',
    purchaseDate: '',
    purchasePrice: '',
    sector: '',
    currentPrice: '',
    notes: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSearching, setIsSearching] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<{ ticker: string; name: string }>>([]);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);

  // Initialize form with position data if editing
  useEffect(() => {
    if (position) {
      setValues({
        ticker: position.ticker,
        companyName: position.companyName,
        shares: position.shares.toString(),
        purchaseDate: position.purchaseDate,
        purchasePrice: position.purchasePrice.toString(),
        sector: position.sector,
        currentPrice: position.currentPrice?.toString() || '',
        notes: position.notes || ''
      });
    }
  }, [position]);

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setValues({
      ...values,
      [name]: value
    });
    
    // Clear validation error when field is changed
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
    
    // Handle ticker search
    if (name === 'ticker' && value.length >= 2) {
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
      
      setTypingTimeout(
        setTimeout(async () => {
          try {
            setIsSearching(true);
            const results = await financialDatasets.searchCompany(value.toUpperCase());
            setSuggestions(results);
          } catch (error) {
            console.error('Error searching company:', error);
          } finally {
            setIsSearching(false);
          }
        }, 500)
      );
    } else if (name === 'ticker' && value.length < 2) {
      setSuggestions([]);
    }
  };

  // Select a suggestion
  const selectSuggestion = async (ticker: string, companyName: string) => {
    setValues({
      ...values,
      ticker,
      companyName
    });
    
    setSuggestions([]);
    
    // Try to fetch current price
    try {
      const price = await financialDatasets.getCurrentPrice(ticker);
      
      setValues(prevValues => ({
        ...prevValues,
        ticker,
        companyName,
        currentPrice: price.toString()
      }));
    } catch (error) {
      console.error('Error fetching current price:', error);
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!values.ticker) {
      newErrors.ticker = 'Ticker is required';
    }
    
    if (!values.companyName) {
      newErrors.companyName = 'Company name is required';
    }
    
    if (!values.shares) {
      newErrors.shares = 'Shares is required';
    } else if (isNaN(Number(values.shares)) || Number(values.shares) <= 0) {
      newErrors.shares = 'Shares must be a positive number';
    }
    
    if (!values.purchaseDate) {
      newErrors.purchaseDate = 'Purchase date is required';
    }
    
    if (!values.purchasePrice) {
      newErrors.purchasePrice = 'Purchase price is required';
    } else if (isNaN(Number(values.purchasePrice)) || Number(values.purchasePrice) <= 0) {
      newErrors.purchasePrice = 'Purchase price must be a positive number';
    }
    
    if (!values.sector) {
      newErrors.sector = 'Sector is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const formData = {
      ticker: values.ticker.toUpperCase(),
      companyName: values.companyName,
      shares: Number(values.shares),
      purchaseDate: values.purchaseDate,
      purchasePrice: Number(values.purchasePrice),
      sector: values.sector,
      notes: values.notes || null
    };
    
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Ticker */}
        <div className="relative">
          <label htmlFor="ticker" className="block text-sm font-medium text-gray-700 mb-1">
            Ticker Symbol *
          </label>
          <input
            type="text"
            id="ticker"
            name="ticker"
            value={values.ticker}
            onChange={handleChange}
            className={`form-input ${errors.ticker ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500' : ''}`}
            disabled={isLoading || !!position}
          />
          {errors.ticker && <p className="form-error">{errors.ticker}</p>}
          
          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white shadow-lg rounded-md border border-gray-200 max-h-60 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => selectSuggestion(suggestion.ticker, suggestion.name)}
                >
                  <span className="font-medium">{suggestion.ticker}</span> - {suggestion.name}
                </div>
              ))}
            </div>
          )}
          
          {isSearching && (
            <div className="absolute right-3 top-9">
              <div className="animate-spin h-4 w-4 border-2 border-primary-500 rounded-full border-t-transparent"></div>
            </div>
          )}
        </div>

        {/* Company Name */}
        <div>
          <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">
            Company Name *
          </label>
          <input
            type="text"
            id="companyName"
            name="companyName"
            value={values.companyName}
            onChange={handleChange}
            className={`form-input ${errors.companyName ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500' : ''}`}
            disabled={isLoading}
          />
          {errors.companyName && <p className="form-error">{errors.companyName}</p>}
        </div>

        {/* Shares */}
        <div>
          <label htmlFor="shares" className="block text-sm font-medium text-gray-700 mb-1">
            Shares *
          </label>
          <input
            type="number"
            id="shares"
            name="shares"
            value={values.shares}
            onChange={handleChange}
            className={`form-input ${errors.shares ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500' : ''}`}
            disabled={isLoading}
            step="0.01"
          />
          {errors.shares && <p className="form-error">{errors.shares}</p>}
        </div>

        {/* Purchase Date */}
        <div>
          <label htmlFor="purchaseDate" className="block text-sm font-medium text-gray-700 mb-1">
            Purchase Date *
          </label>
          <input
            type="date"
            id="purchaseDate"
            name="purchaseDate"
            value={values.purchaseDate}
            onChange={handleChange}
            className={`form-input ${errors.purchaseDate ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500' : ''}`}
            disabled={isLoading}
          />
          {errors.purchaseDate && <p className="form-error">{errors.purchaseDate}</p>}
        </div>

        {/* Purchase Price */}
        <div>
          <label htmlFor="purchasePrice" className="block text-sm font-medium text-gray-700 mb-1">
            Purchase Price ($) *
          </label>
          <input
            type="number"
            id="purchasePrice"
            name="purchasePrice"
            value={values.purchasePrice}
            onChange={handleChange}
            className={`form-input ${errors.purchasePrice ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500' : ''}`}
            disabled={isLoading}
            step="0.01"
          />
          {errors.purchasePrice && <p className="form-error">{errors.purchasePrice}</p>}
        </div>

        {/* Sector */}
        <div>
          <label htmlFor="sector" className="block text-sm font-medium text-gray-700 mb-1">
            Sector *
          </label>
          <select
            id="sector"
            name="sector"
            value={values.sector}
            onChange={handleChange}
            className={`form-input ${errors.sector ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500' : ''}`}
            disabled={isLoading}
          >
            <option value="">Select a sector</option>
            {sectorOptions.map((sector) => (
              <option key={sector} value={sector}>
                {sector}
              </option>
            ))}
          </select>
          {errors.sector && <p className="form-error">{errors.sector}</p>}
        </div>

        {/* Notes */}
        <div className="md:col-span-2">
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            value={values.notes}
            onChange={handleChange}
            className="form-input min-h-[100px]"
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Cost Basis Calculation */}
      {values.shares && values.purchasePrice && (
        <div className="bg-gray-50 p-4 rounded-md">
          <p className="text-sm font-medium text-gray-700">
            Cost Basis: <span className="text-gray-900">${(Number(values.shares) * Number(values.purchasePrice)).toLocaleString()}</span>
          </p>
        </div>
      )}

      {/* Form Actions */}
      <div className="flex justify-end space-x-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
        >
          {position ? 'Update Position' : 'Add Position'}
        </Button>
      </div>
    </form>
  );
};

export default PositionForm;
