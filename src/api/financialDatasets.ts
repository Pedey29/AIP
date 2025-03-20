import axios from 'axios';
import { PriceData, FinancialMetric } from '../types';

const BASE_URL = 'https://api.financialdatasets.ai';
const API_KEY = process.env.REACT_APP_FINANCIAL_DATASETS_API_KEY || '';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'X-API-KEY': API_KEY,
    'Content-Type': 'application/json'
  }
});

/**
 * Get current price data for a ticker symbol
 * @param ticker The ticker symbol
 * @returns Current price data
 */
export const getCurrentPrice = async (ticker: string): Promise<number> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const response = await api.get<PriceData>(`/prices/`, {
      params: {
        ticker,
        interval: 'day',
        start_date: today,
        end_date: today
      }
    });

    if (response.data.prices && response.data.prices.length > 0) {
      return response.data.prices[0].close;
    }

    throw new Error('No price data available for today');
  } catch (error) {
    console.error(`Error fetching current price for ${ticker}:`, error);
    throw error;
  }
};

/**
 * Get historical price data for a ticker symbol
 * @param ticker The ticker symbol
 * @param startDate The start date (YYYY-MM-DD)
 * @param endDate The end date (YYYY-MM-DD)
 * @param interval The time interval ('day', 'week', 'month', etc.)
 * @returns Historical price data
 */
export const getHistoricalPrices = async (
  ticker: string,
  startDate: string,
  endDate: string,
  interval: 'day' | 'week' | 'month' | 'year' = 'day'
): Promise<PriceData> => {
  try {
    const response = await api.get<PriceData>(`/prices/`, {
      params: {
        ticker,
        interval,
        start_date: startDate,
        end_date: endDate
      }
    });

    return response.data;
  } catch (error) {
    console.error(`Error fetching historical prices for ${ticker}:`, error);
    throw error;
  }
};

/**
 * Get financial metrics for a ticker symbol
 * @param ticker The ticker symbol
 * @returns Financial metrics
 */
export const getFinancialMetrics = async (ticker: string): Promise<FinancialMetric> => {
  try {
    const response = await api.get<{ financial_metrics: FinancialMetric[] }>(`/financial-metrics`, {
      params: {
        ticker,
        period: 'ttm',
        limit: 1
      }
    });

    if (response.data.financial_metrics && response.data.financial_metrics.length > 0) {
      return response.data.financial_metrics[0];
    }

    throw new Error('No financial metrics available');
  } catch (error) {
    console.error(`Error fetching financial metrics for ${ticker}:`, error);
    throw error;
  }
};

/**
 * Search for a company by name or ticker
 * @param query The search query
 * @returns Array of matching companies
 */
export const searchCompany = async (query: string): Promise<{ ticker: string; name: string }[]> => {
  try {
    const response = await api.get(`/search`, {
      params: {
        query
      }
    });

    return response.data.results || [];
  } catch (error) {
    console.error(`Error searching for company ${query}:`, error);
    throw error;
  }
};

/**
 * Fetch bulk price data for multiple tickers
 * @param tickers Array of ticker symbols
 * @param date The date to fetch prices for (YYYY-MM-DD)
 * @returns Object mapping tickers to prices
 */
export const getBulkPrices = async (
  tickers: string[],
  date: string
): Promise<Record<string, number>> => {
  try {
    // We need to make separate requests for each ticker
    const pricePromises = tickers.map(ticker => 
      api.get<PriceData>(`/prices/`, {
        params: {
          ticker,
          interval: 'day',
          start_date: date,
          end_date: date
        }
      })
    );

    const responses = await Promise.all(pricePromises);
    const priceMap: Record<string, number> = {};

    responses.forEach((response, index) => {
      const ticker = tickers[index];
      if (response.data.prices && response.data.prices.length > 0) {
        priceMap[ticker] = response.data.prices[0].close;
      }
    });

    return priceMap;
  } catch (error) {
    console.error(`Error fetching bulk prices:`, error);
    throw error;
  }
};

export default {
  getCurrentPrice,
  getHistoricalPrices,
  getFinancialMetrics,
  searchCompany,
  getBulkPrices
};
