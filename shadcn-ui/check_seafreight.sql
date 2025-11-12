-- Check sea freight data for 부산-청도 route
SELECT id, pol, pod, rate, carrier, note, valid_from, valid_to, version, created_at
FROM app_51335ed80f_sea_freights
WHERE pol = '부산' AND pod = '청도'
ORDER BY created_at DESC;
