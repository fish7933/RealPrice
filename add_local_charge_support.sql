-- Add local_charge and other_costs columns to calculation_history table
ALTER TABLE app_3887314453_calculation_history 
ADD COLUMN IF NOT EXISTS local_charge DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS other_costs JSONB DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN app_3887314453_calculation_history.local_charge IS 'L.LOCAL charge amount';
COMMENT ON COLUMN app_3887314453_calculation_history.other_costs IS 'Array of additional costs with name, amount, and description';