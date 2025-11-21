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
  
  // 🆕 Track missing freights
  const missingFreights: MissingFreightInfo[] = [];

  console.log('🔍 ===== 원가 계산 시작 =====');
  console.log('📍 경로:', input.pol, '→', input.pod, '→ 목적지:', input.destinationId);
  console.log('📍 DP 포함 여부:', input.includeDP ? '✅ DP 포함' : '❌ DP 미포함');
  console.log('📦 전체 대리점 해상운임 데이터:', agentSeaFreights);

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

  // 🆕 DIAGNOSTIC: Log what data is actually available
  console.log('\n🔍 ===== 데이터 진단 =====');
  console.log('📦 combinedFreights 배열 길이:', currentCombinedFreights.length);
  console.log('📦 portBorderFreights 배열 길이:', currentPortBorderFreights.length);
  
  if (currentCombinedFreights.length > 0) {
    console.log('📋 통합운임 샘플 (처음 3개):');
    currentCombinedFreights.slice(0, 3).forEach((f, i) => {
      console.log(`   ${i + 1}. agent="${f.agent}", pol="${f.pol}", pod="${f.pod}", destinationId="${f.destinationId}"`);
    });
  } else {
    console.log('⚠️ 통합운임 데이터가 비어있습니다!');
  }
  
  if (currentPortBorderFreights.length > 0) {
    console.log('📋 철도운임 샘플 (처음 3개):');
    currentPortBorderFreights.slice(0, 3).forEach((f, i) => {
      console.log(`   ${i + 1}. agent="${f.agent}", pol="${f.pol}", pod="${f.pod}"`);
    });
  } else {
    console.log('⚠️ 철도운임 데이터가 비어있습니다!');
  }
  console.log('🔍 ===== 데이터 진단 완료 =====\n');

  // ✅ Check if there are ANY valid sea freight rates (general or agent-specific) for this route
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

  console.log('\n🔍 ===== 해상운임 유효성 검사 =====');
  console.log(`📋 유효한 일반 해상운임: ${hasValidGeneralSeaFreight ? '✅ 있음' : '❌ 없음'}`);
  console.log(`📋 유효한 대리점 해상운임: ${hasValidAgentSeaFreight ? '✅ 있음' : '❌ 없음'}`);

  // 🆕 CRITICAL FIX: When DP is included, MUST have general sea freight
  // Agent-specific sea freight alone is NOT sufficient for DP-included calculations
  if (input.includeDP) {
    console.log('\n🔍 DP 포함 모드: 일반 해상운임 필수 확인');
    if (!hasValidGeneralSeaFreight) {
      console.log('❌ DP 포함 모드에서는 일반 해상운임이 필수입니다.');
      console.log('   대리점 해상운임만 있는 경우는 조회 결과에 포함되지 않습니다.');
      missingFreights.push({
        type: 'seaFreight',
        route: `${input.pol} → ${input.pod}`,
        message: `일반 해상운임이 등록되지 않았습니다 (DP 포함 모드에서는 일반 해상운임 필수)`
      });
      
      console.log('🔍 ===== 원가 계산 완료 (결과 없음) =====\n');
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
    console.log('✅ 일반 해상운임이 존재하여 계산을 진행합니다.');
  } else {
    // DP 미포함 모드: 일반 해상운임 또는 대리점 해상운임 중 하나만 있어도 OK
    if (!hasValidGeneralSeaFreight && !hasValidAgentSeaFreight) {
      console.log('\n❌ 조회 날짜에 유효한 해상운임이 없습니다.');
      missingFreights.push({
        type: 'seaFreight',
        route: `${input.pol} → ${input.pod}`,
        message: `해상운임이 등록되지 않았습니다`
      });
    } else {
      console.log('✅ 유효한 해상운임이 존재하여 계산을 진행합니다.');
    }
  }
  console.log('🔍 ===== 해상운임 유효성 검사 완료 =====\n');

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
    console.log(`\n🔎 대리점 해상운임 검색: agent="${agent}", pol="${pol}", pod="${pod}"`);
    
    const filtered = currentAgentSeaFreights.filter(
      (f) => f.agent === agent && f.pol === pol && f.pod === pod
    );
    
    console.log(`   검색 결과 개수: ${filtered.length}`);
    if (filtered.length > 0) {
      console.log(`   검색된 데이터:`, filtered[0]);
      console.log(`   ✅ L.LOCAL 값: ${filtered[0].llocal}`);
    }
    
    if (filtered.length === 0) {
      console.log('   ❌ 대리점 해상운임 없음');
      return { value: null, expired: false };
    }
    
    const validFreights = filtered.filter(f => isValidOnDate(f.validFrom, f.validTo, calculationDate));
    if (validFreights.length > 0) {
      console.log(`   ✅ 유효한 대리점 해상운임 발견!`);
      console.log(`      - Rate: ${validFreights[0].rate}`);
      console.log(`      - LocalCharge: ${validFreights[0].localCharge}`);
      console.log(`      - L.LOCAL: ${validFreights[0].llocal}`);
      console.log(`      - Carrier: ${validFreights[0].carrier}`);
      return { 
        value: validFreights[0].rate, 
        expired: false, 
        carrier: validFreights[0].carrier,
        localCharge: validFreights[0].localCharge || 0,
        llocal: validFreights[0].llocal || 0
      };
    }
    
    console.log(`   ⚠️ 만료된 대리점 해상운임 사용`);
    return { 
      value: filtered[0].rate, 
      expired: true, 
      carrier: filtered[0].carrier,
      localCharge: filtered[0].localCharge || 0,
      llocal: filtered[0].llocal || 0
    };
  };

  // ✅ FIXED: Updated to filter by carrier as well
  const getDTHCByAgentAndRouteWithExpiry = (agent: string, pol: string, pod: string, carrier: string | undefined, isAgentSpecificSeaFreight: boolean): { value: number; expired: boolean } => {
    console.log(`\n🔎 D/O(DTHC) 검색: agent="${agent}", pol="${pol}", pod="${pod}", carrier="${carrier}"`);
    
    // If no carrier specified, return 0
    if (!carrier) {
      console.log('   ⚠️ 선사 정보 없음, D/O(DTHC) = 0');
      return { value: 0, expired: false };
    }
    
    // ✅ FIXED: Filter by agent, pol, pod, AND carrier
    const filtered = currentDthcList.filter((d) => 
      d.agent === agent && 
      d.pol === pol && 
      d.pod === pod && 
      d.carrier === carrier
    );
    
    console.log(`   검색 결과 개수: ${filtered.length}`);
    if (filtered.length > 0) {
      console.log(`   검색된 D/O(DTHC):`, filtered[0]);
    }
    
    if (filtered.length === 0) {
      console.log(`   ❌ 해당 선사(${carrier})의 D/O(DTHC) 없음`);
      return { value: 0, expired: false };
    }
    
    const validDTHC = filtered.filter(d => isValidOnDate(d.validFrom, d.validTo, calculationDate));
    if (validDTHC.length > 0) {
      const dthcValue = isAgentSpecificSeaFreight ? 0 : validDTHC[0].amount;
      console.log(`   ✅ 유효한 D/O(DTHC) 발견: ${dthcValue} (대리점 해상운임 사용: ${isAgentSpecificSeaFreight})`);
      return { value: dthcValue, expired: false };
    }
    
    const dthcValue = isAgentSpecificSeaFreight ? 0 : filtered[0].amount;
    console.log(`   ⚠️ 만료된 D/O(DTHC) 사용: ${dthcValue}`);
    return { value: dthcValue, expired: true };
  };

  const getCombinedFreightWithExpiry = (agent: string, pol: string, pod: string, destinationId: string): { value: number | null; expired: boolean } => {
    console.log(`\n🔎 통합운임 검색: agent="${agent}", pol="${pol}", pod="${pod}", destinationId="${destinationId}"`);
    
    const filtered = currentCombinedFreights.filter(
      (f) => f.agent === agent && f.pol === pol && f.pod === pod && f.destinationId === destinationId
    );
    
    console.log(`   검색 결과 개수: ${filtered.length}`);
    if (filtered.length > 0) {
      console.log(`   검색된 통합운임:`, filtered[0]);
    }
    
    if (filtered.length === 0) {
      console.log('   ❌ 통합운임 없음 (POL 불일치 가능성)');
      return { value: null, expired: false };
    }
    
    const validFreights = filtered.filter(f => isValidOnDate(f.validFrom, f.validTo, calculationDate));
    if (validFreights.length > 0) {
      console.log(`   ✅ 유효한 통합운임 발견: ${validFreights[0].rate}`);
      return { value: validFreights[0].rate, expired: false };
    }
    
    console.log(`   ⚠️ 만료된 통합운임 사용: ${filtered[0].rate}`);
    return { value: filtered[0].rate, expired: true };
  };

  // ✅ FIXED: Return null for "no data" vs actual value (including 0) for "data exists"
  const getBorderDestinationRateWithExpiry = (agent: string, destinationId: string): { value: number | null; expired: boolean } => {
    console.log(`\n🔎 트럭운임 검색: agent="${agent}", destinationId="${destinationId}"`);
    
    const filtered = currentBorderDestinationFreights.filter(
      (f) => f.agent === agent && f.destinationId === destinationId
    );
    
    console.log(`   검색 결과 개수: ${filtered.length}`);
    if (filtered.length > 0) {
      console.log(`   검색된 트럭운임:`, filtered[0]);
      console.log(`   📊 Rate 값: ${filtered[0].rate} (타입: ${typeof filtered[0].rate})`);
    }
    
    if (filtered.length === 0) {
      console.log('   ❌ 트럭운임 데이터 없음 (null 반환)');
      return { value: null, expired: false };
    }
    
    const validFreights = filtered.filter(f => isValidOnDate(f.validFrom, f.validTo, calculationDate));
    if (validFreights.length > 0) {
      console.log(`   ✅ 유효한 트럭운임 발견: ${validFreights[0].rate}`);
      return { value: validFreights[0].rate, expired: false };
    }
    
    console.log(`   ⚠️ 만료된 트럭운임 사용: ${filtered[0].rate}`);
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

  // ✅ FIXED: Return null for "no data" vs actual value (including 0) for "data exists"
  const getPortBorderRateWithExpiry = (agent: string, pol: string, pod: string): { value: number | null; expired: boolean } => {
    console.log(`\n🔎 철도운임 검색: agent="${agent}", pol="${pol}", pod="${pod}"`);
    
    const filtered = currentPortBorderFreights.filter(
      (f) => f.agent === agent && f.pol === pol && f.pod === pod
    );
    
    console.log(`   검색 결과 개수: ${filtered.length}`);
    if (filtered.length > 0) {
      console.log(`   검색된 철도운임:`, filtered[0]);
      console.log(`   📊 Rate 값: ${filtered[0].rate} (타입: ${typeof filtered[0].rate})`);
    }
    
    if (filtered.length === 0) {
      console.log('   ❌ 철도운임 데이터 없음 (null 반환)');
      return { value: null, expired: false };
    }
    
    const validFreights = filtered.filter(f => isValidOnDate(f.validFrom, f.validTo, calculationDate));
    if (validFreights.length > 0) {
      console.log(`   ✅ 유효한 철도운임 발견: ${validFreights[0].rate}`);
      return { value: validFreights[0].rate, expired: false };
    }
    
    console.log(`   ⚠️ 만료된 철도운임 사용: ${filtered[0].rate}`);
    return { value: filtered[0].rate, expired: true };
  };

  // CRITICAL FIX: Get DP cost once, will be used differently for combined vs separate freight
  const dpCostData = getDPCostWithExpiry(input.pol);
  const totalOtherCosts = input.otherCosts.reduce((sum, item) => sum + item.amount, 0);

  // ✅ FIXED: Filter rail agents by BOTH pol AND pod
  const railAgentsFromPortBorder = currentPortBorderFreights
    .filter(f => f.pol === input.pol && f.pod === input.pod)
    .map(f => f.agent);
  
  const railAgentsFromCombined = currentCombinedFreights
    .filter(f => f.pol === input.pol && f.pod === input.pod && f.destinationId === input.destinationId)
    .map(f => f.agent);
  
  // 🆕 CRITICAL FIX: When DP is included, do NOT collect agents from agent sea freight
  // Agent-specific sea freight should only be used when DP is NOT included
  const railAgentsFromAgentSeaFreight = input.includeDP 
    ? [] 
    : currentAgentSeaFreights
        .filter(f => f.pol === input.pol && f.pod === input.pod)
        .map(f => f.agent);
  
  console.log('\n📋 철도운임 대리점 (POL+POD 필터링 적용):', railAgentsFromPortBorder);
  console.log('📋 통합운임 대리점 (POL+POD 필터링 적용):', railAgentsFromCombined);
  console.log('📋 대리점 해상운임 대리점 (POL+POD 필터링 적용):', railAgentsFromAgentSeaFreight);
  if (input.includeDP) {
    console.log('⚠️ DP 포함 모드: 대리점 해상운임 대리점은 제외됨');
  }
  
  // ✅ FIXED: Merge all three sources and get unique agents
  const allAgentNames = [...new Set([...railAgentsFromPortBorder, ...railAgentsFromCombined, ...railAgentsFromAgentSeaFreight])];
  
  // Verify agents exist in railAgents list
  const railAgentsWithFreight = allAgentNames.filter(agentName => 
    railAgents.find(ra => ra.name === agentName)
  );
  
  console.log('\n📋 처리할 대리점 목록:', railAgentsWithFreight);
  
  const cowinTruck = currentBorderDestinationFreights.find(f => 
    f.agent === 'COWIN' && 
    f.destinationId === input.destinationId
  );

  const breakdown: AgentCostBreakdown[] = [];

  railAgentsWithFreight.forEach((agentName) => {
    console.log(`\n\n🏢 ===== ${agentName} 대리점 처리 시작 =====`);
    
    const expiredDetails: string[] = [];
    
    // 🆕 CRITICAL FIX: When DP is included, do NOT use agent-specific sea freight
    const agentSeaResult = input.includeDP 
      ? { value: null, expired: false }
      : getAgentSeaFreightWithExpiry(agentName, input.pol, input.pod);
    
    if (input.includeDP && agentSeaResult.value === null) {
      console.log('⚠️ DP 포함 모드: 대리점 해상운임은 사용하지 않음');
    }
    
    let seaFreightRate = 0;
    let seaFreightLocalCharge = 0;
    let seaFreightLLocal = 0;
    let seaFreightId: string | undefined;
    let seaFreightCarrier: string | undefined;
    let seaFreightCarrierCode: string | undefined;
    let isAgentSpecific = false;
    let seaFreightExpired = false;

    if (agentSeaResult.value !== null && !input.includeDP) {
      console.log(`\n✅ 대리점 해상운임 적용!`);
      seaFreightRate = agentSeaResult.value;
      seaFreightLocalCharge = agentSeaResult.localCharge || 0;
      seaFreightLLocal = agentSeaResult.llocal || 0;
      seaFreightCarrier = agentSeaResult.carrier;
      seaFreightCarrierCode = getShippingLineCode(seaFreightCarrier);
      isAgentSpecific = true;
      seaFreightExpired = agentSeaResult.expired;
      
      console.log(`   📊 적용된 값:`);
      console.log(`      - seaFreightRate: ${seaFreightRate}`);
      console.log(`      - seaFreightLocalCharge: ${seaFreightLocalCharge} 💰`);
      console.log(`      - seaFreightLLocal: ${seaFreightLLocal} ⭐`);
      console.log(`      - seaFreightCarrier: ${seaFreightCarrier}`);
      console.log(`      - seaFreightCarrierCode: ${seaFreightCarrierCode}`);
      console.log(`      - isAgentSpecific: ${isAgentSpecific}`);
      
      if (seaFreightExpired) expiredDetails.push('해상운임');
    } else if (input.selectedSeaFreightId) {
      console.log(`\n📌 선택된 일반 해상운임 사용`);
      const selectedFreight = currentSeaFreights.find(f => f.id === input.selectedSeaFreightId);
      if (selectedFreight) {
        seaFreightRate = selectedFreight.rate;
        seaFreightLocalCharge = selectedFreight.localCharge || 0;
        seaFreightId = selectedFreight.id;
        seaFreightCarrier = selectedFreight.carrier;
        seaFreightCarrierCode = getShippingLineCode(seaFreightCarrier);
        seaFreightExpired = !isValidOnDate(selectedFreight.validFrom, selectedFreight.validTo, calculationDate);
        console.log(`   - Rate: ${seaFreightRate}, LocalCharge: ${seaFreightLocalCharge}`);
        if (seaFreightExpired) expiredDetails.push('해상운임');
      }
    } else {
      console.log(`\n🔍 일반 해상운임 검색`);
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
          console.log(`   ✅ 유효한 일반 해상운임 발견: Rate ${seaFreightRate}`);
        } else {
          seaFreightRate = allSeaFreights[0].rate;
          seaFreightLocalCharge = allSeaFreights[0].localCharge || 0;
          seaFreightId = allSeaFreights[0].id;
          seaFreightCarrier = allSeaFreights[0].carrier;
          seaFreightCarrierCode = getShippingLineCode(seaFreightCarrier);
          seaFreightExpired = true;
          expiredDetails.push('해상운임');
          console.log(`   ⚠️ 만료된 일반 해상운임 사용: Rate ${seaFreightRate}`);
        }
      }
    }
    
    // ✅ FIXED: Pass carrier to DTHC lookup
    const dthcResult = getDTHCByAgentAndRouteWithExpiry(agentName, input.pol, input.pod, seaFreightCarrier, isAgentSpecific);
    if (dthcResult.expired) expiredDetails.push('DTHC');
    
    const combinedResult = getCombinedFreightWithExpiry(agentName, input.pol, input.pod, input.destinationId);
    const railResult = getPortBorderRateWithExpiry(agentName, input.pol, input.pod);
    const ownTruckResult = getBorderDestinationRateWithExpiry(agentName, input.destinationId);
    
    // ✅ CRITICAL FIX: Accept rate=0 as valid data for combined freight
    const hasCombined = combinedResult.value !== null;
    // ✅ FIXED: Check if rail and truck data exist (not null), regardless of value
    const hasSeparate = railResult.value !== null && ownTruckResult.value !== null;
    
    console.log(`\n📊 경로 옵션 확인:`);
    console.log(`   - 통합운임 존재: ${hasCombined} (값: ${combinedResult.value})`);
    console.log(`   - 철도운임 존재: ${railResult.value !== null} (값: ${railResult.value})`);
    console.log(`   - 트럭운임 존재: ${ownTruckResult.value !== null} (값: ${ownTruckResult.value})`);
    console.log(`   - 분리운임 가능: ${hasSeparate}`);
    
    // ✅ FIXED: Check if agent has ONLY agent sea freight with NO inland freight options
    // An agent should be skipped ONLY if it has agent sea freight but NO combined freight AND NO rail freight
    const hasOnlyAgentSeaFreight = isAgentSpecific && !hasCombined && railResult.value === null;
    
    if (hasOnlyAgentSeaFreight) {
      console.log(`\n⚠️ ${agentName}는 대리점 해상운임만 있고 통합운임/철도운임이 없습니다.`);
      console.log(`   이 대리점은 계산에서 제외됩니다.`);
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
      
      // CRITICAL FIX: For combined freight, DP is always 0
      const combinedDpValue = 0;
      
      // NEW LOGIC: L.LOCAL is added directly to total (negative L.LOCAL reduces total, positive L.LOCAL increases total)
      const total =
        seaFreightRate +
        seaFreightLocalCharge +
        dthcResult.value +
        combinedResult.value +
        weightSurchargeResult.value +
        combinedDpValue +
        totalOtherCosts +
        input.domesticTransport +
        seaFreightLLocal; // Add L.LOCAL directly (negative reduces, positive increases)

      console.log(`\n💰 통합운임 계산 완료:`);
      console.log(`   총액 = ${seaFreightRate} + ${seaFreightLocalCharge} + ${dthcResult.value} + ${combinedResult.value} + ${weightSurchargeResult.value} + ${combinedDpValue} + ${totalOtherCosts} + ${input.domesticTransport} + ${seaFreightLLocal}`);
      console.log(`   총액 = ${total}`);
      console.log(`   ⭐ L.LOCAL: ${seaFreightLLocal >= 0 ? '+' : ''}${seaFreightLLocal}`);

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
      
      console.log(`   ✅ Breakdown에 추가됨 - localCharge: ${seaFreightLocalCharge}, llocal: ${seaFreightLLocal}`);
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
      
      // ✅ FIXED: Use 0 if values are null (data exists but value is 0)
      const railValue = railResult.value ?? 0;
      const truckValue = ownTruckResult.value ?? 0;
      
      // NEW LOGIC: L.LOCAL is added directly to total (negative L.LOCAL reduces total, positive L.LOCAL increases total)
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
        seaFreightLLocal; // Add L.LOCAL directly (negative reduces, positive increases)

      console.log(`\n💰 분리운임 계산 완료:`);
      console.log(`   총액 = ${seaFreightRate} + ${seaFreightLocalCharge} + ${dthcResult.value} + ${railValue} + ${truckValue} + ${weightSurchargeResult.value} + ${separateDpValue} + ${totalOtherCosts} + ${input.domesticTransport} + ${seaFreightLLocal}`);
      console.log(`   총액 = ${total}`);
      console.log(`   ⭐ L.LOCAL: ${seaFreightLLocal >= 0 ? '+' : ''}${seaFreightLLocal}`);

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
      
      console.log(`   ✅ Breakdown에 추가됨 - localCharge: ${seaFreightLocalCharge}, llocal: ${seaFreightLLocal}`);
    }

    // Add rail + COWIN truck combination if COWIN truck exists and rail exists
    if (cowinTruck && cowinTruck.rate > 0 && railResult.value !== null) {
      const cowinExpiredDetails = [...expiredDetails];
      if (railResult.expired) cowinExpiredDetails.push('철도운임');
      const cowinTruckExpired = !isValidOnDate(cowinTruck.validFrom, cowinTruck.validTo, calculationDate);
      if (cowinTruckExpired) cowinExpiredDetails.push('트럭운임');
      
      const weightSurchargeResult = getWeightSurchargeWithExpiry('COWIN', input.weight);
      if (weightSurchargeResult.expired) cowinExpiredDetails.push('중량할증');
      
      // CRITICAL FIX: For COWIN combination (separate freight), use actual DP value
      const cowinDpValue = dpCostData.value;
      if (dpCostData.expired && !cowinExpiredDetails.includes('DP')) cowinExpiredDetails.push('DP');
      
      // ✅ FIXED: Pass carrier to DTHC lookup for COWIN combination
      const cowinDthcResult = getDTHCByAgentAndRouteWithExpiry(agentName, input.pol, input.pod, seaFreightCarrier, isAgentSpecific);
      
      const cowinTruckAgentCode = getTruckAgentCode('COWIN');
      
      // ✅ FIXED: Use 0 if railResult.value is null
      const railValue = railResult.value ?? 0;
      
      // NEW LOGIC: L.LOCAL is added directly to total (negative L.LOCAL reduces total, positive L.LOCAL increases total)
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
        seaFreightLLocal; // Add L.LOCAL directly (negative reduces, positive increases)

      console.log(`\n💰 COWIN 조합 계산 완료:`);
      console.log(`   총액 = ${seaFreightRate} + ${seaFreightLocalCharge} + ${cowinDthcResult.value} + ${railValue} + ${cowinTruck.rate} + ${weightSurchargeResult.value} + ${cowinDpValue} + ${totalOtherCosts} + ${input.domesticTransport} + ${seaFreightLLocal}`);
      console.log(`   총액 = ${total}`);
      console.log(`   ⭐ L.LOCAL: ${seaFreightLLocal >= 0 ? '+' : ''}${seaFreightLLocal}`);

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
      
      console.log(`   ✅ Breakdown에 추가됨 - localCharge: ${seaFreightLocalCharge}, llocal: ${seaFreightLLocal}`);
    }
  });

  // 🆕 Return result with missing freight info even if breakdown is empty
  if (breakdown.length === 0) {
    console.log('\n❌ Breakdown이 비어있음!');
    console.log('🔍 ===== 원가 계산 완료 (결과 없음) =====\n');
    
    // Return result with missing freight information
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

  console.log('\n\n📊 ===== 최종 Breakdown =====');
  breakdown.forEach((b, index) => {
    console.log(`\n${index + 1}. ${b.agent}`);
    console.log(`   - 대리점 해상운임 사용: ${b.isAgentSpecificSeaFreight ? '✅ YES' : '❌ NO'}`);
    console.log(`   - LocalCharge: ${b.localCharge} 💰`);
    console.log(`   - L.LOCAL: ${b.llocal} ${b.llocal !== 0 ? '⭐' : ''}`);
    console.log(`   - 총액: ${b.total}`);
  });

  breakdown.sort((a, b) => {
    if (a.railAgent !== b.railAgent) {
      return a.railAgent.localeCompare(b.railAgent, 'ko');
    }
    return a.truckAgent.localeCompare(b.truckAgent, 'ko');
  });

  const lowestCostBreakdown = breakdown.reduce((min, current) =>
    current.total < min.total ? current : min
  );

  console.log('\n🏆 최저가:', lowestCostBreakdown.agent, '-', lowestCostBreakdown.total);
  console.log('🔍 ===== 원가 계산 완료 =====\n');

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