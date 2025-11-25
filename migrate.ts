import { supabase, TABLES } from './src/lib/supabase';
import {
  defaultUsers,
  initialRailAgents,
  initialTruckAgents,
  initialDestinations,
  initialSeaFreights,
  initialAgentSeaFreights,
  initialDTHCList,
  initialDPCosts,
  initialCombinedFreights,
  initialPortBorderFreights,
  initialBorderDestinationFreights,
  initialWeightSurchargeRules,
} from './src/data/initialData';

async function migrate() {
  console.log('🚀 Starting migration...\n');

  try {
    // Step 1: Create users in Supabase Auth
    console.log('📝 Step 1: Creating users in Supabase Auth...');
    for (const user of defaultUsers) {
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
          console.log(`  ⚠️  User ${user.username} already exists, skipping...`);
        } else {
          console.error(`  ❌ Error creating user ${user.username}:`, authError);
        }
      } else {
        console.log(`  ✅ Created user: ${user.username} (${user.name})`);
        
        // Insert user profile
        const { error: profileError } = await supabase
          .from(TABLES.USERS)
          .upsert({
            id: authData.user.id,
            username: user.username,
            name: user.name,
            position: user.position,
            role: user.role,
          }, { onConflict: 'username' });

        if (profileError) {
          console.error(`  ❌ Error creating profile for ${user.username}:`, profileError);
        }
      }
    }

    // Step 2: Migrate rail agents
    console.log('\n📝 Step 2: Migrating rail agents...');
    const railAgentsData = initialRailAgents.map(agent => ({
      name: agent.name,
      description: agent.description,
    }));
    const { error: railAgentsError } = await supabase
      .from(TABLES.RAIL_AGENTS)
      .upsert(railAgentsData, { onConflict: 'name' });
    
    if (railAgentsError) {
      console.error('  ❌ Error migrating rail agents:', railAgentsError);
    } else {
      console.log(`  ✅ Migrated ${railAgentsData.length} rail agents`);
    }

    // Step 3: Migrate truck agents
    console.log('\n📝 Step 3: Migrating truck agents...');
    const truckAgentsData = initialTruckAgents.map(agent => ({
      name: agent.name,
      description: agent.description,
    }));
    const { error: truckAgentsError } = await supabase
      .from(TABLES.TRUCK_AGENTS)
      .upsert(truckAgentsData, { onConflict: 'name' });
    
    if (truckAgentsError) {
      console.error('  ❌ Error migrating truck agents:', truckAgentsError);
    } else {
      console.log(`  ✅ Migrated ${truckAgentsData.length} truck agents`);
    }

    // Step 4: Migrate destinations
    console.log('\n📝 Step 4: Migrating destinations...');
    const destinationsData = initialDestinations.map(dest => ({
      name: dest.name,
      description: dest.description,
    }));
    const { error: destinationsError } = await supabase
      .from(TABLES.DESTINATIONS)
      .upsert(destinationsData, { onConflict: 'name' });
    
    if (destinationsError) {
      console.error('  ❌ Error migrating destinations:', destinationsError);
    } else {
      console.log(`  ✅ Migrated ${destinationsData.length} destinations`);
    }

    // Step 5: Migrate sea freights
    console.log('\n📝 Step 5: Migrating sea freights...');
    const seaFreightsData = initialSeaFreights.map(freight => ({
      pol: freight.pol,
      pod: freight.pod,
      rate: freight.rate,
      carrier: freight.carrier,
      note: freight.note,
      version: freight.version || 1,
      valid_from: freight.validFrom,
      valid_to: freight.validTo,
    }));
    
    // Delete existing and insert new
    await supabase.from(TABLES.SEA_FREIGHTS).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    const { error: seaFreightsError } = await supabase
      .from(TABLES.SEA_FREIGHTS)
      .insert(seaFreightsData);
    
    if (seaFreightsError) {
      console.error('  ❌ Error migrating sea freights:', seaFreightsError);
    } else {
      console.log(`  ✅ Migrated ${seaFreightsData.length} sea freights`);
    }

    // Step 6: Migrate agent sea freights
    console.log('\n📝 Step 6: Migrating agent sea freights...');
    const agentSeaFreightsData = initialAgentSeaFreights.map(freight => ({
      agent: freight.agent,
      pol: freight.pol,
      pod: freight.pod,
      rate: freight.rate,
      carrier: freight.carrier,
      note: freight.note,
      version: freight.version || 1,
      valid_from: freight.validFrom,
      valid_to: freight.validTo,
    }));
    
    await supabase.from(TABLES.AGENT_SEA_FREIGHTS).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    const { error: agentSeaFreightsError } = await supabase
      .from(TABLES.AGENT_SEA_FREIGHTS)
      .insert(agentSeaFreightsData);
    
    if (agentSeaFreightsError) {
      console.error('  ❌ Error migrating agent sea freights:', agentSeaFreightsError);
    } else {
      console.log(`  ✅ Migrated ${agentSeaFreightsData.length} agent sea freights`);
    }

    // Step 7: Migrate DTHC
    console.log('\n📝 Step 7: Migrating DTHC...');
    const dthcData = initialDTHCList.map(item => ({
      agent: item.agent,
      pol: item.pol,
      pod: item.pod,
      amount: item.amount,
      description: item.description,
      version: item.version || 1,
      valid_from: item.validFrom,
      valid_to: item.validTo,
    }));
    
    await supabase.from(TABLES.DTHC).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    const { error: dthcError } = await supabase
      .from(TABLES.DTHC)
      .insert(dthcData);
    
    if (dthcError) {
      console.error('  ❌ Error migrating DTHC:', dthcError);
    } else {
      console.log(`  ✅ Migrated ${dthcData.length} DTHC records`);
    }

    // Step 8: Migrate DP costs
    console.log('\n📝 Step 8: Migrating DP costs...');
    const dpCostsData = initialDPCosts.map(item => ({
      port: item.port,
      amount: item.amount,
      description: item.description,
      version: item.version || 1,
      valid_from: item.validFrom,
      valid_to: item.validTo,
    }));
    
    await supabase.from(TABLES.DP_COSTS).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    const { error: dpCostsError } = await supabase
      .from(TABLES.DP_COSTS)
      .insert(dpCostsData);
    
    if (dpCostsError) {
      console.error('  ❌ Error migrating DP costs:', dpCostsError);
    } else {
      console.log(`  ✅ Migrated ${dpCostsData.length} DP costs`);
    }

    // Step 9: Migrate combined freights
    console.log('\n📝 Step 9: Migrating combined freights...');
    const combinedFreightsData = initialCombinedFreights.map(item => ({
      agent: item.agent,
      pod: item.pod,
      destination_id: item.destinationId,
      rate: item.rate,
      description: item.description,
      version: item.version || 1,
      valid_from: item.validFrom,
      valid_to: item.validTo,
    }));
    
    await supabase.from(TABLES.COMBINED_FREIGHTS).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    const { error: combinedFreightsError } = await supabase
      .from(TABLES.COMBINED_FREIGHTS)
      .insert(combinedFreightsData);
    
    if (combinedFreightsError) {
      console.error('  ❌ Error migrating combined freights:', combinedFreightsError);
    } else {
      console.log(`  ✅ Migrated ${combinedFreightsData.length} combined freights`);
    }

    // Step 10: Migrate port border freights
    console.log('\n📝 Step 10: Migrating port border freights...');
    const portBorderFreightsData = initialPortBorderFreights.map(item => ({
      agent: item.agent,
      qingdao: item.qingdao,
      tianjin: item.tianjin,
      lianyungang: item.lianyungang,
      dandong: item.dandong,
      version: item.version || 1,
      valid_from: item.validFrom,
      valid_to: item.validTo,
    }));
    
    await supabase.from(TABLES.PORT_BORDER_FREIGHTS).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    const { error: portBorderFreightsError } = await supabase
      .from(TABLES.PORT_BORDER_FREIGHTS)
      .insert(portBorderFreightsData);
    
    if (portBorderFreightsError) {
      console.error('  ❌ Error migrating port border freights:', portBorderFreightsError);
    } else {
      console.log(`  ✅ Migrated ${portBorderFreightsData.length} port border freights`);
    }

    // Step 11: Migrate border destination freights
    console.log('\n📝 Step 11: Migrating border destination freights...');
    const borderDestinationFreightsData = initialBorderDestinationFreights.map(item => ({
      agent: item.agent,
      destination_id: item.destinationId,
      rate: item.rate,
      version: item.version || 1,
      valid_from: item.validFrom,
      valid_to: item.validTo,
    }));
    
    await supabase.from(TABLES.BORDER_DESTINATION_FREIGHTS).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    const { error: borderDestinationFreightsError } = await supabase
      .from(TABLES.BORDER_DESTINATION_FREIGHTS)
      .insert(borderDestinationFreightsData);
    
    if (borderDestinationFreightsError) {
      console.error('  ❌ Error migrating border destination freights:', borderDestinationFreightsError);
    } else {
      console.log(`  ✅ Migrated ${borderDestinationFreightsData.length} border destination freights`);
    }

    // Step 12: Migrate weight surcharge rules
    console.log('\n📝 Step 12: Migrating weight surcharge rules...');
    const weightSurchargeRulesData = initialWeightSurchargeRules.map(item => ({
      agent: item.agent,
      min_weight: item.minWeight,
      max_weight: item.maxWeight,
      surcharge: item.surcharge,
      version: item.version || 1,
      valid_from: item.validFrom,
      valid_to: item.validTo,
    }));
    
    await supabase.from(TABLES.WEIGHT_SURCHARGE_RULES).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    const { error: weightSurchargeRulesError } = await supabase
      .from(TABLES.WEIGHT_SURCHARGE_RULES)
      .insert(weightSurchargeRulesData);
    
    if (weightSurchargeRulesError) {
      console.error('  ❌ Error migrating weight surcharge rules:', weightSurchargeRulesError);
    } else {
      console.log(`  ✅ Migrated ${weightSurchargeRulesData.length} weight surcharge rules`);
    }

    console.log('\n✅ Migration completed successfully!\n');
    console.log('📋 Summary:');
    console.log(`   - Users: ${defaultUsers.length}`);
    console.log(`   - Rail Agents: ${initialRailAgents.length}`);
    console.log(`   - Truck Agents: ${initialTruckAgents.length}`);
    console.log(`   - Destinations: ${initialDestinations.length}`);
    console.log(`   - Sea Freights: ${initialSeaFreights.length}`);
    console.log(`   - Agent Sea Freights: ${initialAgentSeaFreights.length}`);
    console.log(`   - DTHC: ${initialDTHCList.length}`);
    console.log(`   - DP Costs: ${initialDPCosts.length}`);
    console.log(`   - Combined Freights: ${initialCombinedFreights.length}`);
    console.log(`   - Port Border Freights: ${initialPortBorderFreights.length}`);
    console.log(`   - Border Destination Freights: ${initialBorderDestinationFreights.length}`);
    console.log(`   - Weight Surcharge Rules: ${initialWeightSurchargeRules.length}`);
    console.log('\n🎉 You can now login with:');
    console.log('   - superadmin / super123');
    console.log('   - admin / admin123');
    console.log('   - viewer / viewer123');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

migrate();
