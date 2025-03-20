import React, { useState, useEffect } from 'react';
import { usePortfolio } from '../../context/PortfolioContext';
import supabaseApi from '../../api/supabaseApi';
import financialDatasets from '../../api/financialDatasets';
import Card from '../common/Card';
import Button from '../common/Button';

const BenchmarkSettings: React.FC = () => {
  const { settings, refreshData } = usePortfolio();
  const [values, setValues] = useState({
    benchmarkTicker: '',
    riskFreeRate: '',
    reportGenerationDay: '',
    adminPassword: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isPriceUpdating, setIsPriceUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);

  // Initialize form with settings
  useEffect(() => {
    if (settings) {
      setValues({
        benchmarkTicker: settings.benchmarkTicker,
        riskFreeRate: (settings.riskFreeRate * 100).toString(),
        reportGenerationDay: settings.reportGenerationDay.toString(),
        adminPassword: ''
      });
    }
  }, [settings]);

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    setValues({
      ...values,
      [name]: value
    });
    
    // Clear validation error
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!values.benchmarkTicker) {
      newErrors.benchmarkTicker = 'Benchmark ticker is required';
    }
    
    if (!values.riskFreeRate) {
      newErrors.riskFreeRate = 'Risk-free rate is required';
    } else if (isNaN(Number(values.riskFreeRate)) || Number(values.riskFreeRate) < 0 || Number(values.riskFreeRate) > 100) {
      newErrors.riskFreeRate = 'Risk-free rate must be a number between 0 and 100';
    }
    
    if (!values.reportGenerationDay) {
      newErrors.reportGenerationDay = 'Report generation day is required';
    } else if (
      isNaN(Number(values.reportGenerationDay)) ||
      Number(values.reportGenerationDay) < 1 ||
      Number(values.reportGenerationDay) > 28 ||
      !Number.isInteger(Number(values.reportGenerationDay))
    ) {
      newErrors.reportGenerationDay = 'Report generation day must be an integer between 1 and 28';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setUpdateSuccess(null);
    setUpdateError(null);
    
    try {
      const updatedSettings: any = {
        benchmarkTicker: values.benchmarkTicker.toUpperCase(),
        riskFreeRate: Number(values.riskFreeRate) / 100,
        reportGenerationDay: Number(values.reportGenerationDay)
      };
      
      // Include password if provided
      if (values.adminPassword) {
        updatedSettings.adminPassword = values.adminPassword;
      }
      
      await supabaseApi.updateSettings(updatedSettings);
      
      // Fetch benchmark historical data if ticker changed
      if (settings && values.benchmarkTicker.toUpperCase() !== settings.benchmarkTicker) {
        try {
          const today = new Date().toISOString().split('T')[0];
          const oneYearAgo = new Date();
          oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
          const startDate = oneYearAgo.toISOString().split('T')[0];
          
          await financialDatasets.getHistoricalPrices(values.benchmarkTicker.toUpperCase(), startDate, today);
        } catch (error) {
          console.error('Error fetching benchmark data:', error);
          // Continue even if fetch fails
        }
      }
      
      // Refresh data
      await refreshData();
      
      // Reset password field
      setValues({
        ...values,
        adminPassword: ''
      });
      
      setUpdateSuccess('Settings updated successfully');
    } catch (error) {
      console.error('Error updating settings:', error);
      setUpdateError('Failed to update settings. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Trigger manual price update
  const handleTriggerPriceUpdate = async () => {
    setIsPriceUpdating(true);
    setUpdateSuccess(null);
    setUpdateError(null);
    
    try {
      await supabaseApi.triggerPriceUpdate();
      await refreshData();
      setUpdateSuccess('Price update triggered successfully');
    } catch (error) {
      console.error('Error triggering price update:', error);
      setUpdateError('Failed to trigger price update. Please try again.');
    } finally {
      setIsPriceUpdating(false);
    }
  };

  if (!settings) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {updateSuccess && (
        <div className="p-3 bg-success-50 border border-success-200 text-success-800 rounded-md">
          {updateSuccess}
        </div>
      )}
      
      {updateError && (
        <div className="p-3 bg-danger-50 border border-danger-200 text-danger-800 rounded-md">
          {updateError}
        </div>
      )}

      {/* Settings Form */}
      <Card title="Benchmark Settings">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Benchmark Ticker */}
            <div>
              <label htmlFor="benchmarkTicker" className="block text-sm font-medium text-gray-700 mb-1">
                Benchmark Ticker *
              </label>
              <input
                type="text"
                id="benchmarkTicker"
                name="benchmarkTicker"
                value={values.benchmarkTicker}
                onChange={handleChange}
                className={`form-input ${errors.benchmarkTicker ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500' : ''}`}
                disabled={isSubmitting}
              />
              {errors.benchmarkTicker && <p className="form-error">{errors.benchmarkTicker}</p>}
            </div>

            {/* Risk-Free Rate */}
            <div>
              <label htmlFor="riskFreeRate" className="block text-sm font-medium text-gray-700 mb-1">
                Risk-Free Rate (%) *
              </label>
              <input
                type="number"
                id="riskFreeRate"
                name="riskFreeRate"
                value={values.riskFreeRate}
                onChange={handleChange}
                className={`form-input ${errors.riskFreeRate ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500' : ''}`}
                disabled={isSubmitting}
                step="0.01"
                min="0"
                max="100"
              />
              {errors.riskFreeRate && <p className="form-error">{errors.riskFreeRate}</p>}
            </div>

            {/* Report Generation Day */}
            <div>
              <label htmlFor="reportGenerationDay" className="block text-sm font-medium text-gray-700 mb-1">
                Report Generation Day (1-28) *
              </label>
              <input
                type="number"
                id="reportGenerationDay"
                name="reportGenerationDay"
                value={values.reportGenerationDay}
                onChange={handleChange}
                className={`form-input ${errors.reportGenerationDay ? 'border-danger-300 focus:border-danger-500 focus:ring-danger-500' : ''}`}
                disabled={isSubmitting}
                min="1"
                max="28"
                step="1"
              />
              {errors.reportGenerationDay && <p className="form-error">{errors.reportGenerationDay}</p>}
            </div>

            {/* Admin Password */}
            <div>
              <label htmlFor="adminPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Admin Password (leave blank to keep current)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="adminPassword"
                  name="adminPassword"
                  value={values.adminPassword}
                  onChange={handleChange}
                  className="form-input pr-10"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                      <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Last Updates */}
          <div className="bg-gray-50 p-4 rounded-md space-y-2">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm font-medium text-gray-700">Last Price Update</h3>
                <p className="text-sm text-gray-600">
                  {settings.lastPriceUpdate
                    ? new Date(settings.lastPriceUpdate).toLocaleString()
                    : 'Never'}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleTriggerPriceUpdate}
                isLoading={isPriceUpdating}
              >
                Update Prices Now
              </Button>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-700">Last Report Generation</h3>
              <p className="text-sm text-gray-600">
                {settings.lastReportGeneration
                  ? new Date(settings.lastReportGeneration).toLocaleString()
                  : 'Never'}
              </p>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end">
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
            >
              Save Settings
            </Button>
          </div>
        </form>
      </Card>

      {/* Cron Job Info */}
      <Card title="Scheduled Jobs">
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-gray-700">Daily Price Update</h3>
            <p className="text-sm text-gray-600">
              Prices are automatically updated daily at 6:00 PM.
            </p>
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-700">Monthly Report Generation</h3>
            <p className="text-sm text-gray-600">
              Reports are automatically generated on day {settings.reportGenerationDay} of each month.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default BenchmarkSettings;