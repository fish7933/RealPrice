import { supabase, TABLES } from '@/lib/supabase';
import { handleError } from '@/lib/errorHandler';
import { detectChanges } from './freightHelpers';
import {
  ShippingLine,
  Port,
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
  CalculationHistory,
  Quotation,
  FreightAuditLog,
  BorderCity,
  SystemSetting,
  User,
} from '@/types/freight';

// Create audit log helper - REMOVED version parameter
export const createAuditLog = async (
  entityType: FreightAuditLog['entityType'],
  entityId: string,
  action: FreightAuditLog['action'],
  changes: FreightAuditLog['changes'],
  entitySnapshot: Record<string, unknown>,
  user: User | null
) => {
  console.log('🔍 [AUDIT LOG] createAuditLog called with:', {
    entityType,
    entityId,
    action,
    changes,
    entitySnapshot,
    user
  });

  if (!user) {
    console.warn('⚠️ [AUDIT LOG] No user found, skipping audit log creation');
    return;
  }

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
    };

    console.log('📝 [AUDIT LOG] Inserting log into database:', log);

    const { data, error } = await supabase
      .from(TABLES.AUDIT_LOGS)
      .insert(log)
      .select()
      .single();

    if (error) {
      console.error('❌ [AUDIT LOG] Error inserting audit log:', error);
      handleError(error, 'Audit Log 생성');
      return null;
    }

    console.log('✅ [AUDIT LOG] Successfully inserted audit log:', data);

    if (data) {
      return {
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
      } as FreightAuditLog;
    }
    return null;
  } catch (error) {
    console.error('💥 [AUDIT LOG] Exception in createAuditLog:', error);
    handleError(error, 'Audit Log 생성');
    return null;
  }
};

// Shipping Line Operations
export const addShippingLine = async (line: Omit<ShippingLine, 'id' | 'createdAt' | 'updatedAt'>) => {
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
  } catch (error) {
    handleError(error, '선사 추가');
  }
};

export const updateShippingLine = async (id: string, line: Partial<ShippingLine>) => {
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
  } catch (error) {
    handleError(error, '선사 수정');
  }
};

export const deleteShippingLine = async (id: string) => {
  try {
    const { error } = await supabase
      .from(TABLES.SHIPPING_LINES)
      .delete()
      .eq('id', id);

    if (error) {
      handleError(error, '선사 삭제');
      return;
    }
  } catch (error) {
    handleError(error, '선사 삭제');
  }
};

// Port Operations
export const addPort = async (port: Omit<Port, 'id' | 'createdAt' | 'updatedAt'>) => {
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
  } catch (error) {
    handleError(error, '포트 추가');
  }
};

export const updatePort = async (id: string, port: Partial<Port>) => {
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
  } catch (error) {
    handleError(error, '포트 수정');
  }
};

export const deletePort = async (id: string) => {
  try {
    const { error } = await supabase
      .from(TABLES.PORTS)
      .delete()
      .eq('id', id);

    if (error) {
      handleError(error, '포트 삭제');
      return;
    }
  } catch (error) {
    handleError(error, '포트 삭제');
  }
};

// Rail Agent Operations
export const addRailAgent = async (agent: Omit<RailAgent, 'id' | 'createdAt' | 'updatedAt'>) => {
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
  } catch (error) {
    handleError(error, '철도 운송사 추가');
  }
};

export const updateRailAgent = async (id: string, agent: Partial<RailAgent>) => {
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
  } catch (error) {
    handleError(error, '철도 운송사 수정');
  }
};

export const deleteRailAgent = async (id: string) => {
  try {
    const { error } = await supabase
      .from(TABLES.RAIL_AGENTS)
      .delete()
      .eq('id', id);

    if (error) {
      handleError(error, '철도 운송사 삭제');
      return;
    }
  } catch (error) {
    handleError(error, '철도 운송사 삭제');
  }
};

// Truck Agent Operations
export const addTruckAgent = async (agent: Omit<TruckAgent, 'id' | 'createdAt' | 'updatedAt'>) => {
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
  } catch (error) {
    handleError(error, '트럭 운송사 추가');
  }
};

export const updateTruckAgent = async (id: string, agent: Partial<TruckAgent>) => {
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
  } catch (error) {
    handleError(error, '트럭 운송사 수정');
  }
};

export const deleteTruckAgent = async (id: string) => {
  try {
    const { error } = await supabase
      .from(TABLES.TRUCK_AGENTS)
      .delete()
      .eq('id', id);

    if (error) {
      handleError(error, '트럭 운송사 삭제');
      return;
    }
  } catch (error) {
    handleError(error, '트럭 운송사 삭제');
  }
};

// Destination Operations
export const addDestination = async (destination: Omit<Destination, 'id' | 'createdAt' | 'updatedAt'>) => {
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
  } catch (error) {
    handleError(error, '목적지 추가');
  }
};

export const updateDestination = async (id: string, destination: Partial<Destination>) => {
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
  } catch (error) {
    handleError(error, '목적지 수정');
  }
};

export const deleteDestination = async (id: string) => {
  try {
    const { error: borderDestError } = await supabase
      .from(TABLES.BORDER_DESTINATION_FREIGHTS)
      .delete()
      .eq('destination_id', id);

    if (borderDestError) {
      handleError(borderDestError, '관련 국경-목적지 운임 삭제');
      throw borderDestError;
    }

    const { error: combinedError } = await supabase
      .from(TABLES.COMBINED_FREIGHTS)
      .delete()
      .eq('destination_id', id);

    if (combinedError) {
      handleError(combinedError, '관련 통합 운임 삭제');
      throw combinedError;
    }

    const { error } = await supabase
      .from(TABLES.DESTINATIONS)
      .delete()
      .eq('id', id);

    if (error) {
      handleError(error, '목적지 삭제');
      throw error;
    }
  } catch (error) {
    handleError(error, '목적지 삭제');
  }
};

// Sea Freight Operations - REMOVED all version logic
export const addSeaFreight = async (
  freight: Omit<SeaFreight, 'id' | 'createdAt' | 'updatedAt'>,
  seaFreights: SeaFreight[],
  user: User | null
) => {
  try {
    const { data, error } = await supabase
      .from(TABLES.SEA_FREIGHTS)
      .insert({
        pol: freight.pol,
        pod: freight.pod,
        rate: freight.rate,
        carrier: freight.carrier,
        local_charge: freight.localCharge || 0,
        note: freight.note,
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
        validFrom: data.valid_from,
        validTo: data.valid_to,
        localCharge: data.local_charge || 0,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      await createAuditLog(
        'seaFreight',
        newFreight.id,
        'create',
        detectChanges(null, newFreight as unknown as Record<string, unknown>),
        newFreight as unknown as Record<string, unknown>,
        user
      );
    }
  } catch (error) {
    handleError(error, '해상 운임 추가');
  }
};

export const updateSeaFreight = async (
  id: string,
  freight: Partial<SeaFreight>,
  seaFreights: SeaFreight[],
  user: User | null
) => {
  try {
    const oldFreight = seaFreights.find(f => f.id === id);
    if (!oldFreight) return;

    const { data, error } = await supabase
      .from(TABLES.SEA_FREIGHTS)
      .update({
        pol: freight.pol,
        pod: freight.pod,
        rate: freight.rate,
        local_charge: freight.localCharge,
        carrier: freight.carrier,
        note: freight.note,
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

    if (data) {
      const updatedFreight: SeaFreight = {
        id: data.id,
        pol: data.pol,
        pod: data.pod,
        rate: data.rate,
        carrier: data.carrier,
        note: data.note,
        localCharge: data.local_charge || 0,
        validFrom: data.valid_from,
        validTo: data.valid_to,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      await createAuditLog(
        'seaFreight',
        id,
        'update',
        detectChanges(oldFreight as unknown as Record<string, unknown>, updatedFreight as unknown as Record<string, unknown>),
        updatedFreight as unknown as Record<string, unknown>,
        user
      );
    }
  } catch (error) {
    handleError(error, '해상 운임 수정');
  }
};

export const deleteSeaFreight = async (id: string, seaFreights: SeaFreight[], user: User | null) => {
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
      await createAuditLog(
        'seaFreight',
        id,
        'delete',
        [],
        freight as unknown as Record<string, unknown>,
        user
      );
    }
  } catch (error) {
    handleError(error, '해상 운임 삭제');
  }
};

// Agent Sea Freight Operations - REMOVED all version logic
export const addAgentSeaFreight = async (
  freight: Omit<AgentSeaFreight, 'id' | 'createdAt' | 'updatedAt'>,
  agentSeaFreights: AgentSeaFreight[],
  user: User | null
) => {
  try {
    const { data, error } = await supabase
      .from(TABLES.AGENT_SEA_FREIGHTS)
      .insert({
        agent: freight.agent,
        pol: freight.pol,
        pod: freight.pod,
        rate: freight.rate,
        llocal: freight.llocal,
        carrier: freight.carrier,
        note: freight.note,
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
        llocal: data.llocal,
        carrier: data.carrier,
        note: data.note,
        validFrom: data.valid_from,
        validTo: data.valid_to,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      await createAuditLog(
        'agentSeaFreight',
        newFreight.id,
        'create',
        detectChanges(null, newFreight as unknown as Record<string, unknown>),
        newFreight as unknown as Record<string, unknown>,
        user
      );
    }
  } catch (error) {
    handleError(error, '운송사별 해상 운임 추가');
  }
};

export const updateAgentSeaFreight = async (
  id: string,
  freight: Partial<AgentSeaFreight>,
  agentSeaFreights: AgentSeaFreight[],
  user: User | null
) => {
  try {
    const oldFreight = agentSeaFreights.find(f => f.id === id);
    if (!oldFreight) return;

    const { data, error } = await supabase
      .from(TABLES.AGENT_SEA_FREIGHTS)
      .update({
        agent: freight.agent,
        pol: freight.pol,
        pod: freight.pod,
        rate: freight.rate,
        llocal: freight.llocal,
        carrier: freight.carrier,
        note: freight.note,
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

    if (data) {
      const updatedFreight: AgentSeaFreight = {
        id: data.id,
        agent: data.agent,
        pol: data.pol,
        pod: data.pod,
        rate: data.rate,
        llocal: data.llocal,
        carrier: data.carrier,
        note: data.note,
        validFrom: data.valid_from,
        validTo: data.valid_to,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      await createAuditLog(
        'agentSeaFreight',
        id,
        'update',
        detectChanges(oldFreight as unknown as Record<string, unknown>, updatedFreight as unknown as Record<string, unknown>),
        updatedFreight as unknown as Record<string, unknown>,
        user
      );
    }
  } catch (error) {
    handleError(error, '운송사별 해상 운임 수정');
  }
};

export const deleteAgentSeaFreight = async (id: string, agentSeaFreights: AgentSeaFreight[], user: User | null) => {
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
      await createAuditLog(
        'agentSeaFreight',
        id,
        'delete',
        [],
        freight as unknown as Record<string, unknown>,
        user
      );
    }
  } catch (error) {
    handleError(error, '운송사별 해상 운임 삭제');
  }
};

// Calculation History Operations
export const addCalculationHistory = async (
  history: Omit<CalculationHistory, 'id' | 'createdAt'>,
  user: User | null
) => {
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

    console.log('✅ Calculation history saved successfully');
  } catch (error) {
    console.error('💥 Exception in addCalculationHistory:', error);
    handleError(error, '계산 이력 추가');
  }
};

export const deleteCalculationHistory = async (id: string) => {
  try {
    const { error } = await supabase
      .from(TABLES.CALCULATION_HISTORY)
      .delete()
      .eq('id', id);

    if (error) {
      handleError(error, '계산 이력 삭제');
      return;
    }
  } catch (error) {
    handleError(error, '계산 이력 삭제');
  }
};

// Quotation Operations
export const addQuotation = async (quotation: Omit<Quotation, 'id' | 'createdAt'>, user: User | null) => {
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
  } catch (error) {
    handleError(error, '견적 추가');
  }
};

export const deleteQuotation = async (id: string) => {
  try {
    const { error } = await supabase
      .from(TABLES.QUOTATIONS)
      .delete()
      .eq('id', id);

    if (error) {
      handleError(error, '견적 삭제');
      return;
    }
  } catch (error) {
    handleError(error, '견적 삭제');
  }
};

// Audit Log Operations
export const deleteAuditLog = async (id: string) => {
  try {
    const { error } = await supabase
      .from(TABLES.AUDIT_LOGS)
      .delete()
      .eq('id', id);

    if (error) {
      handleError(error, '변경 이력 삭제');
      return;
    }
  } catch (error) {
    handleError(error, '변경 이력 삭제');
  }
};

export const clearAuditLogs = async (entityType?: FreightAuditLog['entityType']) => {
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
  } catch (error) {
    handleError(error, '변경 이력 초기화');
  }
};

// Border City Operations
export const addBorderCity = async (city: Omit<BorderCity, 'id' | 'createdAt' | 'updatedAt'>, user: User | null) => {
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

      await createAuditLog(
        'borderCity',
        newCity.id,
        'create',
        detectChanges(null, newCity as unknown as Record<string, unknown>),
        newCity as unknown as Record<string, unknown>,
        user
      );
    }
  } catch (error) {
    handleError(error, '국경 도시 추가');
  }
};

export const updateBorderCity = async (id: string, city: Partial<BorderCity>, borderCities: BorderCity[], user: User | null) => {
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

      await createAuditLog(
        'borderCity',
        id,
        'update',
        detectChanges(oldCity as unknown as Record<string, unknown>, updatedCity as unknown as Record<string, unknown>),
        updatedCity as unknown as Record<string, unknown>,
        user
      );
    }
  } catch (error) {
    handleError(error, '국경 도시 수정');
  }
};

export const deleteBorderCity = async (id: string, borderCities: BorderCity[], user: User | null) => {
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
      await createAuditLog('borderCity', id, 'delete', [], city as unknown as Record<string, unknown>, user);
    }
  } catch (error) {
    handleError(error, '국경 도시 삭제');
  }
};

// System Setting Operations
export const addSystemSetting = async (setting: Omit<SystemSetting, 'id' | 'createdAt' | 'updatedAt'>, user: User | null) => {
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

      await createAuditLog(
        'systemSetting',
        newSetting.id,
        'create',
        detectChanges(null, newSetting as unknown as Record<string, unknown>),
        newSetting as unknown as Record<string, unknown>,
        user
      );
    }
  } catch (error) {
    handleError(error, '시스템 설정 추가');
  }
};

export const updateSystemSetting = async (id: string, setting: Partial<SystemSetting>, systemSettings: SystemSetting[], user: User | null) => {
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

      await createAuditLog(
        'systemSetting',
        id,
        'update',
        detectChanges(oldSetting as unknown as Record<string, unknown>, updatedSetting as unknown as Record<string, unknown>),
        updatedSetting as unknown as Record<string, unknown>,
        user
      );
    }
  } catch (error) {
    handleError(error, '시스템 설정 수정');
  }
};

export const deleteSystemSetting = async (id: string, systemSettings: SystemSetting[], user: User | null) => {
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
      await createAuditLog('systemSetting', id, 'delete', [], setting as unknown as Record<string, unknown>, user);
    }
  } catch (error) {
    handleError(error, '시스템 설정 삭제');
  }
};