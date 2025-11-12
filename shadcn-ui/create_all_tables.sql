BEGIN;

-- 1. Shipping Lines (선사)
CREATE TABLE IF NOT EXISTS app_3887314453_shipping_lines (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Ports (항구)
CREATE TABLE IF NOT EXISTS app_3887314453_ports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('POL', 'POD')),
  country TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 3. Rail Agents (철도 운송사)
CREATE TABLE IF NOT EXISTS app_3887314453_rail_agents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 4. Truck Agents (트럭 운송사)
CREATE TABLE IF NOT EXISTS app_3887314453_truck_agents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 5. Destinations (목적지)
CREATE TABLE IF NOT EXISTS app_3887314453_destinations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 6. Sea Freights (해상 운임)
CREATE TABLE IF NOT EXISTS app_3887314453_sea_freights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pol TEXT NOT NULL,
  pod TEXT NOT NULL,
  rate NUMERIC NOT NULL,
  carrier TEXT,
  note TEXT,
  version INTEGER DEFAULT 1,
  valid_from DATE NOT NULL,
  valid_to DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 7. Agent Sea Freights (운송사별 해상 운임)
CREATE TABLE IF NOT EXISTS app_3887314453_agent_sea_freights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent TEXT NOT NULL,
  pol TEXT NOT NULL,
  pod TEXT NOT NULL,
  rate NUMERIC NOT NULL,
  carrier TEXT,
  note TEXT,
  version INTEGER DEFAULT 1,
  valid_from DATE NOT NULL,
  valid_to DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 8. DTHC
CREATE TABLE IF NOT EXISTS app_3887314453_dthc (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent TEXT NOT NULL,
  pol TEXT NOT NULL,
  pod TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  description TEXT,
  version INTEGER DEFAULT 1,
  valid_from DATE NOT NULL,
  valid_to DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 9. DP Costs (DP 비용)
CREATE TABLE IF NOT EXISTS app_3887314453_dp_costs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  port TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  description TEXT,
  version INTEGER DEFAULT 1,
  valid_from DATE NOT NULL,
  valid_to DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 10. Combined Freights (통합 운임)
CREATE TABLE IF NOT EXISTS app_3887314453_combined_freights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent TEXT NOT NULL,
  pod TEXT NOT NULL,
  destination_id UUID NOT NULL,
  rate NUMERIC NOT NULL,
  description TEXT,
  version INTEGER DEFAULT 1,
  valid_from DATE NOT NULL,
  valid_to DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 11. Port Border Freights (항구-국경 운임)
CREATE TABLE IF NOT EXISTS app_3887314453_port_border_freights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent TEXT NOT NULL,
  pod TEXT NOT NULL,
  rate NUMERIC NOT NULL,
  version INTEGER DEFAULT 1,
  valid_from DATE NOT NULL,
  valid_to DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 12. Border Destination Freights (국경-목적지 운임)
CREATE TABLE IF NOT EXISTS app_3887314453_border_destination_freights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent TEXT NOT NULL,
  destination_id UUID NOT NULL,
  rate NUMERIC NOT NULL,
  version INTEGER DEFAULT 1,
  valid_from DATE NOT NULL,
  valid_to DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 13. Weight Surcharge Rules (중량 할증 규칙)
CREATE TABLE IF NOT EXISTS app_3887314453_weight_surcharge_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent TEXT NOT NULL,
  min_weight NUMERIC NOT NULL,
  max_weight NUMERIC NOT NULL,
  surcharge NUMERIC NOT NULL,
  version INTEGER DEFAULT 1,
  valid_from DATE NOT NULL,
  valid_to DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 14. Audit Logs (변경 이력)
CREATE TABLE IF NOT EXISTS app_3887314453_audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete')),
  changes JSONB,
  entity_snapshot JSONB NOT NULL,
  changed_by UUID NOT NULL,
  changed_by_username TEXT NOT NULL,
  changed_by_name TEXT NOT NULL,
  version INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS sea_freights_pol_pod_idx ON app_3887314453_sea_freights(pol, pod);
CREATE INDEX IF NOT EXISTS sea_freights_valid_idx ON app_3887314453_sea_freights(valid_from, valid_to);
CREATE INDEX IF NOT EXISTS agent_sea_freights_agent_pol_pod_idx ON app_3887314453_agent_sea_freights(agent, pol, pod);
CREATE INDEX IF NOT EXISTS dthc_agent_pol_pod_idx ON app_3887314453_dthc(agent, pol, pod);
CREATE INDEX IF NOT EXISTS combined_freights_agent_pod_dest_idx ON app_3887314453_combined_freights(agent, pod, destination_id);
CREATE INDEX IF NOT EXISTS port_border_freights_agent_pod_idx ON app_3887314453_port_border_freights(agent, pod);
CREATE INDEX IF NOT EXISTS border_dest_freights_agent_dest_idx ON app_3887314453_border_destination_freights(agent, destination_id);
CREATE INDEX IF NOT EXISTS weight_surcharge_agent_idx ON app_3887314453_weight_surcharge_rules(agent);
CREATE INDEX IF NOT EXISTS audit_logs_entity_idx ON app_3887314453_audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON app_3887314453_audit_logs(created_at DESC);

-- Setup Row Level Security (RLS) for all tables
ALTER TABLE app_3887314453_shipping_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_3887314453_ports ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_3887314453_rail_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_3887314453_truck_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_3887314453_destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_3887314453_sea_freights ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_3887314453_agent_sea_freights ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_3887314453_dthc ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_3887314453_dp_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_3887314453_combined_freights ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_3887314453_port_border_freights ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_3887314453_border_destination_freights ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_3887314453_weight_surcharge_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_3887314453_audit_logs ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations (since we handle auth in the app)
DO $$ 
DECLARE 
  tbl TEXT;
BEGIN
  FOR tbl IN 
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_name LIKE 'app_3887314453_%'
      AND table_name NOT IN ('app_3887314453_users', 'app_3887314453_calculation_history', 'app_3887314453_quotations', 'app_3887314453_system_settings', 'app_3887314453_border_cities')
  LOOP
    EXECUTE format('CREATE POLICY IF NOT EXISTS "allow_all_%s" ON %I FOR ALL USING (true) WITH CHECK (true)', tbl, tbl);
  END LOOP;
END $$;

COMMIT;
