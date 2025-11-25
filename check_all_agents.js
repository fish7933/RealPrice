import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://lcubxwvkoqkhsvzstbay.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxjdWJ4d3Zrb3FraHN2enN0YmF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3OTI1NDYsImV4cCI6MjA3ODM2ODU0Nn0.emL4XB1PSUkNZVopMUlZjq1_oU6A5QD-t3ND_-Z3BOo'
);

async function checkData() {
  console.log('=== Checking All Agent Sea Freights ===\n');
  
  const { data: allFreights, error } = await supabase
    .from('app_51335ed80f_agent_sea_freights')
    .select('*')
    .order('agent', { ascending: true });
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Total Agent Sea Freights:', allFreights?.length || 0);
  
  if (allFreights && allFreights.length > 0) {
    // Group by agent
    const byAgent = {};
    allFreights.forEach(freight => {
      if (!byAgent[freight.agent]) {
        byAgent[freight.agent] = [];
      }
      byAgent[freight.agent].push(freight);
    });
    
    console.log('\nAgents found:', Object.keys(byAgent).join(', '));
    
    Object.keys(byAgent).forEach(agent => {
      console.log(`\n=== ${agent} ===`);
      byAgent[agent].forEach((freight, index) => {
        console.log(`  Route ${index + 1}: ${freight.pol} → ${freight.pod}`);
        console.log(`    Rate: ${freight.rate}`);
        console.log(`    L.LOCAL: ${freight.llocal || 0}`);
        console.log(`    Carrier: ${freight.carrier || 'N/A'}`);
      });
    });
  }
}

checkData().catch(console.error);
