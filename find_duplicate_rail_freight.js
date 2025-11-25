import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lcubxwvkoqkhsvzstbay.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxjdWJ4d3Zrb3FraHN2enN0YmF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3OTI1NDYsImV4cCI6MjA3ODM2ODU0Nn0.emL4XB1PSUkNZVopMUlZjq1_oU6A5QD-t3ND_-Z3BOo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function findAndDisplayDuplicates() {
  console.log('🔍 중복 데이터 검색 중...\n');

  // Fetch all port border freights with correct table name
  const { data: freights, error } = await supabase
    .from('app_51335ed80f_port_border_freights')
    .select('*')
    .order('agent', { ascending: true })
    .order('pod', { ascending: true })
    .order('valid_from', { ascending: true });

  if (error) {
    console.error('❌ 데이터 조회 실패:', error);
    return;
  }

  console.log(`📊 총 ${freights.length}개의 철도운임 데이터 발견\n`);

  // Group by agent + pod + validity period
  const groups = {};
  
  freights.forEach(freight => {
    const key = `${freight.agent}|${freight.pod}|${freight.valid_from}|${freight.valid_to}`;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(freight);
  });

  // Find duplicates
  const duplicates = Object.entries(groups).filter(([key, items]) => items.length > 1);

  if (duplicates.length === 0) {
    console.log('✅ 중복 데이터가 없습니다!');
    return;
  }

  console.log(`⚠️  ${duplicates.length}개의 중복 그룹 발견!\n`);
  console.log('=' .repeat(80));

  duplicates.forEach(([key, items], index) => {
    const [agent, pod, validFrom, validTo] = key.split('|');
    console.log(`\n중복 그룹 #${index + 1}:`);
    console.log(`  대리점: ${agent}`);
    console.log(`  POD: ${pod}`);
    console.log(`  유효기간: ${validFrom} ~ ${validTo}`);
    console.log(`  중복 개수: ${items.length}개\n`);
    
    items.forEach((item, i) => {
      console.log(`  [${i + 1}] ID: ${item.id}`);
      console.log(`      운임: $${item.rate}`);
      console.log(`      버전: v${item.version || 1}`);
      console.log(`      생성일: ${item.created_at}`);
      console.log(`      수정일: ${item.updated_at || 'N/A'}`);
    });
    console.log('  ' + '-'.repeat(70));
  });

  console.log('\n' + '='.repeat(80));
  console.log(`\n📋 요약:`);
  console.log(`   - 총 중복 그룹: ${duplicates.length}개`);
  console.log(`   - 총 중복 레코드: ${duplicates.reduce((sum, [, items]) => sum + items.length, 0)}개`);
  console.log(`   - 삭제 필요: ${duplicates.reduce((sum, [, items]) => sum + items.length - 1, 0)}개\n`);
}

findAndDisplayDuplicates();