import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lcubxwvkoqkhsvzstbay.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxjdWJ4d3Zrb3FraHN2enN0YmF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3OTI1NDYsImV4cCI6MjA3ODM2ODU0Nn0.emL4XB1PSUkNZVopMUlZjq1_oU6A5QD-t3ND_-Z3BOo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDataFlow() {
  console.log('=== Testing Data Flow ===\n');
  
  // 1. Fetch from database
  const { data: rawData, error } = await supabase
    .from('app_51335ed80f_agent_sea_freights')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('1. Raw data from database:');
  rawData.slice(0, 3).forEach(d => {
    console.log(`   - ${d.agent} | ${d.pol} → ${d.pod} | Rate: $${d.rate} | L.LOCAL: ${d.llocal ? '$' + d.llocal : 'null'}`);
  });
  
  // 2. Simulate the mapping in freightLoaders.ts
  const mappedData = rawData.map(d => ({
    id: d.id,
    agent: d.agent,
    pol: d.pol,
    pod: d.pod,
    rate: d.rate,
    llocal: d.llocal,  // This is line 221 in freightLoaders.ts
    carrier: d.carrier,
    note: d.note,
    version: d.version,
    validFrom: d.valid_from,
    validTo: d.valid_to,
    createdAt: d.created_at,
    updatedAt: d.updated_at,
  }));
  
  console.log('\n2. After mapping (simulating freightLoaders.ts):');
  mappedData.slice(0, 3).forEach(d => {
    console.log(`   - ${d.agent} | ${d.pol} → ${d.pod} | Rate: $${d.rate} | L.LOCAL: ${d.llocal ? '$' + d.llocal : 'null'}`);
  });
  
  // 3. Check what would be displayed in the table
  console.log('\n3. What should display in the table (lines 522-528 of AgentSeaFreightTable.tsx):');
  mappedData.slice(0, 3).forEach(freight => {
    const displayValue = freight.llocal ? 
      `<span className="text-red-600 font-medium">-$${freight.llocal}</span>` : 
      `<span className="text-gray-400">-</span>`;
    console.log(`   - ${freight.agent}: ${displayValue.includes('gray-400') ? 'Shows "-"' : `Shows "-$${freight.llocal}"`}`);
  });
  
  console.log('\n=== Summary ===');
  const withLlocal = mappedData.filter(d => d.llocal !== null && d.llocal !== undefined);
  console.log(`Total records: ${mappedData.length}`);
  console.log(`Records with L.LOCAL: ${withLlocal.length}`);
  console.log(`Records without L.LOCAL: ${mappedData.length - withLlocal.length}`);
  
  if (withLlocal.length > 0) {
    console.log('\n✅ DATA IS CORRECT! If you don\'t see L.LOCAL values in the UI:');
    console.log('   1. Hard refresh the page (Ctrl+Shift+R or Cmd+Shift+R)');
    console.log('   2. Clear browser cache');
    console.log('   3. Check browser console for any errors');
  }
}

testDataFlow();
