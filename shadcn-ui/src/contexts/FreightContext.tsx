import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  FreightContextType,
  BorderCity,
  SystemSetting,
  ShippingLine,
  RailAgent,
  TruckAgent,
  Destination,
  SeaFreight,
  AgentSeaFreight,
  DTHC,
  DPCost,
  CombinedFreight,
  PortBorderFreight,
  BorderDestinationFreight,
  WeightSurchargeRule,
  CostCalculationInput,
  CostCalculationResult,
  AgentCostBreakdown,
  CalculationHistory,
  Quotation,
  FreightAuditLog,
  HistoricalFreightSnapshot,
  Port,
} from '@/types/freight';
import { useAuth } from './AuthContext';
import { isRateValid as isValidOnDateHelper } from '@/utils/validityHelper';
import { supabase, TABLES } from '@/lib/supabase';
import { handleError } from '@/lib/errorHandler';

const FreightContext = createContext<FreightContextType | undefined>(undefined);

export const FreightProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [shippingLines, setShippingLines] = useState<ShippingLine[]>([]);
  const [ports, setPorts] = useState<Port[]>([]);
  const [railAgents, setRailAgents] = useState<RailAgent[]>([]);
  const [truckAgents, setTruckAgents] = useState<TruckAgent[]>([]);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [seaFreights, setSeaFreights] = useState<SeaFreight[]>([]);
  const [agentSeaFreights, setAgentSeaFreights] = useState<AgentSeaFreight[]>([]);
  const [dthcList, setDthcList] = useState<DTHC[]>([]);
  const [dpCosts, setDpCosts] = useState<DPCost[]>([]);
  const [combinedFreights, setCombinedFreights] = useState<CombinedFreight[]>([]);
  const [portBorderFreights, setPortBorderFreights] = useState<PortBorderFreight[]>([]);
  const [borderDestinationFreights, setBorderDestinationFreights] = useState<BorderDestinationFreight[]>([]);
  const [weightSurchargeRules, setWeightSurchargeRules] = useState<WeightSurchargeRule[]>([]);
  const [calculationHistory, setCalculationHistory] = useState<CalculationHistory[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [auditLogs, setAuditLogs] = useState<FreightAuditLog[]>([]);
  const [borderCities, setBorderCities] = useState<BorderCity[]>([]);
const [systemSettings, setSystemSettings] = useState<SystemSetting[]>([]);

  // Validity helper function
  const isValidOnDate = (validFrom: string, validTo: string, date?: string): boolean => {
    return isValidOnDateHelper(validFrom, validTo, date);
  };

  // Load data from Supabase
  const loadShippingLines = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from(TABLES.SHIPPING_LINES)
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        handleError(error, '선사 목록 로드');
        return;
      }

      if (data) {
        setShippingLines(data.map(d => ({
          id: d.id,
          name: d.name,
          code: d.code,
          description: d.description,
          createdAt: d.created_at,
          updatedAt: d.updated_at,
        })));
      }
    } catch (error) {
      handleError(error, '선사 목록 로드');
    }
  }, []);

  const loadPorts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from(TABLES.PORTS)
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        handleError(error, '포트 목록 로드');
        return;
      }

      if (data) {
        setPorts(data.map(d => ({
          id: d.id,
          name: d.name,
          type: d.type as 'POL' | 'POD',
          country: d.country,
          description: d.description,
          createdAt: d.created_at,
          updatedAt: d.updated_at,
        })));
      }
    } catch (error) {
      handleError(error, '포트 목록 로드');
    }
  }, []);

  const loadQuotations = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from(TABLES.QUOTATIONS)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        handleError(error, '견적 목록 로드');
        return;
      }

      if (data) {
        setQuotations(data.map(d => ({
          id: d.id,
          calculationId: d.calculation_id,
          customerName: d.customer_name,
          customerContact: d.customer_contact,
          validUntil: d.valid_until,
          notes: d.notes,
          createdBy: d.created_by,
          createdAt: d.created_at,
        })));
      }
    } catch (error) {
      handleError(error, '견적 목록 로드');
    }
  }, []);

  const loadRailAgents = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from(TABLES.RAIL_AGENTS)
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        handleError(error, '철도 운송사 목록 로드');
        return;
      }

      if (data) {
        setRailAgents(data.map(d => ({
          id: d.id,
          name: d.name,
          description: d.description,
          createdAt: d.created_at,
          updatedAt: d.updated_at,
        })));
      }
    } catch (error) {
      handleError(error, '철도 운송사 목록 로드');
    }
  }, []);

  const loadTruckAgents = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from(TABLES.TRUCK_AGENTS)
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        handleError(error, '트럭 운송사 목록 로드');
        return;
      }

      if (data) {
        setTruckAgents(data.map(d => ({
          id: d.id,
          name: d.name,
          description: d.description,
          createdAt: d.created_at,
          updatedAt: d.updated_at,
        })));
      }
    } catch (error) {
      handleError(error, '트럭 운송사 목록 로드');
    }
  }, []);

  const loadDestinations = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from(TABLES.DESTINATIONS)
        .select('*')
        .order('created_at', { ascending: true });

      if (error) {
        handleError(error, '목적지 목록 로드');
        return;
      }

      if (data) {
        setDestinations(data.map(d => ({
          id: d.id,
          name: d.name,
          description: d.description,
          createdAt: d.created_at,
          updatedAt: d.updated_at,
        })));
      }
    } catch (error) {
      handleError(error, '목적지 목록 로드');
    }
  }, []);

  const loadSeaFreights = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from(TABLES.SEA_FREIGHTS)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        handleError(error, '해상 운임 목록 로드');
        return;
      }

      if (data) {
        setSeaFreights(data.map(d => ({
          id: d.id,
          pol: d.pol,
          pod: d.pod,
          rate: d.rate,
          carrier: d.carrier,
          localCharge: d.local_charge || 0,
          note: d.note,
          version: d.version,
          validFrom: d.valid_from,
          validTo: d.valid_to,
          createdAt: d.created_at,
          updatedAt: d.updated_at,
        })));
      }
    } catch (error) {
      handleError(error, '해상 운임 목록 로드');
    }
  }, []);

  const loadAgentSeaFreights = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from(TABLES.AGENT_SEA_FREIGHTS)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        handleError(error, '운송사별 해상 운임 목록 로드');
        return;
      }

      if (data) {
        setAgentSeaFreights(data.map(d => ({
          id: d.id,
          agent: d.agent,
          pol: d.pol,
          pod: d.pod,
          rate: d.rate,
          carrier: d.carrier,
          note: d.note,
          version: d.version,
          validFrom: d.valid_from,
          validTo: d.valid_to,
          createdAt: d.created_at,
          updatedAt: d.updated_at,
        })));
      }
    } catch (error) {
      handleError(error, '운송사별 해상 운임 목록 로드');
    }
  }, []);

  const loadDTHC = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from(TABLES.DTHC)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        handleError(error, 'DTHC 목록 로드');
        return;
      }

      if (data) {
        setDthcList(data.map(d => ({
          id: d.id,
          agent: d.agent,
          pol: d.pol,
          pod: d.pod,
          amount: d.amount,
          description: d.description,
          version: d.version,
          validFrom: d.valid_from,
          validTo: d.valid_to,
          createdAt: d.created_at,
          updatedAt: d.updated_at,
        })));
      }
    } catch (error) {
      handleError(error, 'DTHC 목록 로드');
    }
  }, []);

  const loadDPCosts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from(TABLES.DP_COSTS)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        handleError(error, 'DP 비용 목록 로드');
        return;
      }

      if (data) {
        setDpCosts(data.map(d => ({
          id: d.id,
          port: d.port,
          amount: d.amount,
          description: d.description,
          version: d.version,
          validFrom: d.valid_from,
          validTo: d.valid_to,
          createdAt: d.created_at,
          updatedAt: d.updated_at,
        })));
      }
    } catch (error) {
      handleError(error, 'DP 비용 목록 로드');
    }
  }, []);

  const loadCombinedFreights = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from(TABLES.COMBINED_FREIGHTS)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        handleError(error, '통합 운임 목록 로드');
        return;
      }

      if (data) {
        setCombinedFreights(data.map(d => ({
          id: d.id,
          agent: d.agent,
          pod: d.pod,
          destinationId: d.destination_id,
          rate: d.rate,
          description: d.description,
          version: d.version,
          validFrom: d.valid_from,
          validTo: d.valid_to,
          createdAt: d.created_at,
          updatedAt: d.updated_at,
        })));
      }
    } catch (error) {
      handleError(error, '통합 운임 목록 로드');
    }
  }, []);

  const loadPortBorderFreights = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from(TABLES.PORT_BORDER_FREIGHTS)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        handleError(error, '항구-국경 운임 목록 로드');
        return;
      }

      if (data) {
        setPortBorderFreights(data.map(d => ({
          id: d.id,
          agent: d.agent,
          pod: d.pod,
          rate: d.rate,
          version: d.version,
          validFrom: d.valid_from,
          validTo: d.valid_to,
          createdAt: d.created_at,
          updatedAt: d.updated_at,
        })));
      }
    } catch (error) {
      handleError(error, '항구-국경 운임 목록 로드');
    }
  }, []);

  const loadBorderDestinationFreights = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from(TABLES.BORDER_DESTINATION_FREIGHTS)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        handleError(error, '국경-목적지 운임 목록 로드');
        return;
      }

      if (data) {
        setBorderDestinationFreights(data.map(d => ({
          id: d.id,
          agent: d.agent,
          destinationId: d.destination_id,
          rate: d.rate,
          version: d.version,
          validFrom: d.valid_from,
          validTo: d.valid_to,
          createdAt: d.created_at,
          updatedAt: d.updated_at,
        })));
      }
    } catch (error) {
      handleError(error, '국경-목적지 운임 목록 로드');
    }
  }, []);

  const loadWeightSurchargeRules = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from(TABLES.WEIGHT_SURCHARGE_RULES)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        handleError(error, '중량 할증 규칙 목록 로드');
        return;
      }

      if (data) {
        setWeightSurchargeRules(data.map(d => ({
          id: d.id,
          agent: d.agent,
          minWeight: d.min_weight,
          maxWeight: d.max_weight,
          surcharge: d.surcharge,
          version: d.version,
          validFrom: d.valid_from,
          validTo: d.valid_to,
          createdAt: d.created_at,
          updatedAt: d.updated_at,
        })));
      }
    } catch (error) {
      handleError(error, '중량 할증 규칙 목록 로드');
    }
  }, []);

  const loadCalculationHistory = useCallback(async () => {
    try {
      console.log('🔄 Loading calculation history from database...');
      
      const { data, error } = await supabase
        .from(TABLES.CALCULATION_HISTORY)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error loading calculation history:', error);
        handleError(error, '계산 이력 목록 로드');
        return;
      }

      console.log('📦 Raw data from database:', data);

      if (data) {
        const mappedData = data.map(d => {
          console.log('🔍 Mapping record:', d);
          return {
            id: d.id,
            result: d.result,
            destinationName: d.destination_name,
            createdBy: d.created_by,
            createdByUsername: d.created_by_username,
            createdAt: d.created_at,
          };
        });
        
        console.log('✅ Mapped calculation history:', mappedData);
        setCalculationHistory(mappedData);
      } else {
        console.log('⚠️ No data returned from database');
        setCalculationHistory([]);
      }
    } catch (error) {
      console.error('💥 Exception in loadCalculationHistory:', error);
      handleError(error, '계산 이력 목록 로드');
    }
  }, []);

  const loadAuditLogs = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from(TABLES.AUDIT_LOGS)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) {
        handleError(error, '변경 이력 목록 로드');
        return;
      }

      if (data) {
        setAuditLogs(data.map(d => ({
          id: d.id,
          entityType: d.entity_type,
          entityId: d.entity_id,
          action: d.action,
          changes: d.changes,
          entitySnapshot: d.entity_snapshot,
          changedBy: d.changed_by,
          changedByUsername: d.changed_by_username,
          changedByName: d.changed_by_name,
          timestamp: d.created_at,
          version: d.version,
        })));
      }
    } catch (error) {
      handleError(error, '변경 이력 목록 로드');
    }
  }, []);

  const loadBorderCities = useCallback(async () => {
  try {
    const { data, error } = await supabase
      .from(TABLES.BORDER_CITIES)
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      handleError(error, '국경 도시 목록 로드');
      return;
    }

    if (data) {
      setBorderCities(data.map(d => ({
        id: d.id,
        name: d.name,
        country: d.country,
        description: d.description,
        isDefault: d.is_default,
        isActive: d.is_active,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
      })));
    }
  } catch (error) {
    handleError(error, '국경 도시 목록 로드');
  }
}, []);

const loadSystemSettings = useCallback(async () => {
  try {
    const { data, error } = await supabase
      .from(TABLES.SYSTEM_SETTINGS)
      .select('*')
      .order('category', { ascending: true });

    if (error) {
      handleError(error, '시스템 설정 목록 로드');
      return;
    }

    if (data) {
      setSystemSettings(data.map(d => ({
        id: d.id,
        settingKey: d.setting_key,
        settingValue: d.setting_value,
        settingType: d.setting_type as 'text' | 'number' | 'boolean' | 'json',
        category: d.category as 'general' | 'freight' | 'currency' | 'units',
        description: d.description,
        isEditable: d.is_editable,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
      })));
    }
  } catch (error) {
    handleError(error, '시스템 설정 목록 로드');
  }
}, []);


  // Helper function to create audit log - REMOVED loadAuditLogs from dependencies
  const createAuditLog = useCallback(async (
    entityType: FreightAuditLog['entityType'],
    entityId: string,
    action: FreightAuditLog['action'],
    changes: FreightAuditLog['changes'],
    entitySnapshot: Record<string, unknown>,
    version?: number
  ) => {
    if (!user) return;

    try {
      const log = {
        entity_type: entityType,
        entity_id: entityId,
        action,
        changes,
        entity_snapshot: entitySnapshot,
        changed_by: user.id,
        changed_by_username: user.username,
        changed_by_name: user.name,
        version,
      };

      const { error } = await supabase
        .from(TABLES.AUDIT_LOGS)
        .insert(log);

      if (error) {
        handleError(error, 'Audit Log 생성');
        return;
      }

      // Directly update the audit logs state instead of reloading
      const { data } = await supabase
        .from(TABLES.AUDIT_LOGS)
        .select('*')
        .eq('entity_id', entityId)
        .eq('action', action)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (data) {
        const newLog: FreightAuditLog = {
          id: data.id,
          entityType: data.entity_type,
          entityId: data.entity_id,
          action: data.action,
          changes: data.changes,
          entitySnapshot: data.entity_snapshot,
          changedBy: data.changed_by,
          changedByUsername: data.changed_by_username,
          changedByName: data.changed_by_name,
          timestamp: data.created_at,
          version: data.version,
        };
        setAuditLogs(prev => [newLog, ...prev]);
      }
    } catch (error) {
      handleError(error, 'Audit Log 생성');
    }
  }, [user]); // Only depend on user

  // Helper function to detect changes between old and new entity
  const detectChanges = (oldEntity: Record<string, unknown> | null, newEntity: Record<string, unknown>): FreightAuditLog['changes'] => {
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

  // Load all data on mount - only run once
  useEffect(() => {
    const loadAllData = async () => {
      await Promise.all([
        loadShippingLines(),
        loadPorts(),
        loadQuotations(),
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
    };

    loadAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only run once on mount

  // [Rest of the CRUD operations remain the same - keeping the file structure but showing key calculation history operations]
  
  // Shipping Line Operations
  const addShippingLine = async (line: Omit<ShippingLine, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const { error } = await supabase
        .from(TABLES.SHIPPING_LINES)
        .insert({
          name: line.name,
          code: line.code,
          description: line.description,
        });

      if (error) {
        handleError(error, '선사 추가');
        return;
      }

      await loadShippingLines();
    } catch (error) {
      handleError(error, '선사 추가');
    }
  };

  const updateShippingLine = async (id: string, line: Partial<ShippingLine>) => {
    try {
      const { error } = await supabase
        .from(TABLES.SHIPPING_LINES)
        .update({
          name: line.name,
          code: line.code,
          description: line.description,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        handleError(error, '선사 수정');
        return;
      }

      await loadShippingLines();
    } catch (error) {
      handleError(error, '선사 수정');
    }
  };

  const deleteShippingLine = async (id: string) => {
    try {
      const { error } = await supabase
        .from(TABLES.SHIPPING_LINES)
        .delete()
        .eq('id', id);

      if (error) {
        handleError(error, '선사 삭제');
        return;
      }

      await loadShippingLines();
    } catch (error) {
      handleError(error, '선사 삭제');
    }
  };

  const getShippingLineById = (id: string): ShippingLine | undefined => {
    return shippingLines.find((l) => l.id === id);
  };

  // Port Operations
  const addPort = async (port: Omit<Port, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const { error } = await supabase
        .from(TABLES.PORTS)
        .insert({
          name: port.name,
          type: port.type,
          country: port.country,
          description: port.description,
        });

      if (error) {
        handleError(error, '포트 추가');
        return;
      }

      await loadPorts();
    } catch (error) {
      handleError(error, '포트 추가');
    }
  };

  const updatePort = async (id: string, port: Partial<Port>) => {
    try {
      const { error } = await supabase
        .from(TABLES.PORTS)
        .update({
          name: port.name,
          type: port.type,
          country: port.country,
          description: port.description,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        handleError(error, '포트 수정');
        return;
      }

      await loadPorts();
    } catch (error) {
      handleError(error, '포트 수정');
    }
  };

  const deletePort = async (id: string) => {
    try {
      const { error } = await supabase
        .from(TABLES.PORTS)
        .delete()
        .eq('id', id);

      if (error) {
        handleError(error, '포트 삭제');
        return;
      }

      await loadPorts();
    } catch (error) {
      handleError(error, '포트 삭제');
    }
  };

  const getPortById = (id: string): Port | undefined => {
    return ports.find((p) => p.id === id);
  };

  // Get next version number for sea freight
  const getSeaFreightVersion = (carrier: string, pol: string, pod: string, excludeId?: string): number => {
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
  const getAgentSeaFreightVersion = (agent: string, pol: string, pod: string, excludeId?: string): number => {
    const sameRoute = agentSeaFreights.filter(f => 
      f.agent === agent && 
      f.pol === pol && 
      f.pod === pod &&
      f.id !== excludeId
    );
    if (sameRoute.length === 0) return 1;
    const maxVersion = Math.max(...sameRoute.map(f => f.version || 1));
    return maxVersion + 1;
  };

  // [Continuing with remaining CRUD operations - keeping structure but focusing on calculation history]
  
  // Rail Agent Operations
  const addRailAgent = async (agent: Omit<RailAgent, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const { error } = await supabase
        .from(TABLES.RAIL_AGENTS)
        .insert({
          name: agent.name,
          description: agent.description,
        });

      if (error) {
        handleError(error, '철도 운송사 추가');
        return;
      }

      await loadRailAgents();
    } catch (error) {
      handleError(error, '철도 운송사 추가');
    }
  };

  const updateRailAgent = async (id: string, agent: Partial<RailAgent>) => {
    try {
      const { error } = await supabase
        .from(TABLES.RAIL_AGENTS)
        .update({
          name: agent.name,
          description: agent.description,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        handleError(error, '철도 운송사 수정');
        return;
      }

      await loadRailAgents();
    } catch (error) {
      handleError(error, '철도 운송사 수정');
    }
  };

  const deleteRailAgent = async (id: string) => {
    try {
      const { error } = await supabase
        .from(TABLES.RAIL_AGENTS)
        .delete()
        .eq('id', id);

      if (error) {
        handleError(error, '철도 운송사 삭제');
        return;
      }

      await loadRailAgents();
      await loadAgentSeaFreights();
      await loadDTHC();
      await loadCombinedFreights();
      await loadPortBorderFreights();
    } catch (error) {
      handleError(error, '철도 운송사 삭제');
    }
  };

  const getRailAgentById = (id: string): RailAgent | undefined => {
    return railAgents.find((a) => a.id === id);
  };

  // Truck Agent Operations
  const addTruckAgent = async (agent: Omit<TruckAgent, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const { error } = await supabase
        .from(TABLES.TRUCK_AGENTS)
        .insert({
          name: agent.name,
          description: agent.description,
        });

      if (error) {
        handleError(error, '트럭 운송사 추가');
        return;
      }

      await loadTruckAgents();
    } catch (error) {
      handleError(error, '트럭 운송사 추가');
    }
  };

  const updateTruckAgent = async (id: string, agent: Partial<TruckAgent>) => {
    try {
      const { error } = await supabase
        .from(TABLES.TRUCK_AGENTS)
        .update({
          name: agent.name,
          description: agent.description,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        handleError(error, '트럭 운송사 수정');
        return;
      }

      await loadTruckAgents();
    } catch (error) {
      handleError(error, '트럭 운송사 수정');
    }
  };

  const deleteTruckAgent = async (id: string) => {
    try {
      const { error} = await supabase
        .from(TABLES.TRUCK_AGENTS)
        .delete()
        .eq('id', id);

      if (error) {
        handleError(error, '트럭 운송사 삭제');
        return;
      }

      await loadTruckAgents();
      await loadBorderDestinationFreights();
      await loadWeightSurchargeRules();
    } catch (error) {
      handleError(error, '트럭 운송사 삭제');
    }
  };

  const getTruckAgentById = (id: string): TruckAgent | undefined => {
    return truckAgents.find((a) => a.id === id);
  };

  // Destination Operations
  const addDestination = async (destination: Omit<Destination, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const { error } = await supabase
        .from(TABLES.DESTINATIONS)
        .insert({
          name: destination.name,
          description: destination.description,
        });

      if (error) {
        handleError(error, '목적지 추가');
        return;
      }

      await loadDestinations();
    } catch (error) {
      handleError(error, '목적지 추가');
    }
  };

  const updateDestination = async (id: string, destination: Partial<Destination>) => {
    try {
      const { error } = await supabase
        .from(TABLES.DESTINATIONS)
        .update({
          name: destination.name,
          description: destination.description,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        handleError(error, '목적지 수정');
        return;
      }

      await loadDestinations();
    } catch (error) {
      handleError(error, '목적지 수정');
    }
  };

  const deleteDestination = async (id: string) => {
    try {
      // First, delete all related border destination freights
      const { error: borderDestError } = await supabase
        .from(TABLES.BORDER_DESTINATION_FREIGHTS)
        .delete()
        .eq('destination_id', id);

      if (borderDestError) {
        handleError(borderDestError, '관련 국경-목적지 운임 삭제');
        throw borderDestError;
      }

      // Then, delete all related combined freights
      const { error: combinedError } = await supabase
        .from(TABLES.COMBINED_FREIGHTS)
        .delete()
        .eq('destination_id', id);

      if (combinedError) {
        handleError(combinedError, '관련 통합 운임 삭제');
        throw combinedError;
      }

      // Finally, delete the destination itself
      const { error } = await supabase
        .from(TABLES.DESTINATIONS)
        .delete()
        .eq('id', id);

      if (error) {
        handleError(error, '목적지 삭제');
        throw error;
      }

      await loadDestinations();
      await loadBorderDestinationFreights();
      await loadCombinedFreights();
    } catch (error) {
      handleError(error, '목적지 삭제');
    }
  };

  const getDestinationById = (id: string): Destination | undefined => {
    return destinations.find((d) => d.id === id);
  };

  // Border City Operations
  const addBorderCity = async (city: Omit<BorderCity, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const { data, error } = await supabase
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

    if (error) {
      handleError(error, '국경 도시 추가');
      return;
    }

    if (data) {
      const newCity: BorderCity = {
        id: data.id,
        name: data.name,
        country: data.country,
        description: data.description,
        isDefault: data.is_default,
        isActive: data.is_active,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      await createAuditLog('borderCity', newCity.id, 'create',
        detectChanges(null, newCity as unknown as Record<string, unknown>),
        newCity as unknown as Record<string, unknown>
      );
    }

    await loadBorderCities();
  } catch (error) {
    handleError(error, '국경 도시 추가');
  }
};

const updateBorderCity = async (id: string, city: Partial<BorderCity>) => {
  try {
    const oldCity = borderCities.find(c => c.id === id);
    if (!oldCity) return;

    const { data, error } = await supabase
      .from(TABLES.BORDER_CITIES)
      .update({
        name: city.name,
        country: city.country,
        description: city.description,
        is_default: city.isDefault,
        is_active: city.isActive,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      handleError(error, '국경 도시 수정');
      return;
    }

    if (data) {
      const updatedCity: BorderCity = {
        id: data.id,
        name: data.name,
        country: data.country,
        description: data.description,
        isDefault: data.is_default,
        isActive: data.is_active,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      await createAuditLog('borderCity', id, 'update',
        detectChanges(oldCity as unknown as Record<string, unknown>, updatedCity as unknown as Record<string, unknown>),
        updatedCity as unknown as Record<string, unknown>
      );
    }

    await loadBorderCities();
  } catch (error) {
    handleError(error, '국경 도시 수정');
  }
};

const deleteBorderCity = async (id: string) => {
  try {
    const city = borderCities.find(c => c.id === id);

    const { error } = await supabase
      .from(TABLES.BORDER_CITIES)
      .delete()
      .eq('id', id);

    if (error) {
      handleError(error, '국경 도시 삭제');
      return;
    }

    if (city) {
      await createAuditLog('borderCity', id, 'delete', [], city as unknown as Record<string, unknown>);
    }

    await loadBorderCities();
  } catch (error) {
    handleError(error, '국경 도시 삭제');
  }
};

const getBorderCityById = (id: string): BorderCity | undefined => {
  return borderCities.find((c) => c.id === id);
};

const getDefaultBorderCity = (): BorderCity | undefined => {
  return borderCities.find((c) => c.isDefault && c.isActive);
};

// System Setting Operations
const addSystemSetting = async (setting: Omit<SystemSetting, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const { data, error } = await supabase
      .from(TABLES.SYSTEM_SETTINGS)
      .insert({
        setting_key: setting.settingKey,
        setting_value: setting.settingValue,
        setting_type: setting.settingType,
        category: setting.category,
        description: setting.description,
        is_editable: setting.isEditable,
      })
      .select()
      .single();

    if (error) {
      handleError(error, '시스템 설정 추가');
      return;
    }

    if (data) {
      const newSetting: SystemSetting = {
        id: data.id,
        settingKey: data.setting_key,
        settingValue: data.setting_value,
        settingType: data.setting_type,
        category: data.category,
        description: data.description,
        isEditable: data.is_editable,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      await createAuditLog('systemSetting', newSetting.id, 'create',
        detectChanges(null, newSetting as unknown as Record<string, unknown>),
        newSetting as unknown as Record<string, unknown>
      );
    }

    await loadSystemSettings();
  } catch (error) {
    handleError(error, '시스템 설정 추가');
  }
};

const updateSystemSetting = async (id: string, setting: Partial<SystemSetting>) => {
  try {
    const oldSetting = systemSettings.find(s => s.id === id);
    if (!oldSetting) return;

    const { data, error } = await supabase
      .from(TABLES.SYSTEM_SETTINGS)
      .update({
        setting_key: setting.settingKey,
        setting_value: setting.settingValue,
        setting_type: setting.settingType,
        category: setting.category,
        description: setting.description,
        is_editable: setting.isEditable,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      handleError(error, '시스템 설정 수정');
      return;
    }

    if (data) {
      const updatedSetting: SystemSetting = {
        id: data.id,
        settingKey: data.setting_key,
        settingValue: data.setting_value,
        settingType: data.setting_type,
        category: data.category,
        description: data.description,
        isEditable: data.is_editable,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      await createAuditLog('systemSetting', id, 'update',
        detectChanges(oldSetting as unknown as Record<string, unknown>, updatedSetting as unknown as Record<string, unknown>),
        updatedSetting as unknown as Record<string, unknown>
      );
    }

    await loadSystemSettings();
  } catch (error) {
    handleError(error, '시스템 설정 수정');
  }
};

const deleteSystemSetting = async (id: string) => {
  try {
    const setting = systemSettings.find(s => s.id === id);

    const { error } = await supabase
      .from(TABLES.SYSTEM_SETTINGS)
      .delete()
      .eq('id', id);

    if (error) {
      handleError(error, '시스템 설정 삭제');
      return;
    }

    if (setting) {
      await createAuditLog('systemSetting', id, 'delete', [], setting as unknown as Record<string, unknown>);
    }

    await loadSystemSettings();
  } catch (error) {
    handleError(error, '시스템 설정 삭제');
  }
};

const getSystemSettingByKey = (key: string): SystemSetting | undefined => {
  return systemSettings.find((s) => s.settingKey === key);
};

const getSystemSettingValue = (key: string, defaultValue: string = ''): string => {
  const setting = systemSettings.find((s) => s.settingKey === key);
  return setting ? setting.settingValue : defaultValue;
};

  // [Continuing with Sea Freight, Agent Sea Freight, DTHC, DP Cost, Combined Freight, Port Border Freight, Border Destination Freight, Weight Surcharge operations - keeping the same structure as original but abbreviated for space]
  
  // Sea Freight Operations
  const addSeaFreight = async (freight: Omit<SeaFreight, 'id' | 'createdAt' | 'updatedAt' | 'version'>) => {
    try {
      const version = getSeaFreightVersion(freight.carrier || '', freight.pol, freight.pod);
      
      const { data, error } = await supabase
        .from(TABLES.SEA_FREIGHTS)
        .insert({
          pol: freight.pol,
          pod: freight.pod,
          rate: freight.rate,
          carrier: freight.carrier,
          local_charge: freight.localCharge || 0,
          note: freight.note,
          version,
          valid_from: freight.validFrom,
          valid_to: freight.validTo,
        })
        .select()
        .single();

      if (error) {
        handleError(error, '해상 운임 추가');
        return;
      }

      if (data) {
        const newFreight: SeaFreight = {
          id: data.id,
          pol: data.pol,
          pod: data.pod,
          rate: data.rate,
          carrier: data.carrier,
          note: data.note,
          version: data.version,
          validFrom: data.valid_from,
          validTo: data.valid_to,
          localCharge: data.local_charge || 0,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };

        await createAuditLog('seaFreight', newFreight.id, 'create', 
          detectChanges(null, newFreight as unknown as Record<string, unknown>), 
          newFreight as unknown as Record<string, unknown>,
          version
        );
      }

      await loadSeaFreights();
    } catch (error) {
      handleError(error, '해상 운임 추가');
    }
  };

  const updateSeaFreight = async (id: string, freight: Partial<SeaFreight>) => {
    try {
      const oldFreight = seaFreights.find(f => f.id === id);
      if (!oldFreight) return;

      const carrierChanged = freight.carrier !== undefined && freight.carrier !== oldFreight.carrier;
      const rateChanged = freight.rate !== undefined && freight.rate !== oldFreight.rate;
      const localChargeChanged = freight.localCharge !== undefined && freight.localCharge !== oldFreight.localCharge;
      const validFromChanged = freight.validFrom !== undefined && freight.validFrom !== oldFreight.validFrom;
      const validToChanged = freight.validTo !== undefined && freight.validTo !== oldFreight.validTo;
      const validityChanged = validFromChanged || validToChanged;

      let newVersion = oldFreight.version;
      if (carrierChanged || rateChanged || localChargeChanged || validityChanged) {
        newVersion = (oldFreight.version || 1) + 1;
      }

      const { data, error } = await supabase
        .from(TABLES.SEA_FREIGHTS)
        .update({
          pol: freight.pol,
          pod: freight.pod,
          rate: freight.rate,
          local_charge: freight.localCharge,
          carrier: freight.carrier,
          note: freight.note,
          version: newVersion,
          valid_from: freight.validFrom,
          valid_to: freight.validTo,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        handleError(error, '해상 운임 수정');
        return;
      }

      if (data && (carrierChanged || rateChanged || localChargeChanged || validityChanged)) {
        const updatedFreight: SeaFreight = {
          id: data.id,
          pol: data.pol,
          pod: data.pod,
          rate: data.rate,
          carrier: data.carrier,
          note: data.note,
          version: data.version,
          localCharge: data.local_charge || 0,
          validFrom: data.valid_from,
          validTo: data.valid_to,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };

        await createAuditLog('seaFreight', id, 'update',
          detectChanges(oldFreight as unknown as Record<string, unknown>, updatedFreight as unknown as Record<string, unknown>), 
          updatedFreight as unknown as Record<string, unknown>,
          newVersion
        );
      }

      await loadSeaFreights();
    } catch (error) {
      handleError(error, '해상 운임 수정');
    }
  };

  const deleteSeaFreight = async (id: string) => {
    try {
      const freight = seaFreights.find(f => f.id === id);
      
      const { error } = await supabase
        .from(TABLES.SEA_FREIGHTS)
        .delete()
        .eq('id', id);

      if (error) {
        handleError(error, '해상 운임 삭제');
        return;
      }

      if (freight) {
        await createAuditLog('seaFreight', id, 'delete', [], freight as unknown as Record<string, unknown>, freight.version);
      }

      await loadSeaFreights();
    } catch (error) {
      handleError(error, '해상 운임 삭제');
    }
  };

  const getSeaFreightOptions = (pol: string, pod: string, date?: string): SeaFreight[] => {
    const filtered = seaFreights.filter((f) => f.pol === pol && f.pod === pod);
    if (date) {
      return filtered.filter(f => isValidOnDate(f.validFrom, f.validTo, date));
    }
    return filtered;
  };

  // Agent Sea Freight Operations
  const addAgentSeaFreight = async (freight: Omit<AgentSeaFreight, 'id' | 'createdAt' | 'updatedAt' | 'version'>) => {
    try {
      const version = getAgentSeaFreightVersion(freight.agent, freight.pol, freight.pod);
      
      const { data, error } = await supabase
        .from(TABLES.AGENT_SEA_FREIGHTS)
        .insert({
          agent: freight.agent,
          pol: freight.pol,
          pod: freight.pod,
          rate: freight.rate,
          carrier: freight.carrier,
          note: freight.note,
          version,
          valid_from: freight.validFrom,
          valid_to: freight.validTo,
        })
        .select()
        .single();

      if (error) {
        handleError(error, '운송사별 해상 운임 추가');
        return;
      }

      if (data) {
        const newFreight: AgentSeaFreight = {
          id: data.id,
          agent: data.agent,
          pol: data.pol,
          pod: data.pod,
          rate: data.rate,
          carrier: data.carrier,
          note: data.note,
          version: data.version,
          validFrom: data.valid_from,
          validTo: data.valid_to,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };

        await createAuditLog('agentSeaFreight', newFreight.id, 'create',
          detectChanges(null, newFreight as unknown as Record<string, unknown>), 
          newFreight as unknown as Record<string, unknown>,
          version
        );
      }

      await loadAgentSeaFreights();
    } catch (error) {
      handleError(error, '운송사별 해상 운임 추가');
    }
  };

  const updateAgentSeaFreight = async (id: string, freight: Partial<AgentSeaFreight>) => {
    try {
      const oldFreight = agentSeaFreights.find(f => f.id === id);
      if (!oldFreight) return;

      const rateChanged = freight.rate !== undefined && freight.rate !== oldFreight.rate;
      const validFromChanged = freight.validFrom !== undefined && freight.validFrom !== oldFreight.validFrom;
      const validToChanged = freight.validTo !== undefined && freight.validTo !== oldFreight.validTo;
      const validityChanged = validFromChanged || validToChanged;

      let newVersion = oldFreight.version;
      if (rateChanged || validityChanged) {
        newVersion = (oldFreight.version || 1) + 1;
      }

      const { data, error } = await supabase
        .from(TABLES.AGENT_SEA_FREIGHTS)
        .update({
          agent: freight.agent,
          pol: freight.pol,
          pod: freight.pod,
          rate: freight.rate,
          carrier: freight.carrier,
          note: freight.note,
          version: newVersion,
          valid_from: freight.validFrom,
          valid_to: freight.validTo,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        handleError(error, '운송사별 해상 운임 수정');
        return;
      }

      if (data && (rateChanged || validityChanged)) {
        const updatedFreight: AgentSeaFreight = {
          id: data.id,
          agent: data.agent,
          pol: data.pol,
          pod: data.pod,
          rate: data.rate,
          carrier: data.carrier,
          note: data.note,
          version: data.version,
          validFrom: data.valid_from,
          validTo: data.valid_to,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };

        await createAuditLog('agentSeaFreight', id, 'update',
          detectChanges(oldFreight as unknown as Record<string, unknown>, updatedFreight as unknown as Record<string, unknown>), 
          updatedFreight as unknown as Record<string, unknown>,
          newVersion
        );
      }

      await loadAgentSeaFreights();
    } catch (error) {
      handleError(error, '운송사별 해상 운임 수정');
    }
  };

  const deleteAgentSeaFreight = async (id: string) => {
    try {
      const freight = agentSeaFreights.find(f => f.id === id);
      
      const { error } = await supabase
        .from(TABLES.AGENT_SEA_FREIGHTS)
        .delete()
        .eq('id', id);

      if (error) {
        handleError(error, '운송사별 해상 운임 삭제');
        return;
      }

      if (freight) {
        await createAuditLog('agentSeaFreight', id, 'delete', [], freight as unknown as Record<string, unknown>, freight.version);
      }

      await loadAgentSeaFreights();
    } catch (error) {
      handleError(error, '운송사별 해상 운임 삭제');
    }
  };

  const getAgentSeaFreight = (agent: string, pol: string, pod: string, date?: string): number | null => {
    const filtered = agentSeaFreights.filter(
      (f) => f.agent === agent && f.pol === pol && f.pod === pod
    );
    
    if (date) {
      const validFreights = filtered.filter(f => isValidOnDate(f.validFrom, f.validTo, date));
      return validFreights.length > 0 ? validFreights[0].rate : null;
    }
    
    return filtered.length > 0 ? filtered[0].rate : null;
  };

  // DTHC Operations
  const addDTHC = async (dthc: Omit<DTHC, 'id' | 'createdAt' | 'updatedAt' | 'version'>) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.DTHC)
        .insert({
          agent: dthc.agent,
          pol: dthc.pol,
          pod: dthc.pod,
          amount: dthc.amount,
          description: dthc.description,
          version: 1,
          valid_from: dthc.validFrom,
          valid_to: dthc.validTo,
        })
        .select()
        .single();

      if (error) {
        handleError(error, 'DTHC 추가');
        return;
      }

      if (data) {
        const newDTHC: DTHC = {
          id: data.id,
          agent: data.agent,
          pol: data.pol,
          pod: data.pod,
          amount: data.amount,
          description: data.description,
          version: data.version,
          validFrom: data.valid_from,
          validTo: data.valid_to,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };

        await createAuditLog('dthc', newDTHC.id, 'create',
          detectChanges(null, newDTHC as unknown as Record<string, unknown>), 
          newDTHC as unknown as Record<string, unknown>,
          1
        );
      }

      await loadDTHC();
    } catch (error) {
      handleError(error, 'DTHC 추가');
    }
  };

  const updateDTHC = async (id: string, dthc: Partial<DTHC>) => {
    try {
      const oldDTHC = dthcList.find(d => d.id === id);
      if (!oldDTHC) return;

      const amountChanged = dthc.amount !== undefined && dthc.amount !== oldDTHC.amount;
      const validFromChanged = dthc.validFrom !== undefined && dthc.validFrom !== oldDTHC.validFrom;
      const validToChanged = dthc.validTo !== undefined && dthc.validTo !== oldDTHC.validTo;
      const validityChanged = validFromChanged || validToChanged;

      let newVersion = oldDTHC.version;
      if (amountChanged || validityChanged) {
        newVersion = (oldDTHC.version || 1) + 1;
      }

      const { data, error } = await supabase
        .from(TABLES.DTHC)
        .update({
          agent: dthc.agent,
          pol: dthc.pol,
          pod: dthc.pod,
          amount: dthc.amount,
          description: dthc.description,
          version: newVersion,
          valid_from: dthc.validFrom,
          valid_to: dthc.validTo,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        handleError(error, 'DTHC 수정');
        return;
      }

      if (data && (amountChanged || validityChanged)) {
        const updatedDTHC: DTHC = {
          id: data.id,
          agent: data.agent,
          pol: data.pol,
          pod: data.pod,
          amount: data.amount,
          description: data.description,
          version: data.version,
          validFrom: data.valid_from,
          validTo: data.valid_to,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };

        await createAuditLog('dthc', id, 'update',
          detectChanges(oldDTHC as unknown as Record<string, unknown>, updatedDTHC as unknown as Record<string, unknown>), 
          updatedDTHC as unknown as Record<string, unknown>,
          newVersion
        );
      }

      await loadDTHC();
    } catch (error) {
      handleError(error, 'DTHC 수정');
    }
  };

  const deleteDTHC = async (id: string) => {
    try {
      const dthc = dthcList.find(d => d.id === id);
      
      const { error } = await supabase
        .from(TABLES.DTHC)
        .delete()
        .eq('id', id);

      if (error) {
        handleError(error, 'DTHC 삭제');
        return;
      }

      if (dthc) {
        await createAuditLog('dthc', id, 'delete', [], dthc as unknown as Record<string, unknown>, dthc.version);
      }

      await loadDTHC();
    } catch (error) {
      handleError(error, 'DTHC 삭제');
    }
  };

  const getDTHCByAgentAndRoute = (agent: string, pol: string, pod: string, date?: string): number => {
    const filtered = dthcList.filter((d) => d.agent === agent && d.pol === pol && d.pod === pod);
    
    if (date) {
      const validDTHC = filtered.filter(d => isValidOnDate(d.validFrom, d.validTo, date));
      return validDTHC.length > 0 ? validDTHC[0].amount : 0;
    }
    
    return filtered.length > 0 ? filtered[0].amount : 0;
  };

  // DP Cost Operations
  const addDPCost = async (dp: Omit<DPCost, 'id' | 'createdAt' | 'updatedAt' | 'version'>) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.DP_COSTS)
        .insert({
          port: dp.port,
          amount: dp.amount,
          description: dp.description,
          version: 1,
          valid_from: dp.validFrom,
          valid_to: dp.validTo,
        })
        .select()
        .single();

      if (error) {
        handleError(error, 'DP 비용 추가');
        return;
      }

      if (data) {
        const newDP: DPCost = {
          id: data.id,
          port: data.port,
          amount: data.amount,
          description: data.description,
          version: data.version,
          validFrom: data.valid_from,
          validTo: data.valid_to,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };

        await createAuditLog('dpCost', newDP.id, 'create',
          detectChanges(null, newDP as unknown as Record<string, unknown>), 
          newDP as unknown as Record<string, unknown>,
          1
        );
      }

      await loadDPCosts();
    } catch (error) {
      handleError(error, 'DP 비용 추가');
    }
  };

  const updateDPCost = async (id: string, dp: Partial<DPCost>) => {
    try {
      const oldDP = dpCosts.find(d => d.id === id);
      if (!oldDP) return;

      const amountChanged = dp.amount !== undefined && dp.amount !== oldDP.amount;
      const validFromChanged = dp.validFrom !== undefined && dp.validFrom !== oldDP.validFrom;
      const validToChanged = dp.validTo !== undefined && dp.validTo !== oldDP.validTo;
      const validityChanged = validFromChanged || validToChanged;

      let newVersion = oldDP.version;
      if (amountChanged || validityChanged) {
        newVersion = (oldDP.version || 1) + 1;
      }

      const { data, error } = await supabase
        .from(TABLES.DP_COSTS)
        .update({
          port: dp.port,
          amount: dp.amount,
          description: dp.description,
          version: newVersion,
          valid_from: dp.validFrom,
          valid_to: dp.validTo,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        handleError(error, 'DP 비용 수정');
        return;
      }

      if (data && (amountChanged || validityChanged)) {
        const updatedDP: DPCost = {
          id: data.id,
          port: data.port,
          amount: data.amount,
          description: data.description,
          version: data.version,
          validFrom: data.valid_from,
          validTo: data.valid_to,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };

        await createAuditLog('dpCost', id, 'update',
          detectChanges(oldDP as unknown as Record<string, unknown>, updatedDP as unknown as Record<string, unknown>), 
          updatedDP as unknown as Record<string, unknown>,
          newVersion
        );
      }

      await loadDPCosts();
    } catch (error) {
      handleError(error, 'DP 비용 수정');
    }
  };

  const deleteDPCost = async (id: string) => {
    try {
      const dp = dpCosts.find(d => d.id === id);
      
      const { error } = await supabase
        .from(TABLES.DP_COSTS)
        .delete()
        .eq('id', id);

      if (error) {
        handleError(error, 'DP 비용 삭제');
        return;
      }

      if (dp) {
        await createAuditLog('dpCost', id, 'delete', [], dp as unknown as Record<string, unknown>, dp.version);
      }

      await loadDPCosts();
    } catch (error) {
      handleError(error, 'DP 비용 삭제');
    }
  };

  const getDPCost = (port: string, date?: string): number => {
    const filtered = dpCosts.filter((d) => d.port === port);
    
    if (date) {
      const validDP = filtered.filter(d => isValidOnDate(d.validFrom, d.validTo, date));
      return validDP.length > 0 ? validDP[0].amount : 0;
    }
    
    return filtered.length > 0 ? filtered[0].amount : 0;
  };

  // Combined Freight Operations
  const addCombinedFreight = async (freight: Omit<CombinedFreight, 'id' | 'createdAt' | 'updatedAt' | 'version'>) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.COMBINED_FREIGHTS)
        .insert({
          agent: freight.agent,
          pod: freight.pod,
          destination_id: freight.destinationId,
          rate: freight.rate,
          description: freight.description,
          version: 1,
          valid_from: freight.validFrom,
          valid_to: freight.validTo,
        })
        .select()
        .single();

      if (error) {
        handleError(error, '통합 운임 추가');
        return;
      }

      if (data) {
        const newFreight: CombinedFreight = {
          id: data.id,
          agent: data.agent,
          pod: data.pod,
          destinationId: data.destination_id,
          rate: data.rate,
          description: data.description,
          version: data.version,
          validFrom: data.valid_from,
          validTo: data.valid_to,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };

        await createAuditLog('combinedFreight', newFreight.id, 'create',
          detectChanges(null, newFreight as unknown as Record<string, unknown>), 
          newFreight as unknown as Record<string, unknown>,
          1
        );
      }

      await loadCombinedFreights();
    } catch (error) {
      handleError(error, '통합 운임 추가');
    }
  };

  const updateCombinedFreight = async (id: string, freight: Partial<CombinedFreight>) => {
    try {
      const oldFreight = combinedFreights.find(f => f.id === id);
      if (!oldFreight) return;

      const rateChanged = freight.rate !== undefined && freight.rate !== oldFreight.rate;
      const validFromChanged = freight.validFrom !== undefined && freight.validFrom !== oldFreight.validFrom;
      const validToChanged = freight.validTo !== undefined && freight.validTo !== oldFreight.validTo;
      const validityChanged = validFromChanged || validToChanged;

      let newVersion = oldFreight.version;
      if (rateChanged || validityChanged) {
        newVersion = (oldFreight.version || 1) + 1;
      }

      const { data, error } = await supabase
        .from(TABLES.COMBINED_FREIGHTS)
        .update({
          agent: freight.agent,
          pod: freight.pod,
          destination_id: freight.destinationId,
          rate: freight.rate,
          description: freight.description,
          version: newVersion,
          valid_from: freight.validFrom,
          valid_to: freight.validTo,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        handleError(error, '통합 운임 수정');
        return;
      }

      if (data && (rateChanged || validityChanged)) {
        const updatedFreight: CombinedFreight = {
          id: data.id,
          agent: data.agent,
          pod: data.pod,
          destinationId: data.destination_id,
          rate: data.rate,
          description: data.description,
          version: data.version,
          validFrom: data.valid_from,
          validTo: data.valid_to,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };

        await createAuditLog('combinedFreight', id, 'update',
          detectChanges(oldFreight as unknown as Record<string, unknown>, updatedFreight as unknown as Record<string, unknown>), 
          updatedFreight as unknown as Record<string, unknown>,
          newVersion
        );
      }

      await loadCombinedFreights();
    } catch (error) {
      handleError(error, '통합 운임 수정');
    }
  };

  const deleteCombinedFreight = async (id: string) => {
    try {
      const freight = combinedFreights.find(f => f.id === id);
      
      const { error } = await supabase
        .from(TABLES.COMBINED_FREIGHTS)
        .delete()
        .eq('id', id);

      if (error) {
        handleError(error, '통합 운임 삭제');
        return;
      }

      if (freight) {
        await createAuditLog('combinedFreight', id, 'delete', [], freight as unknown as Record<string, unknown>, freight.version);
      }

      await loadCombinedFreights();
    } catch (error) {
      handleError(error, '통합 운임 삭제');
    }
  };

  const getCombinedFreight = (agent: string, pod: string, destinationId: string, date?: string): number | null => {
    const filtered = combinedFreights.filter(
      (f) => f.agent === agent && f.pod === pod && f.destinationId === destinationId
    );
    
    if (date) {
      const validFreights = filtered.filter(f => isValidOnDate(f.validFrom, f.validTo, date));
      return validFreights.length > 0 ? validFreights[0].rate : null;
    }
    
    return filtered.length > 0 ? filtered[0].rate : null;
  };

  // Port Border Freight Operations
  const addPortBorderFreight = async (freight: Omit<PortBorderFreight, 'id' | 'createdAt' | 'updatedAt' | 'version'>) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.PORT_BORDER_FREIGHTS)
        .insert({
          agent: freight.agent,
          pod: freight.pod,
          rate: freight.rate,
          version: 1,
          valid_from: freight.validFrom,
          valid_to: freight.validTo,
        })
        .select()
        .single();

      if (error) {
        handleError(error, '항구-국경 운임 추가');
        return;
      }

      if (data) {
        const newFreight: PortBorderFreight = {
          id: data.id,
          agent: data.agent,
          pod: data.pod,
          rate: data.rate,
          version: data.version,
          validFrom: data.valid_from,
          validTo: data.valid_to,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };

        await createAuditLog('portBorderFreight', newFreight.id, 'create',
          detectChanges(null, newFreight as unknown as Record<string, unknown>), 
          newFreight as unknown as Record<string, unknown>,
          1
        );
      }

      await loadPortBorderFreights();
    } catch (error) {
      handleError(error, '항구-국경 운임 추가');
    }
  };

  const updatePortBorderFreight = async (id: string, freight: Partial<PortBorderFreight>) => {
    try {
      const oldFreight = portBorderFreights.find(f => f.id === id);
      if (!oldFreight) return;

      const rateChanged = freight.rate !== undefined && freight.rate !== oldFreight.rate;
      const validFromChanged = freight.validFrom !== undefined && freight.validFrom !== oldFreight.validFrom;
      const validToChanged = freight.validTo !== undefined && freight.validTo !== oldFreight.validTo;
      const validityChanged = validFromChanged || validToChanged;

      // Check if version will remain the same
      const versionWillChange = rateChanged || validityChanged;
      let newVersion = oldFreight.version;
      if (versionWillChange) {
        newVersion = (oldFreight.version || 1) + 1;
      }

      const { data, error } = await supabase
        .from(TABLES.PORT_BORDER_FREIGHTS)
        .update({
          agent: freight.agent,
          pod: freight.pod,
          rate: freight.rate,
          version: newVersion,
          valid_from: freight.validFrom,
          valid_to: freight.validTo,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        handleError(error, '항구-국경 운임 수정');
        return;
      }

      // Only create audit log if version changes OR (version stays same but there are actual changes)
      if (data) {
        const updatedFreight: PortBorderFreight = {
          id: data.id,
          agent: data.agent,
          pod: data.pod,
          rate: data.rate,
          version: data.version,
          validFrom: data.valid_from,
          validTo: data.valid_to,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };

        const changes = detectChanges(
          oldFreight as unknown as Record<string, unknown>, 
          updatedFreight as unknown as Record<string, unknown>
        );

        // Create log only if:
        // 1. Version changed (meaning rate or validity changed), OR
        // 2. Version stayed same but there are actual changes detected
        if (versionWillChange || (changes.length > 0 && !versionWillChange)) {
          await createAuditLog('portBorderFreight', id, 'update',
            changes, 
            updatedFreight as unknown as Record<string, unknown>,
            newVersion
          );
        }
      }

      await loadPortBorderFreights();
    } catch (error) {
      handleError(error, '항구-국경 운임 수정');
    }
  };

  const deletePortBorderFreight = async (id: string) => {
    try {
      const freight = portBorderFreights.find(f => f.id === id);
      
      const { error } = await supabase
        .from(TABLES.PORT_BORDER_FREIGHTS)
        .delete()
        .eq('id', id);

      if (error) {
        handleError(error, '항구-국경 운임 삭제');
        return;
      }

      if (freight) {
        await createAuditLog('portBorderFreight', id, 'delete', [], freight as unknown as Record<string, unknown>, freight.version);
      }

      await loadPortBorderFreights();
    } catch (error) {
      handleError(error, '항구-국경 운임 삭제');
    }
  };

  const getPortBorderRate = (agent: string, pod: string, date?: string): number => {
    const filtered = portBorderFreights.filter(
      (f) => f.agent === agent && f.pod === pod
    );
    
    if (date) {
      const validFreights = filtered.filter(f => isValidOnDate(f.validFrom, f.validTo, date));
      return validFreights.length > 0 ? validFreights[0].rate : 0;
    }
    
    return filtered.length > 0 ? filtered[0].rate : 0;
  };

  // Border Destination Freight Operations
  const addBorderDestinationFreight = async (freight: Omit<BorderDestinationFreight, 'id' | 'createdAt' | 'updatedAt' | 'version'>) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.BORDER_DESTINATION_FREIGHTS)
        .insert({
          agent: freight.agent,
          destination_id: freight.destinationId,
          rate: freight.rate,
          version: 1,
          valid_from: freight.validFrom,
          valid_to: freight.validTo,
        })
        .select()
        .single();

      if (error) {
        handleError(error, '국경-목적지 운임 추가');
        return;
      }

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
          updatedAt: data.updated_at,
        };

        await createAuditLog('borderDestinationFreight', newFreight.id, 'create',
          detectChanges(null, newFreight as unknown as Record<string, unknown>), 
          newFreight as unknown as Record<string, unknown>,
          1
        );
      }

      await loadBorderDestinationFreights();
    } catch (error) {
      handleError(error, '국경-목적지 운임 추가');
    }
  };

  const updateBorderDestinationFreight = async (id: string, freight: Partial<BorderDestinationFreight>) => {
    try {
      const oldFreight = borderDestinationFreights.find(f => f.id === id);
      if (!oldFreight) return;

      const rateChanged = freight.rate !== undefined && freight.rate !== oldFreight.rate;
      const validFromChanged = freight.validFrom !== undefined && freight.validFrom !== oldFreight.validFrom;
      const validToChanged = freight.validTo !== undefined && freight.validTo !== oldFreight.validTo;
      const validityChanged = validFromChanged || validToChanged;

      // Check if version will remain the same
      const versionWillChange = rateChanged || validityChanged;
      let newVersion = oldFreight.version;
      if (versionWillChange) {
        newVersion = (oldFreight.version || 1) + 1;
      }

      const { data, error } = await supabase
        .from(TABLES.BORDER_DESTINATION_FREIGHTS)
        .update({
          agent: freight.agent,
          destination_id: freight.destinationId,
          rate: freight.rate,
          version: newVersion,
          valid_from: freight.validFrom,
          valid_to: freight.validTo,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        handleError(error, '국경-목적지 운임 수정');
        return;
      }

      // Only create audit log if version changes OR (version stays same but there are actual changes)
      if (data) {
        const updatedFreight: BorderDestinationFreight = {
          id: data.id,
          agent: data.agent,
          destinationId: data.destination_id,
          rate: data.rate,
          version: data.version,
          validFrom: data.valid_from,
          validTo: data.valid_to,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };

        const changes = detectChanges(
          oldFreight as unknown as Record<string, unknown>, 
          updatedFreight as unknown as Record<string, unknown>
        );

        // Create log only if:
        // 1. Version changed (meaning rate or validity changed), OR
        // 2. Version stayed same but there are actual changes detected
        if (versionWillChange || (changes.length > 0 && !versionWillChange)) {
          await createAuditLog('borderDestinationFreight', id, 'update',
            changes, 
            updatedFreight as unknown as Record<string, unknown>,
            newVersion
          );
        }
      }

      await loadBorderDestinationFreights();
    } catch (error) {
      handleError(error, '국경-목적지 운임 수정');
    }
  };

  const deleteBorderDestinationFreight = async (id: string) => {
    try {
      const freight = borderDestinationFreights.find(f => f.id === id);
      
      const { error } = await supabase
        .from(TABLES.BORDER_DESTINATION_FREIGHTS)
        .delete()
        .eq('id', id);

      if (error) {
        handleError(error, '국경-목적지 운임 삭제');
        return;
      }

      if (freight) {
        await createAuditLog('borderDestinationFreight', id, 'delete', [], freight as unknown as Record<string, unknown>, freight.version);
      }

      await loadBorderDestinationFreights();
    } catch (error) {
      handleError(error, '국경-목적지 운임 삭제');
    }
  };

  const getBorderDestinationRate = (agent: string, destinationId: string, date?: string): number => {
    const filtered = borderDestinationFreights.filter(
      (f) => f.agent === agent && f.destinationId === destinationId
    );
    
    if (date) {
      const validFreights = filtered.filter(f => isValidOnDate(f.validFrom, f.validTo, date));
      return validFreights.length > 0 ? validFreights[0].rate : 0;
    }
    
    return filtered.length > 0 ? filtered[0].rate : 0;
  };

  // Weight Surcharge Operations
  const addWeightSurchargeRule = async (rule: Omit<WeightSurchargeRule, 'id' | 'createdAt' | 'updatedAt' | 'version'>) => {
    try {
      const { data, error } = await supabase
        .from(TABLES.WEIGHT_SURCHARGE_RULES)
        .insert({
          agent: rule.agent,
          min_weight: rule.minWeight,
          max_weight: rule.maxWeight,
          surcharge: rule.surcharge,
          version: 1,
          valid_from: rule.validFrom,
          valid_to: rule.validTo,
        })
        .select()
        .single();

      if (error) {
        handleError(error, '중량 할증 규칙 추가');
        return;
      }

      if (data) {
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
          updatedAt: data.updated_at,
        };

        await createAuditLog('weightSurcharge', newRule.id, 'create',
          detectChanges(null, newRule as unknown as Record<string, unknown>), 
          newRule as unknown as Record<string, unknown>,
          1
        );
      }

      await loadWeightSurchargeRules();
    } catch (error) {
      handleError(error, '중량 할증 규칙 추가');
    }
  };

  const updateWeightSurchargeRule = async (id: string, rule: Partial<WeightSurchargeRule>) => {
    try {
      const oldRule = weightSurchargeRules.find(r => r.id === id);
      if (!oldRule) return;

      const surchargeChanged = rule.surcharge !== undefined && rule.surcharge !== oldRule.surcharge;
      const minWeightChanged = rule.minWeight !== undefined && rule.minWeight !== oldRule.minWeight;
      const maxWeightChanged = rule.maxWeight !== undefined && rule.maxWeight !== oldRule.maxWeight;
      const weightRangeChanged = minWeightChanged || maxWeightChanged;
      const validFromChanged = rule.validFrom !== undefined && rule.validFrom !== oldRule.validFrom;
      const validToChanged = rule.validTo !== undefined && rule.validTo !== oldRule.validTo;
      const validityChanged = validFromChanged || validToChanged;

      let newVersion = oldRule.version;
      if (surchargeChanged || weightRangeChanged || validityChanged) {
        newVersion = (oldRule.version || 1) + 1;
      }

      const { data, error } = await supabase
        .from(TABLES.WEIGHT_SURCHARGE_RULES)
        .update({
          agent: rule.agent,
          min_weight: rule.minWeight,
          max_weight: rule.maxWeight,
          surcharge: rule.surcharge,
          version: newVersion,
          valid_from: rule.validFrom,
          valid_to: rule.validTo,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        handleError(error, '중량 할증 규칙 수정');
        return;
      }

      if (data && (surchargeChanged || weightRangeChanged || validityChanged)) {
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
          updatedAt: data.updated_at,
        };

        await createAuditLog('weightSurcharge', id, 'update',
          detectChanges(oldRule as unknown as Record<string, unknown>, updatedRule as unknown as Record<string, unknown>), 
          updatedRule as unknown as Record<string, unknown>,
          newVersion
        );
      }

      await loadWeightSurchargeRules();
    } catch (error) {
      handleError(error, '중량 할증 규칙 수정');
    }
  };

  const deleteWeightSurchargeRule = async (id: string) => {
    try {
      const rule = weightSurchargeRules.find(r => r.id === id);
      
      const { error } = await supabase
        .from(TABLES.WEIGHT_SURCHARGE_RULES)
        .delete()
        .eq('id', id);

      if (error) {
        handleError(error, '중량 할증 규칙 삭제');
        return;
      }

      if (rule) {
        await createAuditLog('weightSurcharge', id, 'delete', [], rule as unknown as Record<string, unknown>, rule.version);
      }

      await loadWeightSurchargeRules();
    } catch (error) {
      handleError(error, '중량 할증 규칙 삭제');
    }
  };

  const getWeightSurcharge = (agent: string, weight: number, date?: string): number => {
    const filtered = weightSurchargeRules.filter(
      (r) => r.agent === agent && weight >= r.minWeight && weight <= r.maxWeight
    );
    
    if (date) {
      const validRules = filtered.filter(r => isValidOnDate(r.validFrom, r.validTo, date));
      return validRules.length > 0 ? validRules[0].surcharge : 0;
    }
    
    return filtered.length > 0 ? filtered[0].surcharge : 0;
  };

  // Calculation History Operations
  const addCalculationHistory = async (history: Omit<CalculationHistory, 'id' | 'createdAt'>) => {
    if (!user) return;

    try {
      console.log('💾 Saving calculation history to database...', history);
      
      const { error } = await supabase
        .from(TABLES.CALCULATION_HISTORY)
        .insert({
          result: history.result,
          destination_name: history.destinationName,
          created_by: user.id,
          created_by_username: user.username,
        });

      if (error) {
        console.error('❌ Error saving calculation history:', error);
        handleError(error, '계산 이력 추가');
        return;
      }

      console.log('✅ Calculation history saved successfully, reloading...');
      await loadCalculationHistory();
    } catch (error) {
      console.error('💥 Exception in addCalculationHistory:', error);
      handleError(error, '계산 이력 추가');
    }
  };

  const deleteCalculationHistory = async (id: string) => {
    try {
      const { error } = await supabase
        .from(TABLES.CALCULATION_HISTORY)
        .delete()
        .eq('id', id);

      if (error) {
        handleError(error, '계산 이력 삭제');
        return;
      }

      await loadCalculationHistory();
    } catch (error) {
      handleError(error, '계산 이력 삭제');
    }
  };

  const getCalculationHistoryById = (id: string): CalculationHistory | undefined => {
    return calculationHistory.find((h) => h.id === id);
  };

  // Quotation Operations
  const addQuotation = async (quotation: Omit<Quotation, 'id' | 'createdAt'>) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from(TABLES.QUOTATIONS)
        .insert({
          calculation_id: quotation.calculationId,
          customer_name: quotation.customerName,
          customer_contact: quotation.customerContact,
          valid_until: quotation.validUntil,
          notes: quotation.notes,
          created_by: user.id,
        });

      if (error) {
        handleError(error, '견적 추가');
        return;
      }

      await loadQuotations();
    } catch (error) {
      handleError(error, '견적 추가');
    }
  };

  const deleteQuotation = async (id: string) => {
    try {
      const { error } = await supabase
        .from(TABLES.QUOTATIONS)
        .delete()
        .eq('id', id);

      if (error) {
        handleError(error, '견적 삭제');
        return;
      }

      await loadQuotations();
    } catch (error) {
      handleError(error, '견적 삭제');
    }
  };

  const getQuotationById = (id: string): Quotation | undefined => {
    return quotations.find((q) => q.id === id);
  };

  // Audit Log Operations
  const getAuditLogsForEntity = (entityType: FreightAuditLog['entityType'], entityId: string): FreightAuditLog[] => {
    return auditLogs.filter(log => log.entityType === entityType && log.entityId === entityId);
  };

  const getAuditLogsByType = (entityType: FreightAuditLog['entityType']): FreightAuditLog[] => {
    return auditLogs.filter(log => log.entityType === entityType);
  };

  const deleteAuditLog = async (id: string) => {
    try {
      const { error } = await supabase
        .from(TABLES.AUDIT_LOGS)
        .delete()
        .eq('id', id);

      if (error) {
        handleError(error, '변경 이력 삭제');
        return;
      }

      await loadAuditLogs();
    } catch (error) {
      handleError(error, '변경 이력 삭제');
    }
  };

  const clearAuditLogs = async (entityType?: FreightAuditLog['entityType']) => {
    try {
      if (entityType) {
        const { error } = await supabase
          .from(TABLES.AUDIT_LOGS)
          .delete()
          .eq('entity_type', entityType);

        if (error) {
          handleError(error, '변경 이력 초기화');
          return;
        }
      } else {
        const { error } = await supabase
          .from(TABLES.AUDIT_LOGS)
          .delete()
          .neq('id', '');

        if (error) {
          handleError(error, '모든 변경 이력 초기화');
          return;
        }
      }

      await loadAuditLogs();
    } catch (error) {
      handleError(error, '변경 이력 초기화');
    }
  };

  // Time Machine functions
  const getHistoricalSnapshot = (targetDate: string): HistoricalFreightSnapshot | null => {
    const targetTime = new Date(targetDate).getTime();
    
    const reconstructEntity = <T extends Record<string, unknown>>(
      entityType: FreightAuditLog['entityType'],
      currentEntities: T[]
    ): T[] => {
      const relevantLogs = auditLogs
        .filter(log => log.entityType === entityType && new Date(log.timestamp).getTime() <= targetTime)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      const entityMap = new Map<string, T>();

      currentEntities.forEach(entity => {
        const createdAt = (entity as { createdAt?: string }).createdAt;
        if (createdAt && new Date(createdAt).getTime() <= targetTime) {
          entityMap.set((entity as { id: string }).id, entity);
        }
      });

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

    return {
      date: targetDate,
      seaFreights: reconstructEntity<SeaFreight>('seaFreight', seaFreights),
      agentSeaFreights: reconstructEntity<AgentSeaFreight>('agentSeaFreight', agentSeaFreights),
      dthcList: reconstructEntity<DTHC>('dthc', dthcList),
      dpCosts: reconstructEntity<DPCost>('dpCost', dpCosts),
      combinedFreights: reconstructEntity<CombinedFreight>('combinedFreight', combinedFreights),
      portBorderFreights: reconstructEntity<PortBorderFreight>('portBorderFreight', portBorderFreights),
      borderDestinationFreights: reconstructEntity<BorderDestinationFreight>('borderDestinationFreight', borderDestinationFreights),
      weightSurchargeRules: reconstructEntity<WeightSurchargeRule>('weightSurcharge', weightSurchargeRules),
    };
  };

  const getAvailableHistoricalDates = (): string[] => {
    const dates = new Set<string>();
    
    auditLogs.forEach(log => {
      const date = log.timestamp.split('T')[0];
      dates.add(date);
    });

    return Array.from(dates).sort((a, b) => b.localeCompare(a));
  };

  const getHistoricalFreightOptions = (date: string, pol: string, pod: string): SeaFreight[] => {
    const snapshot = getHistoricalSnapshot(date);
    if (!snapshot) return [];
    
    return snapshot.seaFreights.filter((f) => f.pol === pol && f.pod === pod);
  };

  // Cost Calculation with expired rate tracking
  const calculateCost = (input: CostCalculationInput): CostCalculationResult | null => {
    const calculationDate = input.historicalDate || new Date().toISOString().split('T')[0];
    
    let snapshot: HistoricalFreightSnapshot | null = null;
    if (input.historicalDate) {
      snapshot = getHistoricalSnapshot(input.historicalDate);
      if (!snapshot) {
        return null;
      }
    }

    const getDataSource = <T,>(current: T[], historical: T[] | undefined): T[] => {
      return snapshot && historical ? historical : current;
    };

    const currentSeaFreights = getDataSource(seaFreights, snapshot?.seaFreights);
    const currentAgentSeaFreights = getDataSource(agentSeaFreights, snapshot?.agentSeaFreights);
    const currentDthcList = getDataSource(dthcList, snapshot?.dthcList);
    const currentDpCosts = getDataSource(dpCosts, snapshot?.dpCosts);
    const currentCombinedFreights = getDataSource(combinedFreights, snapshot?.combinedFreights);
    const currentPortBorderFreights = getDataSource(portBorderFreights, snapshot?.portBorderFreights);
    const currentBorderDestinationFreights = getDataSource(borderDestinationFreights, snapshot?.borderDestinationFreights);
    const currentWeightSurchargeRules = getDataSource(weightSurchargeRules, snapshot?.weightSurchargeRules);

    // Helper functions that return both value and expiration status
    const getDPCostWithExpiry = (port: string): { value: number; expired: boolean } => {
      const filtered = currentDpCosts.filter((d) => d.port === port);
      if (filtered.length === 0) return { value: 0, expired: false };
      
      const validDP = filtered.filter(d => isValidOnDate(d.validFrom, d.validTo, calculationDate));
      if (validDP.length > 0) {
        return { value: validDP[0].amount, expired: false };
      }
      
      // Use expired rate if no valid one exists
      return { value: filtered[0].amount, expired: true };
    };

    const getAgentSeaFreightWithExpiry = (agent: string, pol: string, pod: string): { value: number | null; expired: boolean; carrier?: string } => {
      const filtered = currentAgentSeaFreights.filter(
        (f) => f.agent === agent && f.pol === pol && f.pod === pod
      );
      if (filtered.length === 0) return { value: null, expired: false };
      
      const validFreights = filtered.filter(f => isValidOnDate(f.validFrom, f.validTo, calculationDate));
      if (validFreights.length > 0) {
        return { value: validFreights[0].rate, expired: false, carrier: validFreights[0].carrier };
      }
      
      // Use expired rate if no valid one exists
      return { value: filtered[0].rate, expired: true, carrier: filtered[0].carrier };
    };

    const getDTHCByAgentAndRouteWithExpiry = (agent: string, pol: string, pod: string): { value: number; expired: boolean } => {
      const filtered = currentDthcList.filter((d) => d.agent === agent && d.pol === pol && d.pod === pod);
      if (filtered.length === 0) return { value: 0, expired: false };
      
      const validDTHC = filtered.filter(d => isValidOnDate(d.validFrom, d.validTo, calculationDate));
      if (validDTHC.length > 0) {
        return { value: validDTHC[0].amount, expired: false };
      }
      
      // Use expired rate if no valid one exists
      return { value: filtered[0].amount, expired: true };
    };

    const getCombinedFreightWithExpiry = (agent: string, pod: string, destinationId: string): { value: number | null; expired: boolean } => {
      const filtered = currentCombinedFreights.filter(
        (f) => f.agent === agent && f.pod === pod && f.destinationId === destinationId
      );
      if (filtered.length === 0) return { value: null, expired: false };
      
      const validFreights = filtered.filter(f => isValidOnDate(f.validFrom, f.validTo, calculationDate));
      if (validFreights.length > 0) {
        return { value: validFreights[0].rate, expired: false };
      }
      
      // Use expired rate if no valid one exists
      return { value: filtered[0].rate, expired: true };
    };

    const getBorderDestinationRateWithExpiry = (agent: string, destinationId: string): { value: number; expired: boolean } => {
      const filtered = currentBorderDestinationFreights.filter(
        (f) => f.agent === agent && f.destinationId === destinationId
      );
      if (filtered.length === 0) return { value: 0, expired: false };
      
      const validFreights = filtered.filter(f => isValidOnDate(f.validFrom, f.validTo, calculationDate));
      if (validFreights.length > 0) {
        return { value: validFreights[0].rate, expired: false };
      }
      
      // Use expired rate if no valid one exists
      return { value: filtered[0].rate, expired: true };
    };

    const getWeightSurchargeWithExpiry = (agent: string, weight: number): { value: number; expired: boolean } => {
      const filtered = currentWeightSurchargeRules.filter(
        (r) => r.agent === agent && weight >= r.minWeight && weight <= r.maxWeight
      );
      if (filtered.length === 0) return { value: 0, expired: false };
      
      const validRules = filtered.filter(r => isValidOnDate(r.validFrom, r.validTo, calculationDate));
      if (validRules.length > 0) {
        return { value: validRules[0].surcharge, expired: false };
      }
      
      // Use expired rate if no valid one exists
      return { value: filtered[0].surcharge, expired: true };
    };

    const getPortBorderRateWithExpiry = (agent: string, pod: string): { value: number; expired: boolean } => {
      const filtered = currentPortBorderFreights.filter(
        (f) => f.agent === agent && f.pod === pod
      );
      if (filtered.length === 0) return { value: 0, expired: false };
      
      const validFreights = filtered.filter(f => isValidOnDate(f.validFrom, f.validTo, calculationDate));
      if (validFreights.length > 0) {
        return { value: validFreights[0].rate, expired: false };
      }
      
      // Use expired rate if no valid one exists
      return { value: filtered[0].rate, expired: true };
    };

    const dpResult = input.includeDP ? getDPCostWithExpiry(input.pol) : { value: 0, expired: false };
    const totalOtherCosts = input.otherCosts.reduce((sum, item) => sum + item.amount, 0);

    // FIXED: Collect agents from BOTH rail freight AND combined freight
    const railAgentsFromPortBorder = currentPortBorderFreights
      .filter(f => f.pod === input.pod)
      .map(f => f.agent);
    
    const railAgentsFromCombined = currentCombinedFreights
      .filter(f => f.pod === input.pod && f.destinationId === input.destinationId)
      .map(f => f.agent);
    
    // Merge and get unique agents
    const allAgentNames = [...new Set([...railAgentsFromPortBorder, ...railAgentsFromCombined])];
    
    // Verify agents exist in railAgents list
    const railAgentsWithFreight = allAgentNames.filter(agentName => 
      railAgents.find(ra => ra.name === agentName)
    );
    
    const cowinTruck = currentBorderDestinationFreights.find(f => 
      f.agent === 'COWIN' && 
      f.destinationId === input.destinationId
    );

    const breakdown: AgentCostBreakdown[] = [];

    railAgentsWithFreight.forEach((agentName) => {
      const expiredDetails: string[] = [];
      
      const agentSeaResult = getAgentSeaFreightWithExpiry(agentName, input.pol, input.pod);
      
      let seaFreightRate = 0;
      let seaFreightLocalCharge = 0;
      let seaFreightId: string | undefined;
      let seaFreightCarrier: string | undefined;
      let isAgentSpecific = false;
      let seaFreightExpired = false;

      if (agentSeaResult.value !== null) {
        seaFreightRate = agentSeaResult.value;
        seaFreightCarrier = agentSeaResult.carrier;
        isAgentSpecific = true;
        seaFreightExpired = agentSeaResult.expired;
        if (seaFreightExpired) expiredDetails.push('해상운임');
      } else if (input.selectedSeaFreightId) {
        const selectedFreight = currentSeaFreights.find(f => f.id === input.selectedSeaFreightId);
        if (selectedFreight) {
          seaFreightRate = selectedFreight.rate;
          seaFreightLocalCharge = selectedFreight.localCharge || 0;
          seaFreightId = selectedFreight.id;
          seaFreightCarrier = selectedFreight.carrier;
          seaFreightExpired = !isValidOnDate(selectedFreight.validFrom, selectedFreight.validTo, calculationDate);
          if (seaFreightExpired) expiredDetails.push('해상운임');
        }
      } else {
        const allSeaFreights = currentSeaFreights.filter(
          (f) => f.pol === input.pol && f.pod === input.pod
        );
        if (allSeaFreights.length > 0) {
          const validFreights = allSeaFreights.filter(f => isValidOnDate(f.validFrom, f.validTo, calculationDate));
          if (validFreights.length > 0) {
            seaFreightRate = validFreights[0].rate;
            seaFreightLocalCharge = validFreights[0].localCharge || 0;
            seaFreightId = validFreights[0].id;
            seaFreightCarrier = validFreights[0].carrier;
          } else {
            // Use expired rate
            seaFreightRate = allSeaFreights[0].rate;
            seaFreightLocalCharge = allSeaFreights[0].localCharge || 0;
            seaFreightId = allSeaFreights[0].id;
            seaFreightCarrier = allSeaFreights[0].carrier;
            seaFreightExpired = true;
            expiredDetails.push('해상운임');
          }
        }
      }
      
      const dthcResult = getDTHCByAgentAndRouteWithExpiry(agentName, input.pol, input.pod);
      if (dthcResult.expired) expiredDetails.push('DTHC');
      
      const combinedResult = getCombinedFreightWithExpiry(agentName, input.pod, input.destinationId);
      const railResult = getPortBorderRateWithExpiry(agentName, input.pod);
      const ownTruckResult = getBorderDestinationRateWithExpiry(agentName, input.destinationId);
      
      // Show both combined and separate freight if both exist
      const hasCombined = combinedResult.value !== null && combinedResult.value > 0;
      const hasSeparate = railResult.value > 0 && ownTruckResult.value > 0;
      
      // Add combined freight option if it exists
      if (hasCombined) {
        const combinedExpiredDetails = [...expiredDetails];
        if (combinedResult.expired) combinedExpiredDetails.push('통합운임');
        
        const weightSurchargeResult = getWeightSurchargeWithExpiry(agentName, input.weight);
        if (weightSurchargeResult.expired) combinedExpiredDetails.push('중량할증');
        
        if (dpResult.expired) combinedExpiredDetails.push('DP');
        
        const total =
          seaFreightRate +
          seaFreightLocalCharge +
          dthcResult.value +
          combinedResult.value +
          weightSurchargeResult.value +
          dpResult.value +
          totalOtherCosts +
          input.domesticTransport;

        breakdown.push({
          agent: agentName,
          railAgent: agentName,
          truckAgent: agentName,
          seaFreight: seaFreightRate,
          localCharge: seaFreightLocalCharge,
          seaFreightId,
          seaFreightCarrier,
          isAgentSpecificSeaFreight: isAgentSpecific,
          dthc: dthcResult.value,
          portBorder: 0,
          borderDestination: 0,
          combinedFreight: combinedResult.value,
          isCombinedFreight: true,
          weightSurcharge: weightSurchargeResult.value,
          dp: dpResult.value,
          domesticTransport: input.domesticTransport,
          otherCosts: input.otherCosts,
          total,
          hasExpiredRates: combinedExpiredDetails.length > 0,
          expiredRateDetails: combinedExpiredDetails.length > 0 ? combinedExpiredDetails : undefined,
        });
      }
      
      // Add separate rail+truck option if it exists
      if (hasSeparate) {
        const separateExpiredDetails = [...expiredDetails];
        if (railResult.expired) separateExpiredDetails.push('철도운임');
        if (ownTruckResult.expired) separateExpiredDetails.push('트럭운임');
        
        const weightSurchargeResult = getWeightSurchargeWithExpiry(agentName, input.weight);
        if (weightSurchargeResult.expired) separateExpiredDetails.push('중량할증');
        
        if (dpResult.expired) separateExpiredDetails.push('DP');
        
        const total =
          seaFreightRate +
          seaFreightLocalCharge +
          dthcResult.value +
          railResult.value +
          ownTruckResult.value +
          weightSurchargeResult.value +
          dpResult.value +
          totalOtherCosts +
          input.domesticTransport;

        breakdown.push({
          agent: agentName,
          railAgent: agentName,
          truckAgent: agentName,
          seaFreight: seaFreightRate,
          localCharge: seaFreightLocalCharge,
          seaFreightId,
          seaFreightCarrier,
          isAgentSpecificSeaFreight: isAgentSpecific,
          dthc: dthcResult.value,
          portBorder: railResult.value,
          borderDestination: ownTruckResult.value,
          combinedFreight: 0,
          isCombinedFreight: false,
          weightSurcharge: weightSurchargeResult.value,
          dp: dpResult.value,
          domesticTransport: input.domesticTransport,
          otherCosts: input.otherCosts,
          total,
          hasExpiredRates: separateExpiredDetails.length > 0,
          expiredRateDetails: separateExpiredDetails.length > 0 ? separateExpiredDetails : undefined,
        });
      }

      // Add rail + COWIN truck combination if COWIN truck exists and rail exists
      if (cowinTruck && cowinTruck.rate > 0 && railResult.value > 0) {
        const cowinExpiredDetails = [...expiredDetails];
        if (railResult.expired) cowinExpiredDetails.push('철도운임');
        const cowinTruckExpired = !isValidOnDate(cowinTruck.validFrom, cowinTruck.validTo, calculationDate);
        if (cowinTruckExpired) cowinExpiredDetails.push('트럭운임');
        
        const weightSurchargeResult = getWeightSurchargeWithExpiry('COWIN', input.weight);
        if (weightSurchargeResult.expired) cowinExpiredDetails.push('중량할증');
        
        if (dpResult.expired && !cowinExpiredDetails.includes('DP')) cowinExpiredDetails.push('DP');
        
        const total =
          seaFreightRate +
          seaFreightLocalCharge +
          dthcResult.value +
          railResult.value +
          cowinTruck.rate +
          weightSurchargeResult.value +
          dpResult.value +
          totalOtherCosts +
          input.domesticTransport;

        breakdown.push({
          agent: `${agentName} + COWIN`,
          railAgent: agentName,
          truckAgent: 'COWIN',
          seaFreight: seaFreightRate,
          localCharge: seaFreightLocalCharge,
          seaFreightId,
          seaFreightCarrier,
          isAgentSpecificSeaFreight: isAgentSpecific,
          dthc: dthcResult.value,
          portBorder: railResult.value,
          borderDestination: cowinTruck.rate,
          combinedFreight: 0,
          isCombinedFreight: false,
          weightSurcharge: weightSurchargeResult.value,
          dp: dpResult.value,
          domesticTransport: input.domesticTransport,
          otherCosts: input.otherCosts,
          total,
          hasExpiredRates: cowinExpiredDetails.length > 0,
          expiredRateDetails: cowinExpiredDetails.length > 0 ? cowinExpiredDetails : undefined,
        });
      }
    });

    if (breakdown.length === 0) {
      return null;
    }

    breakdown.sort((a, b) => {
      if (a.railAgent !== b.railAgent) {
        return a.railAgent.localeCompare(b.railAgent, 'ko');
      }
      return a.truckAgent.localeCompare(b.truckAgent, 'ko');
    });

    const lowestCostBreakdown = breakdown.reduce((min, current) =>
      current.total < min.total ? current : min
    );

    return {
      input,
      breakdown,
      lowestCostAgent: lowestCostBreakdown.agent,
      lowestCost: lowestCostBreakdown.total,
      isHistorical: !!input.historicalDate,
      historicalDate: input.historicalDate,
    };
  };

  return (
    <FreightContext.Provider
      value={{
        shippingLines,
        addShippingLine,
        updateShippingLine,
        deleteShippingLine,
        getShippingLineById,
        ports,
        addPort,
        updatePort,
        deletePort,
        getPortById,
        railAgents,
        addRailAgent,
        updateRailAgent,
        deleteRailAgent,
        getRailAgentById,
        truckAgents,
        addTruckAgent,
        updateTruckAgent,
        deleteTruckAgent,
        getTruckAgentById,
        destinations,
        addDestination,
        updateDestination,
        deleteDestination,
        getDestinationById,
        seaFreights,
        addSeaFreight,
        updateSeaFreight,
        deleteSeaFreight,
        getSeaFreightOptions,
        getSeaFreightVersion,
        agentSeaFreights,
        addAgentSeaFreight,
        updateAgentSeaFreight,
        deleteAgentSeaFreight,
        getAgentSeaFreight,
        getAgentSeaFreightVersion,
        dthcList,
        addDTHC,
        updateDTHC,
        deleteDTHC,
        getDTHCByAgentAndRoute,
        dpCosts,
        addDPCost,
        updateDPCost,
        deleteDPCost,
        getDPCost,
        combinedFreights,
        addCombinedFreight,
        updateCombinedFreight,
        deleteCombinedFreight,
        getCombinedFreight,
        portBorderFreights,
        addPortBorderFreight,
        updatePortBorderFreight,
        deletePortBorderFreight,
        getPortBorderRate,
        borderDestinationFreights,
        addBorderDestinationFreight,
        updateBorderDestinationFreight,
        deleteBorderDestinationFreight,
        getBorderDestinationRate,
        weightSurchargeRules,
        addWeightSurchargeRule,
        updateWeightSurchargeRule,
        deleteWeightSurchargeRule,
        getWeightSurcharge,
        calculateCost,
        calculationHistory,
        addCalculationHistory,
        deleteCalculationHistory,
        getCalculationHistoryById,
        quotations,
        addQuotation,
        deleteQuotation,
        getQuotationById,
        auditLogs,
        getAuditLogsForEntity,
        getAuditLogsByType,
        deleteAuditLog,
        clearAuditLogs,
        getHistoricalSnapshot,
        getAvailableHistoricalDates,
        getHistoricalFreightOptions,
        isValidOnDate,
        borderCities,
        addBorderCity,
        updateBorderCity,
        deleteBorderCity,
        getBorderCityById,
        getDefaultBorderCity,
        systemSettings,
        addSystemSetting,
        updateSystemSetting,
        deleteSystemSetting,
        getSystemSettingByKey,
        getSystemSettingValue,
        }}
    >
      {children}
    </FreightContext.Provider>
  );
};

export const useFreight = () => {
  const context = useContext(FreightContext);
  if (context === undefined) {
    throw new Error('useFreight must be used within a FreightProvider');
  }
  return context;
};