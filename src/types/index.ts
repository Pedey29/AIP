import { Database } from './supabase';

// Re-export types from supabase
export type Position = Database['public']['Tables']['positions']['Row'];
export type PriceHistory = Database['public']['Tables']['price_history']['Row'];
export type BenchmarkHistory = Database['public']['Tables']['benchmark_history']['Row'];
export type Settings = Database['public']['Tables']['settings']['Row'];
export type Report = Database['public']['Tables']['reports']['Row'];

// Additional application-specific types

export type TimePeriod = '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | 'YTD' | 'MAX';

export interface PositionWithPerformance extends Position {
  gainLossAmount: number;
  gainLossPercent: number;
}

export interface PerformanceData {
  date: string;
  portfolioValue: number;
  benchmarkValue: number;
  portfolioPercentChange: number;
  benchmarkPercentChange: number;
}

export interface RiskMetrics {
  sharpeRatio: number;
  beta: number;
  standardDeviation: number;
  maxDrawdown: number;
  riskFreeRate: number;
}

export interface SectorAllocation {
  sector: string;
  weight: number;
  benchmarkWeight: number;
  difference: number;
}

export type TopMover = {
  ticker: string;
  companyName: string;
  gainLossPercent: number;
  gainLossAmount: number;
  contribution: number;
};

export interface ReportData {
  date: string;
  portfolioValue: number;
  periodPerformance: {
    amount: number;
    percent: number;
  };
  benchmarkComparison: {
    performance: number;
    difference: number;
  };
  sectorAllocation: SectorAllocation[];
  topHoldings: Position[];
  performanceChart: PerformanceData[];
  rollingReturns: {
    period: string;
    portfolioReturn: number;
    benchmarkReturn: number;
    difference: number;
  }[];
  topGainers: TopMover[];
  topLosers: TopMover[];
  riskMetrics: RiskMetrics;
  commentary: string;
}

export interface TimeSeriesData {
  date: string;
  value: number;
}

export interface PriceData {
  ticker: string;
  prices: {
    open: number;
    close: number;
    high: number;
    low: number;
    volume: number;
    time: string;
  }[];
}

export interface FinancialMetric {
  ticker: string;
  market_cap: number;
  price_to_earnings_ratio: number;
  price_to_book_ratio: number;
  price_to_sales_ratio: number;
  enterprise_value_to_ebitda_ratio: number;
  free_cash_flow_yield: number;
  gross_margin: number;
  operating_margin: number;
  net_margin: number;
  return_on_equity: number;
  return_on_assets: number;
  debt_to_equity: number;
  current_ratio: number;
  quick_ratio: number;
  [key: string]: number | string;
}
