import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://lcubxwvkoqkhsvzstbay.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxjdWJ4d3Zrb3FraHN2enN0YmF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3OTI1NDYsImV4cCI6MjA3ODM2ODU0Nn0.emL4XB1PSUkNZVopMUlZjq1_oU6A5QD-t3ND_-Z3BOo'
);

async function checkData() {
  console.log('=== Checking HARBORLINK Incheon-Dagang L.LOCAL ===\n');
  
  // Check agent_sea_freights table with correct table name
  const { data: agentFreights, error } = await supabase
    .from('app_51335ed80f_agent_sea_freights')
    .select('*')
    .ilike('agent', '%HARBOR%')
    .ilike('pol', '%INCHEON%')
    .ilike('pod', '%DAGANG%');
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Agent Sea Freights found:', agentFreights?.length || 0);
  if (agentFreights && agentFreights.length > 0) {
    agentFreights.forEach((freight, index) => {
      console.log(`\nRecord ${index + 1}:`);
      console.log('  ID:', freight.id);
      console.log('  Agent:', freight.agent);
      console.log('  POL:', freight.pol);
      console.log('  POD:', freight.pod);
      console.log('  Rate:', freight.rate);
      console.log('  L.LOCAL (llocal):', freight.llocal);
      console.log('  Carrier:', freight.carrier);
      console.log('  Valid From:', freight.valid_from);
      console.log('  Valid To:', freight.valid_to);
    });
  } else {
    console.log('No records found!');
  }
  
  // Also check all HARBORLINK records
  console.log('\n\n=== All HARBORLINK Records ===\n');
  const { data: allHarbor, error: error2 } = await supabase
    .from('app_51335ed80f_agent_sea_freights')
    .select('*')
    .ilike('agent', '%HARBOR%');
  
  if (!error2 && allHarbor) {
    console.log('Total HARBORLINK records:', allHarbor.length);
    allHarbor.forEach((freight, index) => {
      console.log(`\nRecord ${index + 1}:`);
      console.log('  Agent:', freight.agent);
      console.log('  POL:', freight.pol);
      console.log('  POD:', freight.pod);
      console.log('  Rate:', freight.rate);
      console.log('  L.LOCAL:', freight.llocal);
    });
  }
}

checkData().catch(console.error);
