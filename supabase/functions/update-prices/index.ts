// Follow this setup guide to integrate the Deno runtime into your application:
// https://deno.land/manual/examples/deploy_supabase_edge

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { format } from 'https://esm.sh/date-fns@2.30.0';
import axios from 'https://esm.sh/axios@1.6.2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Position {
  id: string;
  ticker: string;
  shares: number;
  currentPrice: number | null;
  marketValue: number | null;
  weight: number | null;
}

interface Settings {
  benchmarkTicker: string;
}

interface PriceResponse {
  prices: {
    open: number;
    close: number;
    high: number;
    low: number;
    volume: number;
    time: string;
  }[];
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

    const financeAPIKey = Deno.env.get('FINANCIAL_DATASETS_API_KEY') ?? '';
    
    if (!financeAPIKey) {
      throw new Error('Missing FINANCIAL_DATASETS_API_KEY environment variable');
    }

    // Get all positions from database
    const { data: positions, error: positionsError } = await supabase
      .from('positions')
      .select('id, ticker, shares, currentPrice, marketValue, weight');

    if (positionsError) {
      throw positionsError;
    }

    // Get benchmark ticker from settings
    const { data: settings, error: settingsError } = await supabase
      .from('settings')
      .select('benchmarkTicker')
      .single();

    if (settingsError) {
      throw settingsError;
    }

    const tickers = [...new Set([...positions.map(p => p.ticker), settings.benchmarkTicker])];
    const today = format(new Date(), 'yyyy-MM-dd');
    
    // Check if we already have prices for today
    const { data: existingPrices } = await supabase
      .from('price_history')
      .select('ticker')
      .eq('date', today);
    
    const tickersToUpdate = tickers.filter(
      ticker => !existingPrices?.some(p => p.ticker === ticker)
    );

    if (tickersToUpdate.length === 0) {
      return new Response(
        JSON.stringify({ message: 'Prices already up to date for today' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get latest prices for all tickers
    const pricePromises = tickersToUpdate.map(async (ticker) => {
      try {
        const response = await axios.get<PriceResponse>(
          `https://api.financialdatasets.ai/prices/?ticker=${ticker}&interval=day&start_date=${today}&end_date=${today}`,
          {
            headers: {
              'X-API-KEY': financeAPIKey
            }
          }
        );

        if (response.data.prices.length === 0) {
          console.log(`No prices returned for ${ticker}`);
          return null;
        }

        const price = response.data.prices[0];
        
        // Insert into price_history or benchmark_history
        if (ticker === settings.benchmarkTicker) {
          await supabase.from('benchmark_history').insert({
            ticker,
            date: today,
            openPrice: price.open,
            highPrice: price.high,
            lowPrice: price.low,
            closePrice: price.close,
            volume: price.volume
          });
        } else {
          await supabase.from('price_history').insert({
            ticker,
            date: today,
            openPrice: price.open,
            highPrice: price.high,
            lowPrice: price.low,
            closePrice: price.close,
            volume: price.volume
          });

          // Update current price in positions
          await supabase
            .from('positions')
            .update({ currentPrice: price.close })
            .eq('ticker', ticker);
        }

        return { ticker, price: price.close };
      } catch (error) {
        console.error(`Error fetching price for ${ticker}:`, error);
        return null;
      }
    });

    const priceResults = await Promise.all(pricePromises);
    const validPriceResults = priceResults.filter(result => result !== null);

    // Calculate total portfolio value
    const totalValue = positions.reduce((sum, position) => {
      const priceResult = validPriceResults.find(p => p?.ticker === position.ticker);
      const price = priceResult ? priceResult.price : position.currentPrice;
      
      if (price && position.shares) {
        return sum + (price * position.shares);
      }
      
      return sum;
    }, 0);

    // Update position weights
    if (totalValue > 0) {
      const weightUpdatePromises = positions.map(async (position) => {
        const priceResult = validPriceResults.find(p => p?.ticker === position.ticker);
        const price = priceResult ? priceResult.price : position.currentPrice;
        
        if (price && position.shares) {
          const marketValue = price * position.shares;
          const weight = (marketValue / totalValue) * 100;
          
          await supabase
            .from('positions')
            .update({ weight })
            .eq('id', position.id);
        }
      });

      await Promise.all(weightUpdatePromises);
    }

    // Update last price update timestamp
    await supabase
      .from('settings')
      .update({ lastPriceUpdate: new Date().toISOString() })
      .eq('id', 1);

    return new Response(
      JSON.stringify({ 
        message: 'Prices updated successfully',
        updatedTickers: validPriceResults.map(r => r?.ticker)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in update-prices function:', error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});