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
  qingdao: number;
  tianjin: number;
  lianyungang: number;
  dandong: number;
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
  destination: string;
  railAgent?: string;
  truckAgent?: string;
  weight: number;
  calculationDate: string;
  otherCosts?: OtherCost[]; // Additional other costs
}

export interface AgentCostBreakdown {
  agentName: string;
  agentType: 'rail' | 'truck';
  seaFreight?: number;
  agentSeaFreight?: number;
  dthc?: number;
  dpCost?: number;
  combinedFreight?: number;
  portBorderFreight?: number;
  borderDestinationFreight?: number;
  weightSurcharge?: number;
  localCharge?: number;
  otherCosts?: OtherCost[];
  totalCost: number;
  carrier?: string;
  details?: string;
}

export interface CostCalculationResult {
  pol: string;
  pod: string;
  destination: string;
  weight: number;
  calculationDate: string;
  agentBreakdowns: AgentCostBreakdown[];
  lowestCost?: {
    agentName: string;
    agentType: 'rail' | 'truck';
    totalCost: number;
  };
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
  entityType: string;
  entityId: string;
  snapshotData: Record<string, unknown>;
  validFrom: string;
  validTo: string;
  createdAt: string;
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
  
  // Loading states
  isLoading: boolean;
  
  // CRUD operations for each entity
  addShippingLine: (line: Omit<ShippingLine, 'id'>) => Promise<void>;
  updateShippingLine: (id: string, line: Partial<ShippingLine>) => Promise<void>;
  deleteShippingLine: (id: string) => Promise<void>;
  
  addPort: (port: Omit<Port, 'id'>) => Promise<void>;
  updatePort: (id: string, port: Partial<Port>) => Promise<void>;
  deletePort: (id: string) => Promise<void>;
  
  addRailAgent: (agent: Omit<RailAgent, 'id'>) => Promise<void>;
  updateRailAgent: (id: string, agent: Partial<RailAgent>) => Promise<void>;
  deleteRailAgent: (id: string) => Promise<void>;
  
  addTruckAgent: (agent: Omit<TruckAgent, 'id'>) => Promise<void>;
  updateTruckAgent: (id: string, agent: Partial<TruckAgent>) => Promise<void>;
  deleteTruckAgent: (id: string) => Promise<void>;
  
  addDestination: (destination: Omit<Destination, 'id'>) => Promise<void>;
  updateDestination: (id: string, destination: Partial<Destination>) => Promise<void>;
  deleteDestination: (id: string) => Promise<void>;
  
  addSeaFreight: (freight: Omit<SeaFreight, 'id'>) => Promise<void>;
  updateSeaFreight: (id: string, freight: Partial<SeaFreight>) => Promise<void>;
  deleteSeaFreight: (id: string) => Promise<void>;
  
  addAgentSeaFreight: (freight: Omit<AgentSeaFreight, 'id'>) => Promise<void>;
  updateAgentSeaFreight: (id: string, freight: Partial<AgentSeaFreight>) => Promise<void>;
  deleteAgentSeaFreight: (id: string) => Promise<void>;
  
  addDTHC: (dthc: Omit<DTHC, 'id'>) => Promise<void>;
  updateDTHC: (id: string, dthc: Partial<DTHC>) => Promise<void>;
  deleteDTHC: (id: string) => Promise<void>;
  
  addDPCost: (cost: Omit<DPCost, 'id'>) => Promise<void>;
  updateDPCost: (id: string, cost: Partial<DPCost>) => Promise<void>;
  deleteDPCost: (id: string) => Promise<void>;
  
  addCombinedFreight: (freight: Omit<CombinedFreight, 'id'>) => Promise<void>;
  updateCombinedFreight: (id: string, freight: Partial<CombinedFreight>) => Promise<void>;
  deleteCombinedFreight: (id: string) => Promise<void>;
  
  addPortBorderFreight: (freight: Omit<PortBorderFreight, 'id'>) => Promise<void>;
  updatePortBorderFreight: (id: string, freight: Partial<PortBorderFreight>) => Promise<void>;
  deletePortBorderFreight: (id: string) => Promise<void>;
  
  addBorderDestinationFreight: (freight: Omit<BorderDestinationFreight, 'id'>) => Promise<void>;
  updateBorderDestinationFreight: (id: string, freight: Partial<BorderDestinationFreight>) => Promise<void>;
  deleteBorderDestinationFreight: (id: string) => Promise<void>;
  
  addWeightSurchargeRule: (rule: Omit<WeightSurchargeRule, 'id'>) => Promise<void>;
  updateWeightSurchargeRule: (id: string, rule: Partial<WeightSurchargeRule>) => Promise<void>;
  deleteWeightSurchargeRule: (id: string) => Promise<void>;
  
  // Calculation operations
  calculateFreight: (input: CostCalculationInput) => Promise<CostCalculationResult>;
  saveCalculationHistory: (calculation: Omit<CalculationHistory, 'id' | 'createdAt'>) => Promise<void>;
  deleteCalculationHistory: (id: string) => Promise<void>;
  deleteCalculationHistoryBatch: (ids: string[]) => Promise<void>;
  
  // Quotation operations
  createQuotation: (quotation: Omit<Quotation, 'id' | 'createdAt'>) => Promise<void>;
  updateQuotation: (id: string, quotation: Partial<Quotation>) => Promise<void>;
  deleteQuotation: (id: string) => Promise<void>;
  
  // Utility functions
  refreshData: () => Promise<void>;
  isRateValid: (validFrom: string, validTo: string, checkDate: string) => boolean;
}