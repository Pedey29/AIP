-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";
CREATE EXTENSION IF NOT EXISTS "pg_net";

-- Create positions table
CREATE TABLE IF NOT EXISTS positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticker TEXT NOT NULL,
  "companyName" TEXT NOT NULL,
  shares NUMERIC NOT NULL,
  "purchaseDate" DATE NOT NULL,
  "purchasePrice" NUMERIC NOT NULL,
  "costBasis" NUMERIC GENERATED ALWAYS AS (shares * "purchasePrice") STORED,
  sector TEXT NOT NULL,
  "currentPrice" NUMERIC,
  "marketValue" NUMERIC GENERATED ALWAYS AS (shares * "currentPrice") STORED,
  weight NUMERIC,
  notes TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create price_history table
CREATE TABLE IF NOT EXISTS price_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticker TEXT NOT NULL,
  date DATE NOT NULL,
  "openPrice" NUMERIC NOT NULL,
  "highPrice" NUMERIC NOT NULL,
  "lowPrice" NUMERIC NOT NULL,
  "closePrice" NUMERIC NOT NULL,
  volume NUMERIC,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(ticker, date)
);

-- Create benchmark_history table
CREATE TABLE IF NOT EXISTS benchmark_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticker TEXT NOT NULL,
  date DATE NOT NULL,
  "openPrice" NUMERIC NOT NULL,
  "highPrice" NUMERIC NOT NULL,
  "lowPrice" NUMERIC NOT NULL,
  "closePrice" NUMERIC NOT NULL,
  volume NUMERIC,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(ticker, date)
);

-- Create settings table
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- Ensures only one row
  "adminPassword" TEXT NOT NULL,
  "benchmarkTicker" TEXT NOT NULL DEFAULT 'SPY',
  "riskFreeRate" NUMERIC NOT NULL DEFAULT 0.03,
  "reportGenerationDay" INTEGER NOT NULL DEFAULT 1 CHECK ("reportGenerationDay" BETWEEN 1 AND 28),
  "lastPriceUpdate" TIMESTAMP WITH TIME ZONE,
  "lastReportGeneration" TIMESTAMP WITH TIME ZONE
);

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  "fileUrl" TEXT NOT NULL,
  "portfolioValue" NUMERIC NOT NULL,
  "benchmarkValue" NUMERIC NOT NULL,
  "topGainers" JSONB NOT NULL,
  "topLosers" JSONB NOT NULL,
  commentary TEXT NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create update trigger for positions
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW."updatedAt" = now();
   RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER update_positions_modtime
BEFORE UPDATE ON positions
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Create indexes for better performance
CREATE INDEX idx_positions_ticker ON positions(ticker);
CREATE INDEX idx_price_history_ticker ON price_history(ticker);
CREATE INDEX idx_price_history_date ON price_history(date);
CREATE INDEX idx_benchmark_history_date ON benchmark_history(date);
CREATE INDEX idx_reports_date ON reports(date);

-- Create RLS policies
-- Enable RLS on all tables
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE benchmark_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Allow full access to authenticated users
-- In a real application, you would have more granular policies
CREATE POLICY "Allow full access to authenticated users" ON positions
FOR ALL
TO authenticated
USING (true);

CREATE POLICY "Allow full access to authenticated users" ON price_history
FOR ALL
TO authenticated
USING (true);

CREATE POLICY "Allow full access to authenticated users" ON benchmark_history
FOR ALL
TO authenticated
USING (true);

CREATE POLICY "Allow full access to authenticated users" ON settings
FOR ALL
TO authenticated
USING (true);

CREATE POLICY "Allow full access to authenticated users" ON reports
FOR ALL
TO authenticated
USING (true);

-- Allow read-only access to anonymous users
CREATE POLICY "Allow read access to anonymous users" ON positions
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Allow read access to anonymous users" ON price_history
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Allow read access to anonymous users" ON benchmark_history
FOR SELECT
TO anon
USING (true);

CREATE POLICY "Allow read access to anonymous users" ON reports
FOR SELECT
TO anon
USING (true);

-- Initialize settings with default values if not exists
INSERT INTO settings (id, "adminPassword", "benchmarkTicker", "riskFreeRate", "reportGenerationDay")
VALUES (1, '$2a$10$cXalKeVk0kAn6z.UdpGaxeCFN2eFHdEDwuFfDVpmNsaZ4VVISdIb6', 'SPY', 0.03, 1) -- Default password is 'admin'
ON CONFLICT (id) DO NOTHING;

-- Create view for student position data (hiding admin-only fields)
CREATE VIEW student_positions AS
SELECT 
  id,
  ticker,
  "companyName",
  "costBasis",
  sector,
  "currentPrice",
  "marketValue",
  weight,
  "updatedAt"
FROM positions;