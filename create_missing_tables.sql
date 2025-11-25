BEGIN;

-- Create calculation_history table
CREATE TABLE IF NOT EXISTS app_3887314453_calculation_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  result JSONB NOT NULL,
  destination_name TEXT NOT NULL,
  created_by UUID NOT NULL,
  created_by_username TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS calculation_history_created_by_idx ON app_3887314453_calculation_history(created_by);
CREATE INDEX IF NOT EXISTS calculation_history_created_at_idx ON app_3887314453_calculation_history(created_at DESC);

-- Setup Row Level Security (RLS)
ALTER TABLE app_3887314453_calculation_history ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read all calculation history
CREATE POLICY "allow_read_all_calculation_history" ON app_3887314453_calculation_history
  FOR SELECT
  USING (true);

-- Allow users to insert their own calculation history
CREATE POLICY "allow_insert_own_calculation_history" ON app_3887314453_calculation_history
  FOR INSERT
  WITH CHECK (true);

-- Allow users to delete their own calculation history
CREATE POLICY "allow_delete_own_calculation_history" ON app_3887314453_calculation_history
  FOR DELETE
  USING (true);

COMMIT;
