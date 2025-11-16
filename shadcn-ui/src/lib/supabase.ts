import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://lcubxwvkoqkhsvzstbay.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxjdWJ4d3Zrb3FraHN2enN0YmF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3OTI1NDYsImV4cCI6MjA3ODM2ODU0Nn0.emL4XB1PSUkNZVopMUlZjq1_oU6A5QD-t3ND_-Z3BOo';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // Disabled - we manage sessions ourselves
    autoRefreshToken: false,
  },
  global: {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
  },
  db: {
    schema: 'public',
  },
});

// Database table names - all tables now use unified app_51335ed80f prefix
export const TABLES = {
  USERS: 'app_51335ed80f_users',
  QUOTATIONS: 'app_51335ed80f_quotations',
  CALCULATION_HISTORY: 'app_51335ed80f_calculation_history',
  SYSTEM_SETTINGS: 'app_51335ed80f_system_settings',
  SHIPPING_LINES: 'app_51335ed80f_shipping_lines',
  PORTS: 'app_51335ed80f_ports',
  SEA_FREIGHTS: 'app_51335ed80f_sea_freights',
  AGENT_SEA_FREIGHTS: 'app_51335ed80f_agent_sea_freights',
  RAIL_AGENTS: 'app_51335ed80f_rail_agents',
  TRUCK_AGENTS: 'app_51335ed80f_truck_agents',
  DESTINATIONS: 'app_51335ed80f_destinations',
  DTHC: 'app_51335ed80f_dthc',
  DP_COSTS: 'app_51335ed80f_dp_costs',
  COMBINED_FREIGHTS: 'app_51335ed80f_combined_freights',
  PORT_BORDER_FREIGHTS: 'app_51335ed80f_port_border_freights',
  BORDER_DESTINATION_FREIGHTS: 'app_51335ed80f_border_destination_freights',
  WEIGHT_SURCHARGE_RULES: 'app_51335ed80f_weight_surcharge_rules',
  AUDIT_LOGS: 'app_51335ed80f_audit_logs',
  BORDER_CITIES: 'app_51335ed80f_border_cities',
} as const;

// Type definitions for database tables
export interface User {
  id: string;
  username: string;
  password_hash: string;
  name: string;
  position?: string;
  role: 'superadmin' | 'admin' | 'viewer';
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface Port {
  id: string;
  name: string;
  type: 'POL' | 'POD';
  country: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Quotation {
  id: string;
  calculation_id: string;
  customer_name: string;
  customer_contact?: string;
  valid_until: string;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface SeaFreight {
  id: string;
  pol: string;
  pod: string;
  rate: number;
  carrier?: string;
  note?: string;
  version: number;
  valid_from: string;
  valid_to: string;
  created_at: string;
  updated_at: string;
}

export interface AgentSeaFreight {
  id: string;
  agent: string;
  pol: string;
  pod: string;
  rate: number;
  carrier?: string;
  note?: string;
  version: number;
  valid_from: string;
  valid_to: string;
  created_at: string;
  updated_at: string;
}

export interface RailAgent {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface TruckAgent {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Destination {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface DTHC {
  id: string;
  agent: string;
  pol: string;
  pod: string;
  carrier: string;
  amount: number;
  description?: string;
  version: number;
  valid_from: string;
  valid_to: string;
  created_at: string;
  updated_at: string;
}

export interface DPCost {
  id: string;
  port: string;
  amount: number;
  description?: string;
  version: number;
  valid_from: string;
  valid_to: string;
  created_at: string;
  updated_at: string;
}

export interface CombinedFreight {
  id: string;
  agent: string;
  pod: string;
  destination_id: string;
  rate: number;
  description?: string;
  version: number;
  valid_from: string;
  valid_to: string;
  created_at: string;
  updated_at: string;
}

export interface PortBorderFreight {
  id: string;
  agent: string;
  qingdao: number;
  tianjin: number;
  lianyungang: number;
  dandong: number;
  version: number;
  valid_from: string;
  valid_to: string;
  created_at: string;
  updated_at: string;
}

export interface BorderDestinationFreight {
  id: string;
  agent: string;
  destination_id: string;
  rate: number;
  version: number;
  valid_from: string;
  valid_to: string;
  created_at: string;
  updated_at: string;
}

export interface WeightSurchargeRule {
  id: string;
  agent: string;
  min_weight: number;
  max_weight: number;
  surcharge: number;
  version: number;
  valid_from: string;
  valid_to: string;
  created_at: string;
  updated_at: string;
}

export interface CalculationHistory {
  id: string;
  user_id: string;
  pol: string;
  pod: string;
  destination: string;
  rail_agent?: string;
  truck_agent?: string;
  weight: number;
  total_cost: number;
  breakdown: Record<string, number | string>;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_data?: Record<string, unknown>;
  new_data?: Record<string, unknown>;
  created_at: string;
}

export interface BorderCity {
  id: string;
  name: string;
  country: string;
  description?: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SystemSetting {
  id: string;
  setting_key: string;
  setting_value: string;
  setting_type: 'text' | 'number' | 'boolean' | 'json';
  category: 'general' | 'freight' | 'currency' | 'units';
  description?: string;
  is_editable: boolean;
  created_at: string;
  updated_at: string;
}

// Helper function to check if date is valid
export const isDateInRange = (date: Date, validFrom: string, validTo: string): boolean => {
  const checkDate = new Date(date);
  const fromDate = new Date(validFrom);
  const toDate = new Date(validTo);
  return checkDate >= fromDate && checkDate <= toDate;
};

// Helper function to get current valid records
export const getCurrentValidRecords = <T extends { valid_from: string; valid_to: string }>(
  records: T[]
): T[] => {
  const now = new Date();
  return records.filter(record => isDateInRange(now, record.valid_from, record.valid_to));
};

// Password hashing utility (SHA-256)
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Session management
const SESSION_KEY = 'freight_session';

export interface Session {
  userId: string;
  username: string;
  expiresAt: number;
}

export function saveSession(session: Session): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function getSession(): Session | null {
  const sessionStr = localStorage.getItem(SESSION_KEY);
  if (!sessionStr) return null;
  
  try {
    const session = JSON.parse(sessionStr) as Session;
    if (Date.now() > session.expiresAt) {
      clearSession();
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}