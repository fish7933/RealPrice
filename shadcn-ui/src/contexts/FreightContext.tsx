import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  User,
  AppVersion,
  RailAgent,
  TruckAgent,
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
import { getHistoricalSnapshot } from './freight/freightHelpers';

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
  
  // Audit Logs (legacy)
  auditLogs: AuditLog[];
  addAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => void;
  
  // Calculation History
  calculationHistory: CalculationHistory[];
  addCalculationHistory: (history: Omit<CalculationHistory, 'id' | 'timestamp'>) => void;
  clearCalculationHistory: () => void;
  
  // Cost Calculation
  calculateFreightCost: (input: CostCalculationInput) => CostCalculationResult | null;
  getHistoricalSnapshot: (date: string) => HistoricalFreightSnapshot | null;
}

const FreightContext = createContext<FreightContextType | undefined>(undefined);

export function FreightProvider({ children }: { children: ReactNode }) {
  const [appVersion, setAppVersion] = useState<AppVersion | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [railAgents, setRailAgents] = useState<RailAgent[]>([]);
  const [truckAgents, setTruckAgents] = useState<TruckAgent[]>([]);
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

  // Load data from localStorage on mount
  useEffect(() => {
    const loadData = () => {
      const storedUsers = localStorage.getItem('users');
      const storedRailAgents = localStorage.getItem('railAgents');
      const storedTruckAgents = localStorage.getItem('truckAgents');
      const storedSeaFreights = localStorage.getItem('seaFreights');
      const storedAgentSeaFreights = localStorage.getItem('agentSeaFreights');
      const storedDthcList = localStorage.getItem('dthcList');
      const storedDpCosts = localStorage.getItem('dpCosts');
      const storedCombinedFreights = localStorage.getItem('combinedFreights');
      const storedPortBorderFreights = localStorage.getItem('portBorderFreights');
      const storedBorderDestinationFreights = localStorage.getItem('borderDestinationFreights');
      const storedWeightSurchargeRules = localStorage.getItem('weightSurchargeRules');
      const storedWeightSurcharges = localStorage.getItem('weightSurcharges');
      const storedPorts = localStorage.getItem('ports');
      const storedDestinations = localStorage.getItem('destinations');
      const storedBorderCities = localStorage.getItem('borderCities');
      const storedSystemSettings = localStorage.getItem('systemSettings');
      const storedFreightAuditLogs = localStorage.getItem('freightAuditLogs');
      const storedAuditLogs = localStorage.getItem('auditLogs');
      const storedCalculationHistory = localStorage.getItem('calculationHistory');

      if (storedUsers) setUsers(JSON.parse(storedUsers));
      if (storedRailAgents) setRailAgents(JSON.parse(storedRailAgents));
      if (storedTruckAgents) setTruckAgents(JSON.parse(storedTruckAgents));
      if (storedSeaFreights) setSeaFreights(JSON.parse(storedSeaFreights));
      if (storedAgentSeaFreights) setAgentSeaFreights(JSON.parse(storedAgentSeaFreights));
      if (storedDthcList) setDthcList(JSON.parse(storedDthcList));
      if (storedDpCosts) setDpCosts(JSON.parse(storedDpCosts));
      if (storedCombinedFreights) setCombinedFreights(JSON.parse(storedCombinedFreights));
      if (storedPortBorderFreights) setPortBorderFreights(JSON.parse(storedPortBorderFreights));
      if (storedBorderDestinationFreights) setBorderDestinationFreights(JSON.parse(storedBorderDestinationFreights));
      if (storedWeightSurchargeRules) setWeightSurchargeRules(JSON.parse(storedWeightSurchargeRules));
      if (storedWeightSurcharges) setWeightSurcharges(JSON.parse(storedWeightSurcharges));
      if (storedPorts) setPorts(JSON.parse(storedPorts));
      if (storedDestinations) setDestinations(JSON.parse(storedDestinations));
      if (storedBorderCities) setBorderCities(JSON.parse(storedBorderCities));
      if (storedSystemSettings) setSystemSettings(JSON.parse(storedSystemSettings));
      if (storedFreightAuditLogs) setFreightAuditLogs(JSON.parse(storedFreightAuditLogs));
      if (storedAuditLogs) setAuditLogs(JSON.parse(storedAuditLogs));
      if (storedCalculationHistory) setCalculationHistory(JSON.parse(storedCalculationHistory));
    };

    loadData();
    fetchAppVersion();
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => { localStorage.setItem('users', JSON.stringify(users)); }, [users]);
  useEffect(() => { localStorage.setItem('railAgents', JSON.stringify(railAgents)); }, [railAgents]);
  useEffect(() => { localStorage.setItem('truckAgents', JSON.stringify(truckAgents)); }, [truckAgents]);
  useEffect(() => { localStorage.setItem('seaFreights', JSON.stringify(seaFreights)); }, [seaFreights]);
  useEffect(() => { localStorage.setItem('agentSeaFreights', JSON.stringify(agentSeaFreights)); }, [agentSeaFreights]);
  useEffect(() => { localStorage.setItem('dthcList', JSON.stringify(dthcList)); }, [dthcList]);
  useEffect(() => { localStorage.setItem('dpCosts', JSON.stringify(dpCosts)); }, [dpCosts]);
  useEffect(() => { localStorage.setItem('combinedFreights', JSON.stringify(combinedFreights)); }, [combinedFreights]);
  useEffect(() => { localStorage.setItem('portBorderFreights', JSON.stringify(portBorderFreights)); }, [portBorderFreights]);
  useEffect(() => { localStorage.setItem('borderDestinationFreights', JSON.stringify(borderDestinationFreights)); }, [borderDestinationFreights]);
  useEffect(() => { localStorage.setItem('weightSurchargeRules', JSON.stringify(weightSurchargeRules)); }, [weightSurchargeRules]);
  useEffect(() => { localStorage.setItem('weightSurcharges', JSON.stringify(weightSurcharges)); }, [weightSurcharges]);
  useEffect(() => { localStorage.setItem('ports', JSON.stringify(ports)); }, [ports]);
  useEffect(() => { localStorage.setItem('destinations', JSON.stringify(destinations)); }, [destinations]);
  useEffect(() => { localStorage.setItem('borderCities', JSON.stringify(borderCities)); }, [borderCities]);
  useEffect(() => { localStorage.setItem('systemSettings', JSON.stringify(systemSettings)); }, [systemSettings]);
  useEffect(() => { localStorage.setItem('freightAuditLogs', JSON.stringify(freightAuditLogs)); }, [freightAuditLogs]);
  useEffect(() => { localStorage.setItem('auditLogs', JSON.stringify(auditLogs)); }, [auditLogs]);
  useEffect(() => { localStorage.setItem('calculationHistory', JSON.stringify(calculationHistory)); }, [calculationHistory]);

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

  // Audit Log management (legacy)
  const addAuditLog = (log: Omit<AuditLog, 'id' | 'timestamp'>) => {
    const newLog: AuditLog = { ...log, id: crypto.randomUUID(), timestamp: new Date().toISOString() };
    setAuditLogs([newLog, ...auditLogs]);
  };

  // Calculation History management
  const addCalculationHistory = (history: Omit<CalculationHistory, 'id' | 'timestamp'>) => {
    const newHistory: CalculationHistory = {
      ...history,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };
    setCalculationHistory([newHistory, ...calculationHistory]);
  };
  const clearCalculationHistory = () => {
    setCalculationHistory([]);
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
    auditLogs,
    addAuditLog,
    calculationHistory,
    addCalculationHistory,
    clearCalculationHistory,
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