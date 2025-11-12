BEGIN;

-- Create quotations table if not exists
CREATE TABLE IF NOT EXISTS app_3887314453_quotations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  calculation_id UUID NOT NULL,
  customer_name TEXT NOT NULL,
  customer_contact TEXT,
  valid_until DATE NOT NULL,
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS quotations_calculation_id_idx ON app_3887314453_quotations(calculation_id);
CREATE INDEX IF NOT EXISTS quotations_created_by_idx ON app_3887314453_quotations(created_by);
CREATE INDEX IF NOT EXISTS quotations_created_at_idx ON app_3887314453_quotations(created_at DESC);

ALTER TABLE app_3887314453_quotations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_read_all_quotations" ON app_3887314453_quotations
  FOR SELECT USING (true);

CREATE POLICY "allow_insert_quotations" ON app_3887314453_quotations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "allow_delete_quotations" ON app_3887314453_quotations
  FOR DELETE USING (true);

COMMIT;
