import { createClient } from '@supabase/supabase-js';
import { Database } from './types/supabase';

// Get environment variables from process.env
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

// Create Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Export typings for Supabase tables
export type Position = Database['public']['Tables']['positions']['Row'];
export type PriceHistory = Database['public']['Tables']['price_history']['Row'];
export type BenchmarkHistory = Database['public']['Tables']['benchmark_history']['Row'];
export type Settings = Database['public']['Tables']['settings']['Row'];
export type Report = Database['public']['Tables']['reports']['Row'];
