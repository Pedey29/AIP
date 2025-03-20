import React, { useState, useEffect } from 'react';
import { usePortfolio } from '../../context/PortfolioContext';
import supabaseApi from '../../api/supabaseApi';
import Card from '../common/Card';
import Button from '../common/Button';
import { format, parseISO } from 'date-fns';
import { Report } from '../../types';

// Icons
const ReportIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-primary-600" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm2 10a1 1 0 10-2 0v3a1 1 0 102 0v-3zm2-3a1 1 0 011 1v5a1 1 0 11-2 0v-5a1 1 0 011-1zm4-1a1 1 0 10-2 0v7a1 1 0 102 0V8z" clipRule="evenodd" />
  </svg>
);

const GenerateIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
  </svg>
);

const DownloadIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
  </svg>
);

const ViewIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
  </svg>
);

const ReportGeneration: React.FC = () => {
  const { settings } = usePortfolio();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  // Fetch reports
  useEffect(() => {
    const fetchReports = async () => {
      try {
        const reportData = await supabaseApi.getReports(20);
        setReports(reportData);
      } catch (error) {
        console.error('Error fetching reports:', error);
        setError('Failed to fetch reports. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  // Generate report
  const handleGenerateReport = async () => {
    setIsGenerating(true);
    setSuccess(null);
    setError(null);
    
    try {
      await supabaseApi.generateReport();
      
      // Fetch updated reports
      const reportData = await supabaseApi.getReports(20);
      setReports(reportData);
      
      setSuccess('Report generated successfully');
    } catch (error) {
      console.error('Error generating report:', error);
      setError('Failed to generate report. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Format date
  const formatReportDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMMM d, yyyy h:mm a');
    } catch (error) {
      return dateString;
    }
  };

  // Report modal
  const ReportModal = () => {
    if (!selectedReport) return null;
    
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50"
          onClick={() => setSelectedReport(null)}
        ></div>

        {/* Modal */}
        <div className="flex items-center justify-center min-h-screen p-4">
          <div
            className="relative bg-white rounded-lg max-w-4xl w-full shadow-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">
                Report: {formatReportDate(selectedReport.date)}
              </h3>
              <button
                className="text-gray-400 hover:text-gray-500"
                onClick={() => setSelectedReport(null)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[80vh]">
              <div className="space-y-6">
                <div>
                  <h4 className="text-base font-medium text-gray-900 mb-2">Summary</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded-md">
                      <p className="text-sm text-gray-600">Portfolio Value</p>
                      <p className="text-lg font-medium text-gray-900">${selectedReport.portfolioValue.toLocaleString()}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <p className="text-sm text-gray-600">Benchmark Value</p>
                      <p className="text-lg font-medium text-gray-900">${selectedReport.benchmarkValue.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-base font-medium text-gray-900 mb-2">Top Gainers</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Ticker</th>
                          <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                          <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Gain (%)</th>
                          <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Contribution</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedReport.topGainers.map((gainer: any, index: number) => (
                          <tr key={index}>
                            <td className="px-3 py-2 text-sm font-medium text-primary-600">{gainer.ticker}</td>
                            <td className="px-3 py-2 text-sm text-gray-900">{gainer.companyName}</td>
                            <td className="px-3 py-2 text-sm text-right text-success-600">+{gainer.gainLossPercent.toFixed(2)}%</td>
                            <td className="px-3 py-2 text-sm text-right text-gray-900">{gainer.contribution.toFixed(2)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h4 className="text-base font-medium text-gray-900 mb-2">Top Losers</h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Ticker</th>
                          <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
                          <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Loss (%)</th>
                          <th scope="col" className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Contribution</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedReport.topLosers.map((loser: any, index: number) => (
                          <tr key={index}>
                            <td className="px-3 py-2 text-sm font-medium text-primary-600">{loser.ticker}</td>
                            <td className="px-3 py-2 text-sm text-gray-900">{loser.companyName}</td>
                            <td className="px-3 py-2 text-sm text-right text-danger-600">{loser.gainLossPercent.toFixed(2)}%</td>
                            <td className="px-3 py-2 text-sm text-right text-gray-900">{loser.contribution.toFixed(2)}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h4 className="text-base font-medium text-gray-900 mb-2">Commentary</h4>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedReport.commentary}</p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <a
                    href={selectedReport.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                  >
                    <DownloadIcon className="mr-2" />
                    Download PDF Report
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Success/Error Messages */}
      {success && (
        <div className="p-3 bg-success-50 border border-success-200 text-success-800 rounded-md">
          {success}
        </div>
      )}
      
      {error && (
        <div className="p-3 bg-danger-50 border border-danger-200 text-danger-800 rounded-md">
          {error}
        </div>
      )}

      {/* Generate Report */}
      <Card title="Generate Report">
        <div className="p-6 flex flex-col items-center text-center">
          <ReportIcon />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Create Portfolio Report</h3>
          <p className="mt-2 text-sm text-gray-600 max-w-lg">
            Generate a comprehensive PDF report with portfolio performance, holdings, sector allocation, risk metrics, and AI-generated commentary.
          </p>
          
          <div className="mt-6">
            <Button
              variant="primary"
              size="lg"
              onClick={handleGenerateReport}
              isLoading={isGenerating}
              icon={<GenerateIcon />}
            >
              Generate Report
            </Button>
          </div>
          
          <p className="mt-4 text-xs text-gray-500">
            Reports are automatically generated on day {settings?.reportGenerationDay || '1'} of each month.
          </p>
        </div>
      </Card>

      {/* Reports List */}
      <Card title="Previous Reports">
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin h-8 w-8 border-b-2 border-primary-600 rounded-full"></div>
          </div>
        ) : reports.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-gray-600">No reports generated yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Portfolio Value
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Benchmark Value
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatReportDate(report.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${report.portfolioValue.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${report.benchmarkValue.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => setSelectedReport(report)}
                        className="text-primary-600 hover:text-primary-900 mr-4"
                      >
                        <span className="flex items-center">
                          <ViewIcon className="mr-1" />
                          View
                        </span>
                      </button>
                      <a
                        href={report.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary-600 hover:text-primary-900"
                      >
                        <span className="flex items-center">
                          <DownloadIcon className="mr-1" />
                          Download
                        </span>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Report Modal */}
      <ReportModal />
    </div>
  );
};

export default ReportGeneration;