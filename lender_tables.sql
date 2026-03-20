-- ═══ CAR CAPITOL - LENDER TABLES UPDATE ═══
-- Run this in Supabase SQL Editor

-- Add unique constraint to rate_sheets for upsert
ALTER TABLE rate_sheets ADD COLUMN IF NOT EXISTS max_term INTEGER DEFAULT 84;
ALTER TABLE rate_sheets ADD COLUMN IF NOT EXISTS max_ltv INTEGER DEFAULT 120;
ALTER TABLE rate_sheets ADD COLUMN IF NOT EXISTS max_reserve NUMERIC(5,2) DEFAULT 2.00;
ALTER TABLE rate_sheets ADD COLUMN IF NOT EXISTS lender_name TEXT;

-- Create unique constraint for upsert (lender_id + tier)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'rate_sheets_lender_tier_unique') THEN
    ALTER TABLE rate_sheets ADD CONSTRAINT rate_sheets_lender_tier_unique UNIQUE (lender_id, tier);
  END IF;
END $$;

-- ═══ PROGRAM RULES TABLE ═══
CREATE TABLE IF NOT EXISTS program_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  program_name TEXT DEFAULT 'Standard Auto',
  max_ltv INTEGER DEFAULT 130,
  max_pti NUMERIC(5,2) DEFAULT 20.00,
  max_dti NUMERIC(5,2) DEFAULT 50.00,
  min_credit_score INTEGER DEFAULT 500,
  max_term_new INTEGER DEFAULT 84,
  max_term_used INTEGER DEFAULT 72,
  max_advance NUMERIC(12,2) DEFAULT 50000.00,
  max_vehicle_age INTEGER DEFAULT 12,
  max_vehicle_miles INTEGER DEFAULT 150000,
  min_down_payment_pct NUMERIC(5,2) DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_program_rules_lender ON program_rules(lender_id);

-- ═══ LENDER-DEALER RELATIONSHIPS ═══
CREATE TABLE IF NOT EXISTS lender_dealer_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  dealer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending', 'terminated')),
  max_reserve_override NUMERIC(5,2),
  volume_cap_monthly INTEGER,
  flat_fee NUMERIC(8,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(lender_id, dealer_id)
);

CREATE INDEX IF NOT EXISTS idx_ldr_lender ON lender_dealer_relationships(lender_id);
CREATE INDEX IF NOT EXISTS idx_ldr_dealer ON lender_dealer_relationships(dealer_id);

-- ═══ DEAL STIPULATIONS (enhanced) ═══
ALTER TABLE stipulations ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'document';
ALTER TABLE stipulations ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ;
ALTER TABLE stipulations ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE stipulations ADD COLUMN IF NOT EXISTS completed_by UUID;

-- ═══ RLS POLICIES ═══
ALTER TABLE program_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE lender_dealer_relationships ENABLE ROW LEVEL SECURITY;

-- Lenders can manage their own program rules
CREATE POLICY IF NOT EXISTS "Lenders manage own rules" ON program_rules
  FOR ALL USING (auth.uid() = lender_id);

-- Lenders can manage their dealer relationships
CREATE POLICY IF NOT EXISTS "Lenders manage relationships" ON lender_dealer_relationships
  FOR ALL USING (auth.uid() = lender_id);

-- Dealers can view their lender relationships
CREATE POLICY IF NOT EXISTS "Dealers view relationships" ON lender_dealer_relationships
  FOR SELECT USING (auth.uid() = dealer_id);
