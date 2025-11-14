import { isValidOnDate } from './freightHelpers';
import {
  CostCalculationInput,
  CostCalculationResult,
  AgentCostBreakdown,
  SeaFreight,
  AgentSeaFreight,
  DTHC,
  DPCost,
  CombinedFreight,
  PortBorderFreight,
  BorderDestinationFreight,
  WeightSurchargeRule,
  RailAgent,
  HistoricalFreightSnapshot,
} from '@/types/freight';

// Cost Calculation with expired rate tracking
export const calculateCost = (
  input: CostCalculationInput,
  seaFreights: SeaFreight[],
  agentSeaFreights: AgentSeaFreight[],
  dthcList: DTHC[],
  dpCosts: DPCost[],
  combinedFreights: CombinedFreight[],
  portBorderFreights: PortBorderFreight[],
  borderDestinationFreights: BorderDestinationFreight[],
  weightSurchargeRules: WeightSurchargeRule[],
  railAgents: RailAgent[],
  snapshot: HistoricalFreightSnapshot | null
): CostCalculationResult | null => {
  const calculationDate = input.historicalDate || new Date().toISOString().split('T')[0];

  const getDataSource = <T,>(current: T[], historical: T[] | undefined): T[] => {
    return snapshot && historical ? historical : current;
  };

  const currentSeaFreights = getDataSource(seaFreights, snapshot?.seaFreights);
  const currentAgentSeaFreights = getDataSource(agentSeaFreights, snapshot?.agentSeaFreights);
  const currentDthcList = getDataSource(dthcList, snapshot?.dthcList);
  const currentDpCosts = getDataSource(dpCosts, snapshot?.dpCosts);
  const currentCombinedFreights = getDataSource(combinedFreights, snapshot?.combinedFreights);
  const currentPortBorderFreights = getDataSource(portBorderFreights, snapshot?.portBorderFreights);
  const currentBorderDestinationFreights = getDataSource(borderDestinationFreights, snapshot?.borderDestinationFreights);
  const currentWeightSurchargeRules = getDataSource(weightSurchargeRules, snapshot?.weightSurchargeRules);

  // Helper functions that return both value and expiration status
  const getDPCostWithExpiry = (port: string): { value: number; expired: boolean } => {
    const filtered = currentDpCosts.filter((d) => d.port === port);
    if (filtered.length === 0) return { value: 0, expired: false };
    
    const validDP = filtered.filter(d => isValidOnDate(d.validFrom, d.validTo, calculationDate));
    if (validDP.length > 0) {
      return { value: validDP[0].amount, expired: false };
    }
    
    return { value: filtered[0].amount, expired: true };
  };

  const getAgentSeaFreightWithExpiry = (agent: string, pol: string, pod: string): { value: number | null; expired: boolean; carrier?: string } => {
    const filtered = currentAgentSeaFreights.filter(
      (f) => f.agent === agent && f.pol === pol && f.pod === pod
    );
    if (filtered.length === 0) return { value: null, expired: false };
    
    const validFreights = filtered.filter(f => isValidOnDate(f.validFrom, f.validTo, calculationDate));
    if (validFreights.length > 0) {
      return { value: validFreights[0].rate, expired: false, carrier: validFreights[0].carrier };
    }
    
    return { value: filtered[0].rate, expired: true, carrier: filtered[0].carrier };
  };

  const getDTHCByAgentAndRouteWithExpiry = (agent: string, pol: string, pod: string, isAgentSpecificSeaFreight: boolean): { value: number; expired: boolean } => {
    const filtered = currentDthcList.filter((d) => d.agent === agent && d.pol === pol && d.pod === pod);
    if (filtered.length === 0) return { value: 0, expired: false };
    
    const validDTHC = filtered.filter(d => isValidOnDate(d.validFrom, d.validTo, calculationDate));
    if (validDTHC.length > 0) {
      return { value: isAgentSpecificSeaFreight ? 0 : validDTHC[0].amount, expired: false };
    }
    
    return { value: isAgentSpecificSeaFreight ? 0 : filtered[0].amount, expired: true };
  };

  const getCombinedFreightWithExpiry = (agent: string, pod: string, destinationId: string): { value: number | null; expired: boolean } => {
    const filtered = currentCombinedFreights.filter(
      (f) => f.agent === agent && f.pod === pod && f.destinationId === destinationId
    );
    if (filtered.length === 0) return { value: null, expired: false };
    
    const validFreights = filtered.filter(f => isValidOnDate(f.validFrom, f.validTo, calculationDate));
    if (validFreights.length > 0) {
      return { value: validFreights[0].rate, expired: false };
    }
    
    return { value: filtered[0].rate, expired: true };
  };

  const getBorderDestinationRateWithExpiry = (agent: string, destinationId: string): { value: number; expired: boolean } => {
    const filtered = currentBorderDestinationFreights.filter(
      (f) => f.agent === agent && f.destinationId === destinationId
    );
    if (filtered.length === 0) return { value: 0, expired: false };
    
    const validFreights = filtered.filter(f => isValidOnDate(f.validFrom, f.validTo, calculationDate));
    if (validFreights.length > 0) {
      return { value: validFreights[0].rate, expired: false };
    }
    
    return { value: filtered[0].rate, expired: true };
  };

  const getWeightSurchargeWithExpiry = (agent: string, weight: number): { value: number; expired: boolean } => {
    const filtered = currentWeightSurchargeRules.filter(
      (r) => r.agent === agent && weight >= r.minWeight && weight <= r.maxWeight
    );
    if (filtered.length === 0) return { value: 0, expired: false };
    
    const validRules = filtered.filter(r => isValidOnDate(r.validFrom, r.validTo, calculationDate));
    if (validRules.length > 0) {
      return { value: validRules[0].surcharge, expired: false };
    }
    
    return { value: filtered[0].surcharge, expired: true };
  };

  const getPortBorderRateWithExpiry = (agent: string, pod: string): { value: number; expired: boolean } => {
    const filtered = currentPortBorderFreights.filter(
      (f) => f.agent === agent && f.pod === pod
    );
    if (filtered.length === 0) return { value: 0, expired: false };
    
    const validFreights = filtered.filter(f => isValidOnDate(f.validFrom, f.validTo, calculationDate));
    if (validFreights.length > 0) {
      return { value: validFreights[0].rate, expired: false };
    }
    
    return { value: filtered[0].rate, expired: true };
  };

  // CRITICAL FIX: Get DP cost once, will be used differently for combined vs separate freight
  const dpCostData = getDPCostWithExpiry(input.pol);
  const totalOtherCosts = input.otherCosts.reduce((sum, item) => sum + item.amount, 0);

  // Collect agents from BOTH rail freight AND combined freight
  const railAgentsFromPortBorder = currentPortBorderFreights
    .filter(f => f.pod === input.pod)
    .map(f => f.agent);
  
  const railAgentsFromCombined = currentCombinedFreights
    .filter(f => f.pod === input.pod && f.destinationId === input.destinationId)
    .map(f => f.agent);
  
  // Merge and get unique agents
  const allAgentNames = [...new Set([...railAgentsFromPortBorder, ...railAgentsFromCombined])];
  
  // Verify agents exist in railAgents list
  const railAgentsWithFreight = allAgentNames.filter(agentName => 
    railAgents.find(ra => ra.name === agentName)
  );
  
  const cowinTruck = currentBorderDestinationFreights.find(f => 
    f.agent === 'COWIN' && 
    f.destinationId === input.destinationId
  );

  const breakdown: AgentCostBreakdown[] = [];

  railAgentsWithFreight.forEach((agentName) => {
    const expiredDetails: string[] = [];
    
    const agentSeaResult = getAgentSeaFreightWithExpiry(agentName, input.pol, input.pod);
    
    let seaFreightRate = 0;
    let seaFreightLocalCharge = 0;
    let seaFreightId: string | undefined;
    let seaFreightCarrier: string | undefined;
    let isAgentSpecific = false;
    let seaFreightExpired = false;

    if (agentSeaResult.value !== null) {
      seaFreightRate = agentSeaResult.value;
      seaFreightCarrier = agentSeaResult.carrier;
      isAgentSpecific = true;
      seaFreightExpired = agentSeaResult.expired;
      if (seaFreightExpired) expiredDetails.push('해상운임');
    } else if (input.selectedSeaFreightId) {
      const selectedFreight = currentSeaFreights.find(f => f.id === input.selectedSeaFreightId);
      if (selectedFreight) {
        seaFreightRate = selectedFreight.rate;
        seaFreightLocalCharge = selectedFreight.localCharge || 0;
        seaFreightId = selectedFreight.id;
        seaFreightCarrier = selectedFreight.carrier;
        seaFreightExpired = !isValidOnDate(selectedFreight.validFrom, selectedFreight.validTo, calculationDate);
        if (seaFreightExpired) expiredDetails.push('해상운임');
      }
    } else {
      const allSeaFreights = currentSeaFreights.filter(
        (f) => f.pol === input.pol && f.pod === input.pod
      );
      if (allSeaFreights.length > 0) {
        const validFreights = allSeaFreights.filter(f => isValidOnDate(f.validFrom, f.validTo, calculationDate));
        if (validFreights.length > 0) {
          seaFreightRate = validFreights[0].rate;
          seaFreightLocalCharge = validFreights[0].localCharge || 0;
          seaFreightId = validFreights[0].id;
          seaFreightCarrier = validFreights[0].carrier;
        } else {
          seaFreightRate = allSeaFreights[0].rate;
          seaFreightLocalCharge = allSeaFreights[0].localCharge || 0;
          seaFreightId = allSeaFreights[0].id;
          seaFreightCarrier = allSeaFreights[0].carrier;
          seaFreightExpired = true;
          expiredDetails.push('해상운임');
        }
      }
    }
    
    const dthcResult = getDTHCByAgentAndRouteWithExpiry(agentName, input.pol, input.pod, isAgentSpecific);
    if (dthcResult.expired) expiredDetails.push('DTHC');
    
    const combinedResult = getCombinedFreightWithExpiry(agentName, input.pod, input.destinationId);
    const railResult = getPortBorderRateWithExpiry(agentName, input.pod);
    const ownTruckResult = getBorderDestinationRateWithExpiry(agentName, input.destinationId);
    
    const hasCombined = combinedResult.value !== null && combinedResult.value > 0;
    const hasSeparate = railResult.value > 0 && ownTruckResult.value > 0;
    
    // Add combined freight option if it exists
    if (hasCombined) {
      const combinedExpiredDetails = [...expiredDetails];
      if (combinedResult.expired) combinedExpiredDetails.push('통합운임');
      
      const weightSurchargeResult = getWeightSurchargeWithExpiry(agentName, input.weight);
      if (weightSurchargeResult.expired) combinedExpiredDetails.push('중량할증');
      
      // CRITICAL FIX: For combined freight, DP is always 0
      const combinedDpValue = 0;
      
      const total =
        seaFreightRate +
        seaFreightLocalCharge +
        dthcResult.value +
        combinedResult.value +
        weightSurchargeResult.value +
        combinedDpValue +
        totalOtherCosts +
        input.domesticTransport;

      breakdown.push({
        agent: agentName,
        railAgent: agentName,
        truckAgent: agentName,
        seaFreight: seaFreightRate,
        localCharge: seaFreightLocalCharge,
        seaFreightId,
        seaFreightCarrier,
        isAgentSpecificSeaFreight: isAgentSpecific,
        dthc: dthcResult.value,
        portBorder: 0,
        borderDestination: 0,
        combinedFreight: combinedResult.value,
        isCombinedFreight: true,
        weightSurcharge: weightSurchargeResult.value,
        dp: combinedDpValue,
        domesticTransport: input.domesticTransport,
        otherCosts: input.otherCosts,
        total,
        hasExpiredRates: combinedExpiredDetails.length > 0,
        expiredRateDetails: combinedExpiredDetails.length > 0 ? combinedExpiredDetails : undefined,
      });
    }
    
    // Add separate rail+truck option if it exists
    if (hasSeparate) {
      const separateExpiredDetails = [...expiredDetails];
      if (railResult.expired) separateExpiredDetails.push('철도운임');
      if (ownTruckResult.expired) separateExpiredDetails.push('트럭운임');
      
      const weightSurchargeResult = getWeightSurchargeWithExpiry(agentName, input.weight);
      if (weightSurchargeResult.expired) separateExpiredDetails.push('중량할증');
      
      // CRITICAL FIX: For separate freight, use actual DP value
      const separateDpValue = dpCostData.value;
      if (dpCostData.expired) separateExpiredDetails.push('DP');
      
      const total =
        seaFreightRate +
        seaFreightLocalCharge +
        dthcResult.value +
        railResult.value +
        ownTruckResult.value +
        weightSurchargeResult.value +
        separateDpValue +
        totalOtherCosts +
        input.domesticTransport;

      breakdown.push({
        agent: agentName,
        railAgent: agentName,
        truckAgent: agentName,
        seaFreight: seaFreightRate,
        localCharge: seaFreightLocalCharge,
        seaFreightId,
        seaFreightCarrier,
        isAgentSpecificSeaFreight: isAgentSpecific,
        dthc: dthcResult.value,
        portBorder: railResult.value,
        borderDestination: ownTruckResult.value,
        combinedFreight: 0,
        isCombinedFreight: false,
        weightSurcharge: weightSurchargeResult.value,
        dp: separateDpValue,
        domesticTransport: input.domesticTransport,
        otherCosts: input.otherCosts,
        total,
        hasExpiredRates: separateExpiredDetails.length > 0,
        expiredRateDetails: separateExpiredDetails.length > 0 ? separateExpiredDetails : undefined,
      });
    }

    // Add rail + COWIN truck combination if COWIN truck exists and rail exists
    if (cowinTruck && cowinTruck.rate > 0 && railResult.value > 0) {
      const cowinExpiredDetails = [...expiredDetails];
      if (railResult.expired) cowinExpiredDetails.push('철도운임');
      const cowinTruckExpired = !isValidOnDate(cowinTruck.validFrom, cowinTruck.validTo, calculationDate);
      if (cowinTruckExpired) cowinExpiredDetails.push('트럭운임');
      
      const weightSurchargeResult = getWeightSurchargeWithExpiry('COWIN', input.weight);
      if (weightSurchargeResult.expired) cowinExpiredDetails.push('중량할증');
      
      // CRITICAL FIX: For COWIN combination (separate freight), use actual DP value
      const cowinDpValue = dpCostData.value;
      if (dpCostData.expired && !cowinExpiredDetails.includes('DP')) cowinExpiredDetails.push('DP');
      
      const cowinDthcResult = getDTHCByAgentAndRouteWithExpiry(agentName, input.pol, input.pod, isAgentSpecific);
      
      const total =
        seaFreightRate +
        seaFreightLocalCharge +
        cowinDthcResult.value +
        railResult.value +
        cowinTruck.rate +
        weightSurchargeResult.value +
        cowinDpValue +
        totalOtherCosts +
        input.domesticTransport;

      breakdown.push({
        agent: `${agentName} + COWIN`,
        railAgent: agentName,
        truckAgent: 'COWIN',
        seaFreight: seaFreightRate,
        localCharge: seaFreightLocalCharge,
        seaFreightId,
        seaFreightCarrier,
        isAgentSpecificSeaFreight: isAgentSpecific,
        dthc: cowinDthcResult.value,
        portBorder: railResult.value,
        borderDestination: cowinTruck.rate,
        combinedFreight: 0,
        isCombinedFreight: false,
        weightSurcharge: weightSurchargeResult.value,
        dp: cowinDpValue,
        domesticTransport: input.domesticTransport,
        otherCosts: input.otherCosts,
        total,
        hasExpiredRates: cowinExpiredDetails.length > 0,
        expiredRateDetails: cowinExpiredDetails.length > 0 ? cowinExpiredDetails : undefined,
      });
    }
  });

  if (breakdown.length === 0) {
    return null;
  }

  breakdown.sort((a, b) => {
    if (a.railAgent !== b.railAgent) {
      return a.railAgent.localeCompare(b.railAgent, 'ko');
    }
    return a.truckAgent.localeCompare(b.truckAgent, 'ko');
  });

  const lowestCostBreakdown = breakdown.reduce((min, current) =>
    current.total < min.total ? current : min
  );

  return {
    input,
    breakdown,
    lowestCostAgent: lowestCostBreakdown.agent,
    lowestCost: lowestCostBreakdown.total,
    isHistorical: !!input.historicalDate,
    historicalDate: input.historicalDate,
  };
};