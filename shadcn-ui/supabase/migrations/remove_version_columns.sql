-- Remove version columns from all freight tables
-- This migration removes the versioning system from the freight management application

BEGIN;

-- Remove version column from sea_freights table
ALTER TABLE app_51335ed80f_sea_freights 
DROP COLUMN IF EXISTS version;

-- Remove version column from agent_sea_freights table
ALTER TABLE app_51335ed80f_agent_sea_freights 
DROP COLUMN IF EXISTS version;

-- Remove version column from dthc table
ALTER TABLE app_51335ed80f_dthc 
DROP COLUMN IF EXISTS version;

-- Remove version column from dp_costs table
ALTER TABLE app_51335ed80f_dp_costs 
DROP COLUMN IF EXISTS version;

-- Remove version column from combined_freights table
ALTER TABLE app_51335ed80f_combined_freights 
DROP COLUMN IF EXISTS version;

-- Remove version column from port_border_freights table
ALTER TABLE app_51335ed80f_port_border_freights 
DROP COLUMN IF EXISTS version;

-- Remove version column from border_destination_freights table
ALTER TABLE app_51335ed80f_border_destination_freights 
DROP COLUMN IF EXISTS version;

-- Remove version column from weight_surcharge_rules table
ALTER TABLE app_51335ed80f_weight_surcharge_rules 
DROP COLUMN IF EXISTS version;

-- Remove version column from audit_logs table
ALTER TABLE app_51335ed80f_audit_logs 
DROP COLUMN IF EXISTS version;

COMMIT;