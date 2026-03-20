-- ═══════════════════════════════════════════
-- Car Capitol - Audit Log + RLS Policies
-- Run in Supabase SQL Editor AFTER lender_tables.sql
-- ═══════════════════════════════════════════

-- ═══ DEAL_EVENTS (audit log) ═══
-- Every status change, decision, funding, note writes an event
CREATE TABLE IF NOT EXISTS deal_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES profiles(id),
  actor_role TEXT, -- consumer, dealer, lender, system
  event_type TEXT NOT NULL, -- status_change, decision, note, funding, chargeback, stip_update, doc_upload
  event_data JSONB DEFAULT '{}',
  old_value TEXT,
  new_value TEXT,
  notes TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deal_events_deal ON deal_events(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_events_actor ON deal_events(actor_id);
CREATE INDEX IF NOT EXISTS idx_deal_events_type ON deal_events(event_type);
CREATE INDEX IF NOT EXISTS idx_deal_events_created ON deal_events(created_at DESC);

-- ═══ SAVED_VEHICLES ═══
CREATE TABLE IF NOT EXISTS saved_vehicles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  listing_id TEXT NOT NULL,
  source TEXT DEFAULT 'marketcheck', -- marketcheck, facebook, manual
  vehicle_data JSONB DEFAULT '{}', -- snapshot of listing at save time
  price_at_save NUMERIC(12,2),
  alert_price_drop BOOLEAN DEFAULT TRUE,
  alert_new_similar BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, listing_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_vehicles_user ON saved_vehicles(user_id);

-- ═══ SAVED_SEARCHES ═══
CREATE TABLE IF NOT EXISTS saved_searches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  search_name TEXT,
  filters JSONB NOT NULL DEFAULT '{}', -- {make, model, year_min, price_max, etc.}
  alert_new_matches BOOLEAN DEFAULT TRUE,
  alert_frequency TEXT DEFAULT 'daily', -- daily, weekly, instant
  last_checked_at TIMESTAMPTZ,
  match_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_saved_searches_user ON saved_searches(user_id);

-- ═══ RLS POLICIES ═══

-- deal_events: anyone involved can read, only actors can write
ALTER TABLE deal_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read events for their deals" ON deal_events
  FOR SELECT USING (
    deal_id IN (
      SELECT id FROM deals WHERE consumer_id = auth.uid()
      UNION
      SELECT id FROM deals WHERE dealer_id = auth.uid()
      UNION
      SELECT deal_id FROM lender_apps WHERE lender_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can insert events" ON deal_events
  FOR INSERT WITH CHECK (auth.uid() = actor_id);

-- saved_vehicles: users see only their own
ALTER TABLE saved_vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own saved vehicles" ON saved_vehicles
  FOR ALL USING (auth.uid() = user_id);

-- saved_searches: users see only their own
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own saved searches" ON saved_searches
  FOR ALL USING (auth.uid() = user_id);

-- ═══ ENHANCED DEALS RLS ═══
-- (Only apply if not already set)
-- Consumers see their deals
-- Dealers see their dealership's deals
-- Lenders see deals submitted to them

-- profiles.role enforcement
-- Already has RLS from initial setup, adding role-specific if missing:

-- Garage vehicles: consumer only
ALTER TABLE garage_vehicles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own garage" ON garage_vehicles;
CREATE POLICY "Users manage own garage" ON garage_vehicles
  FOR ALL USING (auth.uid() = user_id);

-- Rate sheets: lender manages own
ALTER TABLE rate_sheets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Lenders manage own rates" ON rate_sheets;
CREATE POLICY "Lenders manage own rates" ON rate_sheets
  FOR ALL USING (auth.uid() = lender_id);

-- Program rules: lender manages own
ALTER TABLE program_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Lenders manage own rules" ON program_rules;
CREATE POLICY "Lenders manage own rules" ON program_rules
  FOR ALL USING (auth.uid() = lender_id);

-- ═══ HELPER FUNCTION: Log deal event ═══
CREATE OR REPLACE FUNCTION log_deal_event(
  p_deal_id UUID,
  p_actor_id UUID,
  p_actor_role TEXT,
  p_event_type TEXT,
  p_old_value TEXT DEFAULT NULL,
  p_new_value TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_event_data JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO deal_events (deal_id, actor_id, actor_role, event_type, old_value, new_value, notes, event_data)
  VALUES (p_deal_id, p_actor_id, p_actor_role, p_event_type, p_old_value, p_new_value, p_notes, p_event_data)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
