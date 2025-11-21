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
  TruckAgent,
  ShippingLine,
  HistoricalFreightSnapshot,
  MissingFreightInfo,
} from '@/types/freight';

// Cost Calculation with expired rate tracking and missing freight detection
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
  truckAgents: TruckAgent[],
  shippingLines: ShippingLine[],
  snapshot: HistoricalFreightSnapshot | null
): CostCalculationResult | null => {
  const calculationDate = input.historicalDate || new Date().toISOString().split('T')[0];
  
  // Track missing freights
  const missingFreights: MissingFreightInfo[] = [];

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

  // ============================================================
  // COMPREHENSIVE UPFRONT VALIDATION - Check ALL missing data
  // ============================================================
  console.log('🔍 [calculateFreightCost] 운임 데이터 검증 시작...');
  
  // 1. Check sea freight
  const hasValidGeneralSeaFreight = currentSeaFreights.some(f => 
    f.pol === input.pol && 
    f.pod === input.pod && 
    isValidOnDate(f.validFrom, f.validTo, calculationDate)
  );

  const hasValidAgentSeaFreight = currentAgentSeaFreights.some(f => 
    f.pol === input.pol && 
    f.pod === input.pod && 
    isValidOnDate(f.validFrom, f.validTo, calculationDate)
  );

  let hasSeaFreight = false;
  
  if (input.includeDP) {
    if (!hasValidGeneralSeaFreight) {
      const sqlQuery = `-- 일반 해상운임 조회 쿼리
SELECT * FROM app_741545ec66_sea_freights 
WHERE pol = '${input.pol}' 
  AND pod = '${input.pod}'
  AND valid_from <= '${calculationDate}'
  AND valid_to >= '${calculationDate}';`;
      
      console.log('\n❌ 누락된 운임 데이터 발견!');
      console.log('📍 경로:', `${input.pol} → ${input.pod}`);
      console.log('📋 필요한 데이터: 일반 해상운임 (DP 포함 모드)');
      console.log('\n🔍 데이터 확인 SQL 쿼리:');
      console.log(sqlQuery);
      
      missingFreights.push({
        type: 'seaFreight',
        route: `${input.pol} → ${input.pod}`,
        message: `일반 해상운임이 등록되지 않았습니다 (DP 포함 모드에서는 일반 해상운임 필수)`
      });
    } else {
      hasSeaFreight = true;
    }
  } else {
    if (!hasValidGeneralSeaFreight && !hasValidAgentSeaFreight) {
      const generalSeaFreightQuery = `-- 일반 해상운임 조회 쿼리
SELECT * FROM app_741545ec66_sea_freights 
WHERE pol = '${input.pol}' 
  AND pod = '${input.pod}'
  AND valid_from <= '${calculationDate}'
  AND valid_to >= '${calculationDate}';`;

      const agentSeaFreightQuery = `-- 대리점 해상운임 조회 쿼리
SELECT * FROM app_741545ec66_agent_sea_freights 
WHERE pol = '${input.pol}' 
  AND pod = '${input.pod}'
  AND valid_from <= '${calculationDate}'
  AND valid_to >= '${calculationDate}';`;
      
      console.log('\n❌ 누락된 운임 데이터 발견!');
      console.log('📍 경로:', `${input.pol} → ${input.pod}`);
      console.log('📋 필요한 데이터: 일반 해상운임 또는 대리점 해상운임');
      console.log('\n🔍 일반 해상운임 확인 SQL:');
      console.log(generalSeaFreightQuery);
      console.log('\n🔍 대리점 해상운임 확인 SQL:');
      console.log(agentSeaFreightQuery);
      
      missingFreights.push({
        type: 'seaFreight',
        route: `${input.pol} → ${input.pod}`,
        message: `해상운임이 등록되지 않았습니다`
      });
    } else {
      hasSeaFreight = true;
    }
  }

  // 2. Check rail and truck freight (only if we need to continue checking)
  // Get all potential agents from the data
  const railAgentsFromPortBorder = currentPortBorderFreights
    .filter(f => f.pol === input.pol && f.pod === input.pod)
    .map(f => f.agent);
  
  const railAgentsFromCombined = currentCombinedFreights
    .filter(f => f.pol === input.pol && f.pod === input.pod && f.destinationId === input.destinationId)
    .map(f => f.agent);
  
  const railAgentsFromAgentSeaFreight = input.includeDP 
    ? [] 
    : currentAgentSeaFreights
        .filter(f => f.pol === input.pol && f.pod === input.pod)
        .map(f => f.agent);
  
  const allAgentNames = [...new Set([...railAgentsFromPortBorder, ...railAgentsFromCombined, ...railAgentsFromAgentSeaFreight])];
  
  // Check if we have ANY valid freight combinations
  const hasCombinedFreight = currentCombinedFreights.some(f => 
    f.pol === input.pol && 
    f.pod === input.pod && 
    f.destinationId === input.destinationId &&
    isValidOnDate(f.validFrom, f.validTo, calculationDate)
  );
  
  const hasRailFreight = currentPortBorderFreights.some(f => 
    f.pol === input.pol && 
    f.pod === input.pod &&
    isValidOnDate(f.validFrom, f.validTo, calculationDate)
  );
  
  const hasTruckFreight = currentBorderDestinationFreights.some(f => 
    f.destinationId === input.destinationId &&
    isValidOnDate(f.validFrom, f.validTo, calculationDate)
  );

  // If no agents found at all, check what's missing
  if (allAgentNames.length === 0 || (!hasCombinedFreight && (!hasRailFreight || !hasTruckFreight))) {
    // Check combined freight
    if (!hasCombinedFreight) {
      const combinedSqlQuery = `-- 통합운임 조회 쿼리
SELECT * FROM app_741545ec66_combined_freights 
WHERE pol = '${input.pol}'
  AND pod = '${input.pod}'
  AND destination_id = '${input.destinationId}'
  AND valid_from <= '${calculationDate}'
  AND valid_to >= '${calculationDate}';`;
      
      console.log('\n❌ 통합운임 데이터 없음');
      console.log('📍 경로:', `${input.pol} → ${input.pod} → 목적지ID: ${input.destinationId}`);
      console.log('🔍 데이터 확인 SQL:');
      console.log(combinedSqlQuery);
      
      missingFreights.push({
        type: 'combinedFreight',
        route: `${input.pol} → ${input.pod} → ${input.destinationId}`,
        message: `통합운임이 등록되지 않았습니다`
      });
    }
    
    // Check rail freight (only if combined is missing)
    if (!hasCombinedFreight && !hasRailFreight) {
      const railSqlQuery = `-- 철도운임 조회 쿼리
SELECT * FROM app_741545ec66_port_border_freights 
WHERE pol = '${input.pol}'
  AND pod = '${input.pod}'
  AND valid_from <= '${calculationDate}'
  AND valid_to >= '${calculationDate}';`;
      
      console.log('\n❌ 철도운임 데이터 없음');
      console.log('📍 경로:', `${input.pol} → ${input.pod}`);
      console.log('🔍 데이터 확인 SQL:');
      console.log(railSqlQuery);
      
      missingFreights.push({
        type: 'railFreight',
        route: `${input.pol} → ${input.pod}`,
        message: `철도운임이 등록되지 않았습니다`
      });
    }
    
    // Check truck freight (only if combined is missing)
    if (!hasCombinedFreight && !hasTruckFreight) {
      const truckSqlQuery = `-- 트럭운임 조회 쿼리
SELECT * FROM app_741545ec66_border_destination_freights 
WHERE destination_id = '${input.destinationId}'
  AND valid_from <= '${calculationDate}'
  AND valid_to >= '${calculationDate}';`;
      
      console.log('\n❌ 트럭운임 데이터 없음');
      console.log('📍 목적지ID:', input.destinationId);
      console.log('🔍 데이터 확인 SQL:');
      console.log(truckSqlQuery);
      
      missingFreights.push({
        type: 'truckFreight',
        route: `목적지: ${input.destinationId}`,
        message: `트럭운임이 등록되지 않았습니다`
      });
    }
  }

  // If there are any missing freights, return early with all missing info
  if (missingFreights.length > 0) {
    console.log('\n⚠️ 총', missingFreights.length, '개의 운임 데이터가 누락되었습니다.');
    return {
      input,
      breakdown: [],
      lowestCostAgent: '',
      lowestCost: 0,
      isHistorical: !!input.historicalDate,
      historicalDate: input.historicalDate,
      missingFreights,
    };
  }

  console.log('✅ 모든 필수 운임 데이터 검증 완료\n');

  // ============================================================
  // PROCEED WITH CALCULATION (all validation passed)
  // ============================================================

  // Helper function to get agent code
  const getRailAgentCode = (agentName: string): string | undefined => {
    const agent = railAgents.find(a => a.name === agentName);
    return agent?.code;
  };

  const getTruckAgentCode = (agentName: string): string | undefined => {
    const agent = truckAgents.find(a => a.name === agentName);
    return agent?.code;
  };

  const getShippingLineCode = (carrierName: string | undefined): string | undefined => {
    if (!carrierName) return undefined;
    const line = shippingLines.find(l => l.name === carrierName);
    return line?.code;
  };

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

  const getAgentSeaFreightWithExpiry = (agent: string, pol: string, pod: string): { value: number | null; expired: boolean; carrier?: string; localCharge?: number; llocal?: number } => {
    const filtered = currentAgentSeaFreights.filter(
      (f) => f.agent === agent && f.pol === pol && f.pod === pod
    );
    
    if (filtered.length === 0) {
      return { value: null, expired: false };
    }
    
    const validFreights = filtered.filter(f => isValidOnDate(f.validFrom, f.validTo, calculationDate));
    if (validFreights.length > 0) {
      return { 
        value: validFreights[0].rate, 
        expired: false, 
        carrier: validFreights[0].carrier,
        localCharge: validFreights[0].localCharge || 0,
        llocal: validFreights[0].llocal || 0
      };
    }
    
    return { 
      value: filtered[0].rate, 
      expired: true, 
      carrier: filtered[0].carrier,
      localCharge: filtered[0].localCharge || 0,
      llocal: filtered[0].llocal || 0
    };
  };

  const getDTHCByAgentAndRouteWithExpiry = (agent: string, pol: string, pod: string, carrier: string | undefined, isAgentSpecificSeaFreight: boolean): { value: number; expired: boolean } => {
    if (!carrier) {
      return { value: 0, expired: false };
    }
    
    const filtered = currentDthcList.filter((d) => 
      d.agent === agent && 
      d.pol === pol && 
      d.pod === pod && 
      d.carrier === carrier
    );
    
    if (filtered.length === 0) {
      return { value: 0, expired: false };
    }
    
    const validDTHC = filtered.filter(d => isValidOnDate(d.validFrom, d.validTo, calculationDate));
    if (validDTHC.length > 0) {
      const dthcValue = isAgentSpecificSeaFreight ? 0 : validDTHC[0].amount;
      return { value: dthcValue, expired: false };
    }
    
    const dthcValue = isAgentSpecificSeaFreight ? 0 : filtered[0].amount;
    return { value: dthcValue, expired: true };
  };

  const getCombinedFreightWithExpiry = (agent: string, pol: string, pod: string, destinationId: string): { value: number | null; expired: boolean } => {
    const filtered = currentCombinedFreights.filter(
      (f) => f.agent === agent && f.pol === pol && f.pod === pod && f.destinationId === destinationId
    );
    
    if (filtered.length === 0) {
      return { value: null, expired: false };
    }
    
    const validFreights = filtered.filter(f => isValidOnDate(f.validFrom, f.validTo, calculationDate));
    if (validFreights.length > 0) {
      return { value: validFreights[0].rate, expired: false };
    }
    
    return { value: filtered[0].rate, expired: true };
  };

  const getBorderDestinationRateWithExpiry = (agent: string, destinationId: string): { value: number | null; expired: boolean } => {
    const filtered = currentBorderDestinationFreights.filter(
      (f) => f.agent === agent && f.destinationId === destinationId
    );
    
    if (filtered.length === 0) {
      return { value: null, expired: false };
    }
    
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

  const getPortBorderRateWithExpiry = (agent: string, pol: string, pod: string): { value: number | null; expired: boolean } => {
    const filtered = currentPortBorderFreights.filter(
      (f) => f.agent === agent && f.pol === pol && f.pod === pod
    );
    
    if (filtered.length === 0) {
      return { value: null, expired: false };
    }
    
    const validFreights = filtered.filter(f => isValidOnDate(f.validFrom, f.validTo, calculationDate));
    if (validFreights.length > 0) {
      return { value: validFreights[0].rate, expired: false };
    }
    
    return { value: filtered[0].rate, expired: true };
  };

  // Get DP cost once, will be used differently for combined vs separate freight
  const dpCostData = getDPCostWithExpiry(input.pol);
  const totalOtherCosts = input.otherCosts.reduce((sum, item) => sum + item.amount, 0);

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
    
    // When DP is included, do NOT use agent-specific sea freight
    const agentSeaResult = input.includeDP 
      ? { value: null, expired: false }
      : getAgentSeaFreightWithExpiry(agentName, input.pol, input.pod);
    
    let seaFreightRate = 0;
    let seaFreightLocalCharge = 0;
    let seaFreightLLocal = 0;
    let seaFreightId: string | undefined;
    let seaFreightCarrier: string | undefined;
    let seaFreightCarrierCode: string | undefined;
    let isAgentSpecific = false;
    let seaFreightExpired = false;

    if (agentSeaResult.value !== null && !input.includeDP) {
      seaFreightRate = agentSeaResult.value;
      seaFreightLocalCharge = agentSeaResult.localCharge || 0;
      seaFreightLLocal = agentSeaResult.llocal || 0;
      seaFreightCarrier = agentSeaResult.carrier;
      seaFreightCarrierCode = getShippingLineCode(seaFreightCarrier);
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
        seaFreightCarrierCode = getShippingLineCode(seaFreightCarrier);
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
          seaFreightCarrierCode = getShippingLineCode(seaFreightCarrier);
        } else {
          seaFreightRate = allSeaFreights[0].rate;
          seaFreightLocalCharge = allSeaFreights[0].localCharge || 0;
          seaFreightId = allSeaFreights[0].id;
          seaFreightCarrier = allSeaFreights[0].carrier;
          seaFreightCarrierCode = getShippingLineCode(seaFreightCarrier);
          seaFreightExpired = true;
          expiredDetails.push('해상운임');
        }
      }
    }
    
    const dthcResult = getDTHCByAgentAndRouteWithExpiry(agentName, input.pol, input.pod, seaFreightCarrier, isAgentSpecific);
    if (dthcResult.expired) expiredDetails.push('DTHC');
    
    const combinedResult = getCombinedFreightWithExpiry(agentName, input.pol, input.pod, input.destinationId);
    const railResult = getPortBorderRateWithExpiry(agentName, input.pol, input.pod);
    const ownTruckResult = getBorderDestinationRateWithExpiry(agentName, input.destinationId);
    
    const hasCombined = combinedResult.value !== null;
    const hasSeparate = railResult.value !== null && ownTruckResult.value !== null;
    
    // Check if agent has ONLY agent sea freight with NO inland freight options
    const hasOnlyAgentSeaFreight = isAgentSpecific && !hasCombined && railResult.value === null;
    
    if (hasOnlyAgentSeaFreight) {
      return; // Skip this agent
    }
    
    // Get agent codes
    const railAgentCode = getRailAgentCode(agentName);
    const truckAgentCode = getTruckAgentCode(agentName);
    
    // Add combined freight option if it exists
    if (hasCombined) {
      const combinedExpiredDetails = [...expiredDetails];
      if (combinedResult.expired) combinedExpiredDetails.push('통합운임');
      
      const weightSurchargeResult = getWeightSurchargeWithExpiry(agentName, input.weight);
      if (weightSurchargeResult.expired) combinedExpiredDetails.push('중량할증');
      
      const combinedDpValue = 0;
      
      const total =
        seaFreightRate +
        seaFreightLocalCharge +
        dthcResult.value +
        combinedResult.value +
        weightSurchargeResult.value +
        combinedDpValue +
        totalOtherCosts +
        input.domesticTransport +
        seaFreightLLocal;

      breakdown.push({
        agent: agentName,
        railAgent: agentName,
        railAgentCode,
        truckAgent: agentName,
        truckAgentCode,
        seaFreight: seaFreightRate,
        localCharge: seaFreightLocalCharge,
        llocal: seaFreightLLocal,
        seaFreightId,
        seaFreightCarrier,
        seaFreightCarrierCode,
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
      
      const separateDpValue = dpCostData.value;
      if (dpCostData.expired) separateExpiredDetails.push('DP');
      
      const railValue = railResult.value ?? 0;
      const truckValue = ownTruckResult.value ?? 0;
      
      const total =
        seaFreightRate +
        seaFreightLocalCharge +
        dthcResult.value +
        railValue +
        truckValue +
        weightSurchargeResult.value +
        separateDpValue +
        totalOtherCosts +
        input.domesticTransport +
        seaFreightLLocal;

      breakdown.push({
        agent: agentName,
        railAgent: agentName,
        railAgentCode,
        truckAgent: agentName,
        truckAgentCode,
        seaFreight: seaFreightRate,
        localCharge: seaFreightLocalCharge,
        llocal: seaFreightLLocal,
        seaFreightId,
        seaFreightCarrier,
        seaFreightCarrierCode,
        isAgentSpecificSeaFreight: isAgentSpecific,
        dthc: dthcResult.value,
        portBorder: railValue,
        borderDestination: truckValue,
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
    if (cowinTruck && cowinTruck.rate > 0 && railResult.value !== null) {
      const cowinExpiredDetails = [...expiredDetails];
      if (railResult.expired) cowinExpiredDetails.push('철도운임');
      const cowinTruckExpired = !isValidOnDate(cowinTruck.validFrom, cowinTruck.validTo, calculationDate);
      if (cowinTruckExpired) cowinExpiredDetails.push('트럭운임');
      
      const weightSurchargeResult = getWeightSurchargeWithExpiry('COWIN', input.weight);
      if (weightSurchargeResult.expired) cowinExpiredDetails.push('중량할증');
      
      const cowinDpValue = dpCostData.value;
      if (dpCostData.expired && !cowinExpiredDetails.includes('DP')) cowinExpiredDetails.push('DP');
      
      const cowinDthcResult = getDTHCByAgentAndRouteWithExpiry(agentName, input.pol, input.pod, seaFreightCarrier, isAgentSpecific);
      
      const cowinTruckAgentCode = getTruckAgentCode('COWIN');
      
      const railValue = railResult.value ?? 0;
      
      const total =
        seaFreightRate +
        seaFreightLocalCharge +
        cowinDthcResult.value +
        railValue +
        cowinTruck.rate +
        weightSurchargeResult.value +
        cowinDpValue +
        totalOtherCosts +
        input.domesticTransport +
        seaFreightLLocal;

      breakdown.push({
        agent: `${agentName} + COWIN`,
        railAgent: agentName,
        railAgentCode,
        truckAgent: 'COWIN',
        truckAgentCode: cowinTruckAgentCode,
        seaFreight: seaFreightRate,
        localCharge: seaFreightLocalCharge,
        llocal: seaFreightLLocal,
        seaFreightId,
        seaFreightCarrier,
        seaFreightCarrierCode,
        isAgentSpecificSeaFreight: isAgentSpecific,
        dthc: cowinDthcResult.value,
        portBorder: railValue,
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
    return {
      input,
      breakdown: [],
      lowestCostAgent: '',
      lowestCost: 0,
      isHistorical: !!input.historicalDate,
      historicalDate: input.historicalDate,
      missingFreights: missingFreights.length > 0 ? missingFreights : undefined,
    };
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
    missingFreights: missingFreights.length > 0 ? missingFreights : undefined,
  };
};