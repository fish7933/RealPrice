import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lcubxwvkoqkhsvzstbay.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxjdWJ4d3Zrb3FraHN2enN0YmF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3OTI1NDYsImV4cCI6MjA3ODM2ODU0Nn0.emL4XB1PSUkNZVopMUlZjq1_oU6A5QD-t3ND_-Z3BOo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  const { data, error } = await supabase
    .from('app_51335ed80f_agent_sea_freights')
    .select('*')
    .limit(5);
    
  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Sample data from database:');
    console.log(JSON.stringify(data, null, 2));
    
    // Check if llocal field exists
    if (data && data.length > 0) {
      console.log('\nColumn names:');
      console.log(Object.keys(data[0]));
    }
  }
}

checkData();
