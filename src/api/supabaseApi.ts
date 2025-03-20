import { supabase } from '../supabase';
import { Position, PriceHistory, BenchmarkHistory, Settings, Report } from '../types';

/**
 * Fetch all positions from the database
 * @param isAdmin Whether to include admin-only fields
 * @returns Array of positions
 */
export const getPositions = async (isAdmin: boolean = false): Promise<Position[]> => {
  try {
    const table = isAdmin ? 'positions' : 'student_positions';
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .order('weight', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching positions:', error);
    throw error;
  }
};

/**
 * Get a position by ID
 * @param id Position ID
 * @returns Position data
 */
export const getPositionById = async (id: string): Promise<Position> => {
  try {
    const { data, error } = await supabase
      .from('positions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error fetching position ${id}:`, error);
    throw error;
  }
};

/**
 * Add a new position
 * @param position Position data to add
 * @returns The created position
 */
export const addPosition = async (position: Omit<Position, 'id' | 'createdAt' | 'updatedAt' | 'marketValue' | 'weight'>): Promise<Position> => {
  try {
    const { data, error } = await supabase
      .from('positions')
      .insert([position])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding position:', error);
    throw error;
  }
};

/**
 * Update an existing position
 * @param id Position ID
 * @param position Position data to update
 * @returns The updated position
 */
export const updatePosition = async (id: string, position: Partial<Position>): Promise<Position> => {
  try {
    const { data, error } = await supabase
      .from('positions')
      .update(position)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error updating position ${id}:`, error);
    throw error;
  }
};

/**
 * Delete a position
 * @param id Position ID
 * @returns Success status
 */
export const deletePosition = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('positions')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error(`Error deleting position ${id}:`, error);
    throw error;
  }
};

/**
 * Fetch historical price data for a ticker
 * @param ticker Ticker symbol
 * @param startDate Start date (YYYY-MM-DD)
 * @param endDate End date (YYYY-MM-DD)
 * @returns Array of price history records
 */
export const getPriceHistory = async (
  ticker: string,
  startDate: string,
  endDate: string
): Promise<PriceHistory[]> => {
  try {
    const { data, error } = await supabase
      .from('price_history')
      .select('*')
      .eq('ticker', ticker)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error(`Error fetching price history for ${ticker}:`, error);
    throw error;
  }
};

/**
 * Fetch benchmark price history
 * @param ticker Benchmark ticker symbol
 * @param startDate Start date (YYYY-MM-DD)
 * @param endDate End date (YYYY-MM-DD)
 * @returns Array of benchmark history records
 */
export const getBenchmarkHistory = async (
  ticker: string,
  startDate: string,
  endDate: string
): Promise<BenchmarkHistory[]> => {
  try {
    const { data, error } = await supabase
      .from('benchmark_history')
      .select('*')
      .eq('ticker', ticker)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error(`Error fetching benchmark history for ${ticker}:`, error);
    throw error;
  }
};

/**
 * Get application settings
 * @returns Settings record
 */
export const getSettings = async (): Promise<Settings> => {
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error fetching settings:', error);
    throw error;
  }
};

/**
 * Update application settings
 * @param settings Settings data to update
 * @returns Updated settings
 */
export const updateSettings = async (settings: Partial<Settings>): Promise<Settings> => {
  try {
    const { data, error } = await supabase
      .from('settings')
      .update(settings)
      .eq('id', 1)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating settings:', error);
    throw error;
  }
};

/**
 * Verify admin password
 * @param password Password to verify
 * @returns Whether the password is valid
 */
export const verifyAdminPassword = async (password: string): Promise<boolean> => {
  try {
    // In a real app, this would call a server function to verify the password
    // without exposing the hashed password to the client
    const { data, error } = await supabase
      .rpc('verify_admin_password', { password });

    if (error) throw error;
    return data || false;
  } catch (error) {
    console.error('Error verifying admin password:', error);
    throw error;
  }
};

/**
 * Get generated reports
 * @param limit Number of reports to retrieve
 * @returns Array of reports
 */
export const getReports = async (limit: number = 10): Promise<Report[]> => {
  try {
    const { data, error } = await supabase
      .from('reports')
      .select('*')
      .order('date', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching reports:', error);
    throw error;
  }
};

/**
 * Manually trigger price update
 * @returns Success status
 */
export const triggerPriceUpdate = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .functions.invoke('update-prices');

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error triggering price update:', error);
    throw error;
  }
};

/**
 * Manually generate report
 * @returns Success status
 */
export const generateReport = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .functions.invoke('generate-report');

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error generating report:', error);
    throw error;
  }
};

export default {
  getPositions,
  getPositionById,
  addPosition,
  updatePosition,
  deletePosition,
  getPriceHistory,
  getBenchmarkHistory,
  getSettings,
  updateSettings,
  verifyAdminPassword,
  getReports,
  triggerPriceUpdate,
  generateReport
};
