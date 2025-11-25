import { supabase, TABLES } from './supabase';
import {
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
} from '@/data/initialData';

/**
 * Migration script to populate Supabase database with initial data
 */
export const migrateInitialData = async () => {
  try {
    console.log('Starting data migration to Supabase...');

    // Migrate rail agents
    console.log('Migrating rail agents...');
    const railAgentsData = initialRailAgents.map(agent => ({
      name: agent.name,
      description: agent.description,
    }));
    const { error: railAgentsError } = await supabase
      .from(TABLES.RAIL_AGENTS)
      .upsert(railAgentsData, { onConflict: 'name' });
    
    if (railAgentsError) {
      console.error('Error migrating rail agents:', railAgentsError);
    } else {
      console.log(`✓ Migrated ${railAgentsData.length} rail agents`);
    }

    // Migrate truck agents
    console.log('Migrating truck agents...');
    const truckAgentsData = initialTruckAgents.map(agent => ({
      name: agent.name,
      description: agent.description,
    }));
    const { error: truckAgentsError } = await supabase
      .from(TABLES.TRUCK_AGENTS)
      .upsert(truckAgentsData, { onConflict: 'name' });
    
    if (truckAgentsError) {
      console.error('Error migrating truck agents:', truckAgentsError);
    } else {
      console.log(`✓ Migrated ${truckAgentsData.length} truck agents`);
    }

    // Migrate destinations
    console.log('Migrating destinations...');
    const destinationsData = initialDestinations.map(dest => ({
      name: dest.name,
      description: dest.description,
    }));
    const { error: destinationsError } = await supabase
      .from(TABLES.DESTINATIONS)
      .upsert(destinationsData, { onConflict: 'name' });
    
    if (destinationsError) {
      console.error('Error migrating destinations:', destinationsError);
    } else {
      console.log(`✓ Migrated ${destinationsData.length} destinations`);
    }

    // Migrate sea freights
    console.log('Migrating sea freights...');
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
    const { error: seaFreightsError } = await supabase
      .from(TABLES.SEA_FREIGHTS)
      .insert(seaFreightsData);
    
    if (seaFreightsError) {
      console.error('Error migrating sea freights:', seaFreightsError);
    } else {
      console.log(`✓ Migrated ${seaFreightsData.length} sea freights`);
    }

    // Migrate agent sea freights
    console.log('Migrating agent sea freights...');
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
    const { error: agentSeaFreightsError } = await supabase
      .from(TABLES.AGENT_SEA_FREIGHTS)
      .insert(agentSeaFreightsData);
    
    if (agentSeaFreightsError) {
      console.error('Error migrating agent sea freights:', agentSeaFreightsError);
    } else {
      console.log(`✓ Migrated ${agentSeaFreightsData.length} agent sea freights`);
    }

    // Migrate DTHC
    console.log('Migrating DTHC...');
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
    const { error: dthcError } = await supabase
      .from(TABLES.DTHC)
      .insert(dthcData);
    
    if (dthcError) {
      console.error('Error migrating DTHC:', dthcError);
    } else {
      console.log(`✓ Migrated ${dthcData.length} DTHC records`);
    }

    // Migrate DP costs
    console.log('Migrating DP costs...');
    const dpCostsData = initialDPCosts.map(item => ({
      port: item.port,
      amount: item.amount,
      description: item.description,
      version: item.version || 1,
      valid_from: item.validFrom,
      valid_to: item.validTo,
    }));
    const { error: dpCostsError } = await supabase
      .from(TABLES.DP_COSTS)
      .insert(dpCostsData);
    
    if (dpCostsError) {
      console.error('Error migrating DP costs:', dpCostsError);
    } else {
      console.log(`✓ Migrated ${dpCostsData.length} DP costs`);
    }

    // Migrate combined freights
    console.log('Migrating combined freights...');
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
    const { error: combinedFreightsError } = await supabase
      .from(TABLES.COMBINED_FREIGHTS)
      .insert(combinedFreightsData);
    
    if (combinedFreightsError) {
      console.error('Error migrating combined freights:', combinedFreightsError);
    } else {
      console.log(`✓ Migrated ${combinedFreightsData.length} combined freights`);
    }

    // Migrate port border freights
    console.log('Migrating port border freights...');
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
    const { error: portBorderFreightsError } = await supabase
      .from(TABLES.PORT_BORDER_FREIGHTS)
      .insert(portBorderFreightsData);
    
    if (portBorderFreightsError) {
      console.error('Error migrating port border freights:', portBorderFreightsError);
    } else {
      console.log(`✓ Migrated ${portBorderFreightsData.length} port border freights`);
    }

    // Migrate border destination freights
    console.log('Migrating border destination freights...');
    const borderDestinationFreightsData = initialBorderDestinationFreights.map(item => ({
      agent: item.agent,
      destination_id: item.destinationId,
      rate: item.rate,
      version: item.version || 1,
      valid_from: item.validFrom,
      valid_to: item.validTo,
    }));
    const { error: borderDestinationFreightsError } = await supabase
      .from(TABLES.BORDER_DESTINATION_FREIGHTS)
      .insert(borderDestinationFreightsData);
    
    if (borderDestinationFreightsError) {
      console.error('Error migrating border destination freights:', borderDestinationFreightsError);
    } else {
      console.log(`✓ Migrated ${borderDestinationFreightsData.length} border destination freights`);
    }

    // Migrate weight surcharge rules
    console.log('Migrating weight surcharge rules...');
    const weightSurchargeRulesData = initialWeightSurchargeRules.map(item => ({
      agent: item.agent,
      min_weight: item.minWeight,
      max_weight: item.maxWeight,
      surcharge: item.surcharge,
      version: item.version || 1,
      valid_from: item.validFrom,
      valid_to: item.validTo,
    }));
    const { error: weightSurchargeRulesError } = await supabase
      .from(TABLES.WEIGHT_SURCHARGE_RULES)
      .insert(weightSurchargeRulesData);
    
    if (weightSurchargeRulesError) {
      console.error('Error migrating weight surcharge rules:', weightSurchargeRulesError);
    } else {
      console.log(`✓ Migrated ${weightSurchargeRulesData.length} weight surcharge rules`);
    }

    console.log('✅ Data migration completed successfully!');
    return { success: true };
  } catch (error) {
    console.error('Migration failed:', error);
    return { success: false, error };
  }
};

/**
 * Check if initial data has already been migrated
 */
export const checkMigrationStatus = async () => {
  try {
    const { count } = await supabase
      .from(TABLES.SEA_FREIGHTS)
      .select('*', { count: 'exact', head: true });
    
    return count && count > 0;
  } catch (error) {
    console.error('Error checking migration status:', error);
    return false;
  }
};