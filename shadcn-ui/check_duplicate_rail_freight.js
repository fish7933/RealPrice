import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lcubxwvkoqkhsvzstbay.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxjdWJ4d3Zrb3FraHN2enN0YmF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3OTI1NDYsImV4cCI6MjA3ODM2ODU0Nn0.emL4XB1PSUkNZVopMUlZjq1_oU6A5QD-t3ND_-Z3BOo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDuplicates() {
  console.log('=== 철도운임 중복 데이터 확인 ===\n');

  const { data: railFreights, error } = await supabase
    .from('app_51335ed80f_port_border_freights')
    .select('*')
    .order('agent', { ascending: true })
    .order('pod', { ascending: true });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`총 ${railFreights.length}개의 철도운임 데이터 발견\n`);

  // Group by agent + pod to find duplicates
  const groups = {};
  railFreights.forEach(freight => {
    const key = `${freight.agent}_${freight.pod}`;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(freight);
  });

  // Find duplicates
  let hasDuplicates = false;
  Object.keys(groups).forEach(key => {
    const [agent, pod] = key.split('_');
    const items = groups[key];
    
    if (items.length > 1) {
      hasDuplicates = true;
      console.log(`🔴 중복 발견: ${agent} - ${pod} (${items.length}개)`);
      items.forEach((item, index) => {
        console.log(`  [${index + 1}] ID: ${item.id}`);
        console.log(`      운임: $${item.rate}`);
        console.log(`      유효기간: ${item.valid_from} ~ ${item.valid_to}`);
        console.log(`      버전: ${item.version}`);
        console.log(`      생성일: ${item.created_at}`);
        console.log('');
      });
    }
  });

  if (!hasDuplicates) {
    console.log('✅ 중복된 데이터가 없습니다.');
  }

  // Show all unique combinations
  console.log('\n=== 현재 등록된 철도운임 조합 ===');
  Object.keys(groups).forEach(key => {
    const [agent, pod] = key.split('_');
    const items = groups[key];
    console.log(`${agent} - ${pod}: ${items.length}개`);
  });
}

checkDuplicates().catch(console.error);
