import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lcubxwvkoqkhsvzstbay.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxjdWJ4d3Zrb3FraHN2enN0YmF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3OTI1NDYsImV4cCI6MjA3ODM2ODU0Nn0.emL4XB1PSUkNZVopMUlZjq1_oU6A5QD-t3ND_-Z3BOo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFreightData() {
  console.log('=== 부산 → 청도 → OSH 경로 운임 데이터 확인 ===\n');

  // Check ports
  const { data: ports } = await supabase
    .from('app_51335ed80f_ports')
    .select('*')
    .in('name', ['부산', '청도']);
  console.log('1. 포트 데이터:', ports);

  // Check destinations
  const { data: destinations } = await supabase
    .from('app_51335ed80f_destinations')
    .select('*')
    .eq('name', 'OSH');
  console.log('\n2. 목적지 데이터:', destinations);

  // Check sea freights
  const { data: seaFreights } = await supabase
    .from('app_51335ed80f_sea_freights')
    .select('*')
    .eq('pol', '부산')
    .eq('pod', '청도');
  console.log('\n3. 해상운임 (부산→청도):', seaFreights);

  // Check port border freights (rail)
  const { data: portBorderFreights } = await supabase
    .from('app_51335ed80f_port_border_freights')
    .select('*')
    .eq('pod', '청도');
  console.log('\n4. 철도운임 (청도→국경):', portBorderFreights);

  // Check border destination freights (truck)
  if (destinations && destinations.length > 0) {
    const { data: borderDestFreights } = await supabase
      .from('app_51335ed80f_border_destination_freights')
      .select('*')
      .eq('destination_id', destinations[0].id);
    console.log('\n5. 트럭운임 (국경→OSH):', borderDestFreights);
  }

  // Check rail agents
  const { data: railAgents } = await supabase
    .from('app_51335ed80f_rail_agents')
    .select('*');
  console.log('\n6. 철도 대리점:', railAgents);

  // Check truck agents
  const { data: truckAgents } = await supabase
    .from('app_51335ed80f_truck_agents')
    .select('*');
  console.log('\n7. 트럭 대리점:', truckAgents);

  // Current date check
  const today = new Date().toISOString().split('T')[0];
  console.log('\n8. 현재 날짜:', today);
  console.log('\n=== 유효기간 확인 필요 ===');
  console.log('모든 운임 데이터의 valid_from과 valid_to가 현재 날짜를 포함하는지 확인하세요.');
}

checkFreightData().catch(console.error);
