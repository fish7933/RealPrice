// User types
export interface User {
  id: string;
  username: string;
  password: string;
  role: 'superadmin' | 'admin' | 'user';
  createdAt: string;
  displayName?: string;
  email?: string;
}

// Version types
export interface AppVersion {
  id: string;
  version: string;
  updatedAt: string;
  createdAt: string;
}

// Agent types
export interface RailAgent {
  id: string;
  name: string;
  code?: string;
  description?: string;
  createdAt: string;
}

export interface TruckAgent {
  id: string;
  name: string;
  code?: string;
  description?: string;
  createdAt: string;
}

// Shipping Line types
export interface ShippingLine {
  id: string;
  name: string;
  code?: string;
  description?: string;
  createdAt: string;
}

// Port and Destination types
export interface Port {
  id: string;
  code: string;
  name: string;
  country: string;
}

export interface Destination {
  id: string;
  name: string;
  code: string;
  province?: string;
  city?: string;
}

export interface BorderCity {
  id: string;
  name: string;
  code: string;
  isDefault: boolean;
  isActive: boolean;
}

// Freight types
export interface SeaFreight {
  id: string;
  carrier: string;
  pol: string;
  pod: string;
  rate: number;
  localCharge?: number;
  llocal?: number;
  validFrom: string;
  validTo: string;
  createdAt: string;
  version?: number;
  // Legacy fields for backward compatibility
  departurePort?: string;
  arrivalPort?: string;
  containerSize?: string;
  price?: number;
  currency?: string;
  railAgentId?: string;
  railAgentName?: string;
}

export interface AgentSeaFreight {
  id: string;
  agent: string;
  carrier?: string;
  pol: string;
  pod: string;
  rate: number;
  localCharge?: number;
  llocal?: number;
  validFrom: string;
  validTo: string;
  createdAt: string;
  version?: number;
}

export interface DTHC {
  id: string;
  agent: string;
  pol: string;
  pod: string;
  amount: number;
  validFrom: string;
  validTo: string;
  createdAt: string;
}

export interface DPCost {
  id: string;
  port: string;
  amount: number;
  validFrom: string;
  validTo: string;
  createdAt: string;
}

export interface CombinedFreight {
  id: string;
  agent: string;
  pol: string;
  pod: string;
  destinationId: string;
  rate: number;
  validFrom: string;
  validTo: string;
  createdAt: string;
}

export interface PortBorderFreight {
  id: string;
  agent: string;
  pol: string;
  pod: string;
  rate: number;
  validFrom: string;
  validTo: string;
  createdAt: string;
  version?: number;
  // Legacy fields for backward compatibility
  arrivalPort?: string;
  borderPoint?: string;
  containerSize?: string;
  price?: number;
  currency?: string;
  railAgentId?: string;
  railAgentName?: string;
}

export interface BorderDestinationFreight {
  id: string;
  agent: string;
  destinationId: string;
  rate: number;
  validFrom: string;
  validTo: string;
  createdAt: string;
  // Legacy fields for backward compatibility
  borderPoint?: string;
  destination?: string;
  containerSize?: string;
  price?: number;
  currency?: string;
  truckAgentId?: string;
  truckAgentName?: string;
}

export interface WeightSurchargeRule {
  id: string;
  agent: string;
  minWeight: number;
  maxWeight: number;
  surcharge: number;
  validFrom: string;
  validTo: string;
  createdAt: string;
}

export interface WeightSurcharge {
  id: string;
  truckAgentId: string;
  truckAgentName?: string;
  destination: string;
  containerSize: string;
  minWeight: number;
  maxWeight: number;
  surchargeType: 'fixed' | 'perTon';
  amount: number;
  currency: string;
  validFrom: string;
  validTo: string;
  createdAt: string;
}

// System settings
export interface SystemSetting {
  id: string;
  settingKey: string;
  settingValue: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// Audit log types
export interface FreightAuditLog {
  id: string;
  userId: string;
  username: string;
  action: 'create' | 'update' | 'delete';
  entityType: 'seaFreight' | 'agentSeaFreight' | 'dthc' | 'dpCost' | 'combinedFreight' | 'portBorderFreight' | 'borderDestinationFreight' | 'weightSurcharge';
  entityId: string;
  entitySnapshot: Record<string, unknown>;
  changes: Array<{
    field: string;
    oldValue?: string | number | boolean;
    newValue?: string | number | boolean;
  }>;
  timestamp: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  username: string;
  action: string;
  entityType: string;
  entityId: string;
  changes: Record<string, unknown>;
  timestamp: string;
}

// Historical snapshot
export interface HistoricalFreightSnapshot {
  date: string;
  seaFreights: SeaFreight[];
  agentSeaFreights: AgentSeaFreight[];
  dthcList: DTHC[];
  dpCosts: DPCost[];
  combinedFreights: CombinedFreight[];
  portBorderFreights: PortBorderFreight[];
  borderDestinationFreights: BorderDestinationFreight[];
  weightSurchargeRules: WeightSurchargeRule[];
}

// Calculation types
export interface OtherCost {
  name: string;
  amount: number;
}

export interface CostCalculationInput {
  pol: string;
  pod: string;
  destinationId: string;
  weight: number;
  domesticTransport: number;
  otherCosts: OtherCost[];
  selectedSeaFreightId?: string;
  historicalDate?: string;
  includeDP?: boolean;
}

export interface AgentCostBreakdown {
  agent: string;
  railAgent: string;
  railAgentCode?: string;
  truckAgent: string;
  truckAgentCode?: string;
  seaFreight: number;
  localCharge: number;
  llocal: number;
  seaFreightId?: string;
  seaFreightCarrier?: string;
  seaFreightCarrierCode?: string;
  isAgentSpecificSeaFreight: boolean;
  dthc: number;
  portBorder: number;
  borderDestination: number;
  combinedFreight: number;
  isCombinedFreight: boolean;
  weightSurcharge: number;
  dp: number;
  domesticTransport: number;
  otherCosts: OtherCost[];
  total: number;
  hasExpiredRates?: boolean;
  expiredRateDetails?: string[];
}

export interface CostCalculationResult {
  input: CostCalculationInput;
  breakdown: AgentCostBreakdown[];
  lowestCostAgent: string;
  lowestCost: number;
  isHistorical: boolean;
  historicalDate?: string;
}

export interface CalculationHistory {
  id: string;
  timestamp: string;
  input: CostCalculationInput;
  result: CostCalculationResult;
  userId?: string;
  username?: string;
}

// Local charge types
export interface LocalCharge {
  id: string;
  name: string;
  amount: number;
  currency: string;
}

// Legacy calculation result type
export interface CalculationResult {
  railAgentId: string;
  railAgentName: string;
  truckAgentId: string;
  truckAgentName: string;
  seaFreight: number;
  portBorderFreight: number;
  borderDestinationFreight: number;
  weightSurcharge: number;
  localCharges: number;
  totalCost: number;
  currency: string;
}