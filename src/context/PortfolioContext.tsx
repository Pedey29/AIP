import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import supabaseApi from '../api/supabaseApi';
import { Position, Settings, TimePeriod, PerformanceData, RiskMetrics, SectorAllocation } from '../types';
import { formatISO, subDays, subMonths, subYears, startOfYear } from 'date-fns';

interface PortfolioContextValue {
  // Portfolio data
  positions: Position[];
  totalValue: number;
  dayChange: { amount: number; percent: number };
  ytdChange: { amount: number; percent: number };
  inceptionChange: { amount: number; percent: number };
  
  // Performance data
  performanceData: PerformanceData[];
  timePeriod: TimePeriod;
  setTimePeriod: (period: TimePeriod) => void;
  
  // Settings
  settings: Settings | null;
  
  // Risk metrics
  riskMetrics: RiskMetrics | null;
  
  // Sector allocation
  sectorAllocation: SectorAllocation[];
  
  // Admin state
  isAdmin: boolean;
  setIsAdmin: (isAdmin: boolean) => void;
  
  // Loading states
  loading: boolean;
  
  // Refresh data
  refreshData: () => Promise<void>;
}

const PortfolioContext = createContext<PortfolioContextValue | undefined>(undefined);

export const PortfolioProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [positions, setPositions] = useState<Position[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('1M');
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [riskMetrics, setRiskMetrics] = useState<RiskMetrics | null>(null);
  const [sectorAllocation, setSectorAllocation] = useState<SectorAllocation[]>([]);

  // Calculate derived portfolio data
  const totalValue = positions.reduce((sum, pos) => sum + (pos.marketValue || 0), 0);
  
  // Calculate day change (placeholder - would use actual daily data)
  const dayChange = {
    amount: positions.reduce((sum, pos) => sum + ((pos.currentPrice || 0) - (pos.purchasePrice || 0)) * (pos.shares || 0), 0),
    percent: totalValue > 0 ? (dayChange.amount / totalValue) * 100 : 0
  };
  
  // Calculate YTD change (placeholder - would use actual YTD data)
  const ytdChange = {
    amount: positions.reduce((sum, pos) => sum + ((pos.currentPrice || 0) - (pos.purchasePrice || 0)) * (pos.shares || 0), 0),
    percent: totalValue > 0 ? (ytdChange.amount / totalValue) * 100 : 0
  };
  
  // Calculate inception change (placeholder - would use actual inception data)
  const inceptionChange = {
    amount: positions.reduce((sum, pos) => sum + ((pos.currentPrice || 0) - (pos.purchasePrice || 0)) * (pos.shares || 0), 0),
    percent: totalValue > 0 ? (inceptionChange.amount / totalValue) * 100 : 0
  };

  // Fetch portfolio data
  const fetchData = async () => {
    setLoading(true);
    try {
      const positionsData = await supabaseApi.getPositions(isAdmin);
      setPositions(positionsData);
      
      const settingsData = await supabaseApi.getSettings();
      setSettings(settingsData);
      
      await fetchPerformanceData(timePeriod, settingsData.benchmarkTicker);
      await calculateRiskMetrics(positionsData, settingsData);
      calculateSectorAllocation(positionsData);
    } catch (error) {
      console.error('Error fetching portfolio data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch performance data for a specific time period
  const fetchPerformanceData = async (period: TimePeriod, benchmarkTicker: string) => {
    try {
      const today = new Date();
      let startDate: Date;
      
      switch (period) {
        case '1D':
          startDate = subDays(today, 1);
          break;
        case '1W':
          startDate = subDays(today, 7);
          break;
        case '1M':
          startDate = subMonths(today, 1);
          break;
        case '3M':
          startDate = subMonths(today, 3);
          break;
        case '6M':
          startDate = subMonths(today, 6);
          break;
        case '1Y':
          startDate = subYears(today, 1);
          break;
        case 'YTD':
          startDate = startOfYear(today);
          break;
        case 'MAX':
          startDate = new Date(0); // Beginning of time
          break;
        default:
          startDate = subMonths(today, 1);
      }
      
      const formattedStartDate = formatISO(startDate, { representation: 'date' });
      const formattedEndDate = formatISO(today, { representation: 'date' });
      
      // Fetch benchmark history
      const benchmarkData = await supabaseApi.getBenchmarkHistory(
        benchmarkTicker,
        formattedStartDate,
        formattedEndDate
      );
      
      // For each position, fetch price history and calculate portfolio value over time
      const tickerSet = new Set(positions.map(p => p.ticker));
      const tickers = Array.from(tickerSet);
      
      const priceHistoryPromises = tickers.map(ticker => 
        supabaseApi.getPriceHistory(ticker, formattedStartDate, formattedEndDate)
      );
      
      const priceHistoryResults = await Promise.all(priceHistoryPromises);
      
      // Create a map of ticker -> date -> price
      const priceMap: Record<string, Record<string, number>> = {};
      
      tickers.forEach((ticker, index) => {
        priceMap[ticker] = {};
        const priceHistory = priceHistoryResults[index];
        
        priceHistory.forEach(record => {
          priceMap[ticker][record.date] = record.closePrice;
        });
      });
      
      // Create a set of all dates across all price histories
      const dateSet = new Set<string>();
      
      priceHistoryResults.forEach(history => {
        history.forEach(record => {
          dateSet.add(record.date);
        });
      });
      
      benchmarkData.forEach(record => {
        dateSet.add(record.date);
      });
      
      // Sort dates
      const sortedDates = Array.from(dateSet).sort();
      
      // For each date, calculate portfolio value and benchmark value
      const performanceData: PerformanceData[] = sortedDates.map(date => {
        // Calculate portfolio value for this date
        let portfolioValue = 0;
        positions.forEach(position => {
          const price = priceMap[position.ticker]?.[date];
          if (price && position.shares) {
            portfolioValue += price * position.shares;
          }
        });
        
        // Find benchmark value for this date
        const benchmarkRecord = benchmarkData.find(record => record.date === date);
        const benchmarkValue = benchmarkRecord ? benchmarkRecord.closePrice : 0;
        
        // Calculate percent changes (relative to first date)
        const firstPortfolioValue = performanceData[0]?.portfolioValue || portfolioValue;
        const firstBenchmarkValue = performanceData[0]?.benchmarkValue || benchmarkValue;
        
        const portfolioPercentChange = firstPortfolioValue > 0
          ? ((portfolioValue - firstPortfolioValue) / firstPortfolioValue) * 100
          : 0;
        
        const benchmarkPercentChange = firstBenchmarkValue > 0
          ? ((benchmarkValue - firstBenchmarkValue) / firstBenchmarkValue) * 100
          : 0;
        
        return {
          date,
          portfolioValue,
          benchmarkValue,
          portfolioPercentChange,
          benchmarkPercentChange
        };
      });
      
      setPerformanceData(performanceData);
    } catch (error) {
      console.error('Error fetching performance data:', error);
    }
  };

  // Calculate risk metrics
  const calculateRiskMetrics = async (positions: Position[], settings: Settings) => {
    try {
      const today = new Date();
      const oneYearAgo = subYears(today, 1);
      const formattedStartDate = formatISO(oneYearAgo, { representation: 'date' });
      const formattedEndDate = formatISO(today, { representation: 'date' });
      
      // Fetch benchmark history
      const benchmarkData = await supabaseApi.getBenchmarkHistory(
        settings.benchmarkTicker,
        formattedStartDate,
        formattedEndDate
      );
      
      // For each position, fetch price history
      const tickerSet = new Set(positions.map(p => p.ticker));
      const tickers = Array.from(tickerSet);
      
      const priceHistoryPromises = tickers.map(ticker => 
        supabaseApi.getPriceHistory(ticker, formattedStartDate, formattedEndDate)
      );
      
      const priceHistoryResults = await Promise.all(priceHistoryPromises);
      
      // Create a map of ticker -> date -> price
      const priceMap: Record<string, Record<string, number>> = {};
      
      tickers.forEach((ticker, index) => {
        priceMap[ticker] = {};
        const priceHistory = priceHistoryResults[index];
        
        priceHistory.forEach(record => {
          priceMap[ticker][record.date] = record.closePrice;
        });
      });
      
      // Create a set of all dates across all price histories
      const dateSet = new Set<string>();
      
      priceHistoryResults.forEach(history => {
        history.forEach(record => {
          dateSet.add(record.date);
        });
      });
      
      // Sort dates
      const sortedDates = Array.from(dateSet).sort();
      
      // Calculate daily portfolio values
      const portfolioValues = sortedDates.map(date => {
        let value = 0;
        positions.forEach(position => {
          const price = priceMap[position.ticker]?.[date];
          if (price && position.shares) {
            value += price * position.shares;
          }
        });
        return { date, value };
      });
      
      // Calculate benchmark values
      const benchmarkValues = sortedDates.map(date => {
        const record = benchmarkData.find(r => r.date === date);
        return { date, value: record ? record.closePrice : 0 };
      });
      
      // Calculate daily returns
      const portfolioReturns: number[] = [];
      const benchmarkReturns: number[] = [];
      
      for (let i = 1; i < portfolioValues.length; i++) {
        if (portfolioValues[i-1].value > 0) {
          portfolioReturns.push(
            (portfolioValues[i].value / portfolioValues[i-1].value) - 1
          );
        }
        
        if (benchmarkValues[i-1].value > 0) {
          benchmarkReturns.push(
            (benchmarkValues[i].value / benchmarkValues[i-1].value) - 1
          );
        }
      }
      
      // Calculate standard deviation of portfolio returns
      const portfolioMean = portfolioReturns.reduce((sum, ret) => sum + ret, 0) / portfolioReturns.length;
      const portfolioVariance = portfolioReturns.reduce((sum, ret) => sum + Math.pow(ret - portfolioMean, 2), 0) / portfolioReturns.length;
      const portfolioStdDev = Math.sqrt(portfolioVariance) * Math.sqrt(252); // Annualized
      
      // Calculate beta
      const benchmarkMean = benchmarkReturns.reduce((sum, ret) => sum + ret, 0) / benchmarkReturns.length;
      let covariance = 0;
      let benchmarkVariance = 0;
      
      const minLength = Math.min(portfolioReturns.length, benchmarkReturns.length);
      
      for (let i = 0; i < minLength; i++) {
        covariance += (portfolioReturns[i] - portfolioMean) * (benchmarkReturns[i] - benchmarkMean);
        benchmarkVariance += Math.pow(benchmarkReturns[i] - benchmarkMean, 2);
      }
      
      covariance /= minLength;
      benchmarkVariance /= minLength;
      
      const beta = covariance / benchmarkVariance;
      
      // Calculate Sharpe ratio
      const excessReturn = portfolioMean - (settings.riskFreeRate / 252); // Daily excess return
      const sharpeRatio = (excessReturn / Math.sqrt(portfolioVariance)) * Math.sqrt(252); // Annualized
      
      // Calculate maximum drawdown
      let maxDrawdown = 0;
      let peak = portfolioValues[0].value;
      
      for (const { value } of portfolioValues) {
        if (value > peak) {
          peak = value;
        }
        
        const drawdown = (peak - value) / peak;
        maxDrawdown = Math.max(maxDrawdown, drawdown);
      }
      
      setRiskMetrics({
        sharpeRatio,
        beta,
        standardDeviation: portfolioStdDev * 100, // Convert to percentage
        maxDrawdown,
        riskFreeRate: settings.riskFreeRate
      });
    } catch (error) {
      console.error('Error calculating risk metrics:', error);
    }
  };

  // Calculate sector allocation
  const calculateSectorAllocation = (positions: Position[]) => {
    try {
      // Group by sector and calculate weights
      const sectorMap: Record<string, number> = {};
      
      positions.forEach(position => {
        if (!sectorMap[position.sector]) {
          sectorMap[position.sector] = 0;
        }
        
        sectorMap[position.sector] += position.weight || 0;
      });
      
      // Create mock benchmark sector weights (in a real app, this would come from benchmark data)
      const benchmarkSectorWeights: Record<string, number> = {
        'Technology': 25.5,
        'Healthcare': 14.2,
        'Financials': 13.7,
        'Consumer Discretionary': 10.8,
        'Communication Services': 8.5,
        'Industrials': 7.9,
        'Consumer Staples': 6.5,
        'Energy': 5.2,
        'Utilities': 3.2,
        'Real Estate': 2.8,
        'Materials': 1.7
      };
      
      // Calculate sector allocation with benchmark weights and differences
      const allocation: SectorAllocation[] = Object.entries(sectorMap).map(([sector, weight]) => ({
        sector,
        weight,
        benchmarkWeight: benchmarkSectorWeights[sector] || 0,
        difference: weight - (benchmarkSectorWeights[sector] || 0)
      }));
      
      // Sort by weight descending
      allocation.sort((a, b) => b.weight - a.weight);
      
      setSectorAllocation(allocation);
    } catch (error) {
      console.error('Error calculating sector allocation:', error);
    }
  };

  // Refresh data
  const refreshData = async () => {
    await fetchData();
  };

  // Initial data load
  useEffect(() => {
    fetchData();
  }, [isAdmin]);
  
  // Update performance data when time period changes
  useEffect(() => {
    if (settings) {
      fetchPerformanceData(timePeriod, settings.benchmarkTicker);
    }
  }, [timePeriod, settings]);

  const value: PortfolioContextValue = {
    positions,
    totalValue,
    dayChange,
    ytdChange,
    inceptionChange,
    performanceData,
    timePeriod,
    setTimePeriod,
    settings,
    riskMetrics,
    sectorAllocation,
    isAdmin,
    setIsAdmin,
    loading,
    refreshData
  };

  return (
    <PortfolioContext.Provider value={value}>
      {children}
    </PortfolioContext.Provider>
  );
};

export const usePortfolio = (): PortfolioContextValue => {
  const context = useContext(PortfolioContext);
  if (context === undefined) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return context;
};
