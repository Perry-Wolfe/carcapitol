-- Run this in your Supabase SQL Editor
-- Adds marketplace_listings table for Facebook Marketplace data

CREATE TABLE IF NOT EXISTS marketplace_listings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source_id TEXT UNIQUE NOT NULL,
  year INTEGER,
  make TEXT,
  model TEXT,
  trim TEXT,
  price INTEGER DEFAULT 0,
  mileage INTEGER DEFAULT 0,
  city TEXT,
  state TEXT,
  body_type TEXT,
  fuel_type TEXT,
  color_exterior TEXT,
  status TEXT DEFAULT 'Available',
  description TEXT,
  source TEXT NOT NULL DEFAULT 'facebook_marketplace',
  source_url TEXT,
  seller_type TEXT DEFAULT 'private',
  seller_name TEXT,
  seller_location TEXT,
  photo_url TEXT,
  dealer_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast searching
CREATE INDEX IF NOT EXISTS idx_ml_make ON marketplace_listings(make);
CREATE INDEX IF NOT EXISTS idx_ml_model ON marketplace_listings(model);
CREATE INDEX IF NOT EXISTS idx_ml_year ON marketplace_listings(year);
CREATE INDEX IF NOT EXISTS idx_ml_price ON marketplace_listings(price);
CREATE INDEX IF NOT EXISTS idx_ml_source ON marketplace_listings(source);
CREATE INDEX IF NOT EXISTS idx_ml_status ON marketplace_listings(status);
CREATE INDEX IF NOT EXISTS idx_ml_city ON marketplace_listings(city);
CREATE INDEX IF NOT EXISTS idx_ml_state ON marketplace_listings(state);

-- RLS: everyone can read active listings
ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read marketplace listings"
  ON marketplace_listings FOR SELECT
  USING (status = 'Available');

-- Service role can insert/update (for our API)
CREATE POLICY "Service can manage marketplace listings"
  ON marketplace_listings FOR ALL
  USING (true)
  WITH CHECK (true);
