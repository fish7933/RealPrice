import { isRateValid as isValidOnDateHelper } from '@/utils/validityHelper';
import {
  SeaFreight,
  AgentSeaFreight,
  DTHC,
  DPCost,
  CombinedFreight,
  PortBorderFreight,
  BorderDestinationFreight,
  WeightSurchargeRule,
  FreightAuditLog,
  HistoricalFreightSnapshot,
  BorderCity,
  SystemSetting,
} from '@/types/freight';

// Validity helper function
export const isValidOnDate = (validFrom: string, validTo: string, date?: string): boolean => {
  return isValidOnDateHelper(validFrom, validTo, date);
};

// Helper function to detect changes between old and new entity
export const detectChanges = (
  oldEntity: Record<string, unknown> | null,
  newEntity: Record<string, unknown>
): FreightAuditLog['changes'] => {
  const changes: FreightAuditLog['changes'] = [];
  const keys = new Set([...Object.keys(oldEntity || {}), ...Object.keys(newEntity || {})]);
  
  keys.forEach(key => {
    if (key === 'id' || key === 'createdAt' || key === 'updatedAt') return;
    
    const oldValue = oldEntity?.[key];
    const newValue = newEntity?.[key];
    
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      changes.push({
        field: key,
        oldValue: oldValue as string | number | boolean | undefined,
        newValue: newValue as string | number | boolean | undefined,
      });
    }
  });
  
  return changes;
};

// Get next version number for sea freight
export const getSeaFreightVersion = (
  seaFreights: SeaFreight[],
  carrier: string,
  pol: string,
  pod: string,
  excludeId?: string
): number => {
  const sameGroup = seaFreights.filter(f => 
    f.carrier === carrier && 
    f.pol === pol && 
    f.pod === pod &&
    f.id !== excludeId
  );
  if (sameGroup.length === 0) return 1;
  const maxVersion = Math.max(...sameGroup.map(f => f.version || 1));
  return maxVersion + 1;
};

// Get next version number for agent sea freight
// Now includes carrier to treat different carriers as separate entities
export const getAgentSeaFreightVersion = (
  agentSeaFreights: AgentSeaFreight[],
  agent: string,
  pol: string,
  pod: string,
  carrier?: string,
  excludeId?: string
): number => {
  const sameRoute = agentSeaFreights.filter(f => 
    f.agent === agent && 
    f.pol === pol && 
    f.pod === pod &&
    f.carrier === carrier &&
    f.id !== excludeId
  );
  if (sameRoute.length === 0) return 1;
  const maxVersion = Math.max(...sameRoute.map(f => f.version || 1));
  return maxVersion + 1;
};

// Get sea freight options
export const getSeaFreightOptions = (
  seaFreights: SeaFreight[],
  pol: string,
  pod: string,
  date?: string
): SeaFreight[] => {
  const filtered = seaFreights.filter((f) => f.pol === pol && f.pod === pod);
  if (date) {
    return filtered.filter(f => isValidOnDate(f.validFrom, f.validTo, date));
  }
  return filtered;
};

// Get agent sea freight
export const getAgentSeaFreight = (
  agentSeaFreights: AgentSeaFreight[],
  agent: string,
  pol: string,
  pod: string,
  date?: string
): number | null => {
  const filtered = agentSeaFreights.filter(
    (f) => f.agent === agent && f.pol === pol && f.pod === pod
  );
  
  if (date) {
    const validFreights = filtered.filter(f => isValidOnDate(f.validFrom, f.validTo, date));
    return validFreights.length > 0 ? validFreights[0].rate : null;
  }
  
  return filtered.length > 0 ? filtered[0].rate : null;
};

// Get DTHC by agent and route
export const getDTHCByAgentAndRoute = (
  dthcList: DTHC[],
  agent: string,
  pol: string,
  pod: string,
  date?: string
): number => {
  const filtered = dthcList.filter((d) => d.agent === agent && d.pol === pol && d.pod === pod);
  
  if (date) {
    const validDTHC = filtered.filter(d => isValidOnDate(d.validFrom, d.validTo, date));
    return validDTHC.length > 0 ? validDTHC[0].amount : 0;
  }
  
  return filtered.length > 0 ? filtered[0].amount : 0;
};

// Get DP cost
export const getDPCost = (
  dpCosts: DPCost[],
  port: string,
  date?: string
): number => {
  const filtered = dpCosts.filter((d) => d.port === port);
  
  if (date) {
    const validDP = filtered.filter(d => isValidOnDate(d.validFrom, d.validTo, date));
    return validDP.length > 0 ? validDP[0].amount : 0;
  }
  
  return filtered.length > 0 ? filtered[0].amount : 0;
};

// Get combined freight - NOW INCLUDES POL FILTERING
export const getCombinedFreight = (
  combinedFreights: CombinedFreight[],
  agent: string,
  pol: string,
  pod: string,
  destinationId: string,
  date?: string
): number | null => {
  const filtered = combinedFreights.filter(
    (f) => f.agent === agent && f.pol === pol && f.pod === pod && f.destinationId === destinationId
  );
  
  if (date) {
    const validFreights = filtered.filter(f => isValidOnDate(f.validFrom, f.validTo, date));
    return validFreights.length > 0 ? validFreights[0].rate : null;
  }
  
  return filtered.length > 0 ? filtered[0].rate : null;
};

// Get port border rate
export const getPortBorderRate = (
  portBorderFreights: PortBorderFreight[],
  agent: string,
  pod: string,
  date?: string
): number => {
  const filtered = portBorderFreights.filter(
    (f) => f.agent === agent && f.pod === pod
  );
  
  if (date) {
    const validFreights = filtered.filter(f => isValidOnDate(f.validFrom, f.validTo, date));
    return validFreights.length > 0 ? validFreights[0].rate : 0;
  }
  
  return filtered.length > 0 ? filtered[0].rate : 0;
};

// Get border destination rate
export const getBorderDestinationRate = (
  borderDestinationFreights: BorderDestinationFreight[],
  agent: string,
  destinationId: string,
  date?: string
): number => {
  const filtered = borderDestinationFreights.filter(
    (f) => f.agent === agent && f.destinationId === destinationId
  );
  
  if (date) {
    const validFreights = filtered.filter(f => isValidOnDate(f.validFrom, f.validTo, date));
    return validFreights.length > 0 ? validFreights[0].rate : 0;
  }
  
  return filtered.length > 0 ? filtered[0].rate : 0;
};

// Get weight surcharge
export const getWeightSurcharge = (
  weightSurchargeRules: WeightSurchargeRule[],
  agent: string,
  weight: number,
  date?: string
): number => {
  const filtered = weightSurchargeRules.filter(
    (r) => r.agent === agent && weight >= r.minWeight && weight <= r.maxWeight
  );
  
  if (date) {
    const validRules = filtered.filter(r => isValidOnDate(r.validFrom, r.validTo, date));
    return validRules.length > 0 ? validRules[0].surcharge : 0;
  }
  
  return filtered.length > 0 ? filtered[0].surcharge : 0;
};

// Get border city by ID
export const getBorderCityById = (
  borderCities: BorderCity[],
  id: string
): BorderCity | undefined => {
  return borderCities.find((c) => c.id === id);
};

// Get default border city
export const getDefaultBorderCity = (
  borderCities: BorderCity[]
): BorderCity | undefined => {
  return borderCities.find((c) => c.isDefault && c.isActive);
};

// Get system setting by key
export const getSystemSettingByKey = (
  systemSettings: SystemSetting[],
  key: string
): SystemSetting | undefined => {
  return systemSettings.find((s) => s.settingKey === key);
};

// Get system setting value
export const getSystemSettingValue = (
  systemSettings: SystemSetting[],
  key: string,
  defaultValue: string = ''
): string => {
  const setting = systemSettings.find((s) => s.settingKey === key);
  return setting ? setting.settingValue : defaultValue;
};

// Time Machine: Reconstruct entity
// ✅ FIXED: createdAt 날짜는 무시하고 audit log만 사용
export const reconstructEntity = <T extends Record<string, unknown>>(
  entityType: FreightAuditLog['entityType'],
  currentEntities: T[],
  auditLogs: FreightAuditLog[],
  targetTime: number
): T[] => {
  const relevantLogs = auditLogs
    .filter(log => log.entityType === entityType && new Date(log.timestamp).getTime() <= targetTime)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  
  const entityMap = new Map<string, T>();

  // ✅ CRITICAL FIX: 모든 현재 엔티티를 포함 (createdAt 체크 제거)
  // 유효기간(validFrom/validTo)만 체크하면 됨
  currentEntities.forEach(entity => {
    const entityId = (entity as { id: string }).id;
    entityMap.set(entityId, entity);
  });

  // Apply audit log changes on top of current entities
  relevantLogs.forEach(log => {
    if (log.action === 'create') {
      entityMap.set(log.entityId, log.entitySnapshot as T);
    } else if (log.action === 'update') {
      entityMap.set(log.entityId, log.entitySnapshot as T);
    } else if (log.action === 'delete') {
      entityMap.delete(log.entityId);
    }
  });

  return Array.from(entityMap.values());
};

// Get historical snapshot
// ✅ FIXED: 항상 null을 반환하여 현재 데이터 사용 (유효기간만 체크)
export const getHistoricalSnapshot = (
  targetDate: string,
  seaFreights: SeaFreight[],
  agentSeaFreights: AgentSeaFreight[],
  dthcList: DTHC[],
  dpCosts: DPCost[],
  combinedFreights: CombinedFreight[],
  portBorderFreights: PortBorderFreight[],
  borderDestinationFreights: BorderDestinationFreight[],
  weightSurchargeRules: WeightSurchargeRule[],
  auditLogs: FreightAuditLog[]
): HistoricalFreightSnapshot | null => {
  console.log(`🕰️ [getHistoricalSnapshot] Date: ${targetDate} - Using current data with validity period check only`);
  
  // ✅ CRITICAL FIX: 항상 null을 반환하여 현재 데이터를 사용하도록 함
  // 유효기간(validFrom/validTo)은 각 helper 함수에서 체크됨
  return null;
};

// Get available historical dates
export const getAvailableHistoricalDates = (auditLogs: FreightAuditLog[]): string[] => {
  const dates = new Set<string>();
  
  auditLogs.forEach(log => {
    const date = log.timestamp.split('T')[0];
    dates.add(date);
  });

  return Array.from(dates).sort((a, b) => b.localeCompare(a));
};

// Get historical freight options
export const getHistoricalFreightOptions = (
  date: string,
  pol: string,
  pod: string,
  seaFreights: SeaFreight[],
  agentSeaFreights: AgentSeaFreight[],
  dthcList: DTHC[],
  dpCosts: DPCost[],
  combinedFreights: CombinedFreight[],
  portBorderFreights: PortBorderFreight[],
  borderDestinationFreights: BorderDestinationFreight[],
  weightSurchargeRules: WeightSurchargeRule[],
  auditLogs: FreightAuditLog[]
): SeaFreight[] => {
  const snapshot = getHistoricalSnapshot(
    date,
    seaFreights,
    agentSeaFreights,
    dthcList,
    dpCosts,
    combinedFreights,
    portBorderFreights,
    borderDestinationFreights,
    weightSurchargeRules,
    auditLogs
  );
  if (!snapshot) return [];
  
  return snapshot.seaFreights.filter((f) => f.pol === pol && f.pod === pod);
};

// Get audit logs for entity
export const getAuditLogsForEntity = (
  auditLogs: FreightAuditLog[],
  entityType: FreightAuditLog['entityType'],
  entityId: string
): FreightAuditLog[] => {
  return auditLogs.filter(log => log.entityType === entityType && log.entityId === entityId);
};

// Get audit logs by type
export const getAuditLogsByType = (
  auditLogs: FreightAuditLog[],
  entityType: FreightAuditLog['entityType']
): FreightAuditLog[] => {
  return auditLogs.filter(log => log.entityType === entityType);
};