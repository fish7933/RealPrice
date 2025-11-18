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
} from '@/types/freight';
import { createClient } from '@supabase/supabase-js';
import { calculateCost } from './freight/freightCalculations';
import { getHistoricalSnapshot, getDPCost as getDPCostHelper, getSeaFreightOptions as getSeaFreightOptionsHelper, getAuditLogsByType as getAuditLogsByTypeHelper } from './freight/freightHelpers';
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
import { deleteCalculationHistory as deleteCalculationHistoryOp, addCalculationHistory as addCalculationHistoryOp } from './freight/freightOperations';
import { useAuth } from './AuthContext';

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
  addRailAgent: (agent: Omit<RailAgent, 'id' | 'createdAt'>) => void;
  updateRailAgent: (id: string, updates: Partial<RailAgent>) => void;
  deleteRailAgent: (id: string) => void;
  
  // Truck Agents
  truckAgents: TruckAgent[];
  addTruckAgent: (agent: Omit<TruckAgent, 'id' | 'createdAt'>) => void;
  updateTruckAgent: (id: string, updates: Partial<TruckAgent>) => void;
  deleteTruckAgent: (id: string) => void;
  
  // Shipping Lines
  shippingLines: ShippingLine[];
  addShippingLine: (line: Omit<ShippingLine, 'id' | 'createdAt'>) => void;
  updateShippingLine: (id: string, updates: Partial<ShippingLine>) => void;
  deleteShippingLine: (id: string) => void;
  
  // Sea Freight
  seaFreights: SeaFreight[];
  addSeaFreight: (freight: Omit<SeaFreight, 'id' | 'createdAt'>) => void;
  updateSeaFreight: (id: string, updates: Partial<SeaFreight>) => void;
  deleteSeaFreight: (id: string) => void;
  
  // Agent Sea Freight
  agentSeaFreights: AgentSeaFreight[];
  addAgentSeaFreight: (freight: Omit<AgentSeaFreight, 'id' | 'createdAt'>) => void;
  updateAgentSeaFreight: (id: string, updates: Partial<AgentSeaFreight>) => void;
  deleteAgentSeaFreight: (id: string) => void;
  
  // DTHC
  dthcList: DTHC[];
  addDTHC: (dthc: Omit<DTHC, 'id' | 'createdAt'>) => void;
  updateDTHC: (id: string, updates: Partial<DTHC>) => void;
  deleteDTHC: (id: string) => void;
  
  // DP Cost
  dpCosts: DPCost[];
  addDPCost: (cost: Omit<DPCost, 'id' | 'createdAt'>) => void;
  updateDPCost: (id: string, updates: Partial<DPCost>) => void;
  deleteDPCost: (id: string) => void;
  
  // Combined Freight
  combinedFreights: CombinedFreight[];
  addCombinedFreight: (freight: Omit<CombinedFreight, 'id' | 'createdAt'>) => void;
  updateCombinedFreight: (id: string, updates: Partial<CombinedFreight>) => void;
  deleteCombinedFreight: (id: string) => void;
  
  // Port Border Freight
  portBorderFreights: PortBorderFreight[];
  addPortBorderFreight: (freight: Omit<PortBorderFreight, 'id' | 'createdAt'>) => void;
  updatePortBorderFreight: (id: string, updates: Partial<PortBorderFreight>) => void;
  deletePortBorderFreight: (id: string) => void;
  
  // Border Destination Freight
  borderDestinationFreights: BorderDestinationFreight[];
  addBorderDestinationFreight: (freight: Omit<BorderDestinationFreight, 'id' | 'createdAt'>) => void;
  updateBorderDestinationFreight: (id: string, updates: Partial<BorderDestinationFreight>) => void;
  deleteBorderDestinationFreight: (id: string) => void;
  
  // Weight Surcharge Rules
  weightSurchargeRules: WeightSurchargeRule[];
  addWeightSurchargeRule: (rule: Omit<WeightSurchargeRule, 'id' | 'createdAt'>) => void;
  updateWeightSurchargeRule: (id: string, updates: Partial<WeightSurchargeRule>) => void;
  deleteWeightSurchargeRule: (id: string) => void;
  
  // Weight Surcharge (legacy)
  weightSurcharges: WeightSurcharge[];
  addWeightSurcharge: (surcharge: Omit<WeightSurcharge, 'id' | 'createdAt'>) => void;
  updateWeightSurcharge: (id: string, updates: Partial<WeightSurcharge>) => void;
  deleteWeightSurcharge: (id: string) => void;
  
  // Ports
  ports: Port[];
  addPort: (port: Omit<Port, 'id'>) => void;
  updatePort: (id: string, updates: Partial<Port>) => void;
  deletePort: (id: string) => void;
  
  // Destinations
  destinations: Destination[];
  addDestination: (destination: Omit<Destination, 'id'>) => void;
  updateDestination: (id: string, updates: Partial<Destination>) => void;
  deleteDestination: (id: string) => void;
  getDestinationById: (id: string) => Destination | undefined;
  
  // Border Cities
  borderCities: BorderCity[];
  addBorderCity: (city: Omit<BorderCity, 'id'>) => void;
  updateBorderCity: (id: string, updates: Partial<BorderCity>) => void;
  deleteBorderCity: (id: string) => void;
  
  // System Settings
  systemSettings: SystemSetting[];
  addSystemSetting: (setting: Omit<SystemSetting, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateSystemSetting: (id: string, updates: Partial<SystemSetting>) => void;
  deleteSystemSetting: (id: string) => void;
  
  // Freight Audit Logs
  freightAuditLogs: FreightAuditLog[];
  addFreightAuditLog: (log: Omit<FreightAuditLog, 'id' | 'timestamp'>) => void;
  getAuditLogsByType: (entityType: FreightAuditLog['entityType']) => FreightAuditLog[];
  
  // Audit Logs (legacy)
  auditLogs: AuditLog[];
  addAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => void;
  
  // Calculation History
  calculationHistory: CalculationHistory[];
  addCalculationHistory: (history: Omit<CalculationHistory, 'id' | 'timestamp'>) => Promise<void>;
  deleteCalculationHistory: (id: string) => Promise<void>;
  clearCalculationHistory: () => void;
  
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

  // Load all data from database on mount
  useEffect(() => {
    const loadAllData = async () => {
      console.log('🔄 Loading all data from database...');
      
      try {
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

  // Rail Agent management
  const addRailAgent = (agent: Omit<RailAgent, 'id' | 'createdAt'>) => {
    const newAgent: RailAgent = { ...agent, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    setRailAgents([...railAgents, newAgent]);
  };
  const updateRailAgent = (id: string, updates: Partial<RailAgent>) => {
    setRailAgents(railAgents.map(agent => agent.id === id ? { ...agent, ...updates } : agent));
  };
  const deleteRailAgent = (id: string) => {
    setRailAgents(railAgents.filter(agent => agent.id !== id));
  };

  // Truck Agent management
  const addTruckAgent = (agent: Omit<TruckAgent, 'id' | 'createdAt'>) => {
    const newAgent: TruckAgent = { ...agent, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    setTruckAgents([...truckAgents, newAgent]);
  };
  const updateTruckAgent = (id: string, updates: Partial<TruckAgent>) => {
    setTruckAgents(truckAgents.map(agent => agent.id === id ? { ...agent, ...updates } : agent));
  };
  const deleteTruckAgent = (id: string) => {
    setTruckAgents(truckAgents.filter(agent => agent.id !== id));
  };

  // Shipping Line management
  const addShippingLine = (line: Omit<ShippingLine, 'id' | 'createdAt'>) => {
    const newLine: ShippingLine = { ...line, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    setShippingLines([...shippingLines, newLine]);
  };
  const updateShippingLine = (id: string, updates: Partial<ShippingLine>) => {
    setShippingLines(shippingLines.map(line => line.id === id ? { ...line, ...updates } : line));
  };
  const deleteShippingLine = (id: string) => {
    setShippingLines(shippingLines.filter(line => line.id !== id));
  };

  // Sea Freight management
  const addSeaFreight = (freight: Omit<SeaFreight, 'id' | 'createdAt'>) => {
    const newFreight: SeaFreight = { ...freight, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    setSeaFreights([...seaFreights, newFreight]);
  };
  const updateSeaFreight = (id: string, updates: Partial<SeaFreight>) => {
    setSeaFreights(seaFreights.map(freight => freight.id === id ? { ...freight, ...updates } : freight));
  };
  const deleteSeaFreight = (id: string) => {
    setSeaFreights(seaFreights.filter(freight => freight.id !== id));
  };

  // Agent Sea Freight management
  const addAgentSeaFreight = (freight: Omit<AgentSeaFreight, 'id' | 'createdAt'>) => {
    const newFreight: AgentSeaFreight = { ...freight, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    setAgentSeaFreights([...agentSeaFreights, newFreight]);
  };
  const updateAgentSeaFreight = (id: string, updates: Partial<AgentSeaFreight>) => {
    setAgentSeaFreights(agentSeaFreights.map(freight => freight.id === id ? { ...freight, ...updates } : freight));
  };
  const deleteAgentSeaFreight = (id: string) => {
    setAgentSeaFreights(agentSeaFreights.filter(freight => freight.id !== id));
  };

  // DTHC management
  const addDTHC = (dthc: Omit<DTHC, 'id' | 'createdAt'>) => {
    const newDTHC: DTHC = { ...dthc, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    setDthcList([...dthcList, newDTHC]);
  };
  const updateDTHC = (id: string, updates: Partial<DTHC>) => {
    setDthcList(dthcList.map(dthc => dthc.id === id ? { ...dthc, ...updates } : dthc));
  };
  const deleteDTHC = (id: string) => {
    setDthcList(dthcList.filter(dthc => dthc.id !== id));
  };

  // DP Cost management
  const addDPCost = (cost: Omit<DPCost, 'id' | 'createdAt'>) => {
    const newCost: DPCost = { ...cost, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    setDpCosts([...dpCosts, newCost]);
  };
  const updateDPCost = (id: string, updates: Partial<DPCost>) => {
    setDpCosts(dpCosts.map(cost => cost.id === id ? { ...cost, ...updates } : cost));
  };
  const deleteDPCost = (id: string) => {
    setDpCosts(dpCosts.filter(cost => cost.id !== id));
  };

  // Combined Freight management
  const addCombinedFreight = (freight: Omit<CombinedFreight, 'id' | 'createdAt'>) => {
    const newFreight: CombinedFreight = { ...freight, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    setCombinedFreights([...combinedFreights, newFreight]);
  };
  const updateCombinedFreight = (id: string, updates: Partial<CombinedFreight>) => {
    setCombinedFreights(combinedFreights.map(freight => freight.id === id ? { ...freight, ...updates } : freight));
  };
  const deleteCombinedFreight = (id: string) => {
    setCombinedFreights(combinedFreights.filter(freight => freight.id !== id));
  };

  // Port Border Freight management
  const addPortBorderFreight = (freight: Omit<PortBorderFreight, 'id' | 'createdAt'>) => {
    const newFreight: PortBorderFreight = { ...freight, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    setPortBorderFreights([...portBorderFreights, newFreight]);
  };
  const updatePortBorderFreight = (id: string, updates: Partial<PortBorderFreight>) => {
    setPortBorderFreights(portBorderFreights.map(freight => freight.id === id ? { ...freight, ...updates } : freight));
  };
  const deletePortBorderFreight = (id: string) => {
    setPortBorderFreights(portBorderFreights.filter(freight => freight.id !== id));
  };

  // Border Destination Freight management
  const addBorderDestinationFreight = (freight: Omit<BorderDestinationFreight, 'id' | 'createdAt'>) => {
    const newFreight: BorderDestinationFreight = { ...freight, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    setBorderDestinationFreights([...borderDestinationFreights, newFreight]);
  };
  const updateBorderDestinationFreight = (id: string, updates: Partial<BorderDestinationFreight>) => {
    setBorderDestinationFreights(borderDestinationFreights.map(freight => freight.id === id ? { ...freight, ...updates } : freight));
  };
  const deleteBorderDestinationFreight = (id: string) => {
    setBorderDestinationFreights(borderDestinationFreights.filter(freight => freight.id !== id));
  };

  // Weight Surcharge Rule management
  const addWeightSurchargeRule = (rule: Omit<WeightSurchargeRule, 'id' | 'createdAt'>) => {
    const newRule: WeightSurchargeRule = { ...rule, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    setWeightSurchargeRules([...weightSurchargeRules, newRule]);
  };
  const updateWeightSurchargeRule = (id: string, updates: Partial<WeightSurchargeRule>) => {
    setWeightSurchargeRules(weightSurchargeRules.map(rule => rule.id === id ? { ...rule, ...updates } : rule));
  };
  const deleteWeightSurchargeRule = (id: string) => {
    setWeightSurchargeRules(weightSurchargeRules.filter(rule => rule.id !== id));
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
  const addPort = (port: Omit<Port, 'id'>) => {
    const newPort: Port = { ...port, id: crypto.randomUUID() };
    setPorts([...ports, newPort]);
  };
  const updatePort = (id: string, updates: Partial<Port>) => {
    setPorts(ports.map(port => port.id === id ? { ...port, ...updates } : port));
  };
  const deletePort = (id: string) => {
    setPorts(ports.filter(port => port.id !== id));
  };

  // Destination management
  const addDestination = (destination: Omit<Destination, 'id'>) => {
    const newDestination: Destination = { ...destination, id: crypto.randomUUID() };
    setDestinations([...destinations, newDestination]);
  };
  const updateDestination = (id: string, updates: Partial<Destination>) => {
    setDestinations(destinations.map(dest => dest.id === id ? { ...dest, ...updates } : dest));
  };
  const deleteDestination = (id: string) => {
    setDestinations(destinations.filter(dest => dest.id !== id));
  };
  const getDestinationById = (id: string): Destination | undefined => {
    return destinations.find(dest => dest.id === id);
  };

  // Border City management
  const addBorderCity = (city: Omit<BorderCity, 'id'>) => {
    const newCity: BorderCity = { ...city, id: crypto.randomUUID() };
    setBorderCities([...borderCities, newCity]);
  };
  const updateBorderCity = (id: string, updates: Partial<BorderCity>) => {
    setBorderCities(borderCities.map(city => city.id === id ? { ...city, ...updates } : city));
  };
  const deleteBorderCity = (id: string) => {
    setBorderCities(borderCities.filter(city => city.id !== id));
  };

  // System Setting management
  const addSystemSetting = (setting: Omit<SystemSetting, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newSetting: SystemSetting = {
      ...setting,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setSystemSettings([...systemSettings, newSetting]);
  };
  const updateSystemSetting = (id: string, updates: Partial<SystemSetting>) => {
    setSystemSettings(systemSettings.map(setting => 
      setting.id === id ? { ...setting, ...updates, updatedAt: new Date().toISOString() } : setting
    ));
  };
  const deleteSystemSetting = (id: string) => {
    setSystemSettings(systemSettings.filter(setting => setting.id !== id));
  };

  // Freight Audit Log management
  const addFreightAuditLog = (log: Omit<FreightAuditLog, 'id' | 'timestamp'>) => {
    const newLog: FreightAuditLog = { ...log, id: crypto.randomUUID(), timestamp: new Date().toISOString() };
    setFreightAuditLogs([newLog, ...freightAuditLogs]);
  };

  const getAuditLogsByType = (entityType: FreightAuditLog['entityType']): FreightAuditLog[] => {
    return getAuditLogsByTypeHelper(freightAuditLogs, entityType);
  };

  // Audit Log management (legacy)
  const addAuditLog = (log: Omit<AuditLog, 'id' | 'timestamp'>) => {
    const newLog: AuditLog = { ...log, id: crypto.randomUUID(), timestamp: new Date().toISOString() };
    setAuditLogs([newLog, ...auditLogs]);
  };

  // Calculation History management
  const handleAddCalculationHistory = async (history: Omit<CalculationHistory, 'id' | 'timestamp'>) => {
    await addCalculationHistoryOp(history, user);
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

  // Cost Calculation
  const calculateFreightCost = (input: CostCalculationInput): CostCalculationResult | null => {
    const snapshot = input.historicalDate 
      ? getHistoricalSnapshot(
          input.historicalDate,
          seaFreights,
          agentSeaFreights,
          dthcList,
          dpCosts,
          combinedFreights,
          portBorderFreights,
          borderDestinationFreights,
          weightSurchargeRules,
          freightAuditLogs
        )
      : null;

    return calculateCost(
      input,
      seaFreights,
      agentSeaFreights,
      dthcList,
      dpCosts,
      combinedFreights,
      portBorderFreights,
      borderDestinationFreights,
      weightSurchargeRules,
      railAgents,
      snapshot
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
    systemSettings,
    addSystemSetting,
    updateSystemSetting,
    deleteSystemSetting,
    freightAuditLogs,
    addFreightAuditLog,
    getAuditLogsByType,
    auditLogs,
    addAuditLog,
    calculationHistory,
    addCalculationHistory: handleAddCalculationHistory,
    deleteCalculationHistory: handleDeleteCalculationHistory,
    clearCalculationHistory,
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

  return <FreightContext.Provider value={value}>{children}</FreightContext.Provider>;
}

export function useFreight() {
  const context = useContext(FreightContext);
  if (context === undefined) {
    throw new Error('useFreight must be used within a FreightProvider');
  }
  return context;
}