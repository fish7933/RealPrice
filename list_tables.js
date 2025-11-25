import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lcubxwvkoqkhsvzstbay.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxjdWJ4d3Zrb3FraHN2enN0YmF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3OTI1NDYsImV4cCI6MjA3ODM2ODU0Nn0.emL4XB1PSUkNZVopMUlZjq1_oU6A5QD-t3ND_-Z3BOo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function listTables() {
  console.log('🔍 데이터베이스 테이블 목록 조회 중...\n');
  
  // Try common table patterns
  const tablesToCheck = [
    'app_51335ed80f_port_border_freights',
    'app_c2f75d3bef_port_border_freights',
    'app_51335ed80f_rail_freights',
    'app_c2f75d3bef_rail_freights',
    'port_border_freights',
    'rail_freights',
    'freights'
  ];
  
  console.log('테이블 확인 중...\n');
  
  for (const table of tablesToCheck) {
    const { data, error } = await supabase.from(table).select('*').limit(1);
    if (!error) {
      console.log(`✅ 테이블 발견: ${table}`);
      const { count } = await supabase.from(table).select('*', { count: 'exact', head: true });
      console.log(`   레코드 수: ${count}\n`);
    }
  }
  
  console.log('완료!');
}

listTables();