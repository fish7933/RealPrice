-- Add local_charge column to sea_freights table
BEGIN;

ALTER TABLE app_3887314453_sea_freights 
ADD COLUMN IF NOT EXISTS local_charge NUMERIC DEFAULT 0;

COMMIT;
