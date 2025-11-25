SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'app_51335ed80f_%'
ORDER BY table_name;
