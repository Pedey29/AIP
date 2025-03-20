export interface Database {
  public: {
    Tables: {
      positions: {
        Row: {
          id: string;
          ticker: string;
          companyName: string;
          shares: number;
          purchaseDate: string;
          purchasePrice: number;
          costBasis: number;
          sector: string;
          currentPrice: number;
          marketValue: number;
          weight: number;
          notes: string | null;
          createdAt: string;
          updatedAt: string;
        };
        Insert: {
          id?: string;
          ticker: string;
          companyName: string;
          shares: number;
          purchaseDate: string;
          purchasePrice: number;
          costBasis?: number;
          sector: string;
          currentPrice?: number;
          marketValue?: number;
          weight?: number;
          notes?: string | null;
          createdAt?: string;
          updatedAt?: string;
        };
        Update: {
          id?: string;
          ticker?: string;
          companyName?: string;
          shares?: number;
          purchaseDate?: string;
          purchasePrice?: number;
          costBasis?: number;
          sector?: string;
          currentPrice?: number;
          marketValue?: number;
          weight?: number;
          notes?: string | null;
          createdAt?: string;
          updatedAt?: string;
        };
      };
      price_history: {
        Row: {
          id: string;
          ticker: string;
          date: string;
          openPrice: number;
          highPrice: number;
          lowPrice: number;
          closePrice: number;
          volume: number | null;
          createdAt: string;
        };
        Insert: {
          id?: string;
          ticker: string;
          date: string;
          openPrice: number;
          highPrice: number;
          lowPrice: number;
          closePrice: number;
          volume?: number | null;
          createdAt?: string;
        };
        Update: {
          id?: string;
          ticker?: string;
          date?: string;
          openPrice?: number;
          highPrice?: number;
          lowPrice?: number;
          closePrice?: number;
          volume?: number | null;
          createdAt?: string;
        };
      };
      benchmark_history: {
        Row: {
          id: string;
          ticker: string;
          date: string;
          openPrice: number;
          highPrice: number;
          lowPrice: number;
          closePrice: number;
          volume: number | null;
          createdAt: string;
        };
        Insert: {
          id?: string;
          ticker: string;
          date: string;
          openPrice: number;
          highPrice: number;
          lowPrice: number;
          closePrice: number;
          volume?: number | null;
          createdAt?: string;
        };
        Update: {
          id?: string;
          ticker?: string;
          date?: string;
          openPrice?: number;
          highPrice?: number;
          lowPrice?: number;
          closePrice?: number;
          volume?: number | null;
          createdAt?: string;
        };
      };
      settings: {
        Row: {
          id: number;
          adminPassword: string;
          benchmarkTicker: string;
          riskFreeRate: number;
          reportGenerationDay: number;
          lastPriceUpdate: string | null;
          lastReportGeneration: string | null;
        };
        Insert: {
          id?: number;
          adminPassword: string;
          benchmarkTicker: string;
          riskFreeRate: number;
          reportGenerationDay: number;
          lastPriceUpdate?: string | null;
          lastReportGeneration?: string | null;
        };
        Update: {
          id?: number;
          adminPassword?: string;
          benchmarkTicker?: string;
          riskFreeRate?: number;
          reportGenerationDay?: number;
          lastPriceUpdate?: string | null;
          lastReportGeneration?: string | null;
        };
      };
      reports: {
        Row: {
          id: string;
          date: string;
          fileUrl: string;
          portfolioValue: number;
          benchmarkValue: number;
          topGainers: any; // Using 'any' for JSONB type
          topLosers: any; // Using 'any' for JSONB type
          commentary: string;
          createdAt: string;
        };
        Insert: {
          id?: string;
          date: string;
          fileUrl: string;
          portfolioValue: number;
          benchmarkValue: number;
          topGainers: any; // Using 'any' for JSONB type
          topLosers: any; // Using 'any' for JSONB type
          commentary: string;
          createdAt?: string;
        };
        Update: {
          id?: string;
          date?: string;
          fileUrl?: string;
          portfolioValue?: number;
          benchmarkValue?: number;
          topGainers?: any; // Using 'any' for JSONB type
          topLosers?: any; // Using 'any' for JSONB type
          commentary?: string;
          createdAt?: string;
        };
      };
    };
    Views: {
      [key: string]: {
        Row: Record<string, unknown>;
        Insert: Record<string, unknown>;
        Update: Record<string, unknown>;
      };
    };
    Functions: {
      [key: string]: {
        Args: Record<string, unknown>;
        Returns: unknown;
      };
    };
    Enums: {
      [key: string]: {
        [key: string]: string;
      };
    };
  };
}
