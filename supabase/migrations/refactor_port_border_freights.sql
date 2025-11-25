-- Migration: Refactor port_border_freights table to dynamic structure
-- This script transforms the hardcoded 4-column structure to a flexible agent-pod-rate structure

BEGIN;

-- Step 1: Create new table with dynamic structure
CREATE TABLE IF NOT EXISTS app_51335ed80f_port_border_freights_new (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  agent TEXT NOT NULL,
  pod TEXT NOT NULL, -- 중국항 이름 (청도, 천진, 연운, 다강 등)
  rate NUMERIC NOT NULL, -- POD → KASHGAR 운임
  valid_from DATE NOT NULL,
  valid_to DATE NOT NULL,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  
  -- Unique constraint: one active rate per agent-pod combination per time period
  CONSTRAINT unique_agent_pod_period UNIQUE (agent, pod, valid_from, valid_to)
);

-- Step 2: Create indexes for query optimization
CREATE INDEX IF NOT EXISTS idx_port_border_freights_new_agent ON app_51335ed80f_port_border_freights_new(agent);
CREATE INDEX IF NOT EXISTS idx_port_border_freights_new_pod ON app_51335ed80f_port_border_freights_new(pod);
CREATE INDEX IF NOT EXISTS idx_port_border_freights_new_validity ON app_51335ed80f_port_border_freights_new(valid_from, valid_to);

-- Step 3: Migrate existing data from old table to new table
-- Transform each row with 4 columns into 4 separate rows
INSERT INTO app_51335ed80f_port_border_freights_new (agent, pod, rate, valid_from, valid_to, version, created_at, updated_at)
SELECT 
  agent,
  '청도' as pod,
  qingdao as rate,
  valid_from,
  valid_to,
  version,
  created_at,
  updated_at
FROM app_51335ed80f_port_border_freights
WHERE qingdao IS NOT NULL AND qingdao > 0

UNION ALL

SELECT 
  agent,
  '천진' as pod,
  tianjin as rate,
  valid_from,
  valid_to,
  version,
  created_at,
  updated_at
FROM app_51335ed80f_port_border_freights
WHERE tianjin IS NOT NULL AND tianjin > 0

UNION ALL

SELECT 
  agent,
  '연운' as pod,
  lianyungang as rate,
  valid_from,
  valid_to,
  version,
  created_at,
  updated_at
FROM app_51335ed80f_port_border_freights
WHERE lianyungang IS NOT NULL AND lianyungang > 0

UNION ALL

SELECT 
  agent,
  '다강' as pod,
  dandong as rate,
  valid_from,
  valid_to,
  version,
  created_at,
  updated_at
FROM app_51335ed80f_port_border_freights
WHERE dandong IS NOT NULL AND dandong > 0;

-- Step 4: Drop old table
DROP TABLE IF EXISTS app_51335ed80f_port_border_freights;

-- Step 5: Rename new table to original name
ALTER TABLE app_51335ed80f_port_border_freights_new RENAME TO app_51335ed80f_port_border_freights;

-- Step 6: Setup Row Level Security (RLS)
ALTER TABLE app_51335ed80f_port_border_freights ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read
CREATE POLICY "allow_read_port_border_freights" 
  ON app_51335ed80f_port_border_freights 
  FOR SELECT 
  TO authenticated 
  USING (true);

-- Allow authenticated users to insert
CREATE POLICY "allow_insert_port_border_freights" 
  ON app_51335ed80f_port_border_freights 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

-- Allow authenticated users to update
CREATE POLICY "allow_update_port_border_freights" 
  ON app_51335ed80f_port_border_freights 
  FOR UPDATE 
  TO authenticated 
  USING (true);

-- Allow authenticated users to delete
CREATE POLICY "allow_delete_port_border_freights" 
  ON app_51335ed80f_port_border_freights 
  FOR DELETE 
  TO authenticated 
  USING (true);

COMMIT;

-- Verification queries (run these after migration to verify)
-- SELECT agent, pod, rate, valid_from, valid_to FROM app_51335ed80f_port_border_freights ORDER BY agent, pod;
-- SELECT agent, COUNT(*) as pod_count FROM app_51335ed80f_port_border_freights GROUP BY agent;