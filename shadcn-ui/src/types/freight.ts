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
  description?: string;
  createdAt: string;
}

export interface TruckAgent {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
}

// Freight types
export interface SeaFreight {
  id: string;
  departurePort: string;
  arrivalPort: string;
  containerSize: string;
  price: number;
  currency: string;
  validFrom: string;
  validTo: string;
  createdAt: string;
  railAgentId: string;
  railAgentName?: string;
}

export interface PortBorderFreight {
  id: string;
  arrivalPort: string;
  borderPoint: string;
  containerSize: string;
  price: number;
  currency: string;
  validFrom: string;
  validTo: string;
  createdAt: string;
  railAgentId: string;
  railAgentName?: string;
}

export interface BorderDestinationFreight {
  id: string;
  borderPoint: string;
  destination: string;
  containerSize: string;
  price: number;
  currency: string;
  validFrom: string;
  validTo: string;
  createdAt: string;
  truckAgentId: string;
  truckAgentName?: string;
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

// Audit log types
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

// Local charge types
export interface LocalCharge {
  id: string;
  name: string;
  amount: number;
  currency: string;
}

// Calculation types
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