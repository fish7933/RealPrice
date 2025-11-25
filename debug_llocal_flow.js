import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://lcubxwvkoqkhsvzstbay.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxjdWJ4d3Zrb3FraHN2enN0YmF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3OTI1NDYsImV4cCI6MjA3ODM2ODU0Nn0.emL4XB1PSUkNZVopMUlZjq1_oU6A5QD-t3ND_-Z3BOo'
);

async function debugFlow() {
  console.log('=== L.LOCAL Data Flow Debug ===\n');
  
  // Step 1: Check database
  console.log('Step 1: Database Check');
  const { data: dbData, error } = await supabase
    .from('app_51335ed80f_agent_sea_freights')
    .select('*')
    .eq('agent', '하버링크')
    .eq('pol', '인천')
    .eq('pod', '다강');
  
  if (error) {
    console.error('Database Error:', error);
    return;
  }
  
  console.log('Database Record:', {
    agent: dbData[0]?.agent,
    pol: dbData[0]?.pol,
    pod: dbData[0]?.pod,
    rate: dbData[0]?.rate,
    llocal: dbData[0]?.llocal,
    carrier: dbData[0]?.carrier
  });
  
  // Step 2: Simulate loader mapping
  console.log('\nStep 2: Loader Mapping Simulation');
  const mappedData = {
    id: dbData[0]?.id,
    agent: dbData[0]?.agent,
    pol: dbData[0]?.pol,
    pod: dbData[0]?.pod,
    rate: dbData[0]?.rate,
    llocal: dbData[0]?.llocal,  // This is line 221 in freightLoaders.ts
    carrier: dbData[0]?.carrier,
    note: dbData[0]?.note,
    version: dbData[0]?.version,
    validFrom: dbData[0]?.valid_from,
    validTo: dbData[0]?.valid_to,
  };
  console.log('Mapped Data:', mappedData);
  console.log('llocal value after mapping:', mappedData.llocal);
  console.log('llocal type:', typeof mappedData.llocal);
  
  // Step 3: Check if llocal is null, undefined, or 0
  console.log('\nStep 3: Value Checks');
  console.log('llocal === null:', mappedData.llocal === null);
  console.log('llocal === undefined:', mappedData.llocal === undefined);
  console.log('llocal === 0:', mappedData.llocal === 0);
  console.log('llocal || 0 result:', mappedData.llocal || 0);
  
  // Step 4: Simulate calculation logic
  console.log('\nStep 4: Calculation Logic Simulation');
  const agentSeaResult = {
    value: mappedData.rate,
    expired: false,
    carrier: mappedData.carrier,
    llocal: mappedData.llocal
  };
  console.log('agentSeaResult:', agentSeaResult);
  
  let seaFreightLLocal = agentSeaResult.llocal || 0;
  console.log('seaFreightLLocal (line 195):', seaFreightLLocal);
  
  // Step 5: Check breakdown
  console.log('\nStep 5: Breakdown Object');
  const breakdown = {
    agent: '하버링크',
    llocal: seaFreightLLocal,
  };
  console.log('breakdown.llocal:', breakdown.llocal);
  
  console.log('\n=== Summary ===');
  console.log('Database llocal:', dbData[0]?.llocal);
  console.log('Final breakdown llocal:', breakdown.llocal);
  console.log('Are they equal?', dbData[0]?.llocal === breakdown.llocal);
}

debugFlow().catch(console.error);
