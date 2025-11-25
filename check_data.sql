-- Check combined freights for Qingdao to OSH
SELECT agent, pod, destination_id, rate, valid_from, valid_to 
FROM app_c2f75d3bef_combined_freights 
WHERE pod = '청도';

-- Check port-border freights for Qingdao
SELECT agent, pod, rate, valid_from, valid_to 
FROM app_c2f75d3bef_port_border_freights 
WHERE pod = '청도';

-- Check destinations
SELECT id, name FROM app_c2f75d3bef_destinations WHERE name LIKE '%OSH%';
