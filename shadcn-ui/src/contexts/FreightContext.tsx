import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  User,
  AppVersion,
  RailAgent,
  TruckAgent,
  ShippingLine,
  SeaFreight,
  AgentSeaFreight,
  DTHC,
  DPCost,
  CombinedFreight,
  PortBorderFreight,
  BorderDestinationFreight,
  WeightSurchargeRule,
  WeightSurcharge,
  BorderCity,
  SystemSetting,
  Port,
  Destination,
  FreightAuditLog,
  AuditLog,
  CostCalculationInput,
  CostCalculationResult,
  CalculationHistory,
  HistoricalFreightSnapshot,
  Quotation,
  AgentCostBreakdown,
} from '@/types/freight';
import { createClient } from '@supabase/supabase-js';
import { calculateCost } from './freight/freightCalculations';
import { 
  getHistoricalSnapshot, 
  getDPCost as getDPCostHelper, 
  getSeaFreightOptions as getSeaFreightOptionsHelper, 
  getAuditLogsByType as getAuditLogsByTypeHelper,
  getDefaultBorderCity as getDefaultBorderCityHelper,
  getSystemSettingValue as getSystemSettingValueHelper,
  detectChanges,
  filterByDate
} from './freight/freightHelpers';
import {
  loadShippingLines,
  loadPorts,
  loadRailAgents,
  loadTruckAgents,
  loadDestinations,
  loadSeaFreights,
  loadAgentSeaFreights,
  loadDTHC,
  loadDPCosts,
  loadCombinedFreights,
  loadPortBorderFreights,
  loadBorderDestinationFreights,
  loadWeightSurchargeRules,
  loadCalculationHistory,
  loadAuditLogs,
  loadBorderCities,
  loadSystemSettings,
} from './freight/freightLoaders';
import { deleteCalculationHistory as deleteCalculationHistoryOp, addCalculationHistory as addCalculationHistoryOp, createAuditLog } from './freight/freightOperations';
import { useAuth } from './AuthContext';
import { supabase as supabaseClient, TABLES, generateFreightCode } from '@/lib/supabase';

const supabase = createClient(
  'https://lcubxwvkoqkhsvzstbay.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxjdWJ4d3Zrb3FraHN2enN0YmF5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3OTI1NDYsImV4cCI6MjA3ODM2ODU0Nn0.emL4XB1PSUkNZVopMUlZjq1_oU6A5QD-t3ND_-Z3BOo'
);

interface FreightContextType {
  // Version
  appVersion: AppVersion | null;
  fetchAppVersion: () => Promise<void>;
  
  // Users
  users: User[];
  addUser: (user: Omit<User, 'id' | 'createdAt'>) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  
  // Rail Agents
  railAgents: RailAgent[];
  addRailAgent: (agent: Omit<RailAgent, 'id' | 'createdAt'>) => Promise<void>;
  updateRailAgent: (id: string, updates: Partial<RailAgent>) => Promise<void>;
  deleteRailAgent: (id: string) => Promise<void>;
  
  // Truck Agents
  truckAgents: TruckAgent[];
  addTruckAgent: (agent: Omit<TruckAgent, 'id' | 'createdAt'>) => Promise<void>;
  updateTruckAgent: (id: string, updates: Partial<TruckAgent>) => Promise<void>;
  deleteTruckAgent: (id: string) => Promise<void>;
  
  // Shipping Lines
  shippingLines: ShippingLine[];
  addShippingLine: (line: Omit<ShippingLine, 'id' | 'createdAt'>) => Promise<void>;
  updateShippingLine: (id: string, updates: Partial<ShippingLine>) => Promise<void>;
  deleteShippingLine: (id: string) => Promise<void>;
  
  // Sea Freight
  seaFreights: SeaFreight[];
  addSeaFreight: (freight: Omit<SeaFreight, 'id' | 'createdAt'>) => Promise<void>;
  updateSeaFreight: (id: string, updates: Partial<SeaFreight>) => Promise<void>;
  deleteSeaFreight: (id: string) => Promise<void>;
  
  // Agent Sea Freight
  agentSeaFreights: AgentSeaFreight[];
  addAgentSeaFreight: (freight: Omit<AgentSeaFreight, 'id' | 'createdAt'>) => Promise<void>;
  updateAgentSeaFreight: (id: string, updates: Partial<AgentSeaFreight>) => Promise<void>;
  deleteAgentSeaFreight: (id: string) => Promise<void>;
  
  // DTHC
  dthcList: DTHC[];
  addDTHC: (dthc: Omit<DTHC, 'id' | 'createdAt'>) => Promise<void>;
  updateDTHC: (id: string, updates: Partial<DTHC>) => Promise<void>;
  deleteDTHC: (id: string) => Promise<void>;
  
  // DP Cost
  dpCosts: DPCost[];
  addDPCost: (cost: Omit<DPCost, 'id' | 'createdAt'>) => Promise<void>;
  updateDPCost: (id: string, updates: Partial<DPCost>) => Promise<void>;
  deleteDPCost: (id: string) => Promise<void>;
  
  // Combined Freight
  combinedFreights: CombinedFreight[];
  addCombinedFreight: (freight: Omit<CombinedFreight, 'id' | 'createdAt'>) => Promise<void>;
  updateCombinedFreight: (id: string, updates: Partial<CombinedFreight>) => Promise<void>;
  deleteCombinedFreight: (id: string) => Promise<void>;
  
  // Port Border Freight
  portBorderFreights: PortBorderFreight[];
  addPortBorderFreight: (freight: Omit<PortBorderFreight, 'id' | 'createdAt'>) => Promise<void>;
  updatePortBorderFreight: (id: string, updates: Partial<PortBorderFreight>) => Promise<void>;
  deletePortBorderFreight: (id: string) => Promise<void>;
  
  // Border Destination Freight
  borderDestinationFreights: BorderDestinationFreight[];
  addBorderDestinationFreight: (freight: Omit<BorderDestinationFreight, 'id' | 'createdAt'>) => Promise<void>;
  updateBorderDestinationFreight: (id: string, updates: Partial<BorderDestinationFreight>) => Promise<void>;
  deleteBorderDestinationFreight: (id: string) => Promise<void>;
  batchBorderDestinationFreightOperations: (operations: Array<{
    type: 'add' | 'update' | 'delete';
    data?: Omit<BorderDestinationFreight, 'id' | 'createdAt'>;
    id?: string;
    updates?: Partial<BorderDestinationFreight>;
  }>) => Promise<void>;
  
  // Weight Surcharge Rules
  weightSurchargeRules: WeightSurchargeRule[];
  addWeightSurchargeRule: (rule: Omit<WeightSurchargeRule, 'id' | 'createdAt'>) => Promise<void>;
  updateWeightSurchargeRule: (id: string, updates: Partial<WeightSurchargeRule>) => Promise<void>;
  deleteWeightSurchargeRule: (id: string) => Promise<void>;
  
  // Weight Surcharge (legacy)
  weightSurcharges: WeightSurcharge[];
  addWeightSurcharge: (surcharge: Omit<WeightSurcharge, 'id' | 'createdAt'>) => void;
  updateWeightSurcharge: (id: string, updates: Partial<WeightSurcharge>) => void;
  deleteWeightSurcharge: (id: string) => void;
  
  // Ports
  ports: Port[];
  addPort: (port: Omit<Port, 'id'>) => Promise<void>;
  updatePort: (id: string, updates: Partial<Port>) => Promise<void>;
  deletePort: (id: string) => Promise<void>;
  
  // Destinations
  destinations: Destination[];
  addDestination: (destination: Omit<Destination, 'id'>) => Promise<void>;
  updateDestination: (id: string, updates: Partial<Destination>) => Promise<void>;
  deleteDestination: (id: string) => Promise<void>;
  getDestinationById: (id: string) => Destination | undefined;
  
  // Border Cities
  borderCities: BorderCity[];
  addBorderCity: (city: Omit<BorderCity, 'id'>) => Promise<void>;
  updateBorderCity: (id: string, updates: Partial<BorderCity>) => Promise<void>;
  deleteBorderCity: (id: string) => Promise<void>;
  getDefaultBorderCity: () => BorderCity | undefined;
  
  // System Settings
  systemSettings: SystemSetting[];
  addSystemSetting: (setting: Omit<SystemSetting, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateSystemSetting: (id: string, updates: Partial<SystemSetting>) => Promise<void>;
  deleteSystemSetting: (id: string) => Promise<void>;
  getSystemSettingValue: (key: string, defaultValue?: string) => string;
  
  // Freight Audit Logs
  freightAuditLogs: FreightAuditLog[];
  addFreightAuditLog: (log: Omit<FreightAuditLog, 'id' | 'timestamp'>) => void;
  getAuditLogsByType: (entityType: FreightAuditLog['entityType']) => FreightAuditLog[];
  deleteAuditLog: (id: string) => Promise<void>;
  clearAuditLogs: (entityType?: FreightAuditLog['entityType']) => Promise<void>;
  
  // Audit Logs (legacy)
  auditLogs: AuditLog[];
  addAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => void;
  
  // Calculation History
  calculationHistory: CalculationHistory[];
  addCalculationHistory: (history: Omit<CalculationHistory, 'id' | 'timestamp'>) => Promise<void>;
  deleteCalculationHistory: (id: string) => Promise<void>;
  clearCalculationHistory: () => void;
  
  // Quotations
  quotations: Quotation[];
  addQuotation: (quotation: {
    breakdown: AgentCostBreakdown;
    input: CostCalculationInput;
    destinationName: string;
    costTotal: number;
    sellingPrice: number;
    profit: number;
    profitRate: number;
    createdBy: string;
    createdByUsername: string;
    carrier?: string;
    excludedCosts?: Record<string, boolean>;
    notes?: string;
  }) => Promise<void>;
  deleteQuotation: (id: string) => Promise<void>;
  updateQuotation: (id: string, updates: Partial<Quotation>) => Promise<void>;
  loadQuotations: () => Promise<void>;
  
  // Cost Calculation
  calculateCost: (input: CostCalculationInput) => CostCalculationResult | null;
  calculateFreightCost: (input: CostCalculationInput) => CostCalculationResult | null;
  getHistoricalSnapshot: (date: string) => HistoricalFreightSnapshot | null;
  getAvailableHistoricalDates: () => string[];
  
  // Helper methods
  getDPCost: (port: string, date?: string) => number;
  getSeaFreightOptions: (pol: string, pod: string, date?: string) => SeaFreight[];
}

const FreightContext = createContext<FreightContextType | undefined>(undefined);

export function FreightProvider({ children }: { children: ReactNode }) {
  console.log('🚀 [FreightProvider] Component mounting...');
  
  const { user } = useAuth();
  const [appVersion, setAppVersion] = useState<AppVersion | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [railAgents, setRailAgents] = useState<RailAgent[]>([]);
  const [truckAgents, setTruckAgents] = useState<TruckAgent[]>([]);
  const [shippingLines, setShippingLines] = useState<ShippingLine[]>([]);
  const [seaFreights, setSeaFreights] = useState<SeaFreight[]>([]);
  const [agentSeaFreights, setAgentSeaFreights] = useState<AgentSeaFreight[]>([]);
  const [dthcList, setDthcList] = useState<DTHC[]>([]);
  const [dpCosts, setDpCosts] = useState<DPCost[]>([]);
  const [combinedFreights, setCombinedFreights] = useState<CombinedFreight[]>([]);
  const [portBorderFreights, setPortBorderFreights] = useState<PortBorderFreight[]>([]);
  const [borderDestinationFreights, setBorderDestinationFreights] = useState<BorderDestinationFreight[]>([]);
  const [weightSurchargeRules, setWeightSurchargeRules] = useState<WeightSurchargeRule[]>([]);
  const [weightSurcharges, setWeightSurcharges] = useState<WeightSurcharge[]>([]);
  const [ports, setPorts] = useState<Port[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [borderCities, setBorderCities] = useState<BorderCity[]>([]);
  const [systemSettings, setSystemSettings] = useState<SystemSetting[]>([]);
  const [freightAuditLogs, setFreightAuditLogs] = useState<FreightAuditLog[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [calculationHistory, setCalculationHistory] = useState<CalculationHistory[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);

  // Fetch app version from Supabase
  const fetchAppVersion = async () => {
    try {
      const { data, error } = await supabase
        .from('app_741545ec66_version')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;

      if (data) {
        setAppVersion({
          id: data.id,
          version: data.version,
          updatedAt: data.updated_at,
          createdAt: data.created_at,
        });
      }
    } catch (error) {
      console.error('Error fetching app version:', error);
    }
  };

  // Load quotations from database
  const loadQuotationsFromDB = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabaseClient
        .from(TABLES.QUOTATIONS)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const loadedQuotations: Quotation[] = data.map((item: Record<string, unknown>) => ({
        id: item.id as string,
        userId: item.user_id as string,
        username: item.username as string,
        pol: item.pol as string,
        pod: item.pod as string,
        destinationName: item.destination_name as string,
        breakdown: item.breakdown as AgentCostBreakdown,
        input: item.input as CostCalculationInput,
        excludedCosts: item.excluded_costs as Record<string, boolean>,
        costTotal: item.cost_total as number,
        sellingPrice: item.selling_price as number,
        profit: item.profit as number,
        profitRate: item.profit_rate as number,
        carrier: item.carrier as string | undefined,
        notes: item.notes as string | undefined,
        memo: item.memo as string | undefined,
        createdAt: item.created_at as string,
        updatedAt: item.updated_at as string,
      }));

      setQuotations(loadedQuotations);
      console.log('✅ Quotations loaded:', loadedQuotations.length);
    } catch (error) {
      console.error('Error loading quotations:', error);
    }
  };

  // Load all data from database on mount
  useEffect(() => {
    console.log('🔄 [FreightProvider useEffect] Starting data load...');
    
    const loadAllData = async () => {
      try {
        console.log('🔄 Loading all data from database...');
        
        // Load all data in parallel
        const [
          loadedShippingLines,
          loadedPorts,
          loadedRailAgents,
          loadedTruckAgents,
          loadedDestinations,
          loadedSeaFreights,
          loadedAgentSeaFreights,
          loadedDTHC,
          loadedDPCosts,
          loadedCombinedFreights,
          loadedPortBorderFreights,
          loadedBorderDestinationFreights,
          loadedWeightSurchargeRules,
          loadedCalculationHistory,
          loadedAuditLogs,
          loadedBorderCities,
          loadedSystemSettings,
        ] = await Promise.all([
          loadShippingLines(),
          loadPorts(),
          loadRailAgents(),
          loadTruckAgents(),
          loadDestinations(),
          loadSeaFreights(),
          loadAgentSeaFreights(),
          loadDTHC(),
          loadDPCosts(),
          loadCombinedFreights(),
          loadPortBorderFreights(),
          loadBorderDestinationFreights(),
          loadWeightSurchargeRules(),
          loadCalculationHistory(),
          loadAuditLogs(),
          loadBorderCities(),
          loadSystemSettings(),
        ]);

        // Set all loaded data
        setShippingLines(loadedShippingLines);
        setPorts(loadedPorts);
        setRailAgents(loadedRailAgents);
        setTruckAgents(loadedTruckAgents);
        setDestinations(loadedDestinations);
        setSeaFreights(loadedSeaFreights);
        setAgentSeaFreights(loadedAgentSeaFreights);
        setDthcList(loadedDTHC);
        setDpCosts(loadedDPCosts);
        setCombinedFreights(loadedCombinedFreights);
        setPortBorderFreights(loadedPortBorderFreights);
        setBorderDestinationFreights(loadedBorderDestinationFreights);
        setWeightSurchargeRules(loadedWeightSurchargeRules);
        setCalculationHistory(loadedCalculationHistory);
        setFreightAuditLogs(loadedAuditLogs);
        setBorderCities(loadedBorderCities);
        setSystemSettings(loadedSystemSettings);

        // Load quotations
        await loadQuotationsFromDB();

        console.log('✅ All data loaded successfully from database');
        console.log('📊 Data counts:', {
          shippingLines: loadedShippingLines.length,
          ports: loadedPorts.length,
          railAgents: loadedRailAgents.length,
          truckAgents: loadedTruckAgents.length,
          destinations: loadedDestinations.length,
          seaFreights: loadedSeaFreights.length,
          agentSeaFreights: loadedAgentSeaFreights.length,
          dthc: loadedDTHC.length,
          dpCosts: loadedDPCosts.length,
          combinedFreights: loadedCombinedFreights.length,
          portBorderFreights: loadedPortBorderFreights.length,
          borderDestinationFreights: loadedBorderDestinationFreights.length,
          weightSurchargeRules: loadedWeightSurchargeRules.length,
          calculationHistory: loadedCalculationHistory.length,
          auditLogs: loadedAuditLogs.length,
          borderCities: loadedBorderCities.length,
          systemSettings: loadedSystemSettings.length,
        });
      } catch (error) {
        console.error('❌ Error loading data from database:', error);
      }
    };

    loadAllData();
    fetchAppVersion();
  }, []);

  console.log('📊 [FreightProvider] Current state:', {
    combinedFreights: combinedFreights.length,
    portBorderFreights: portBorderFreights.length,
  });

  // User management
  const addUser = (user: Omit<User, 'id' | 'createdAt'>) => {
    const newUser: User = { ...user, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    setUsers([...users, newUser]);
  };
  const updateUser = (id: string, updates: Partial<User>) => {
    setUsers(users.map(user => user.id === id ? { ...user, ...updates } : user));
  };
  const deleteUser = (id: string) => {
    setUsers(users.filter(user => user.id !== id));
  };

  // Quotation management
  const addQuotation = async (quotation: {
    breakdown: AgentCostBreakdown;
    input: CostCalculationInput;
    destinationName: string;
    costTotal: number;
    sellingPrice: number;
    profit: number;
    profitRate: number;
    createdBy: string;
    createdByUsername: string;
    carrier?: string;
    excludedCosts?: Record<string, boolean>;
    notes?: string;
  }) => {
    try {
      const { data, error } = await supabaseClient
        .from(TABLES.QUOTATIONS)
        .insert({
          user_id: quotation.createdBy,
          username: quotation.createdByUsername,
          pol: quotation.input.pol,
          pod: quotation.input.pod,
          destination_name: quotation.destinationName,
          breakdown: quotation.breakdown,
          input: quotation.input,
          excluded_costs: quotation.excludedCosts || {},
          cost_total: quotation.costTotal,
          selling_price: quotation.sellingPrice,
          profit: quotation.profit,
          profit_rate: quotation.profitRate,
          carrier: quotation.carrier,
          notes: quotation.notes,
        })
        .select()
        .single();

      if (error) throw error;

      const newQuotation: Quotation = {
        id: data.id,
        userId: data.user_id,
        username: data.username,
        pol: data.pol,
        pod: data.pod,
        destinationName: data.destination_name,
        breakdown: data.breakdown,
        input: data.input,
        excludedCosts: data.excluded_costs,
        costTotal: data.cost_total,
        sellingPrice: data.selling_price,
        profit: data.profit,
        profitRate: data.profit_rate,
        carrier: data.carrier,
        notes: data.notes,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      setQuotations([newQuotation, ...quotations]);
      console.log('✅ Quotation added successfully');
    } catch (error) {
      console.error('Error adding quotation:', error);
      throw error;
    }
  };

  const deleteQuotation = async (id: string) => {
    try {
      const { error } = await supabaseClient
        .from(TABLES.QUOTATIONS)
        .delete()
        .eq('id', id);

      if (error) throw error;

      setQuotations(quotations.filter(q => q.id !== id));
      console.log('✅ Quotation deleted successfully');
    } catch (error) {
      console.error('Error deleting quotation:', error);
      throw error;
    }
  };
  const updateQuotation = async (id: string, updates: Partial<Quotation>) => {
    try {
      const { data, error } = await supabaseClient
        .from(TABLES.QUOTATIONS)
        .update({
          memo: updates.memo,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      const updatedQuotation: Quotation = {
        id: data.id,
        userId: data.user_id,
        username: data.username,
        pol: data.pol,
        pod: data.pod,
        destinationName: data.destination_name,
        breakdown: data.breakdown,
        input: data.input,
        excludedCosts: data.excluded_costs,
        costTotal: data.cost_total,
        sellingPrice: data.selling_price,
        profit: data.profit,
        profitRate: data.profit_rate,
        carrier: data.carrier,
        notes: data.notes,
        memo: data.memo,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      setQuotations(quotations.map(q => q.id === id ? updatedQuotation : q));
      console.log('✅ Quotation updated successfully');
    } catch (error) {
      console.error('Error updating quotation:', error);
      throw error;
    }
  };

  // ... (keeping all other management functions unchanged for brevity - they remain the same as before)
  // The file is too long to include everything, but all other functions remain identical

  // Rail Agent management
  const addRailAgent = async (agent: Omit<RailAgent, 'id' | 'createdAt'>) => {
    try {
      const { data, error } = await supabaseClient
        .from(TABLES.RAIL_AGENTS)
        .insert({
          name: agent.name,
          code: agent.code,
          description: agent.description,
        })
        .select()
        .single();

      if (error) throw error;

      const newAgent: RailAgent = {
        id: data.id,
        name: data.name,
        code: data.code,
        description: data.description,
        createdAt: data.created_at,
      };
      setRailAgents([...railAgents, newAgent]);
    } catch (error) {
      console.error('Error adding rail agent:', error);
      throw error;
    }
  };

  const updateRailAgent = async (id: string, updates: Partial<RailAgent>) => {
    try {
      const { error } = await supabaseClient
        .from(TABLES.RAIL_AGENTS)
        .update({
          name: updates.name,
          code: updates.code,
          description: updates.description,
        })
        .eq('id', id);

      if (error) throw error;

      setRailAgents(railAgents.map(agent => agent.id === id ? { ...agent, ...updates } : agent));
    } catch (error) {
      console.error('Error updating rail agent:', error);
      throw error;
    }
  };

  const deleteRailAgent = async (id: string) => {
    try {
      const { error } = await supabaseClient
        .from(TABLES.RAIL_AGENTS)
        .delete()
        .eq('id', id);

      if (error) throw error;

      setRailAgents(railAgents.filter(agent => agent.id !== id));
    } catch (error) {
      console.error('Error deleting rail agent:', error);
      throw error;
    }
  };

  // Truck Agent management
  const addTruckAgent = async (agent: Omit<TruckAgent, 'id' | 'createdAt'>) => {
    try {
      const { data, error } = await supabaseClient
        .from(TABLES.TRUCK_AGENTS)
        .insert({
          name: agent.name,
          code: agent.code,
          description: agent.description,
        })
        .select()
        .single();

      if (error) throw error;

      const newAgent: TruckAgent = {
        id: data.id,
        name: data.name,
        code: data.code,
        description: data.description,
        createdAt: data.created_at,
      };
      setTruckAgents([...truckAgents, newAgent]);
    } catch (error) {
      console.error('Error adding truck agent:', error);
      throw error;
    }
  };

  const updateTruckAgent = async (id: string, updates: Partial<TruckAgent>) => {
    try {
      const { error } = await supabaseClient
        .from(TABLES.TRUCK_AGENTS)
        .update({
          name: updates.name,
          code: updates.code,
          description: updates.description,
        })
        .eq('id', id);

      if (error) throw error;

      setTruckAgents(truckAgents.map(agent => agent.id === id ? { ...agent, ...updates } : agent));
    } catch (error) {
      console.error('Error updating truck agent:', error);
      throw error;
    }
  };

  const deleteTruckAgent = async (id: string) => {
    try {
      const { error } = await supabaseClient
        .from(TABLES.TRUCK_AGENTS)
        .delete()
        .eq('id', id);

      if (error) throw error;

      setTruckAgents(truckAgents.filter(agent => agent.id !== id));
    } catch (error) {
      console.error('Error deleting truck agent:', error);
      throw error;
    }
  };

  // Shipping Line management
  const addShippingLine = async (line: Omit<ShippingLine, 'id' | 'createdAt'>) => {
    try {
      const { data, error } = await supabaseClient
        .from(TABLES.SHIPPING_LINES)
        .insert({
          name: line.name,
          code: line.code,
          description: line.description,
        })
        .select()
        .single();

      if (error) throw error;

      const newLine: ShippingLine = {
        id: data.id,
        name: data.name,
        code: data.code,
        description: data.description,
        createdAt: data.created_at,
      };
      setShippingLines([...shippingLines, newLine]);
    } catch (error) {
      console.error('Error adding shipping line:', error);
      throw error;
    }
  };

  const updateShippingLine = async (id: string, updates: Partial<ShippingLine>) => {
    try {
      const { error } = await supabaseClient
        .from(TABLES.SHIPPING_LINES)
        .update({
          name: updates.name,
          code: updates.code,
          description: updates.description,
        })
        .eq('id', id);

      if (error) throw error;

      setShippingLines(shippingLines.map(line => line.id === id ? { ...line, ...updates } : line));
    } catch (error) {
      console.error('Error updating shipping line:', error);
      throw error;
    }
  };

  const deleteShippingLine = async (id: string) => {
    try {
      const { error } = await supabaseClient
        .from(TABLES.SHIPPING_LINES)
        .delete()
        .eq('id', id);

      if (error) throw error;

      setShippingLines(shippingLines.filter(line => line.id !== id));
    } catch (error) {
      console.error('Error deleting shipping line:', error);
      throw error;
    }
  };

  // Sea Freight management
  const addSeaFreight = async (freight: Omit<SeaFreight, 'id' | 'createdAt'>) => {
    try {
      console.log('🔍 [addSeaFreight] Starting to add sea freight:', freight);
      
      // Step 1: Insert without freight_code first to get the ID
      const { data, error } = await supabaseClient
        .from(TABLES.SEA_FREIGHTS)
        .insert({
          pol: freight.pol,
          pod: freight.pod,
          rate: freight.rate,
          local_charge: freight.localCharge,
          carrier: freight.carrier,
          note: freight.note,
          version: freight.version,
          valid_from: freight.validFrom,
          valid_to: freight.validTo,
          freight_code: 'TEMP', // Temporary value
        })
        .select()
        .single();

      if (error) {
        console.error('❌ [addSeaFreight] Database insert error:', error);
        throw error;
      }

      console.log('✅ [addSeaFreight] Initial insert successful, ID:', data.id);

      // Step 2: Generate freight_code using the ID
      const freightCode = generateFreightCode(
        freight.carrier || 'UNKNOWN',
        freight.pol,
        freight.pod,
        data.id
      );

      console.log('🔖 [addSeaFreight] Generated freight_code:', freightCode);

      // Step 3: Update with the generated freight_code
      const { data: updatedData, error: updateError } = await supabaseClient
        .from(TABLES.SEA_FREIGHTS)
        .update({ freight_code: freightCode })
        .eq('id', data.id)
        .select()
        .single();

      if (updateError) {
        console.error('❌ [addSeaFreight] Freight code update error:', updateError);
        throw updateError;
      }

      console.log('✅ [addSeaFreight] Freight code updated successfully');

      const newFreight: SeaFreight = {
        id: updatedData.id,
        freightCode: updatedData.freight_code,
        pol: updatedData.pol,
        pod: updatedData.pod,
        rate: updatedData.rate,
        localCharge: updatedData.local_charge,
        carrier: updatedData.carrier,
        note: updatedData.note,
        version: updatedData.version,
        validFrom: updatedData.valid_from,
        validTo: updatedData.valid_to,
        createdAt: updatedData.created_at,
      };
      setSeaFreights([...seaFreights, newFreight]);

      // ✅ Create audit log for add operation
      await createAuditLog(
        'seaFreight',
        newFreight.id,
        'create',
        detectChanges(null, newFreight as unknown as Record<string, unknown>),
        newFreight as unknown as Record<string, unknown>,
        user
      );

      // Reload audit logs
      const reloadedAuditLogs = await loadAuditLogs();
      setFreightAuditLogs(reloadedAuditLogs);

      console.log('✅ [addSeaFreight] Sea freight added successfully with code:', freightCode);
    } catch (error) {
      console.error('💥 [addSeaFreight] Error adding sea freight:', error);
      throw error;
    }
  };

  const updateSeaFreight = async (id: string, updates: Partial<SeaFreight>) => {
    try {
      console.log('🔍 [updateSeaFreight] Starting update for ID:', id, 'Updates:', updates);
      
      // ✅ Get old freight data for audit log AND history
      const oldFreight = seaFreights.find(f => f.id === id);
      if (!oldFreight) {
        console.error('❌ Old freight not found for audit log');
        return;
      }

      console.log('📦 [updateSeaFreight] Old freight data:', oldFreight);

      // 🆕 STEP 1: Archive old version to history table BEFORE updating
      if (user) {
        console.log('💾 [updateSeaFreight] Archiving old version to history...');
        
        const { error: historyError } = await supabaseClient
          .from(TABLES.SEA_FREIGHT_HISTORY)
          .insert({
            freight_code: oldFreight.freightCode,
            original_id: oldFreight.id,
            carrier: oldFreight.carrier,
            pol: oldFreight.pol,
            pod: oldFreight.pod,
            rate: oldFreight.rate,
            local_charge: oldFreight.localCharge,
            note: oldFreight.note,
            valid_from: oldFreight.validFrom,
            valid_to: oldFreight.validTo,
            version: oldFreight.version,
            archived_at: new Date().toISOString(),
            archived_by: user.id,
            archived_by_username: user.username,
          });

        if (historyError) {
          console.error('❌ [updateSeaFreight] Error archiving to history:', historyError);
          // Don't throw - continue with update even if history fails
        } else {
          console.log('✅ [updateSeaFreight] Old version archived successfully');
        }
      }

      // STEP 2: Update the main record
      const { data, error } = await supabaseClient
        .from(TABLES.SEA_FREIGHTS)
        .update({
          pol: updates.pol,
          pod: updates.pod,
          rate: updates.rate,
          local_charge: updates.localCharge,
          carrier: updates.carrier,
          note: updates.note,
          version: updates.version,
          valid_from: updates.validFrom,
          valid_to: updates.validTo,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('❌ [updateSeaFreight] Database update error:', error);
        throw error;
      }

      console.log('✅ [updateSeaFreight] Database update successful');

      // ✅ Update local state
      setSeaFreights(seaFreights.map(freight => freight.id === id ? { ...freight, ...updates } : freight));

      // ✅ Create audit log for update operation
      if (data) {
        const updatedFreight: SeaFreight = {
          id: data.id,
          freightCode: data.freight_code,
          pol: data.pol,
          pod: data.pod,
          rate: data.rate,
          localCharge: data.local_charge,
          carrier: data.carrier,
          note: data.note,
          version: data.version,
          validFrom: data.valid_from,
          validTo: data.valid_to,
          createdAt: data.created_at,
        };

        await createAuditLog(
          'seaFreight',
          id,
          'update',
          detectChanges(oldFreight as unknown as Record<string, unknown>, updatedFreight as unknown as Record<string, unknown>),
          updatedFreight as unknown as Record<string, unknown>,
          user
        );

        // Reload audit logs
        const reloadedAuditLogs = await loadAuditLogs();
        setFreightAuditLogs(reloadedAuditLogs);

        console.log('✅ [updateSeaFreight] Audit log created successfully');
      }
    } catch (error) {
      console.error('💥 [updateSeaFreight] Error updating sea freight:', error);
      throw error;
    }
  };

  const deleteSeaFreight = async (id: string) => {
    try {
      // ✅ Get freight data before deletion for audit log
      const freight = seaFreights.find(f => f.id === id);

      const { error } = await supabaseClient
        .from(TABLES.SEA_FREIGHTS)
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSeaFreights(seaFreights.filter(freight => freight.id !== id));

      // ✅ Create audit log for delete operation
      if (freight) {
        await createAuditLog(
          'seaFreight',
          id,
          'delete',
          [],
          freight as unknown as Record<string, unknown>,
          user
        );

        // Reload audit logs
        const reloadedAuditLogs = await loadAuditLogs();
        setFreightAuditLogs(reloadedAuditLogs);
      }
    } catch (error) {
      console.error('Error deleting sea freight:', error);
      throw error;
    }
  };

  // Agent Sea Freight management
  const addAgentSeaFreight = async (freight: Omit<AgentSeaFreight, 'id' | 'createdAt'>) => {
    try {
      const { data, error } = await supabaseClient
        .from(TABLES.AGENT_SEA_FREIGHTS)
        .insert({
          agent: freight.agent,
          pol: freight.pol,
          pod: freight.pod,
          rate: freight.rate,
          llocal: freight.llocal,
          carrier: freight.carrier,
          note: freight.note,
          version: freight.version,
          valid_from: freight.validFrom,
          valid_to: freight.validTo,
        })
        .select()
        .single();

      if (error) throw error;

      const newFreight: AgentSeaFreight = {
        id: data.id,
        agent: data.agent,
        pol: data.pol,
        pod: data.pod,
        rate: data.rate,
        llocal: data.llocal,
        carrier: data.carrier,
        note: data.note,
        version: data.version,
        validFrom: data.valid_from,
        validTo: data.valid_to,
        createdAt: data.created_at,
      };
      setAgentSeaFreights([...agentSeaFreights, newFreight]);

      // ✅ Create audit log for add operation
      await createAuditLog(
        'agentSeaFreight',
        newFreight.id,
        'create',
        detectChanges(null, newFreight as unknown as Record<string, unknown>),
        newFreight as unknown as Record<string, unknown>,
        user
      );

      // Reload audit logs
      const reloadedAuditLogs = await loadAuditLogs();
      setFreightAuditLogs(reloadedAuditLogs);
    } catch (error) {
      console.error('Error adding agent sea freight:', error);
      throw error;
    }
  };

  const updateAgentSeaFreight = async (id: string, updates: Partial<AgentSeaFreight>) => {
    try {
      // Get old freight data for audit log
      const oldFreight = agentSeaFreights.find(f => f.id === id);

      const { data, error } = await supabaseClient
        .from(TABLES.AGENT_SEA_FREIGHTS)
        .update({
          agent: updates.agent,
          pol: updates.pol,
          pod: updates.pod,
          rate: updates.rate,
          llocal: updates.llocal,
          carrier: updates.carrier,
          note: updates.note,
          version: updates.version,
          valid_from: updates.validFrom,
          valid_to: updates.validTo,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setAgentSeaFreights(agentSeaFreights.map(freight => freight.id === id ? { ...freight, ...updates } : freight));

      // ✅ Create audit log for update operation
      if (data && oldFreight) {
        const updatedFreight: AgentSeaFreight = {
          id: data.id,
          agent: data.agent,
          pol: data.pol,
          pod: data.pod,
          rate: data.rate,
          llocal: data.llocal,
          carrier: data.carrier,
          note: data.note,
          version: data.version,
          validFrom: data.valid_from,
          validTo: data.valid_to,
          createdAt: data.created_at,
        };

        await createAuditLog(
          'agentSeaFreight',
          id,
          'update',
          detectChanges(oldFreight as unknown as Record<string, unknown>, updatedFreight as unknown as Record<string, unknown>),
          updatedFreight as unknown as Record<string, unknown>,
          user
        );

        // Reload audit logs
        const reloadedAuditLogs = await loadAuditLogs();
        setFreightAuditLogs(reloadedAuditLogs);
      }
    } catch (error) {
      console.error('Error updating agent sea freight:', error);
      throw error;
    }
  };

  const deleteAgentSeaFreight = async (id: string) => {
    try {
      // Get freight data before deletion for audit log
      const freight = agentSeaFreights.find(f => f.id === id);

      const { error } = await supabaseClient
        .from(TABLES.AGENT_SEA_FREIGHTS)
        .delete()
        .eq('id', id);

      if (error) throw error;

      setAgentSeaFreights(agentSeaFreights.filter(freight => freight.id !== id));

      // ✅ Create audit log for delete operation
      if (freight) {
        await createAuditLog(
          'agentSeaFreight',
          id,
          'delete',
          [],
          freight as unknown as Record<string, unknown>,
          user
        );

        // Reload audit logs
        const reloadedAuditLogs = await loadAuditLogs();
        setFreightAuditLogs(reloadedAuditLogs);
      }
    } catch (error) {
      console.error('Error deleting agent sea freight:', error);
      throw error;
    }
  };

  // DTHC management
  const addDTHC = async (dthc: Omit<DTHC, 'id' | 'createdAt'>) => {
    try {
      const { data, error } = await supabaseClient
        .from(TABLES.DTHC)
        .insert({
          agent: dthc.agent,
          pol: dthc.pol,
          pod: dthc.pod,
          carrier: dthc.carrier,
          amount: dthc.amount,
          description: dthc.description,
          version: dthc.version,
          valid_from: dthc.validFrom,
          valid_to: dthc.validTo,
        })
        .select()
        .single();

      if (error) throw error;

      const newDTHC: DTHC = {
        id: data.id,
        agent: data.agent,
        pol: data.pol,
        pod: data.pod,
        carrier: data.carrier,
        amount: data.amount,
        description: data.description,
        version: data.version,
        validFrom: data.valid_from,
        validTo: data.valid_to,
        createdAt: data.created_at,
      };
      setDthcList([...dthcList, newDTHC]);

      // ✅ Create audit log for add operation
      await createAuditLog(
        'dthc',
        newDTHC.id,
        'create',
        detectChanges(null, newDTHC as unknown as Record<string, unknown>),
        newDTHC as unknown as Record<string, unknown>,
        user
      );

      // Reload audit logs
      const reloadedAuditLogs = await loadAuditLogs();
      setFreightAuditLogs(reloadedAuditLogs);
    } catch (error) {
      console.error('Error adding DTHC:', error);
      throw error;
    }
  };

  const updateDTHC = async (id: string, updates: Partial<DTHC>) => {
    try {
      // Get old DTHC data for audit log
      const oldDTHC = dthcList.find(d => d.id === id);

      const { data, error } = await supabaseClient
        .from(TABLES.DTHC)
        .update({
          agent: updates.agent,
          pol: updates.pol,
          pod: updates.pod,
          carrier: updates.carrier,
          amount: updates.amount,
          description: updates.description,
          version: updates.version,
          valid_from: updates.validFrom,
          valid_to: updates.validTo,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setDthcList(dthcList.map(dthc => dthc.id === id ? { ...dthc, ...updates } : dthc));

      // ✅ Create audit log for update operation
      if (data && oldDTHC) {
        const updatedDTHC: DTHC = {
          id: data.id,
          agent: data.agent,
          pol: data.pol,
          pod: data.pod,
          carrier: data.carrier,
          amount: data.amount,
          description: data.description,
          version: data.version,
          validFrom: data.valid_from,
          validTo: data.valid_to,
          createdAt: data.created_at,
        };

        await createAuditLog(
          'dthc',
          id,
          'update',
          detectChanges(oldDTHC as unknown as Record<string, unknown>, updatedDTHC as unknown as Record<string, unknown>),
          updatedDTHC as unknown as Record<string, unknown>,
          user
        );

        // Reload audit logs
        const reloadedAuditLogs = await loadAuditLogs();
        setFreightAuditLogs(reloadedAuditLogs);
      }
    } catch (error) {
      console.error('Error updating DTHC:', error);
      throw error;
    }
  };

  const deleteDTHC = async (id: string) => {
    try {
      // Get DTHC data before deletion for audit log
      const dthc = dthcList.find(d => d.id === id);

      const { error } = await supabaseClient
        .from(TABLES.DTHC)
        .delete()
        .eq('id', id);

      if (error) throw error;

      setDthcList(dthcList.filter(dthc => dthc.id !== id));

      // ✅ Create audit log for delete operation
      if (dthc) {
        await createAuditLog(
          'dthc',
          id,
          'delete',
          [],
          dthc as unknown as Record<string, unknown>,
          user
        );

        // Reload audit logs
        const reloadedAuditLogs = await loadAuditLogs();
        setFreightAuditLogs(reloadedAuditLogs);
      }
    } catch (error) {
      console.error('Error deleting DTHC:', error);
      throw error;
    }
  };

  // DP Cost management
  const addDPCost = async (cost: Omit<DPCost, 'id' | 'createdAt'>) => {
    try {
      const { data, error } = await supabaseClient
        .from(TABLES.DP_COSTS)
        .insert({
          port: cost.port,
          amount: cost.amount,
          description: cost.description,
          version: cost.version,
          valid_from: cost.validFrom,
          valid_to: cost.validTo,
        })
        .select()
        .single();

      if (error) throw error;

      const newCost: DPCost = {
        id: data.id,
        port: data.port,
        amount: data.amount,
        description: data.description,
        version: data.version,
        validFrom: data.valid_from,
        validTo: data.valid_to,
        createdAt: data.created_at,
      };
      setDpCosts([...dpCosts, newCost]);

      // ✅ Create audit log for add operation
      await createAuditLog(
        'dpCost',
        newCost.id,
        'create',
        detectChanges(null, newCost as unknown as Record<string, unknown>),
        newCost as unknown as Record<string, unknown>,
        user
      );

      // Reload audit logs
      const reloadedAuditLogs = await loadAuditLogs();
      setFreightAuditLogs(reloadedAuditLogs);
    } catch (error) {
      console.error('Error adding DP cost:', error);
      throw error;
    }
  };

  const updateDPCost = async (id: string, updates: Partial<DPCost>) => {
    try {
      // Get old DP cost data for audit log
      const oldCost = dpCosts.find(c => c.id === id);

      const { data, error } = await supabaseClient
        .from(TABLES.DP_COSTS)
        .update({
          port: updates.port,
          amount: updates.amount,
          description: updates.description,
          version: updates.version,
          valid_from: updates.validFrom,
          valid_to: updates.validTo,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setDpCosts(dpCosts.map(cost => cost.id === id ? { ...cost, ...updates } : cost));

      // ✅ Create audit log for update operation
      if (data && oldCost) {
        const updatedCost: DPCost = {
          id: data.id,
          port: data.port,
          amount: data.amount,
          description: data.description,
          version: data.version,
          validFrom: data.valid_from,
          validTo: data.valid_to,
          createdAt: data.created_at,
        };

        await createAuditLog(
          'dpCost',
          id,
          'update',
          detectChanges(oldCost as unknown as Record<string, unknown>, updatedCost as unknown as Record<string, unknown>),
          updatedCost as unknown as Record<string, unknown>,
          user
        );

        // Reload audit logs
        const reloadedAuditLogs = await loadAuditLogs();
        setFreightAuditLogs(reloadedAuditLogs);
      }
    } catch (error) {
      console.error('Error updating DP cost:', error);
      throw error;
    }
  };

  const deleteDPCost = async (id: string) => {
    try {
      // Get DP cost data before deletion for audit log
      const cost = dpCosts.find(c => c.id === id);

      const { error } = await supabaseClient
        .from(TABLES.DP_COSTS)
        .delete()
        .eq('id', id);

      if (error) throw error;

      setDpCosts(dpCosts.filter(cost => cost.id !== id));

      // ✅ Create audit log for delete operation
      if (cost) {
        await createAuditLog(
          'dpCost',
          id,
          'delete',
          [],
          cost as unknown as Record<string, unknown>,
          user
        );

        // Reload audit logs
        const reloadedAuditLogs = await loadAuditLogs();
        setFreightAuditLogs(reloadedAuditLogs);
      }
    } catch (error) {
      console.error('Error deleting DP cost:', error);
      throw error;
    }
  };

  // Combined Freight management
  const addCombinedFreight = async (freight: Omit<CombinedFreight, 'id' | 'createdAt'>) => {
    try {
      console.log('🔍 [addCombinedFreight] Starting to add combined freight:', freight);
      
      const { data, error } = await supabaseClient
        .from(TABLES.COMBINED_FREIGHTS)
        .insert({
          agent: freight.agent,
          pol: freight.pol,
          pod: freight.pod,
          destination_id: freight.destinationId,
          rate: freight.rate,
          description: freight.description,
          version: freight.version,
          valid_from: freight.validFrom,
          valid_to: freight.validTo,
        })
        .select()
        .single();

      if (error) {
        console.error('❌ [addCombinedFreight] Database insert error:', error);
        throw error;
      }

      console.log('✅ [addCombinedFreight] Database insert successful:', data);

      const newFreight: CombinedFreight = {
        id: data.id,
        agent: data.agent,
        pol: data.pol,
        pod: data.pod,
        destinationId: data.destination_id,
        rate: data.rate,
        description: data.description,
        version: data.version,
        validFrom: data.valid_from,
        validTo: data.valid_to,
        createdAt: data.created_at,
      };
      setCombinedFreights([...combinedFreights, newFreight]);

      // ✅ Create audit log for add operation
      await createAuditLog(
        'combinedFreight',
        newFreight.id,
        'create',
        detectChanges(null, newFreight as unknown as Record<string, unknown>),
        newFreight as unknown as Record<string, unknown>,
        user
      );

      // Reload audit logs
      const reloadedAuditLogs = await loadAuditLogs();
      setFreightAuditLogs(reloadedAuditLogs);
      
      console.log('✅ [addCombinedFreight] Combined freight added successfully with audit log');
    } catch (error) {
      console.error('💥 [addCombinedFreight] Error adding combined freight:', error);
      throw error;
    }
  };

  const updateCombinedFreight = async (id: string, updates: Partial<CombinedFreight>) => {
    try {
      console.log('🔍 [updateCombinedFreight] Starting update for ID:', id);

      // Get old freight data for audit log
      const oldFreight = combinedFreights.find(f => f.id === id);

      const { data, error } = await supabaseClient
        .from(TABLES.COMBINED_FREIGHTS)
        .update({
          agent: updates.agent,
          pol: updates.pol,
          pod: updates.pod,
          destination_id: updates.destinationId,
          rate: updates.rate,
          description: updates.description,
          version: updates.version,
          valid_from: updates.validFrom,
          valid_to: updates.validTo,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setCombinedFreights(combinedFreights.map(freight => freight.id === id ? { ...freight, ...updates } : freight));

      // ✅ Create audit log for update operation
      if (data && oldFreight) {
        const updatedFreight: CombinedFreight = {
          id: data.id,
          agent: data.agent,
          pol: data.pol,
          pod: data.pod,
          destinationId: data.destination_id,
          rate: data.rate,
          description: data.description,
          version: data.version,
          validFrom: data.valid_from,
          validTo: data.valid_to,
          createdAt: data.created_at,
        };

        await createAuditLog(
          'combinedFreight',
          id,
          'update',
          detectChanges(oldFreight as unknown as Record<string, unknown>, updatedFreight as unknown as Record<string, unknown>),
          updatedFreight as unknown as Record<string, unknown>,
          user
        );

        // Reload audit logs
        const reloadedAuditLogs = await loadAuditLogs();
        setFreightAuditLogs(reloadedAuditLogs);

        console.log('✅ [updateCombinedFreight] Combined freight updated successfully with audit log');
      }
    } catch (error) {
      console.error('Error updating combined freight:', error);
      throw error;
    }
  };

  const deleteCombinedFreight = async (id: string) => {
    try {
      console.log('🗑️ [deleteCombinedFreight] Starting delete for ID:', id);

      // Get freight data before deletion for audit log
      const freight = combinedFreights.find(f => f.id === id);

      const { error } = await supabaseClient
        .from(TABLES.COMBINED_FREIGHTS)
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCombinedFreights(combinedFreights.filter(freight => freight.id !== id));

      // ✅ Create audit log for delete operation
      if (freight) {
        await createAuditLog(
          'combinedFreight',
          id,
          'delete',
          [],
          freight as unknown as Record<string, unknown>,
          user
        );

        // Reload audit logs
        const reloadedAuditLogs = await loadAuditLogs();
        setFreightAuditLogs(reloadedAuditLogs);

        console.log('✅ [deleteCombinedFreight] Combined freight deleted successfully with audit log');
      }
    } catch (error) {
      console.error('Error deleting combined freight:', error);
      throw error;
    }
  };

  // Port Border Freight management
  const addPortBorderFreight = async (freight: Omit<PortBorderFreight, 'id' | 'createdAt'>) => {
    try {
      console.log('🔍 [FreightContext] addPortBorderFreight called with:', freight);
      
      const { data, error } = await supabaseClient
        .from(TABLES.PORT_BORDER_FREIGHTS)
        .insert({
          agent: freight.agent,
          pol: freight.pol,
          pod: freight.pod,
          rate: freight.rate,
          version: freight.version || 1,
          valid_from: freight.validFrom,
          valid_to: freight.validTo,
        })
        .select()
        .single();

      if (error) {
        console.error('❌ [FreightContext] Database error:', error);
        throw error;
      }

      console.log('✅ [FreightContext] Database insert successful:', data);

      // ✅ 데이터베이스에서 다시 로드
      console.log('🔄 [FreightContext] Reloading port border freights from database...');
      const reloadedData = await loadPortBorderFreights();
      setPortBorderFreights(reloadedData);
      console.log('✅ [FreightContext] Port border freights reloaded:', reloadedData.length);
      
      // Create audit log
      const newFreight: PortBorderFreight = {
        id: data.id,
        agent: data.agent,
        pol: data.pol,
        pod: data.pod,
        rate: data.rate,
        version: data.version,
        validFrom: data.valid_from,
        validTo: data.valid_to,
        createdAt: data.created_at,
      };
      
      await createAuditLog(
        'portBorderFreight',
        newFreight.id,
        'create',
        detectChanges(null, newFreight as unknown as Record<string, unknown>),
        newFreight as unknown as Record<string, unknown>,
        user
      );
      
      // Reload audit logs
      const reloadedAuditLogs = await loadAuditLogs();
      setFreightAuditLogs(reloadedAuditLogs);
    } catch (error) {
      console.error('Error adding port border freight:', error);
      throw error;
    }
  };

  const updatePortBorderFreight = async (id: string, updates: Partial<PortBorderFreight>) => {
    try {
      const oldFreight = portBorderFreights.find(f => f.id === id);
      
      const updateData: Record<string, unknown> = {
        rate: updates.rate,
        version: updates.version,
        valid_from: updates.validFrom,
        valid_to: updates.validTo,
        updated_at: new Date().toISOString(),
      };

      if (updates.pol !== undefined) {
        updateData.pol = updates.pol;
      }

      const { data, error } = await supabaseClient
        .from(TABLES.PORT_BORDER_FREIGHTS)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // ✅ 데이터베이스에서 다시 로드
      console.log('🔄 [FreightContext] Reloading port border freights after update...');
      const reloadedData = await loadPortBorderFreights();
      setPortBorderFreights(reloadedData);
      console.log('✅ [FreightContext] Port border freights reloaded after update');

      if (data && oldFreight) {
        const updatedFreight: PortBorderFreight = {
          id: data.id,
          agent: data.agent,
          pol: data.pol,
          pod: data.pod,
          rate: data.rate,
          version: data.version,
          validFrom: data.valid_from,
          validTo: data.valid_to,
          createdAt: data.created_at,
        };
        
        // Create audit log
        await createAuditLog(
          'portBorderFreight',
          id,
          'update',
          detectChanges(oldFreight as unknown as Record<string, unknown>, updatedFreight as unknown as Record<string, unknown>),
          updatedFreight as unknown as Record<string, unknown>,
          user
        );
        
        // Reload audit logs
        const reloadedAuditLogs = await loadAuditLogs();
        setFreightAuditLogs(reloadedAuditLogs);
      }
    } catch (error) {
      console.error('Error updating port border freight:', error);
      throw error;
    }
  };

  const deletePortBorderFreight = async (id: string) => {
    try {
      console.log('🗑️ [FreightContext] deletePortBorderFreight called for ID:', id);
      
      const freight = portBorderFreights.find(f => f.id === id);
      
      const { error } = await supabaseClient
        .from(TABLES.PORT_BORDER_FREIGHTS)
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ [FreightContext] Database delete error:', error);
        throw error;
      }

      console.log('✅ [FreightContext] Database delete successful');

      // ✅ FIXED: 삭제 후 데이터베이스에서 다시 로드 (로컬 상태 직접 수정 대신)
      console.log('🔄 [FreightContext] Reloading port border freights after delete...');
      const reloadedData = await loadPortBorderFreights();
      setPortBorderFreights(reloadedData);
      console.log('✅ [FreightContext] Port border freights reloaded after delete:', reloadedData.length);
      
      // Create audit log
      if (freight) {
        await createAuditLog(
          'portBorderFreight',
          id,
          'delete',
          [],
          freight as unknown as Record<string, unknown>,
          user
        );
        
        // Reload audit logs
        const reloadedAuditLogs = await loadAuditLogs();
        setFreightAuditLogs(reloadedAuditLogs);
      }
    } catch (error) {
      console.error('Error deleting port border freight:', error);
      throw error;
    }
  };

  // Border Destination Freight management
  const addBorderDestinationFreight = async (freight: Omit<BorderDestinationFreight, 'id' | 'createdAt'>) => {
    try {
      const { data, error } = await supabaseClient
        .from(TABLES.BORDER_DESTINATION_FREIGHTS)
        .insert({
          agent: freight.agent,
          destination_id: freight.destinationId,
          rate: freight.rate,
          version: freight.version,
          valid_from: freight.validFrom,
          valid_to: freight.validTo,
        })
        .select()
        .single();

      if (error) throw error;

      const newFreight: BorderDestinationFreight = {
        id: data.id,
        agent: data.agent,
        destinationId: data.destination_id,
        rate: data.rate,
        version: data.version,
        validFrom: data.valid_from,
        validTo: data.valid_to,
        createdAt: data.created_at,
      };
      setBorderDestinationFreights([...borderDestinationFreights, newFreight]);

      // ✅ Create audit log for add operation
      await createAuditLog(
        'borderDestinationFreight',
        newFreight.id,
        'create',
        detectChanges(null, newFreight as unknown as Record<string, unknown>),
        newFreight as unknown as Record<string, unknown>,
        user
      );

      // Reload audit logs
      const reloadedAuditLogs = await loadAuditLogs();
      setFreightAuditLogs(reloadedAuditLogs);
    } catch (error) {
      console.error('Error adding border destination freight:', error);
      throw error;
    }
  };

  const updateBorderDestinationFreight = async (id: string, updates: Partial<BorderDestinationFreight>) => {
    try {
      // Get old freight data for audit log
      const oldFreight = borderDestinationFreights.find(f => f.id === id);

      const { data, error } = await supabaseClient
        .from(TABLES.BORDER_DESTINATION_FREIGHTS)
        .update({
          agent: updates.agent,
          destination_id: updates.destinationId,
          rate: updates.rate,
          version: updates.version,
          valid_from: updates.validFrom,
          valid_to: updates.validTo,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Update local state without reloading
      setBorderDestinationFreights(borderDestinationFreights.map(freight => 
        freight.id === id ? { ...freight, ...updates } : freight
      ));

      // ✅ Create audit log for update operation
      if (data && oldFreight) {
        const updatedFreight: BorderDestinationFreight = {
          id: data.id,
          agent: data.agent,
          destinationId: data.destination_id,
          rate: data.rate,
          version: data.version,
          validFrom: data.valid_from,
          validTo: data.valid_to,
          createdAt: data.created_at,
        };

        await createAuditLog(
          'borderDestinationFreight',
          id,
          'update',
          detectChanges(oldFreight as unknown as Record<string, unknown>, updatedFreight as unknown as Record<string, unknown>),
          updatedFreight as unknown as Record<string, unknown>,
          user
        );

        // Reload audit logs
        const reloadedAuditLogs = await loadAuditLogs();
        setFreightAuditLogs(reloadedAuditLogs);
      }
    } catch (error) {
      console.error('Error updating border destination freight:', error);
      throw error;
    }
  };

  const deleteBorderDestinationFreight = async (id: string) => {
    try {
      // Get freight data before deletion for audit log
      const freight = borderDestinationFreights.find(f => f.id === id);

      const { error } = await supabaseClient
        .from(TABLES.BORDER_DESTINATION_FREIGHTS)
        .delete()
        .eq('id', id);

      if (error) throw error;

      setBorderDestinationFreights(borderDestinationFreights.filter(freight => freight.id !== id));

      // ✅ Create audit log for delete operation
      if (freight) {
        await createAuditLog(
          'borderDestinationFreight',
          id,
          'delete',
          [],
          freight as unknown as Record<string, unknown>,
          user
        );

        // Reload audit logs
        const reloadedAuditLogs = await loadAuditLogs();
        setFreightAuditLogs(reloadedAuditLogs);
      }
    } catch (error) {
      console.error('Error deleting border destination freight:', error);
      throw error;
    }
  };

  // Batch operations for Border Destination Freight
  const batchBorderDestinationFreightOperations = async (operations: Array<{
    type: 'add' | 'update' | 'delete';
    data?: Omit<BorderDestinationFreight, 'id' | 'createdAt'>;
    id?: string;
    updates?: Partial<BorderDestinationFreight>;
  }>) => {
    try {
      console.log('🔄 [BATCH] Starting batch operations for border destination freights:', operations.length);
      
      // Execute all operations sequentially and create audit logs
      for (const op of operations) {
        if (op.type === 'add' && op.data) {
          console.log('➕ [BATCH] Adding freight:', op.data);
          
          const { data, error } = await supabaseClient
            .from(TABLES.BORDER_DESTINATION_FREIGHTS)
            .insert({
              agent: op.data.agent,
              destination_id: op.data.destinationId,
              rate: op.data.rate,
              version: op.data.version,
              valid_from: op.data.validFrom,
              valid_to: op.data.validTo,
            })
            .select()
            .single();

          if (error) throw error;

          if (data) {
            const newFreight: BorderDestinationFreight = {
              id: data.id,
              agent: data.agent,
              destinationId: data.destination_id,
              rate: data.rate,
              version: data.version,
              validFrom: data.valid_from,
              validTo: data.valid_to,
              createdAt: data.created_at,
            };

            // Create audit log for add operation
            await createAuditLog(
              'borderDestinationFreight',
              newFreight.id,
              'create',
              detectChanges(null, newFreight as unknown as Record<string, unknown>),
              newFreight as unknown as Record<string, unknown>,
              user
            );
            
            console.log('✅ [BATCH] Freight added with audit log:', newFreight.id);
          }
        } else if (op.type === 'update' && op.id && op.updates) {
          console.log('🔄 [BATCH] Updating freight:', op.id, op.updates);
          
          // Get old freight data for audit log
          const oldFreight = borderDestinationFreights.find(f => f.id === op.id);
          
          const { data, error } = await supabaseClient
            .from(TABLES.BORDER_DESTINATION_FREIGHTS)
            .update({
              agent: op.updates.agent,
              destination_id: op.updates.destinationId,
              rate: op.updates.rate,
              version: op.updates.version,
              valid_from: op.updates.validFrom,
              valid_to: op.updates.validTo,
            })
            .eq('id', op.id)
            .select()
            .single();

          if (error) throw error;

          if (data && oldFreight) {
            const updatedFreight: BorderDestinationFreight = {
              id: data.id,
              agent: data.agent,
              destinationId: data.destination_id,
              rate: data.rate,
              version: data.version,
              validFrom: data.valid_from,
              validTo: data.valid_to,
              createdAt: data.created_at,
            };

            // Create audit log for update operation
            await createAuditLog(
              'borderDestinationFreight',
              op.id,
              'update',
              detectChanges(oldFreight as unknown as Record<string, unknown>, updatedFreight as unknown as Record<string, unknown>),
              updatedFreight as unknown as Record<string, unknown>,
              user
            );
            
            console.log('✅ [BATCH] Freight updated with audit log:', op.id);
          }
        } else if (op.type === 'delete' && op.id) {
          console.log('🗑️ [BATCH] Deleting freight:', op.id);
          
          // Get freight data before deletion for audit log
          const freight = borderDestinationFreights.find(f => f.id === op.id);
          
          const { error } = await supabaseClient
            .from(TABLES.BORDER_DESTINATION_FREIGHTS)
            .delete()
            .eq('id', op.id);

          if (error) throw error;

          if (freight) {
            // Create audit log for delete operation
            await createAuditLog(
              'borderDestinationFreight',
              op.id,
              'delete',
              [],
              freight as unknown as Record<string, unknown>,
              user
            );
            
            console.log('✅ [BATCH] Freight deleted with audit log:', op.id);
          }
        }
      }

      // Reload data once after all operations
      console.log('🔄 [BATCH] Reloading data after batch operations...');
      const reloadedData = await loadBorderDestinationFreights();
      setBorderDestinationFreights(reloadedData);
      
      // Reload audit logs to show new entries
      const reloadedAuditLogs = await loadAuditLogs();
      setFreightAuditLogs(reloadedAuditLogs);
      
      console.log('✅ [BATCH] Batch operations completed successfully');
    } catch (error) {
      console.error('❌ [BATCH] Error in batch operations:', error);
      throw error;
    }
  };

  // Weight Surcharge Rule management
  const addWeightSurchargeRule = async (rule: Omit<WeightSurchargeRule, 'id' | 'createdAt'>) => {
    try {
      const { data, error } = await supabaseClient
        .from(TABLES.WEIGHT_SURCHARGE_RULES)
        .insert({
          agent: rule.agent,
          min_weight: rule.minWeight,
          max_weight: rule.maxWeight,
          surcharge: rule.surcharge,
          version: rule.version,
          valid_from: rule.validFrom,
          valid_to: rule.validTo,
        })
        .select()
        .single();

      if (error) throw error;

      const newRule: WeightSurchargeRule = {
        id: data.id,
        agent: data.agent,
        minWeight: data.min_weight,
        maxWeight: data.max_weight,
        surcharge: data.surcharge,
        version: data.version,
        validFrom: data.valid_from,
        validTo: data.valid_to,
        createdAt: data.created_at,
      };
      setWeightSurchargeRules([...weightSurchargeRules, newRule]);

      // ✅ Create audit log for add operation
      await createAuditLog(
        'weightSurcharge',
        newRule.id,
        'create',
        detectChanges(null, newRule as unknown as Record<string, unknown>),
        newRule as unknown as Record<string, unknown>,
        user
      );

      // Reload audit logs
      const reloadedAuditLogs = await loadAuditLogs();
      setFreightAuditLogs(reloadedAuditLogs);
    } catch (error) {
      console.error('Error adding weight surcharge rule:', error);
      throw error;
    }
  };

  const updateWeightSurchargeRule = async (id: string, updates: Partial<WeightSurchargeRule>) => {
    try {
      // Get old rule data for audit log
      const oldRule = weightSurchargeRules.find(r => r.id === id);

      const { data, error } = await supabaseClient
        .from(TABLES.WEIGHT_SURCHARGE_RULES)
        .update({
          agent: updates.agent,
          min_weight: updates.minWeight,
          max_weight: updates.maxWeight,
          surcharge: updates.surcharge,
          version: updates.version,
          valid_from: updates.validFrom,
          valid_to: updates.validTo,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setWeightSurchargeRules(weightSurchargeRules.map(rule => rule.id === id ? { ...rule, ...updates } : rule));

      // ✅ Create audit log for update operation
      if (data && oldRule) {
        const updatedRule: WeightSurchargeRule = {
          id: data.id,
          agent: data.agent,
          minWeight: data.min_weight,
          maxWeight: data.max_weight,
          surcharge: data.surcharge,
          version: data.version,
          validFrom: data.valid_from,
          validTo: data.valid_to,
          createdAt: data.created_at,
        };

        await createAuditLog(
          'weightSurcharge',
          id,
          'update',
          detectChanges(oldRule as unknown as Record<string, unknown>, updatedRule as unknown as Record<string, unknown>),
          updatedRule as unknown as Record<string, unknown>,
          user
        );

        // Reload audit logs
        const reloadedAuditLogs = await loadAuditLogs();
        setFreightAuditLogs(reloadedAuditLogs);
      }
    } catch (error) {
      console.error('Error updating weight surcharge rule:', error);
      throw error;
    }
  };

  const deleteWeightSurchargeRule = async (id: string) => {
    try {
      // Get rule data before deletion for audit log
      const rule = weightSurchargeRules.find(r => r.id === id);

      const { error } = await supabaseClient
        .from(TABLES.WEIGHT_SURCHARGE_RULES)
        .delete()
        .eq('id', id);

      if (error) throw error;

      setWeightSurchargeRules(weightSurchargeRules.filter(rule => rule.id !== id));

      // ✅ Create audit log for delete operation
      if (rule) {
        await createAuditLog(
          'weightSurcharge',
          id,
          'delete',
          [],
          rule as unknown as Record<string, unknown>,
          user
        );

        // Reload audit logs
        const reloadedAuditLogs = await loadAuditLogs();
        setFreightAuditLogs(reloadedAuditLogs);
      }
    } catch (error) {
      console.error('Error deleting weight surcharge rule:', error);
      throw error;
    }
  };

  // Weight Surcharge management (legacy)
  const addWeightSurcharge = (surcharge: Omit<WeightSurcharge, 'id' | 'createdAt'>) => {
    const newSurcharge: WeightSurcharge = { ...surcharge, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    setWeightSurcharges([...weightSurcharges, newSurcharge]);
  };
  const updateWeightSurcharge = (id: string, updates: Partial<WeightSurcharge>) => {
    setWeightSurcharges(weightSurcharges.map(surcharge => surcharge.id === id ? { ...surcharge, ...updates } : surcharge));
  };
  const deleteWeightSurcharge = (id: string) => {
    setWeightSurcharges(weightSurcharges.filter(surcharge => surcharge.id !== id));
  };

  // Port management
  const addPort = async (port: Omit<Port, 'id'>) => {
    try {
      const { data, error } = await supabaseClient
        .from(TABLES.PORTS)
        .insert({
          name: port.name,
          type: port.type,
          country: port.country,
          description: port.description,
        })
        .select()
        .single();

      if (error) throw error;

      const newPort: Port = {
        id: data.id,
        name: data.name,
        type: data.type,
        country: data.country,
        description: data.description,
      };
      setPorts([...ports, newPort]);
    } catch (error) {
      console.error('Error adding port:', error);
      throw error;
    }
  };

  const updatePort = async (id: string, updates: Partial<Port>) => {
    try {
      const { error } = await supabaseClient
        .from(TABLES.PORTS)
        .update({
          name: updates.name,
          type: updates.type,
          country: updates.country,
          description: updates.description,
        })
        .eq('id', id);

      if (error) throw error;

      setPorts(ports.map(port => port.id === id ? { ...port, ...updates } : port));
    } catch (error) {
      console.error('Error updating port:', error);
      throw error;
    }
  };

  const deletePort = async (id: string) => {
    try {
      const { error } = await supabaseClient
        .from(TABLES.PORTS)
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPorts(ports.filter(port => port.id !== id));
    } catch (error) {
      console.error('Error deleting port:', error);
      throw error;
    }
  };

  // Destination management
  const addDestination = async (destination: Omit<Destination, 'id'>) => {
    try {
      const { data, error } = await supabaseClient
        .from(TABLES.DESTINATIONS)
        .insert({
          name: destination.name,
          description: destination.description,
        })
        .select()
        .single();

      if (error) throw error;

      const newDestination: Destination = {
        id: data.id,
        name: data.name,
        description: data.description,
      };
      setDestinations([...destinations, newDestination]);
    } catch (error) {
      console.error('Error adding destination:', error);
      throw error;
    }
  };

  const updateDestination = async (id: string, updates: Partial<Destination>) => {
    try {
      const { error } = await supabaseClient
        .from(TABLES.DESTINATIONS)
        .update({
          name: updates.name,
          description: updates.description,
        })
        .eq('id', id);

      if (error) throw error;

      setDestinations(destinations.map(dest => dest.id === id ? { ...dest, ...updates } : dest));
    } catch (error) {
      console.error('Error updating destination:', error);
      throw error;
    }
  };

  const deleteDestination = async (id: string) => {
    try {
      const { error } = await supabaseClient
        .from(TABLES.DESTINATIONS)
        .delete()
        .eq('id', id);

      if (error) throw error;

      setDestinations(destinations.filter(dest => dest.id !== id));
    } catch (error) {
      console.error('Error deleting destination:', error);
      throw error;
    }
  };

  const getDestinationById = (id: string): Destination | undefined => {
    return destinations.find(dest => dest.id === id);
  };

  // Border City management
  const addBorderCity = async (city: Omit<BorderCity, 'id'>) => {
    try {
      const { data, error } = await supabaseClient
        .from(TABLES.BORDER_CITIES)
        .insert({
          name: city.name,
          country: city.country,
          description: city.description,
          is_default: city.isDefault,
          is_active: city.isActive,
        })
        .select()
        .single();

      if (error) throw error;

      const newCity: BorderCity = {
        id: data.id,
        name: data.name,
        country: data.country,
        description: data.description,
        isDefault: data.is_default,
        isActive: data.is_active,
      };
      setBorderCities([...borderCities, newCity]);
    } catch (error) {
      console.error('Error adding border city:', error);
      throw error;
    }
  };

  const updateBorderCity = async (id: string, updates: Partial<BorderCity>) => {
    try {
      const { error } = await supabaseClient
        .from(TABLES.BORDER_CITIES)
        .update({
          name: updates.name,
          country: updates.country,
          description: updates.description,
          is_default: updates.isDefault,
          is_active: updates.isActive,
        })
        .eq('id', id);

      if (error) throw error;

      setBorderCities(borderCities.map(city => city.id === id ? { ...city, ...updates } : city));
    } catch (error) {
      console.error('Error updating border city:', error);
      throw error;
    }
  };

  const deleteBorderCity = async (id: string) => {
    try {
      const { error } = await supabaseClient
        .from(TABLES.BORDER_CITIES)
        .delete()
        .eq('id', id);

      if (error) throw error;

      setBorderCities(borderCities.filter(city => city.id !== id));
    } catch (error) {
      console.error('Error deleting border city:', error);
      throw error;
    }
  };

  const getDefaultBorderCity = (): BorderCity | undefined => {
    return getDefaultBorderCityHelper(borderCities);
  };

  // System Setting management
  const addSystemSetting = async (setting: Omit<SystemSetting, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const { data, error } = await supabaseClient
        .from(TABLES.SYSTEM_SETTINGS)
        .insert({
          setting_key: setting.key,
          setting_value: setting.value,
          setting_type: setting.type,
          category: setting.category,
          description: setting.description,
          is_editable: setting.isEditable,
        })
        .select()
        .single();

      if (error) throw error;

      const newSetting: SystemSetting = {
        id: data.id,
        key: data.setting_key,
        value: data.setting_value,
        type: data.setting_type,
        category: data.category,
        description: data.description,
        isEditable: data.is_editable,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
      setSystemSettings([...systemSettings, newSetting]);
    } catch (error) {
      console.error('Error adding system setting:', error);
      throw error;
    }
  };

  const updateSystemSetting = async (id: string, updates: Partial<SystemSetting>) => {
    try {
      const { error } = await supabaseClient
        .from(TABLES.SYSTEM_SETTINGS)
        .update({
          setting_key: updates.key,
          setting_value: updates.value,
          setting_type: updates.type,
          category: updates.category,
          description: updates.description,
          is_editable: updates.isEditable,
        })
        .eq('id', id);

      if (error) throw error;

      setSystemSettings(systemSettings.map(setting => 
        setting.id === id ? { ...setting, ...updates, updatedAt: new Date().toISOString() } : setting
      ));
    } catch (error) {
      console.error('Error updating system setting:', error);
      throw error;
    }
  };

  const deleteSystemSetting = async (id: string) => {
    try {
      const { error } = await supabaseClient
        .from(TABLES.SYSTEM_SETTINGS)
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSystemSettings(systemSettings.filter(setting => setting.id !== id));
    } catch (error) {
      console.error('Error deleting system setting:', error);
      throw error;
    }
  };

  const getSystemSettingValue = (key: string, defaultValue: string = ''): string => {
    return getSystemSettingValueHelper(systemSettings, key, defaultValue);
  };

  // Freight Audit Log management
  const addFreightAuditLog = (log: Omit<FreightAuditLog, 'id' | 'timestamp'>) => {
    const newLog: FreightAuditLog = { ...log, id: crypto.randomUUID(), timestamp: new Date().toISOString() };
    setFreightAuditLogs([newLog, ...freightAuditLogs]);
  };

  const getAuditLogsByType = (entityType: FreightAuditLog['entityType']): FreightAuditLog[] => {
    return getAuditLogsByTypeHelper(freightAuditLogs, entityType);
  };

  // 🆕 Delete single audit log
  const deleteAuditLog = async (id: string) => {
    try {
      console.log('🗑️ [deleteAuditLog] Deleting audit log:', id);
      
      const { error } = await supabaseClient
        .from(TABLES.AUDIT_LOGS)
        .delete()
        .eq('id', id);

      if (error) {
        console.error('❌ [deleteAuditLog] Database delete error:', error);
        throw error;
      }

      console.log('✅ [deleteAuditLog] Database delete successful');

      // Reload audit logs
      const reloadedAuditLogs = await loadAuditLogs();
      setFreightAuditLogs(reloadedAuditLogs);
      
      console.log('✅ [deleteAuditLog] Audit logs reloaded');
    } catch (error) {
      console.error('Error deleting audit log:', error);
      throw error;
    }
  };

  // 🆕 Clear all audit logs (optionally filtered by entity type)
  const clearAuditLogs = async (entityType?: FreightAuditLog['entityType']) => {
    try {
      console.log('🗑️ [clearAuditLogs] Clearing audit logs, entityType:', entityType);
      
      let query = supabaseClient.from(TABLES.AUDIT_LOGS).delete();
      
      if (entityType) {
        query = query.eq('entity_type', entityType);
      } else {
        // Delete all audit logs - use neq with a non-existent value to match all
        query = query.neq('id', '00000000-0000-0000-0000-000000000000');
      }

      const { error } = await query;

      if (error) {
        console.error('❌ [clearAuditLogs] Database delete error:', error);
        throw error;
      }

      console.log('✅ [clearAuditLogs] Database delete successful');

      // Reload audit logs
      const reloadedAuditLogs = await loadAuditLogs();
      setFreightAuditLogs(reloadedAuditLogs);
      
      console.log('✅ [clearAuditLogs] Audit logs reloaded, remaining:', reloadedAuditLogs.length);
    } catch (error) {
      console.error('Error clearing audit logs:', error);
      throw error;
    }
  };

  // Audit Log management (legacy)
  const addAuditLog = (log: Omit<AuditLog, 'id' | 'timestamp'>) => {
    const newLog: AuditLog = { ...log, id: crypto.randomUUID(), timestamp: new Date().toISOString() };
    setAuditLogs([newLog, ...auditLogs]);
  };

  // Calculation History management
  const handleAddCalculationHistory = async (history: Omit<CalculationHistory, 'id' | 'timestamp'>) => {
    // 🆕 Pass all freight data arrays to addCalculationHistoryOp for snapshot creation
    await addCalculationHistoryOp(
      history,
      user,
      seaFreights,
      agentSeaFreights,
      dthcList,
      dpCosts,
      portBorderFreights,
      borderDestinationFreights,
      combinedFreights,
      weightSurchargeRules
    );
    // Reload calculation history after adding
    const loadedHistory = await loadCalculationHistory();
    setCalculationHistory(loadedHistory);
  };

  const handleDeleteCalculationHistory = async (id: string) => {
    await deleteCalculationHistoryOp(id);
    // Reload calculation history after deleting
    const loadedHistory = await loadCalculationHistory();
    setCalculationHistory(loadedHistory);
  };

  const clearCalculationHistory = () => {
    setCalculationHistory([]);
  };

  // Get available historical dates from audit logs
  const getAvailableHistoricalDates = (): string[] => {
    const dates = new Set<string>();
    
    // Extract dates from freight audit logs
    freightAuditLogs.forEach(log => {
      const date = log.timestamp.split('T')[0];
      dates.add(date);
    });
    
    // Extract dates from legacy audit logs
    auditLogs.forEach(log => {
      const date = log.timestamp.split('T')[0];
      dates.add(date);
    });
    
    // Convert to array and sort in descending order (newest first)
    return Array.from(dates).sort((a, b) => b.localeCompare(a));
  };

  // Helper methods
  const getDPCost = (port: string, date?: string): number => {
    return getDPCostHelper(dpCosts, port, date);
  };

  const getSeaFreightOptions = (pol: string, pod: string, date?: string): SeaFreight[] => {
    return getSeaFreightOptionsHelper(seaFreights, pol, pod, date);
  };

  // ✅ FIXED: Cost Calculation with date filtering
  const calculateFreightCost = (input: CostCalculationInput): CostCalculationResult | null => {
    const calculationDate = input.historicalDate || undefined;
    
    console.log(`🔍 [calculateFreightCost] Filtering data by date: ${calculationDate || 'current'}`);
    
    // ✅ Filter all data by validity period BEFORE passing to calculateCost
    const filteredSeaFreights = filterByDate(seaFreights, calculationDate);
    const filteredAgentSeaFreights = filterByDate(agentSeaFreights, calculationDate);
    const filteredDthcList = filterByDate(dthcList, calculationDate);
    const filteredDpCosts = filterByDate(dpCosts, calculationDate);
    const filteredCombinedFreights = filterByDate(combinedFreights, calculationDate);
    const filteredPortBorderFreights = filterByDate(portBorderFreights, calculationDate);
    const filteredBorderDestinationFreights = filterByDate(borderDestinationFreights, calculationDate);
    const filteredWeightSurchargeRules = filterByDate(weightSurchargeRules, calculationDate);
    
    console.log(`📊 [calculateFreightCost] Filtered data counts:`, {
      seaFreights: `${filteredSeaFreights.length}/${seaFreights.length}`,
      agentSeaFreights: `${filteredAgentSeaFreights.length}/${agentSeaFreights.length}`,
      dthc: `${filteredDthcList.length}/${dthcList.length}`,
      dpCosts: `${filteredDpCosts.length}/${dpCosts.length}`,
      combinedFreights: `${filteredCombinedFreights.length}/${combinedFreights.length}`,
      portBorderFreights: `${filteredPortBorderFreights.length}/${portBorderFreights.length}`,
      borderDestinationFreights: `${filteredBorderDestinationFreights.length}/${borderDestinationFreights.length}`,
      weightSurchargeRules: `${filteredWeightSurchargeRules.length}/${weightSurchargeRules.length}`,
    });

    return calculateCost(
      input,
      filteredSeaFreights,
      filteredAgentSeaFreights,
      filteredDthcList,
      filteredDpCosts,
      filteredCombinedFreights,
      filteredPortBorderFreights,
      filteredBorderDestinationFreights,
      filteredWeightSurchargeRules,
      railAgents,
      truckAgents,
      shippingLines,
      null // No longer using snapshot
    );
  };

  const value: FreightContextType = {
    appVersion,
    fetchAppVersion,
    users,
    addUser,
    updateUser,
    deleteUser,
    railAgents,
    addRailAgent,
    updateRailAgent,
    deleteRailAgent,
    truckAgents,
    addTruckAgent,
    updateTruckAgent,
    deleteTruckAgent,
    shippingLines,
    addShippingLine,
    updateShippingLine,
    deleteShippingLine,
    seaFreights,
    addSeaFreight,
    updateSeaFreight,
    deleteSeaFreight,
    agentSeaFreights,
    addAgentSeaFreight,
    updateAgentSeaFreight,
    deleteAgentSeaFreight,
    dthcList,
    addDTHC,
    updateDTHC,
    deleteDTHC,
    dpCosts,
    addDPCost,
    updateDPCost,
    deleteDPCost,
    combinedFreights,
    addCombinedFreight,
    updateCombinedFreight,
    deleteCombinedFreight,
    portBorderFreights,
    addPortBorderFreight,
    updatePortBorderFreight,
    deletePortBorderFreight,
    borderDestinationFreights,
    addBorderDestinationFreight,
    updateBorderDestinationFreight,
    deleteBorderDestinationFreight,
    batchBorderDestinationFreightOperations,
    weightSurchargeRules,
    addWeightSurchargeRule,
    updateWeightSurchargeRule,
    deleteWeightSurchargeRule,
    weightSurcharges,
    addWeightSurcharge,
    updateWeightSurcharge,
    deleteWeightSurcharge,
    ports,
    addPort,
    updatePort,
    deletePort,
    destinations,
    addDestination,
    updateDestination,
    deleteDestination,
    getDestinationById,
    borderCities,
    addBorderCity,
    updateBorderCity,
    deleteBorderCity,
    getDefaultBorderCity,
    systemSettings,
    addSystemSetting,
    updateSystemSetting,
    deleteSystemSetting,
    getSystemSettingValue,
    freightAuditLogs,
    addFreightAuditLog,
    getAuditLogsByType,
    deleteAuditLog,
    clearAuditLogs,
    auditLogs,
    addAuditLog,
    calculationHistory,
    addCalculationHistory: handleAddCalculationHistory,
    deleteCalculationHistory: handleDeleteCalculationHistory,
    clearCalculationHistory,
    quotations,
    addQuotation,
    deleteQuotation,
    updateQuotation,
    loadQuotations: loadQuotationsFromDB,
    calculateCost: calculateFreightCost,
    calculateFreightCost,
    getHistoricalSnapshot: (date: string) => getHistoricalSnapshot(
      date,
      seaFreights,
      agentSeaFreights,
      dthcList,
      dpCosts,
      combinedFreights,
      portBorderFreights,
      borderDestinationFreights,
      weightSurchargeRules,
      freightAuditLogs
    ),
    getAvailableHistoricalDates,
    getDPCost,
    getSeaFreightOptions,
  };

  console.log('✅ [FreightProvider] Rendering with value');

  return <FreightContext.Provider value={value}>{children}</FreightContext.Provider>;
}

export function useFreight() {
  const context = useContext(FreightContext);
  if (context === undefined) {
    throw new Error('useFreight must be used within a FreightProvider');
  }
  return context;
}