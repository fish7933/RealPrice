import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': '*',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] Migration request started`);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const results = {
      users: { success: 0, failed: 0, errors: [] },
      railAgents: { success: 0, failed: 0, errors: [] },
      truckAgents: { success: 0, failed: 0, errors: [] },
      destinations: { success: 0, failed: 0, errors: [] },
      seaFreights: { success: 0, failed: 0, errors: [] },
      agentSeaFreights: { success: 0, failed: 0, errors: [] },
      dthc: { success: 0, failed: 0, errors: [] },
      dpCosts: { success: 0, failed: 0, errors: [] },
      combinedFreights: { success: 0, failed: 0, errors: [] },
      portBorderFreights: { success: 0, failed: 0, errors: [] },
      borderDestinationFreights: { success: 0, failed: 0, errors: [] },
      weightSurchargeRules: { success: 0, failed: 0, errors: [] },
    };

    const getDefaultValidity = () => {
      const today = new Date();
      const oneMonthLater = new Date(today);
      oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
      return {
        validFrom: today.toISOString().split('T')[0],
        validTo: oneMonthLater.toISOString().split('T')[0],
      };
    };

    const validity = getDefaultValidity();

    // Step 1: Create users
    console.log(`[${requestId}] Step 1: Creating users...`);
    const users = [
      { username: 'superadmin', password: 'super123', name: '최고관리자', position: '대표이사', role: 'superadmin' },
      { username: 'admin', password: 'admin123', name: '관리자', position: '부장', role: 'admin' },
      { username: 'viewer', password: 'viewer123', name: '일반사용자', position: '사원', role: 'viewer' },
    ];

    let superadminId: string | null = null;
    let adminId: string | null = null;

    for (const user of users) {
      try {
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: `${user.username}@freight.local`,
          password: user.password,
          email_confirm: true,
          user_metadata: {
            username: user.username,
            name: user.name,
            position: user.position,
            role: user.role,
          },
        });

        if (authError) {
          if (authError.message.includes('already registered')) {
            console.log(`[${requestId}] User ${user.username} already exists, fetching ID...`);
            const { data: existingUser } = await supabase
              .from('app_51335ed80f_users')
              .select('id')
              .eq('username', user.username)
              .single();
            
            if (existingUser) {
              if (user.role === 'superadmin') superadminId = existingUser.id;
              if (user.role === 'admin') adminId = existingUser.id;
            }
            results.users.success++;
          } else {
            console.error(`[${requestId}] Error creating user ${user.username}:`, authError);
            results.users.failed++;
            results.users.errors.push(`${user.username}: ${authError.message}`);
          }
        } else {
          // Store IDs for created_by field
          if (user.role === 'superadmin') superadminId = authData.user.id;
          if (user.role === 'admin') adminId = authData.user.id;

          // Determine created_by: superadmin creates itself, admin created by superadmin, viewer created by admin
          let createdBy = null;
          if (user.role === 'superadmin') {
            createdBy = authData.user.id; // Self-created
          } else if (user.role === 'admin') {
            createdBy = superadminId; // Created by superadmin
          } else if (user.role === 'viewer') {
            createdBy = adminId; // Created by admin
          }

          const { error: profileError } = await supabase
            .from('app_51335ed80f_users')
            .upsert({
              id: authData.user.id,
              username: user.username,
              name: user.name,
              position: user.position,
              role: user.role,
              created_by: createdBy,
            }, { onConflict: 'id' });

          if (profileError) {
            console.error(`[${requestId}] Error creating profile for ${user.username}:`, profileError);
            results.users.failed++;
            results.users.errors.push(`${user.username} profile: ${profileError.message}`);
          } else {
            results.users.success++;
          }
        }
      } catch (error) {
        console.error(`[${requestId}] Exception creating user ${user.username}:`, error);
        results.users.failed++;
        results.users.errors.push(`${user.username}: ${error.message}`);
      }
    }

    // Update created_by for existing users if needed
    if (superadminId && adminId) {
      console.log(`[${requestId}] Updating created_by fields for existing users...`);
      
      // Update admin's created_by to superadmin
      await supabase
        .from('app_51335ed80f_users')
        .update({ created_by: superadminId })
        .eq('username', 'admin');

      // Update viewer's created_by to admin
      await supabase
        .from('app_51335ed80f_users')
        .update({ created_by: adminId })
        .eq('username', 'viewer');

      // Update superadmin's created_by to itself
      await supabase
        .from('app_51335ed80f_users')
        .update({ created_by: superadminId })
        .eq('username', 'superadmin');
    }

    // Step 2: Migrate rail agents
    console.log(`[${requestId}] Step 2: Migrating rail agents...`);
    const railAgents = [
      { name: '하버링크', description: '철도 운송 대리점' },
      { name: 'WJ', description: '철도 운송 대리점' },
      { name: 'LB', description: '철도 운송 대리점' },
      { name: '시노트란스', description: '철도 운송 대리점' },
    ];

    for (const agent of railAgents) {
      const { error } = await supabase
        .from('app_51335ed80f_rail_agents')
        .insert(agent);
      
      if (error) {
        if (error.code === '23505') {
          results.railAgents.success++;
        } else {
          results.railAgents.failed++;
          results.railAgents.errors.push(`${agent.name}: ${error.message}`);
        }
      } else {
        results.railAgents.success++;
      }
    }

    // Step 3: Migrate truck agents
    console.log(`[${requestId}] Step 3: Migrating truck agents...`);
    const truckAgents = [
      { name: 'COWIN', description: '트럭 운송 전문 업체' },
      { name: '하버링크', description: '철도 + 트럭 운송' },
      { name: 'WJ', description: '철도 + 트럭 운송' },
      { name: 'LB', description: '철도 + 트럭 운송' },
      { name: '시노트란스', description: '철도 + 트럭 운송' },
    ];

    for (const agent of truckAgents) {
      const { error } = await supabase
        .from('app_51335ed80f_truck_agents')
        .insert(agent);
      
      if (error) {
        if (error.code === '23505') {
          results.truckAgents.success++;
        } else {
          results.truckAgents.failed++;
          results.truckAgents.errors.push(`${agent.name}: ${error.message}`);
        }
      } else {
        results.truckAgents.success++;
      }
    }

    // Step 4: Migrate destinations
    console.log(`[${requestId}] Step 4: Migrating destinations...`);
    const destinations = [
      { name: 'OSH', description: '오시 (키르기스스탄)' },
      { name: 'BISHKEK', description: '비슈케크 (키르기스스탄 수도)' },
      { name: 'ANDIJAN', description: '안디잔 (우즈베키스탄)' },
    ];

    const destinationIds = {};
    for (const dest of destinations) {
      const { data, error } = await supabase
        .from('app_51335ed80f_destinations')
        .insert(dest)
        .select()
        .single();
      
      if (error) {
        if (error.code === '23505') {
          const { data: existing } = await supabase
            .from('app_51335ed80f_destinations')
            .select('id')
            .eq('name', dest.name)
            .single();
          if (existing) destinationIds[dest.name] = existing.id;
          results.destinations.success++;
        } else {
          results.destinations.failed++;
          results.destinations.errors.push(`${dest.name}: ${error.message}`);
        }
      } else {
        destinationIds[dest.name] = data.id;
        results.destinations.success++;
      }
    }

    // Step 5: Migrate sea freights
    console.log(`[${requestId}] Step 5: Migrating sea freights...`);
    const seaFreights = [
      { pol: '부산', pod: '청도', rate: 420, carrier: '흥아', version: 1, ...validity },
      { pol: '부산', pod: '천진', rate: 420, carrier: '흥아', version: 1, ...validity },
      { pol: '부산', pod: '연운', rate: 420, carrier: '흥아', version: 1, ...validity },
      { pol: '인천', pod: '청도', rate: 580, carrier: 'SITC', note: '하버링크CC', version: 1, ...validity },
      { pol: '인천', pod: '천진', rate: 790, carrier: '두우', version: 1, ...validity },
      { pol: '인천', pod: '연운', rate: 490, version: 1, ...validity },
      { pol: '인천', pod: '다강', rate: 200, note: 'CC', version: 1, ...validity },
    ];

    for (const freight of seaFreights) {
      const { error } = await supabase
        .from('app_51335ed80f_sea_freights')
        .insert({
          pol: freight.pol,
          pod: freight.pod,
          rate: freight.rate,
          carrier: freight.carrier,
          note: freight.note,
          version: freight.version,
          valid_from: freight.validFrom,
          valid_to: freight.validTo,
        });
      
      if (error) {
        results.seaFreights.failed++;
        results.seaFreights.errors.push(`${freight.pol}-${freight.pod}: ${error.message}`);
      } else {
        results.seaFreights.success++;
      }
    }

    // Step 6: Migrate agent sea freights
    console.log(`[${requestId}] Step 6: Migrating agent sea freights...`);
    const agentSeaFreights = [
      { agent: '하버링크', pol: '인천', pod: '청도', rate: 580, carrier: 'SITC', note: '하버링크 지정 운임', version: 1, ...validity },
      { agent: 'WJ', pol: '부산', pod: '청도', rate: 420, carrier: '흥아', note: 'WJ 지정 운임', version: 1, ...validity },
      { agent: 'LB', pol: '부산', pod: '청도', rate: 420, carrier: '흥아', note: 'LB 지정 운임', version: 1, ...validity },
      { agent: '시노트란스', pol: '부산', pod: '청도', rate: 420, carrier: '흥아', note: '시노트란스 지정 운임', version: 1, ...validity },
    ];

    for (const freight of agentSeaFreights) {
      const { error } = await supabase
        .from('app_51335ed80f_agent_sea_freights')
        .insert({
          agent: freight.agent,
          pol: freight.pol,
          pod: freight.pod,
          rate: freight.rate,
          carrier: freight.carrier,
          note: freight.note,
          version: freight.version,
          valid_from: freight.validFrom,
          valid_to: freight.validTo,
        });
      
      if (error) {
        results.agentSeaFreights.failed++;
        results.agentSeaFreights.errors.push(`${freight.agent}-${freight.pol}-${freight.pod}: ${error.message}`);
      } else {
        results.agentSeaFreights.success++;
      }
    }

    // Step 7: Migrate DTHC
    console.log(`[${requestId}] Step 7: Migrating DTHC...`);
    const dthcList = [
      { agent: '하버링크', pol: '부산', pod: '청도', amount: 100, description: '하버링크 부산→청도 D/O(DTHC)', version: 1, ...validity },
      { agent: '하버링크', pol: '부산', pod: '천진', amount: 105, description: '하버링크 부산→천진 D/O(DTHC)', version: 1, ...validity },
      { agent: '하버링크', pol: '부산', pod: '연운', amount: 102, description: '하버링크 부산→연운 D/O(DTHC)', version: 1, ...validity },
      { agent: '하버링크', pol: '인천', pod: '청도', amount: 110, description: '하버링크 인천→청도 D/O(DTHC)', version: 1, ...validity },
      { agent: '하버링크', pol: '인천', pod: '천진', amount: 115, description: '하버링크 인천→천진 D/O(DTHC)', version: 1, ...validity },
      { agent: '하버링크', pol: '인천', pod: '연운', amount: 112, description: '하버링크 인천→연운 D/O(DTHC)', version: 1, ...validity },
      { agent: '하버링크', pol: '인천', pod: '다강', amount: 108, description: '하버링크 인천→다강 D/O(DTHC)', version: 1, ...validity },
      { agent: 'WJ', pol: '부산', pod: '청도', amount: 110, description: 'WJ 부산→청도 D/O(DTHC)', version: 1, ...validity },
      { agent: 'WJ', pol: '부산', pod: '천진', amount: 112, description: 'WJ 부산→천진 D/O(DTHC)', version: 1, ...validity },
      { agent: 'WJ', pol: '부산', pod: '연운', amount: 111, description: 'WJ 부산→연운 D/O(DTHC)', version: 1, ...validity },
      { agent: 'WJ', pol: '인천', pod: '청도', amount: 115, description: 'WJ 인천→청도 D/O(DTHC)', version: 1, ...validity },
      { agent: 'WJ', pol: '인천', pod: '천진', amount: 118, description: 'WJ 인천→천진 D/O(DTHC)', version: 1, ...validity },
      { agent: 'WJ', pol: '인천', pod: '연운', amount: 116, description: 'WJ 인천→연운 D/O(DTHC)', version: 1, ...validity },
      { agent: 'WJ', pol: '인천', pod: '다강', amount: 113, description: 'WJ 인천→다강 D/O(DTHC)', version: 1, ...validity },
    ];

    for (const item of dthcList) {
      const { error } = await supabase
        .from('app_51335ed80f_dthc')
        .insert({
          agent: item.agent,
          pol: item.pol,
          pod: item.pod,
          amount: item.amount,
          description: item.description,
          version: item.version,
          valid_from: item.validFrom,
          valid_to: item.validTo,
        });
      
      if (error) {
        results.dthc.failed++;
        results.dthc.errors.push(`${item.agent}-${item.pol}-${item.pod}: ${error.message}`);
      } else {
        results.dthc.success++;
      }
    }

    // Step 8: Migrate DP costs
    console.log(`[${requestId}] Step 8: Migrating DP costs...`);
    const dpCosts = [
      { port: '부산', amount: 150, description: 'Disposal Container (부산)', version: 1, ...validity },
      { port: '인천', amount: 180, description: 'Disposal Container (인천)', version: 1, ...validity },
    ];

    for (const item of dpCosts) {
      const { error } = await supabase
        .from('app_51335ed80f_dp_costs')
        .insert({
          port: item.port,
          amount: item.amount,
          description: item.description,
          version: item.version,
          valid_from: item.validFrom,
          valid_to: item.validTo,
        });
      
      if (error) {
        results.dpCosts.failed++;
        results.dpCosts.errors.push(`${item.port}: ${error.message}`);
      } else {
        results.dpCosts.success++;
      }
    }

    // Step 9: Migrate combined freights
    console.log(`[${requestId}] Step 9: Migrating combined freights...`);
    if (destinationIds['OSH']) {
      const { error } = await supabase
        .from('app_51335ed80f_combined_freights')
        .insert({
          agent: '하버링크',
          pod: '청도',
          destination_id: destinationIds['OSH'],
          rate: 4550,
          description: '청도→OSH 통합 운임',
          version: 1,
          valid_from: validity.validFrom,
          valid_to: validity.validTo,
        });
      
      if (error) {
        results.combinedFreights.failed++;
        results.combinedFreights.errors.push(`하버링크-청도-OSH: ${error.message}`);
      } else {
        results.combinedFreights.success++;
      }
    }

    // Step 10: Migrate port border freights
    console.log(`[${requestId}] Step 10: Migrating port border freights...`);
    const portBorderFreights = [
      { agent: '하버링크', qingdao: 2550, tianjin: 1, lianyungang: 1, dandong: 1, version: 1, ...validity },
      { agent: 'WJ', qingdao: 2050, tianjin: 2, lianyungang: 2, dandong: 2, version: 1, ...validity },
      { agent: 'LB', qingdao: 3, tianjin: 3, lianyungang: 3, dandong: 3, version: 1, ...validity },
      { agent: '시노트란스', qingdao: 4, tianjin: 4, lianyungang: 4, dandong: 4, version: 1, ...validity },
    ];

    for (const item of portBorderFreights) {
      const { error } = await supabase
        .from('app_51335ed80f_port_border_freights')
        .insert({
          agent: item.agent,
          qingdao: item.qingdao,
          tianjin: item.tianjin,
          lianyungang: item.lianyungang,
          dandong: item.dandong,
          version: item.version,
          valid_from: item.validFrom,
          valid_to: item.validTo,
        });
      
      if (error) {
        results.portBorderFreights.failed++;
        results.portBorderFreights.errors.push(`${item.agent}: ${error.message}`);
      } else {
        results.portBorderFreights.success++;
      }
    }

    // Step 11: Migrate border destination freights
    console.log(`[${requestId}] Step 11: Migrating border destination freights...`);
    const borderDestinationFreights = [
      { agent: '하버링크', destination: 'OSH', rate: 2000 },
      { agent: '하버링크', destination: 'BISHKEK', rate: 2000 },
      { agent: '하버링크', destination: 'ANDIJAN', rate: 2000 },
      { agent: 'WJ', destination: 'OSH', rate: 2050 },
      { agent: 'WJ', destination: 'BISHKEK', rate: 2050 },
      { agent: 'WJ', destination: 'ANDIJAN', rate: 2050 },
      { agent: 'LB', destination: 'OSH', rate: 2080 },
      { agent: 'LB', destination: 'BISHKEK', rate: 2080 },
      { agent: 'LB', destination: 'ANDIJAN', rate: 2080 },
      { agent: '시노트란스', destination: 'OSH', rate: 1900 },
      { agent: '시노트란스', destination: 'BISHKEK', rate: 1950 },
      { agent: '시노트란스', destination: 'ANDIJAN', rate: 2000 },
      { agent: 'COWIN', destination: 'OSH', rate: 1950 },
      { agent: 'COWIN', destination: 'BISHKEK', rate: 1850 },
      { agent: 'COWIN', destination: 'ANDIJAN', rate: 1650 },
    ];

    for (const item of borderDestinationFreights) {
      if (destinationIds[item.destination]) {
        const { error } = await supabase
          .from('app_51335ed80f_border_destination_freights')
          .insert({
            agent: item.agent,
            destination_id: destinationIds[item.destination],
            rate: item.rate,
            version: 1,
            valid_from: validity.validFrom,
            valid_to: validity.validTo,
          });
        
        if (error) {
          results.borderDestinationFreights.failed++;
          results.borderDestinationFreights.errors.push(`${item.agent}-${item.destination}: ${error.message}`);
        } else {
          results.borderDestinationFreights.success++;
        }
      }
    }

    // Step 12: Migrate weight surcharge rules
    console.log(`[${requestId}] Step 12: Migrating weight surcharge rules...`);
    const weightSurchargeRules = [
      { agent: '하버링크', minWeight: 0, maxWeight: 1000, surcharge: 0, version: 1, ...validity },
      { agent: '하버링크', minWeight: 1001, maxWeight: 2000, surcharge: 50, version: 1, ...validity },
      { agent: '하버링크', minWeight: 2001, maxWeight: 3000, surcharge: 100, version: 1, ...validity },
      { agent: '하버링크', minWeight: 3001, maxWeight: 999999, surcharge: 150, version: 1, ...validity },
      { agent: 'WJ', minWeight: 0, maxWeight: 999999, surcharge: 33, version: 1, ...validity },
      { agent: 'LB', minWeight: 0, maxWeight: 999999, surcharge: 43, version: 1, ...validity },
      { agent: '시노트란스', minWeight: 0, maxWeight: 999999, surcharge: 80, version: 1, ...validity },
      { agent: 'COWIN', minWeight: 0, maxWeight: 999999, surcharge: 180, version: 1, ...validity },
    ];

    for (const item of weightSurchargeRules) {
      const { error } = await supabase
        .from('app_51335ed80f_weight_surcharge_rules')
        .insert({
          agent: item.agent,
          min_weight: item.minWeight,
          max_weight: item.maxWeight,
          surcharge: item.surcharge,
          version: item.version,
          valid_from: item.validFrom,
          valid_to: item.validTo,
        });
      
      if (error) {
        results.weightSurchargeRules.failed++;
        results.weightSurchargeRules.errors.push(`${item.agent}: ${error.message}`);
      } else {
        results.weightSurchargeRules.success++;
      }
    }

    console.log(`[${requestId}] Migration completed`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Migration completed with proper created_by relationships',
        results,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error(`[${requestId}] Migration error:`, error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        stack: error.stack,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});