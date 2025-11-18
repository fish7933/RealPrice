import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  User,
  AppVersion,
  RailAgent,
  TruckAgent,
  SeaFreight,
  PortBorderFreight,
  BorderDestinationFreight,
  WeightSurcharge,
  AuditLog,
} from '@/types/freight';
import { createClient } from '@supabase/supabase-js';

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
  
  // Weight Surcharge
  weightSurcharges: WeightSurcharge[];
  addWeightSurcharge: (surcharge: Omit<WeightSurcharge, 'id' | 'createdAt'>) => void;
  updateWeightSurcharge: (id: string, updates: Partial<WeightSurcharge>) => void;
  deleteWeightSurcharge: (id: string) => void;
  
  // Audit Logs
  auditLogs: AuditLog[];
  addAuditLog: (log: Omit<AuditLog, 'id' | 'timestamp'>) => void;
}

const FreightContext = createContext<FreightContextType | undefined>(undefined);

export function FreightProvider({ children }: { children: ReactNode }) {
  const [appVersion, setAppVersion] = useState<AppVersion | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [railAgents, setRailAgents] = useState<RailAgent[]>([]);
  const [truckAgents, setTruckAgents] = useState<TruckAgent[]>([]);
  const [seaFreights, setSeaFreights] = useState<SeaFreight[]>([]);
  const [portBorderFreights, setPortBorderFreights] = useState<PortBorderFreight[]>([]);
  const [borderDestinationFreights, setBorderDestinationFreights] = useState<BorderDestinationFreight[]>([]);
  const [weightSurcharges, setWeightSurcharges] = useState<WeightSurcharge[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

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
      const storedPortBorderFreights = localStorage.getItem('portBorderFreights');
      const storedBorderDestinationFreights = localStorage.getItem('borderDestinationFreights');
      const storedWeightSurcharges = localStorage.getItem('weightSurcharges');
      const storedAuditLogs = localStorage.getItem('auditLogs');

      if (storedUsers) setUsers(JSON.parse(storedUsers));
      if (storedRailAgents) setRailAgents(JSON.parse(storedRailAgents));
      if (storedTruckAgents) setTruckAgents(JSON.parse(storedTruckAgents));
      if (storedSeaFreights) setSeaFreights(JSON.parse(storedSeaFreights));
      if (storedPortBorderFreights) setPortBorderFreights(JSON.parse(storedPortBorderFreights));
      if (storedBorderDestinationFreights) setBorderDestinationFreights(JSON.parse(storedBorderDestinationFreights));
      if (storedWeightSurcharges) setWeightSurcharges(JSON.parse(storedWeightSurcharges));
      if (storedAuditLogs) setAuditLogs(JSON.parse(storedAuditLogs));
    };

    loadData();
    fetchAppVersion();
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('railAgents', JSON.stringify(railAgents));
  }, [railAgents]);

  useEffect(() => {
    localStorage.setItem('truckAgents', JSON.stringify(truckAgents));
  }, [truckAgents]);

  useEffect(() => {
    localStorage.setItem('seaFreights', JSON.stringify(seaFreights));
  }, [seaFreights]);

  useEffect(() => {
    localStorage.setItem('portBorderFreights', JSON.stringify(portBorderFreights));
  }, [portBorderFreights]);

  useEffect(() => {
    localStorage.setItem('borderDestinationFreights', JSON.stringify(borderDestinationFreights));
  }, [borderDestinationFreights]);

  useEffect(() => {
    localStorage.setItem('weightSurcharges', JSON.stringify(weightSurcharges));
  }, [weightSurcharges]);

  useEffect(() => {
    localStorage.setItem('auditLogs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  // User management
  const addUser = (user: Omit<User, 'id' | 'createdAt'>) => {
    const newUser: User = {
      ...user,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
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
    const newAgent: RailAgent = {
      ...agent,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setRailAgents([...railAgents, newAgent]);
  };

  const updateRailAgent = (id: string, updates: Partial<RailAgent>) => {
    setRailAgents(railAgents.map(agent => agent.id === id ? { ...agent, ...updates } : agent));
  };

  const deleteRailAgent = (id: string) => {
    setRailAgents(railAgents.filter(agent => agent.id !== id));
    setSeaFreights(seaFreights.filter(freight => freight.railAgentId !== id));
    setPortBorderFreights(portBorderFreights.filter(freight => freight.railAgentId !== id));
  };

  // Truck Agent management
  const addTruckAgent = (agent: Omit<TruckAgent, 'id' | 'createdAt'>) => {
    const newAgent: TruckAgent = {
      ...agent,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setTruckAgents([...truckAgents, newAgent]);
  };

  const updateTruckAgent = (id: string, updates: Partial<TruckAgent>) => {
    setTruckAgents(truckAgents.map(agent => agent.id === id ? { ...agent, ...updates } : agent));
  };

  const deleteTruckAgent = (id: string) => {
    setTruckAgents(truckAgents.filter(agent => agent.id !== id));
    setBorderDestinationFreights(borderDestinationFreights.filter(freight => freight.truckAgentId !== id));
    setWeightSurcharges(weightSurcharges.filter(surcharge => surcharge.truckAgentId !== id));
  };

  // Sea Freight management
  const addSeaFreight = (freight: Omit<SeaFreight, 'id' | 'createdAt'>) => {
    const newFreight: SeaFreight = {
      ...freight,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setSeaFreights([...seaFreights, newFreight]);
  };

  const updateSeaFreight = (id: string, updates: Partial<SeaFreight>) => {
    setSeaFreights(seaFreights.map(freight => freight.id === id ? { ...freight, ...updates } : freight));
  };

  const deleteSeaFreight = (id: string) => {
    setSeaFreights(seaFreights.filter(freight => freight.id !== id));
  };

  // Port Border Freight management
  const addPortBorderFreight = (freight: Omit<PortBorderFreight, 'id' | 'createdAt'>) => {
    const newFreight: PortBorderFreight = {
      ...freight,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
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
    const newFreight: BorderDestinationFreight = {
      ...freight,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setBorderDestinationFreights([...borderDestinationFreights, newFreight]);
  };

  const updateBorderDestinationFreight = (id: string, updates: Partial<BorderDestinationFreight>) => {
    setBorderDestinationFreights(borderDestinationFreights.map(freight => freight.id === id ? { ...freight, ...updates } : freight));
  };

  const deleteBorderDestinationFreight = (id: string) => {
    setBorderDestinationFreights(borderDestinationFreights.filter(freight => freight.id !== id));
  };

  // Weight Surcharge management
  const addWeightSurcharge = (surcharge: Omit<WeightSurcharge, 'id' | 'createdAt'>) => {
    const newSurcharge: WeightSurcharge = {
      ...surcharge,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setWeightSurcharges([...weightSurcharges, newSurcharge]);
  };

  const updateWeightSurcharge = (id: string, updates: Partial<WeightSurcharge>) => {
    setWeightSurcharges(weightSurcharges.map(surcharge => surcharge.id === id ? { ...surcharge, ...updates } : surcharge));
  };

  const deleteWeightSurcharge = (id: string) => {
    setWeightSurcharges(weightSurcharges.filter(surcharge => surcharge.id !== id));
  };

  // Audit Log management
  const addAuditLog = (log: Omit<AuditLog, 'id' | 'timestamp'>) => {
    const newLog: AuditLog = {
      ...log,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };
    setAuditLogs([newLog, ...auditLogs]);
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
    portBorderFreights,
    addPortBorderFreight,
    updatePortBorderFreight,
    deletePortBorderFreight,
    borderDestinationFreights,
    addBorderDestinationFreight,
    updateBorderDestinationFreight,
    deleteBorderDestinationFreight,
    weightSurcharges,
    addWeightSurcharge,
    updateWeightSurcharge,
    deleteWeightSurcharge,
    auditLogs,
    addAuditLog,
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