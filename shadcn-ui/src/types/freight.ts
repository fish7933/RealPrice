export interface User {
  id: string;
  username: string;
  name: string;
  position?: string;
  role: 'superadmin' | 'admin' | 'viewer';
  password?: string; // Only used when creating/updating users
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

export interface Port {
  id: string;
  name: string;
  type: 'POL' | 'POD';
  country: string;
  description?: string;
}

export interface ShippingLine {
  id: string;
  name: string;
  code: string;
  description?: string;
}

export interface RailAgent {
  id: string;
  name: string;
  description?: string;
}

export interface TruckAgent {
  id: string;
  name: string;
  description?: string;
}

export interface Destination {
  id: string;
  name: string;
  description?: string;
}

export interface SeaFreight {
  id: string;
  pol: string;
  pod: string;
  rate: number;
  localCharge?: number; // L.LOCAL charge
  carrier?: string;
  note?: string;
  validFrom: string;
  validTo: string;
}

export interface AgentSeaFreight {
  id: string;
  agent: string;
  pol: string;
  pod: string;
  rate: number;
  llocal?: number; // L.LOCAL charge that will be deducted from total
  carrier?: string;
  note?: string;
  validFrom: string;
  validTo: string;
}

export interface DTHC {
  id: string;
  agent: string;
  pol: string;
  pod: string;
  carrier: string; // Added carrier field - REQUIRED
  amount: number;
  description?: string;
  validFrom: string;
  validTo: string;
  version?: number;
}

export interface DPCost {
  id: string;
  port: string;
  amount: number;
  description?: string;
  validFrom: string;
  validTo: string;
}

export interface CombinedFreight {
  id: string;
  agent: string;
  pod: string;
  destinationId: string;
  rate: number;
  description?: string;
  validFrom: string;
  validTo: string;
}

export interface PortBorderFreight {
  id: string;
  agent: string;
  pod: string;
  rate: number;
  validFrom: string;
  validTo: string;
}

export interface BorderDestinationFreight {
  id: string;
  agent: string;
  destinationId: string;
  rate: number;
  validFrom: string;
  validTo: string;
}

export interface WeightSurchargeRule {
  id: string;
  agent: string;
  minWeight: number;
  maxWeight: number;
  surcharge: number;
  validFrom: string;
  validTo: string;
}

export interface OtherCost {
  id: string;
  name: string;
  amount: number;
  description?: string;
}

export interface CostCalculationInput {
  pol: string;
  pod: string;
  destinationId: string;
  weight: number;
  includeDP: boolean;
  domesticTransport: number;
  otherCosts: { name: string; amount: number }[];
  selectedSeaFreightId?: string;
  historicalDate?: string;
}

// This is the actual breakdown structure used in freightCalculations.ts
export interface AgentCostBreakdown {
  agent: string;
  railAgent: string;
  truckAgent: string;
  seaFreight: number;
  localCharge: number;
  llocal: number; // L.LOCAL deduction
  seaFreightId?: string;
  seaFreightCarrier?: string;
  isAgentSpecificSeaFreight: boolean;
  dthc: number;
  portBorder: number;
  borderDestination: number;
  combinedFreight: number;
  isCombinedFreight: boolean;
  weightSurcharge: number;
  dp: number;
  domesticTransport: number;
  otherCosts: { name: string; amount: number }[];
  total: number;
  hasExpiredRates: boolean;
  expiredRateDetails?: string[];
}

// This is the actual result structure returned by calculateCost
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
  userId: string;
  pol: string;
  pod: string;
  destination: string;
  railAgent?: string;
  truckAgent?: string;
  weight: number;
  calculationDate: string;
  otherCosts?: OtherCost[];
  result: CostCalculationResult;
  createdAt: string;
  updatedAt?: string;
}

export interface Quotation {
  id: string;
  userId: string;
  calculationHistoryId?: string;
  quotationNumber: string;
  customerName: string;
  customerEmail?: string;
  pol: string;
  pod: string;
  destination: string;
  weight: number;
  selectedAgent: string;
  selectedAgentType: 'rail' | 'truck';
  totalCost: number;
  breakdown: AgentCostBreakdown;
  validFrom: string;
  validTo: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface FreightAuditLog {
  id: string;
  userId: string;
  action: 'create' | 'update' | 'delete';
  entityType: string;
  entityId: string;
  oldData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
  timestamp: string;
}

export interface HistoricalFreightSnapshot {
  id: string;
  seaFreights?: SeaFreight[];
  agentSeaFreights?: AgentSeaFreight[];
  dthcList?: DTHC[];
  dpCosts?: DPCost[];
  combinedFreights?: CombinedFreight[];
  portBorderFreights?: PortBorderFreight[];
  borderDestinationFreights?: BorderDestinationFreight[];
  weightSurchargeRules?: WeightSurchargeRule[];
}

export interface CalculationResult {
  id?: string;
  pol: string;
  pod: string;
  destination: string;
  railAgent?: string;
  truckAgent?: string;
  weight: number;
  totalCost: number;
  breakdown: {
    seaFreight?: number;
    agentSeaFreight?: number;
    dthc?: number;
    dpCost?: number;
    combinedFreight?: number;
    portBorderFreight?: number;
    borderDestinationFreight?: number;
    weightSurcharge?: number;
    localCharge?: number;
    llocal?: number; // L.LOCAL deduction
    carrier?: string;
    [key: string]: number | string | undefined;
  };
  createdAt?: string;
  userId?: string;
}

export interface BorderCity {
  id: string;
  name: string;
  country: string;
  description?: string;
  isDefault: boolean;
  isActive: boolean;
}

export interface SystemSetting {
  id: string;
  settingKey: string;
  settingValue: string;
  settingType: 'text' | 'number' | 'boolean' | 'json';
  category: 'general' | 'freight' | 'currency' | 'units';
  description?: string;
  isEditable: boolean;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  oldData?: Record<string, unknown>;
  newData?: Record<string, unknown>;
  createdAt: string;
}

export interface FreightContextType {
  // Data states
  shippingLines: ShippingLine[];
  ports: Port[];
  railAgents: RailAgent[];
  truckAgents: TruckAgent[];
  destinations: Destination[];
  seaFreights: SeaFreight[];
  agentSeaFreights: AgentSeaFreight[];
  dthcList: DTHC[];
  dpCosts: DPCost[];
  combinedFreights: CombinedFreight[];
  portBorderFreights: PortBorderFreight[];
  borderDestinationFreights: BorderDestinationFreight[];
  weightSurchargeRules: WeightSurchargeRule[];
  calculationHistory: CalculationHistory[];
  quotations: Quotation[];
  auditLogs: AuditLog[];
  borderCities: BorderCity[];
  systemSettings: SystemSetting[];
  
  // CRUD operations for each entity
  addShippingLine: (line: Omit<ShippingLine, 'id'>) => Promise<void>;
  updateShippingLine: (id: string, line: Partial<ShippingLine>) => Promise<void>;
  deleteShippingLine: (id: string) => Promise<void>;
  getShippingLineById: (id: string) => ShippingLine | undefined;
  
  addPort: (port: Omit<Port, 'id'>) => Promise<void>;
  updatePort: (id: string, port: Partial<Port>) => Promise<void>;
  deletePort: (id: string) => Promise<void>;
  getPortById: (id: string) => Port | undefined;
  
  addRailAgent: (agent: Omit<RailAgent, 'id'>) => Promise<void>;
  updateRailAgent: (id: string, agent: Partial<RailAgent>) => Promise<void>;
  deleteRailAgent: (id: string) => Promise<void>;
  getRailAgentById: (id: string) => RailAgent | undefined;
  
  addTruckAgent: (agent: Omit<TruckAgent, 'id'>) => Promise<void>;
  updateTruckAgent: (id: string, agent: Partial<TruckAgent>) => Promise<void>;
  deleteTruckAgent: (id: string) => Promise<void>;
  getTruckAgentById: (id: string) => TruckAgent | undefined;
  
  addDestination: (destination: Omit<Destination, 'id'>) => Promise<void>;
  updateDestination: (id: string, destination: Partial<Destination>) => Promise<void>;
  deleteDestination: (id: string) => Promise<void>;
  getDestinationById: (id: string) => Destination | undefined;
  
  addSeaFreight: (freight: Omit<SeaFreight, 'id'>) => Promise<void>;
  updateSeaFreight: (id: string, freight: Partial<SeaFreight>) => Promise<void>;
  deleteSeaFreight: (id: string) => Promise<void>;
  getSeaFreightOptions: (pol: string, pod: string, date?: string) => SeaFreight[];
  getSeaFreightVersion: (carrier: string, pol: string, pod: string, excludeId?: string) => number;
  
  addAgentSeaFreight: (freight: Omit<AgentSeaFreight, 'id'>) => Promise<void>;
  updateAgentSeaFreight: (id: string, freight: Partial<AgentSeaFreight>) => Promise<void>;
  deleteAgentSeaFreight: (id: string) => Promise<void>;
  getAgentSeaFreight: (agent: string, pol: string, pod: string, date?: string) => AgentSeaFreight | undefined;
  getAgentSeaFreightVersion: (agent: string, pol: string, pod: string, excludeId?: string) => number;
  
  addDTHC: (dthc: Omit<DTHC, 'id'>) => Promise<void>;
  updateDTHC: (id: string, dthc: Partial<DTHC>) => Promise<void>;
  deleteDTHC: (id: string) => Promise<void>;
  getDTHCByAgentAndRoute: (agent: string, pol: string, pod: string, date?: string) => DTHC | undefined;
  
  addDPCost: (cost: Omit<DPCost, 'id'>) => Promise<void>;
  updateDPCost: (id: string, cost: Partial<DPCost>) => Promise<void>;
  deleteDPCost: (id: string) => Promise<void>;
  getDPCost: (port: string, date?: string) => number;
  
  addCombinedFreight: (freight: Omit<CombinedFreight, 'id'>) => Promise<void>;
  updateCombinedFreight: (id: string, freight: Partial<CombinedFreight>) => Promise<void>;
  deleteCombinedFreight: (id: string) => Promise<void>;
  getCombinedFreight: (agent: string, pod: string, destinationId: string, date?: string) => CombinedFreight | undefined;
  
  addPortBorderFreight: (freight: Omit<PortBorderFreight, 'id'>) => Promise<void>;
  updatePortBorderFreight: (id: string, freight: Partial<PortBorderFreight>) => Promise<void>;
  deletePortBorderFreight: (id: string) => Promise<void>;
  getPortBorderRate: (agent: string, pod: string, date?: string) => number;
  
  addBorderDestinationFreight: (freight: Omit<BorderDestinationFreight, 'id'>) => Promise<void>;
  updateBorderDestinationFreight: (id: string, freight: Partial<BorderDestinationFreight>) => Promise<void>;
  deleteBorderDestinationFreight: (id: string) => Promise<void>;
  getBorderDestinationRate: (agent: string, destinationId: string, date?: string) => number;
  
  addWeightSurchargeRule: (rule: Omit<WeightSurchargeRule, 'id'>) => Promise<void>;
  updateWeightSurchargeRule: (id: string, rule: Partial<WeightSurchargeRule>) => Promise<void>;
  deleteWeightSurchargeRule: (id: string) => Promise<void>;
  getWeightSurcharge: (agent: string, weight: number, date?: string) => number;
  
  // Calculation operations
  calculateCost: (input: CostCalculationInput) => CostCalculationResult | null;
  addCalculationHistory: (history: Omit<CalculationHistory, 'id' | 'createdAt'>) => Promise<void>;
  deleteCalculationHistory: (id: string) => Promise<void>;
  getCalculationHistoryById: (id: string) => CalculationHistory | undefined;
  
  // Quotation operations
  addQuotation: (quotation: Omit<Quotation, 'id' | 'createdAt'>) => Promise<void>;
  deleteQuotation: (id: string) => Promise<void>;
  getQuotationById: (id: string) => Quotation | undefined;
  
  // Audit log operations
  getAuditLogsForEntity: (entityType: string, entityId: string) => AuditLog[];
  getAuditLogsByType: (entityType: string) => AuditLog[];
  deleteAuditLog: (id: string) => Promise<void>;
  clearAuditLogs: (entityType?: string) => Promise<void>;
  
  // Border city operations
  addBorderCity: (city: Omit<BorderCity, 'id'>) => Promise<void>;
  updateBorderCity: (id: string, city: Partial<BorderCity>) => Promise<void>;
  deleteBorderCity: (id: string) => Promise<void>;
  getBorderCityById: (id: string) => BorderCity | undefined;
  getDefaultBorderCity: () => BorderCity | undefined;
  
  // System setting operations
  addSystemSetting: (setting: Omit<SystemSetting, 'id'>) => Promise<void>;
  updateSystemSetting: (id: string, setting: Partial<SystemSetting>) => Promise<void>;
  deleteSystemSetting: (id: string) => Promise<void>;
  getSystemSettingByKey: (key: string) => SystemSetting | undefined;
  getSystemSettingValue: (key: string, defaultValue?: string) => string;
  
  // Time machine operations
  getHistoricalSnapshot: (targetDate: string) => HistoricalFreightSnapshot | null;
  getAvailableHistoricalDates: () => string[];
  getHistoricalFreightOptions: (date: string, pol: string, pod: string) => SeaFreight[];
  
  // Utility functions
  isValidOnDate: (validFrom: string, validTo: string, checkDate: string) => boolean;
  getTotalOtherCosts: () => number;
}