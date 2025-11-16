import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lcubxwvkoqkhsvzstbay.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxjdWJ4d3Zrb3FraHN2enN0YmF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3OTI1NDYsImV4cCI6MjA3ODM2ODU0Nn0.emL4XB1PSUkNZVopMUlZjq1_oU6A5QD-t3ND_-Z3BOo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  // Check all records
  const { data: allData, error: allError } = await supabase
    .from('app_51335ed80f_agent_sea_freights')
    .select('id, agent, pol, pod, rate, llocal, created_at')
    .order('created_at', { ascending: false });
    
  if (allError) {
    console.error('Error fetching all records:', allError);
  } else {
    console.log('All agent sea freight records:');
    console.log(JSON.stringify(allData, null, 2));
    
    const withLlocal = allData.filter(d => d.llocal !== null && d.llocal !== undefined);
    console.log(`\nRecords with L.LOCAL: ${withLlocal.length} out of ${allData.length}`);
    
    if (withLlocal.length > 0) {
      console.log('\nRecords with L.LOCAL values:');
      console.log(JSON.stringify(withLlocal, null, 2));
    }
  }
}

checkData();
