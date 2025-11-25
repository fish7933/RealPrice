import { supabase, TABLES } from '@/lib/supabase';
import { handleError } from '@/lib/errorHandler';
import {
  ShippingLine,
  Port,
  RailAgent,
  TruckAgent,
  Destination,
  SeaFreight,
  SeaFreightHistory,
  AgentSeaFreight,
  DTHC,
  DPCost,
  CombinedFreight,
  PortBorderFreight,
  BorderDestinationFreight,
  WeightSurchargeRule,
  CalculationHistory,
  Quotation,
  FreightAuditLog,
  BorderCity,
  SystemSetting,
} from '@/types/freight';

export const loadShippingLines = async (): Promise<ShippingLine[]> => {
  try {
    const { data, error } = await supabase
      .from(TABLES.SHIPPING_LINES)
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      handleError(error, '선사 목록 로드');
      return [];
    }

    if (data) {
      return data.map(d => ({
        id: d.id,
        name: d.name,
        code: d.code,
        description: d.description,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
      }));
    }
    return [];
  } catch (error) {
    handleError(error, '선사 목록 로드');
    return [];
  }
};

export const loadPorts = async (): Promise<Port[]> => {
  try {
    const { data, error } = await supabase
      .from(TABLES.PORTS)
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      handleError(error, '포트 목록 로드');
      return [];
    }

    if (data) {
      return data.map(d => ({
        id: d.id,
        name: d.name,
        type: d.type as 'POL' | 'POD',
        country: d.country,
        description: d.description,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
      }));
    }
    return [];
  } catch (error) {
    handleError(error, '포트 목록 로드');
    return [];
  }
};

export const loadRailAgents = async (): Promise<RailAgent[]> => {
  try {
    const { data, error } = await supabase
      .from(TABLES.RAIL_AGENTS)
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      handleError(error, '철도 운송사 목록 로드');
      return [];
    }

    if (data) {
      return data.map(d => ({
        id: d.id,
        name: d.name,
        code: d.code,
        description: d.description,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
      }));
    }
    return [];
  } catch (error) {
    handleError(error, '철도 운송사 목록 로드');
    return [];
  }
};

export const loadTruckAgents = async (): Promise<TruckAgent[]> => {
  try {
    const { data, error } = await supabase
      .from(TABLES.TRUCK_AGENTS)
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      handleError(error, '트럭 운송사 목록 로드');
      return [];
    }

    if (data) {
      return data.map(d => ({
        id: d.id,
        name: d.name,
        code: d.code,
        description: d.description,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
      }));
    }
    return [];
  } catch (error) {
    handleError(error, '트럭 운송사 목록 로드');
    return [];
  }
};

export const loadDestinations = async (): Promise<Destination[]> => {
  try {
    const { data, error } = await supabase
      .from(TABLES.DESTINATIONS)
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      handleError(error, '목적지 목록 로드');
      return [];
    }

    if (data) {
      return data.map(d => ({
        id: d.id,
        name: d.name,
        description: d.description,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
      }));
    }
    return [];
  } catch (error) {
    handleError(error, '목적지 목록 로드');
    return [];
  }
};

export const loadSeaFreights = async (): Promise<SeaFreight[]> => {
  try {
    const { data, error } = await supabase
      .from(TABLES.SEA_FREIGHTS)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      handleError(error, '해상 운임 목록 로드');
      return [];
    }

    if (data) {
      return data.map(d => ({
        id: d.id,
        freightCode: d.freight_code,
        pol: d.pol,
        pod: d.pod,
        rate: d.rate,
        carrier: d.carrier,
        localCharge: d.local_charge || 0,
        note: d.note,
        validFrom: d.valid_from,
        validTo: d.valid_to,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
      }));
    }
    return [];
  } catch (error) {
    handleError(error, '해상 운임 목록 로드');
    return [];
  }
};

// 🆕 해상운임 히스토리 로드
export const loadSeaFreightHistory = async (freightCode?: string): Promise<SeaFreightHistory[]> => {
  try {
    let query = supabase
      .from(TABLES.SEA_FREIGHT_HISTORY)
      .select('*')
      .order('archived_at', { ascending: false });

    if (freightCode) {
      query = query.eq('freight_code', freightCode);
    }

    const { data, error } = await query;

    if (error) {
      handleError(error, '해상 운임 히스토리 로드');
      return [];
    }

    if (data) {
      return data.map(d => ({
        id: d.id,
        freightCode: d.freight_code,
        originalId: d.original_id,
        carrier: d.carrier,
        pol: d.pol,
        pod: d.pod,
        rate: d.rate,
        localCharge: d.local_charge,
        note: d.note,
        validFrom: d.valid_from,
        validTo: d.valid_to,
        archivedAt: d.archived_at,
        archivedBy: d.archived_by,
        archivedByUsername: d.archived_by_username,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
      }));
    }
    return [];
  } catch (error) {
    handleError(error, '해상 운임 히스토리 로드');
    return [];
  }
};

// 🆕 특정 날짜의 해상운임 히스토리 조회
export const loadSeaFreightHistoryByDate = async (date: string): Promise<SeaFreightHistory[]> => {
  try {
    const { data, error } = await supabase
      .from(TABLES.SEA_FREIGHT_HISTORY)
      .select('*')
      .lte('valid_from', date)
      .gte('valid_to', date)
      .order('archived_at', { ascending: false });

    if (error) {
      handleError(error, '날짜별 해상 운임 히스토리 로드');
      return [];
    }

    if (data) {
      return data.map(d => ({
        id: d.id,
        freightCode: d.freight_code,
        originalId: d.original_id,
        carrier: d.carrier,
        pol: d.pol,
        pod: d.pod,
        rate: d.rate,
        localCharge: d.local_charge,
        note: d.note,
        validFrom: d.valid_from,
        validTo: d.valid_to,
        archivedAt: d.archived_at,
        archivedBy: d.archived_by,
        archivedByUsername: d.archived_by_username,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
      }));
    }
    return [];
  } catch (error) {
    handleError(error, '날짜별 해상 운임 히스토리 로드');
    return [];
  }
};

export const loadAgentSeaFreights = async (): Promise<AgentSeaFreight[]> => {
  try {
    const { data, error } = await supabase
      .from(TABLES.AGENT_SEA_FREIGHTS)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      handleError(error, '운송사별 해상 운임 목록 로드');
      return [];
    }

    if (data) {
      return data.map(d => ({
        id: d.id,
        agent: d.agent,
        pol: d.pol,
        pod: d.pod,
        rate: d.rate,
        llocal: d.llocal || 0,
        localCharge: d.llocal || 0,
        carrier: d.carrier,
        note: d.note,
        validFrom: d.valid_from,
        validTo: d.valid_to,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
      }));
    }
    return [];
  } catch (error) {
    handleError(error, '운송사별 해상 운임 목록 로드');
    return [];
  }
};

export const loadDTHC = async (): Promise<DTHC[]> => {
  try {
    const { data, error } = await supabase
      .from(TABLES.DTHC)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      handleError(error, 'DTHC 목록 로드');
      return [];
    }

    if (data) {
      return data.map(d => ({
        id: d.id,
        agent: d.agent,
        pol: d.pol,
        pod: d.pod,
        carrier: d.carrier,
        amount: d.amount,
        description: d.description,
        validFrom: d.valid_from,
        validTo: d.valid_to,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
      }));
    }
    return [];
  } catch (error) {
    handleError(error, 'DTHC 목록 로드');
    return [];
  }
};

export const loadDPCosts = async (): Promise<DPCost[]> => {
  try {
    const { data, error } = await supabase
      .from(TABLES.DP_COSTS)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      handleError(error, 'DP 비용 목록 로드');
      return [];
    }

    if (data) {
      return data.map(d => ({
        id: d.id,
        port: d.port,
        amount: d.amount,
        description: d.description,
        validFrom: d.valid_from,
        validTo: d.valid_to,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
      }));
    }
    return [];
  } catch (error) {
    handleError(error, 'DP 비용 목록 로드');
    return [];
  }
};

export const loadCombinedFreights = async (): Promise<CombinedFreight[]> => {
  try {
    console.log('🔄 [loadCombinedFreights] Loading combined freights from database...');
    
    const { data, error } = await supabase
      .from(TABLES.COMBINED_FREIGHTS)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ [loadCombinedFreights] Database error:', error);
      handleError(error, '통합 운임 목록 로드');
      return [];
    }

    console.log('📦 [loadCombinedFreights] Raw data from database:', data);

    if (data) {
      const mappedData = data.map(d => {
        const mapped = {
          id: d.id,
          agent: d.agent,
          pol: d.pol || '인천',
          pod: d.pod,
          destinationId: d.destination_id,
          rate: d.rate,
          description: d.description,
          validFrom: d.valid_from,
          validTo: d.valid_to,
          createdAt: d.created_at,
          updatedAt: d.updated_at,
        };
        
        console.log(`   📋 Mapped: agent="${mapped.agent}", pol="${mapped.pol}", pod="${mapped.pod}", destinationId="${mapped.destinationId}"`);
        
        return mapped;
      });
      
      console.log(`✅ [loadCombinedFreights] Loaded ${mappedData.length} combined freights`);
      return mappedData;
    }
    
    console.log('⚠️ [loadCombinedFreights] No data returned from database');
    return [];
  } catch (error) {
    console.error('💥 [loadCombinedFreights] Exception:', error);
    handleError(error, '통합 운임 목록 로드');
    return [];
  }
};

export const loadPortBorderFreights = async (): Promise<PortBorderFreight[]> => {
  try {
    console.log('🔄 [loadPortBorderFreights] Loading port border freights from database...');
    
    const { data, error } = await supabase
      .from(TABLES.PORT_BORDER_FREIGHTS)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ [loadPortBorderFreights] Database error:', error);
      handleError(error, '항구-국경 운임 목록 로드');
      return [];
    }

    console.log('📦 [loadPortBorderFreights] Raw data from database:', data);

    if (data) {
      const mappedData = data.map(d => {
        const mapped = {
          id: d.id,
          agent: d.agent,
          pol: d.pol || '인천',
          pod: d.pod,
          rate: d.rate,
          validFrom: d.valid_from,
          validTo: d.valid_to,
          createdAt: d.created_at,
          updatedAt: d.updated_at,
        };
        
        console.log(`   📋 Mapped: agent="${mapped.agent}", pol="${mapped.pol}", pod="${mapped.pod}"`);
        
        return mapped;
      });
      
      console.log(`✅ [loadPortBorderFreights] Loaded ${mappedData.length} port border freights`);
      return mappedData;
    }
    
    console.log('⚠️ [loadPortBorderFreights] No data returned from database');
    return [];
  } catch (error) {
    console.error('💥 [loadPortBorderFreights] Exception:', error);
    handleError(error, '항구-국경 운임 목록 로드');
    return [];
  }
};

export const loadBorderDestinationFreights = async (): Promise<BorderDestinationFreight[]> => {
  try {
    const { data, error } = await supabase
      .from(TABLES.BORDER_DESTINATION_FREIGHTS)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      handleError(error, '국경-목적지 운임 목록 로드');
      return [];
    }

    if (data) {
      return data.map(d => ({
        id: d.id,
        agent: d.agent,
        destinationId: d.destination_id,
        rate: d.rate,
        validFrom: d.valid_from,
        validTo: d.valid_to,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
      }));
    }
    return [];
  } catch (error) {
    handleError(error, '국경-목적지 운임 목록 로드');
    return [];
  }
};

export const loadWeightSurchargeRules = async (): Promise<WeightSurchargeRule[]> => {
  try {
    const { data, error } = await supabase
      .from(TABLES.WEIGHT_SURCHARGE_RULES)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      handleError(error, '중량 할증 규칙 목록 로드');
      return [];
    }

    if (data) {
      return data.map(d => ({
        id: d.id,
        agent: d.agent,
        minWeight: d.min_weight,
        maxWeight: d.max_weight,
        surcharge: d.surcharge,
        validFrom: d.valid_from,
        validTo: d.valid_to,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
      }));
    }
    return [];
  } catch (error) {
    handleError(error, '중량 할증 규칙 목록 로드');
    return [];
  }
};

export const loadCalculationHistory = async (): Promise<CalculationHistory[]> => {
  try {
    console.log('🔄 Loading calculation history from database...');
    
    const { data, error } = await supabase
      .from(TABLES.CALCULATION_HISTORY)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error loading calculation history:', error);
      handleError(error, '계산 이력 목록 로드');
      return [];
    }

    console.log('📦 Raw data from database:', data);

    if (data) {
      const mappedData = data.map(d => {
        console.log('🔍 Mapping record:', d);
        console.log('   - query_date from DB:', d.query_date);
        return {
          id: d.id,
          result: d.result,
          destinationName: d.destination_name,
          createdBy: d.created_by,
          createdByUsername: d.created_by_username,
          createdAt: d.created_at,
          queryDate: d.query_date, // ✅ FIXED: Map query_date from database
        };
      });
      
      console.log('✅ Mapped calculation history:', mappedData);
      return mappedData;
    }
    
    console.log('⚠️ No data returned from database');
    return [];
  } catch (error) {
    console.error('💥 Exception in loadCalculationHistory:', error);
    handleError(error, '계산 이력 목록 로드');
    return [];
  }
};

export const loadQuotations = async (): Promise<Quotation[]> => {
  try {
    const { data, error } = await supabase
      .from(TABLES.QUOTATIONS)
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      handleError(error, '견적 목록 로드');
      return [];
    }

    if (data) {
      return data.map(d => ({
        id: d.id,
        calculationId: d.calculation_id,
        customerName: d.customer_name,
        customerContact: d.customer_contact,
        validUntil: d.valid_until,
        notes: d.notes,
        createdBy: d.created_by,
        createdAt: d.created_at,
      }));
    }
    return [];
  } catch (error) {
    handleError(error, '견적 목록 로드');
    return [];
  }
};

export const loadAuditLogs = async (): Promise<FreightAuditLog[]> => {
  try {
    const { data, error } = await supabase
      .from(TABLES.AUDIT_LOGS)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1000);

    if (error) {
      handleError(error, '변경 이력 목록 로드');
      return [];
    }

    if (data) {
      return data.map(d => ({
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
      }));
    }
    return [];
  } catch (error) {
    handleError(error, '변경 이력 목록 로드');
    return [];
  }
};

export const loadBorderCities = async (): Promise<BorderCity[]> => {
  try {
    const { data, error } = await supabase
      .from(TABLES.BORDER_CITIES)
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      handleError(error, '국경 도시 목록 로드');
      return [];
    }

    if (data) {
      return data.map(d => ({
        id: d.id,
        name: d.name,
        country: d.country,
        description: d.description,
        isDefault: d.is_default,
        isActive: d.is_active,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
      }));
    }
    return [];
  } catch (error) {
    handleError(error, '국경 도시 목록 로드');
    return [];
  }
};

export const loadSystemSettings = async (): Promise<SystemSetting[]> => {
  try {
    const { data, error } = await supabase
      .from(TABLES.SYSTEM_SETTINGS)
      .select('*')
      .order('category', { ascending: true });

    if (error) {
      handleError(error, '시스템 설정 목록 로드');
      return [];
    }

    if (data) {
      return data.map(d => ({
        id: d.id,
        settingKey: d.setting_key,
        settingValue: d.setting_value,
        settingType: d.setting_type as 'text' | 'number' | 'boolean' | 'json',
        category: d.category as 'general' | 'freight' | 'currency' | 'units',
        description: d.description,
        isEditable: d.is_editable,
        createdAt: d.created_at,
        updatedAt: d.updated_at,
      }));
    }
    return [];
  } catch (error) {
    handleError(error, '시스템 설정 목록 로드');
    return [];
  }
};