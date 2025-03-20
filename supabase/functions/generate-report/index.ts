// Follow this setup guide to integrate the Deno runtime into your application:
// https://deno.land/manual/examples/deploy_supabase_edge

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { format, subMonths, subDays } from 'https://esm.sh/date-fns@2.30.0';
import OpenAI from 'https://esm.sh/openai@4.20.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Position {
  id: string;
  ticker: string;
  companyName: string;
  shares: number;
  currentPrice: number;
  marketValue: number;
  purchasePrice: number;
  purchaseDate: string;
  costBasis: number;
  sector: string;
  weight: number;
}

interface PriceHistory {
  ticker: string;
  date: string;
  closePrice: number;
}

interface Settings {
  benchmarkTicker: string;
  riskFreeRate: number;
}

interface TopMover {
  ticker: string;
  companyName: string;
  gainLossPercent: number;
  gainLossAmount: number;
  contribution: number;
}

interface SectorAllocation {
  sector: string;
  weight: number;
}

interface RiskMetrics {
  sharpeRatio: number;
  beta: number;
  standardDeviation: number;
  maxDrawdown: number;
}

interface ReportData {
  date: string;
  portfolioValue: number;
  benchmarkValue: number;
  monthlyPerformance: {
    portfolio: number;
    benchmark: number;
  };
  yearToDatePerformance: {
    portfolio: number;
    benchmark: number;
  };
  topGainers: TopMover[];
  topLosers: TopMover[];
  sectorAllocation: SectorAllocation[];
  riskMetrics: RiskMetrics;
}

// Calculate portfolio performance metrics
function calculatePerformance(
  positions: Position[],
  priceHistory: PriceHistory[],
  benchmarkHistory: PriceHistory[],
  riskFreeRate: number
): ReportData {
  const today = new Date();
  const oneMonthAgo = subMonths(today, 1);
  const startOfYear = new Date(today.getFullYear(), 0, 1);
  
  // Group price history by ticker
  const pricesByTicker = priceHistory.reduce((acc, price) => {
    if (!acc[price.ticker]) {
      acc[price.ticker] = [];
    }
    acc[price.ticker].push(price);
    return acc;
  }, {} as Record<string, PriceHistory[]>);
  
  // Calculate current portfolio value
  const portfolioValue = positions.reduce((sum, position) => sum + position.marketValue, 0);
  
  // Get latest benchmark value
  const sortedBenchmarkHistory = [...benchmarkHistory].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const latestBenchmarkPrice = sortedBenchmarkHistory[0]?.closePrice || 0;
  const benchmarkValue = latestBenchmarkPrice;
  
  // Calculate monthly performance
  const monthlyPositionPerformance = positions.map(position => {
    const prices = pricesByTicker[position.ticker] || [];
    const monthAgoPrice = prices.find(
      price => new Date(price.date) <= oneMonthAgo
    )?.closePrice || position.purchasePrice;
    
    const performanceAmount = position.marketValue - (monthAgoPrice * position.shares);
    const performancePercent = ((position.currentPrice / monthAgoPrice) - 1) * 100;
    
    return {
      ...position,
      performanceAmount,
      performancePercent,
      contribution: (performanceAmount / portfolioValue) * 100
    };
  });
  
  // Get benchmark monthly performance
  const monthAgoBenchmarkPrice = sortedBenchmarkHistory.find(
    price => new Date(price.date) <= oneMonthAgo
  )?.closePrice || sortedBenchmarkHistory[sortedBenchmarkHistory.length - 1]?.closePrice || 0;
  
  const monthlyPortfolioPerformance = 
    (portfolioValue / positions.reduce((sum, p) => sum + (p.shares * (pricesByTicker[p.ticker]?.find(
      price => new Date(price.date) <= oneMonthAgo
    )?.closePrice || p.purchasePrice)), 0) - 1) * 100;
  
  const monthlyBenchmarkPerformance = ((latestBenchmarkPrice / monthAgoBenchmarkPrice) - 1) * 100;
  
  // Calculate YTD performance
  const ytdPositionPerformance = positions.map(position => {
    const prices = pricesByTicker[position.ticker] || [];
    const startOfYearPrice = prices.find(
      price => new Date(price.date) >= startOfYear && new Date(price.date) <= new Date(startOfYear.getTime() + 7 * 24 * 60 * 60 * 1000)
    )?.closePrice || position.purchasePrice;
    
    const performanceAmount = position.marketValue - (startOfYearPrice * position.shares);
    const performancePercent = ((position.currentPrice / startOfYearPrice) - 1) * 100;
    
    return {
      ...position,
      performanceAmount,
      performancePercent,
      contribution: (performanceAmount / portfolioValue) * 100
    };
  });
  
  // Get benchmark YTD performance
  const startOfYearBenchmarkPrice = sortedBenchmarkHistory.find(
    price => new Date(price.date) >= startOfYear && new Date(price.date) <= new Date(startOfYear.getTime() + 7 * 24 * 60 * 60 * 1000)
  )?.closePrice || sortedBenchmarkHistory[sortedBenchmarkHistory.length - 1]?.closePrice || 0;
  
  const ytdPortfolioPerformance = 
    (portfolioValue / positions.reduce((sum, p) => sum + (p.shares * (pricesByTicker[p.ticker]?.find(
      price => new Date(price.date) >= startOfYear && new Date(price.date) <= new Date(startOfYear.getTime() + 7 * 24 * 60 * 60 * 1000)
    )?.closePrice || p.purchasePrice)), 0) - 1) * 100;
  
  const ytdBenchmarkPerformance = ((latestBenchmarkPrice / startOfYearBenchmarkPrice) - 1) * 100;
  
  // Sort positions by performance for top gainers/losers
  const topGainers = [...monthlyPositionPerformance]
    .sort((a, b) => b.performancePercent - a.performancePercent)
    .slice(0, 5)
    .map(p => ({
      ticker: p.ticker,
      companyName: p.companyName,
      gainLossPercent: p.performancePercent,
      gainLossAmount: p.performanceAmount,
      contribution: p.contribution
    }));
  
  const topLosers = [...monthlyPositionPerformance]
    .sort((a, b) => a.performancePercent - b.performancePercent)
    .slice(0, 5)
    .map(p => ({
      ticker: p.ticker,
      companyName: p.companyName,
      gainLossPercent: p.performancePercent,
      gainLossAmount: p.performanceAmount,
      contribution: p.contribution
    }));
  
  // Calculate sector allocation
  const sectorAllocation = positions.reduce((acc, position) => {
    const existingSector = acc.find(s => s.sector === position.sector);
    
    if (existingSector) {
      existingSector.weight += position.weight;
    } else {
      acc.push({
        sector: position.sector,
        weight: position.weight
      });
    }
    
    return acc;
  }, [] as SectorAllocation[]);
  
  // Calculate risk metrics
  // This is a simplified calculation - in a real-world scenario, these would be more complex
  const dailyReturns = calculateDailyReturns(positions, priceHistory);
  const benchmarkDailyReturns = calculateBenchmarkDailyReturns(benchmarkHistory);
  
  const standardDeviation = Math.sqrt(
    dailyReturns.reduce((sum, ret) => sum + Math.pow(ret - average(dailyReturns), 2), 0) / dailyReturns.length
  ) * Math.sqrt(252); // Annualized
  
  const benchmarkStdDev = Math.sqrt(
    benchmarkDailyReturns.reduce((sum, ret) => sum + Math.pow(ret - average(benchmarkDailyReturns), 2), 0) / benchmarkDailyReturns.length
  ) * Math.sqrt(252); // Annualized
  
  const beta = calculateBeta(dailyReturns, benchmarkDailyReturns);
  const sharpeRatio = (ytdPortfolioPerformance - riskFreeRate) / standardDeviation;
  const maxDrawdown = calculateMaxDrawdown(positions, priceHistory);
  
  return {
    date: format(today, 'yyyy-MM-dd'),
    portfolioValue,
    benchmarkValue,
    monthlyPerformance: {
      portfolio: monthlyPortfolioPerformance,
      benchmark: monthlyBenchmarkPerformance
    },
    yearToDatePerformance: {
      portfolio: ytdPortfolioPerformance,
      benchmark: ytdBenchmarkPerformance
    },
    topGainers,
    topLosers,
    sectorAllocation,
    riskMetrics: {
      sharpeRatio,
      beta,
      standardDeviation,
      maxDrawdown
    }
  };
}

// Helper function to calculate daily returns
function calculateDailyReturns(positions: Position[], priceHistory: PriceHistory[]): number[] {
  // Group history by date
  const pricesByDate = priceHistory.reduce((acc, price) => {
    if (!acc[price.date]) {
      acc[price.date] = [];
    }
    acc[price.date].push(price);
    return acc;
  }, {} as Record<string, PriceHistory[]>);
  
  // Get dates in chronological order
  const dates = Object.keys(pricesByDate).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );
  
  // Calculate portfolio value for each day and compute daily returns
  const portfolioValues = dates.map(date => {
    const dayPrices = pricesByDate[date];
    let portfolioValue = 0;
    
    for (const position of positions) {
      const price = dayPrices.find(p => p.ticker === position.ticker);
      if (price) {
        portfolioValue += price.closePrice * position.shares;
      }
    }
    
    return portfolioValue;
  });
  
  // Calculate daily returns
  const returns = [];
  for (let i = 1; i < portfolioValues.length; i++) {
    if (portfolioValues[i-1] > 0) {
      returns.push((portfolioValues[i] / portfolioValues[i-1]) - 1);
    }
  }
  
  return returns;
}

// Helper function to calculate benchmark daily returns
function calculateBenchmarkDailyReturns(benchmarkHistory: PriceHistory[]): number[] {
  // Sort by date
  const sortedHistory = [...benchmarkHistory].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  // Calculate daily returns
  const returns = [];
  for (let i = 1; i < sortedHistory.length; i++) {
    returns.push((sortedHistory[i].closePrice / sortedHistory[i-1].closePrice) - 1);
  }
  
  return returns;
}

// Helper function to calculate average
function average(arr: number[]): number {
  return arr.reduce((sum, val) => sum + val, 0) / arr.length;
}

// Helper function to calculate beta
function calculateBeta(portfolioReturns: number[], benchmarkReturns: number[]): number {
  // Beta = Covariance(Portfolio, Benchmark) / Variance(Benchmark)
  const minLength = Math.min(portfolioReturns.length, benchmarkReturns.length);
  const portReturns = portfolioReturns.slice(0, minLength);
  const benchReturns = benchmarkReturns.slice(0, minLength);
  
  const portMean = average(portReturns);
  const benchMean = average(benchReturns);
  
  let covariance = 0;
  let benchVariance = 0;
  
  for (let i = 0; i < minLength; i++) {
    covariance += (portReturns[i] - portMean) * (benchReturns[i] - benchMean);
    benchVariance += Math.pow(benchReturns[i] - benchMean, 2);
  }
  
  covariance /= minLength;
  benchVariance /= minLength;
  
  return covariance / benchVariance;
}

// Helper function to calculate maximum drawdown
function calculateMaxDrawdown(positions: Position[], priceHistory: PriceHistory[]): number {
  // Group history by date
  const pricesByDate = priceHistory.reduce((acc, price) => {
    if (!acc[price.date]) {
      acc[price.date] = [];
    }
    acc[price.date].push(price);
    return acc;
  }, {} as Record<string, PriceHistory[]>);
  
  // Get dates in chronological order
  const dates = Object.keys(pricesByDate).sort(
    (a, b) => new Date(a).getTime() - new Date(b).getTime()
  );
  
  // Calculate portfolio value for each day
  const portfolioValues = dates.map(date => {
    const dayPrices = pricesByDate[date];
    let portfolioValue = 0;
    
    for (const position of positions) {
      const price = dayPrices.find(p => p.ticker === position.ticker);
      if (price) {
        portfolioValue += price.closePrice * position.shares;
      }
    }
    
    return portfolioValue;
  });
  
  // Calculate maximum drawdown
  let maxDrawdown = 0;
  let peak = portfolioValues[0];
  
  for (const value of portfolioValues) {
    if (value > peak) {
      peak = value;
    }
    
    const drawdown = (peak - value) / peak;
    maxDrawdown = Math.max(maxDrawdown, drawdown);
  }
  
  return maxDrawdown;
}

// Generate AI commentary using OpenAI
async function generateCommentary(reportData: ReportData): Promise<string> {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY') ?? '';
  
  if (!openaiApiKey) {
    return "Commentary generation failed: Missing OpenAI API key.";
  }
  
  const openai = new OpenAI({
    apiKey: openaiApiKey
  });
  
  const prompt = `
  Please provide a 200-300 word analysis of the following investment portfolio performance data:
  
  Date: ${reportData.date}
  Portfolio Value: $${reportData.portfolioValue.toLocaleString()}
  
  Monthly Performance:
  - Portfolio: ${reportData.monthlyPerformance.portfolio.toFixed(2)}%
  - Benchmark: ${reportData.monthlyPerformance.benchmark.toFixed(2)}%
  - Difference: ${(reportData.monthlyPerformance.portfolio - reportData.monthlyPerformance.benchmark).toFixed(2)}%
  
  Year-to-Date Performance:
  - Portfolio: ${reportData.yearToDatePerformance.portfolio.toFixed(2)}%
  - Benchmark: ${reportData.yearToDatePerformance.benchmark.toFixed(2)}%
  - Difference: ${(reportData.yearToDatePerformance.portfolio - reportData.yearToDatePerformance.benchmark).toFixed(2)}%
  
  Top Gainers:
  ${reportData.topGainers.map(g => `- ${g.companyName} (${g.ticker}): ${g.gainLossPercent.toFixed(2)}%`).join('\n')}
  
  Top Losers:
  ${reportData.topLosers.map(l => `- ${l.companyName} (${l.ticker}): ${l.gainLossPercent.toFixed(2)}%`).join('\n')}
  
  Sector Allocation:
  ${reportData.sectorAllocation.map(s => `- ${s.sector}: ${s.weight.toFixed(2)}%`).join('\n')}
  
  Risk Metrics:
  - Sharpe Ratio: ${reportData.riskMetrics.sharpeRatio.toFixed(2)}
  - Beta: ${reportData.riskMetrics.beta.toFixed(2)}
  - Standard Deviation: ${reportData.riskMetrics.standardDeviation.toFixed(2)}%
  - Maximum Drawdown: ${(reportData.riskMetrics.maxDrawdown * 100).toFixed(2)}%
  
  Please focus on:
  1. Overall portfolio performance vs. benchmark
  2. Key contributors to performance (sectors and individual positions)
  3. Risk-adjusted return assessment
  4. Brief outlook based on current positioning
  
  The analysis should be written for a university Applied Investments class that manages a $1.2 million portfolio.
  `;
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { 
          role: "system", 
          content: "You are a professional investment analyst specializing in portfolio analysis for educational purposes."
        },
        { 
          role: "user", 
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.7
    });
    
    return response.choices[0]?.message?.content || "Commentary generation failed.";
  } catch (error) {
    console.error("Error generating commentary:", error);
    return `Commentary generation failed: ${error.message}`;
  }
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create a Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get positions
    const { data: positions, error: positionsError } = await supabase
      .from('positions')
      .select('*');

    if (positionsError) {
      throw positionsError;
    }

    // Get settings
    const { data: settings, error: settingsError } = await supabase
      .from('settings')
      .select('benchmarkTicker, riskFreeRate')
      .single();

    if (settingsError) {
      throw settingsError;
    }

    // Get historical prices (last 1 year)
    const oneYearAgo = format(subDays(new Date(), 365), 'yyyy-MM-dd');
    
    const { data: priceHistory, error: priceHistoryError } = await supabase
      .from('price_history')
      .select('ticker, date, closePrice')
      .gte('date', oneYearAgo);

    if (priceHistoryError) {
      throw priceHistoryError;
    }

    // Get benchmark history
    const { data: benchmarkHistory, error: benchmarkHistoryError } = await supabase
      .from('benchmark_history')
      .select('ticker, date, closePrice')
      .eq('ticker', settings.benchmarkTicker)
      .gte('date', oneYearAgo);

    if (benchmarkHistoryError) {
      throw benchmarkHistoryError;
    }

    // Calculate performance metrics
    const reportData = calculatePerformance(
      positions,
      priceHistory,
      benchmarkHistory,
      settings.riskFreeRate
    );

    // Generate AI commentary
    const commentary = await generateCommentary(reportData);

    // Generate a report URL (in a real app, this would be a PDF generation step)
    // Here we're just simulating it by creating a placeholder URL
    const reportUrl = `${supabaseUrl}/storage/v1/object/public/reports/report-${format(new Date(), 'yyyy-MM-dd')}.pdf`;

    // Insert report into database
    const { error: insertError } = await supabase
      .from('reports')
      .insert({
        date: new Date().toISOString(),
        fileUrl: reportUrl,
        portfolioValue: reportData.portfolioValue,
        benchmarkValue: reportData.benchmarkValue,
        topGainers: reportData.topGainers,
        topLosers: reportData.topLosers,
        commentary
      });

    if (insertError) {
      throw insertError;
    }

    // Update last report generation timestamp
    await supabase
      .from('settings')
      .update({ lastReportGeneration: new Date().toISOString() })
      .eq('id', 1);

    return new Response(
      JSON.stringify({ 
        message: 'Report generated successfully',
        reportData
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in generate-report function:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});