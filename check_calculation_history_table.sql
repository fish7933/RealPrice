SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'app_3887314453_calculation_history' 
ORDER BY ordinal_position;

SELECT * FROM app_3887314453_calculation_history LIMIT 5;
