-- Fix calculation history by reassigning to superadmin user
UPDATE app_3887314453_calculation_history 
SET created_by = (SELECT id FROM app_3887314453_users WHERE username = 'superadmin' LIMIT 1),
    created_by_username = 'superadmin'
WHERE created_by NOT IN (SELECT id FROM app_3887314453_users);
