import { supabase, TABLES } from '@/lib/supabase';
import { handleError } from '@/lib/errorHandler';
import { detectChanges } from './freightHelpers';
import { createAuditLog } from './freightOperations';
import {
  DTHC,
  DPCost,
  CombinedFreight,
  PortBorderFreight,
  BorderDestinationFreight,
  WeightSurchargeRule,
  User,
} from '@/types/freight';

// DTHC Operations - REMOVED all version logic
export const addDTHC = async (dthc: Omit<DTHC, 'id' | 'createdAt' | 'updatedAt'>, user: User | null) => {
  try {
    const { data, error } = await supabase
      .from(TABLES.DTHC)
      .insert({
        agent: dthc.agent,
        pol: dthc.pol,
        pod: dthc.pod,
        carrier: dthc.carrier,
        amount: dthc.amount,
        description: dthc.description,
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
        carrier: data.carrier,
        amount: data.amount,
        description: data.description,
        validFrom: data.valid_from,
        validTo: data.valid_to,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      await createAuditLog(
        'dthc',
        newDTHC.id,
        'create',
        detectChanges(null, newDTHC as unknown as Record<string, unknown>),
        newDTHC as unknown as Record<string, unknown>,
        user
      );
    }
  } catch (error) {
    handleError(error, 'DTHC 추가');
  }
};

export const updateDTHC = async (id: string, dthc: Partial<DTHC>, dthcList: DTHC[], user: User | null) => {
  try {
    const oldDTHC = dthcList.find(d => d.id === id);
    if (!oldDTHC) return;

    const { data, error } = await supabase
      .from(TABLES.DTHC)
      .update({
        agent: dthc.agent,
        pol: dthc.pol,
        pod: dthc.pod,
        carrier: dthc.carrier,
        amount: dthc.amount,
        description: dthc.description,
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

    if (data) {
      const updatedDTHC: DTHC = {
        id: data.id,
        agent: data.agent,
        pol: data.pol,
        pod: data.pod,
        carrier: data.carrier,
        amount: data.amount,
        description: data.description,
        validFrom: data.valid_from,
        validTo: data.valid_to,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      await createAuditLog(
        'dthc',
        id,
        'update',
        detectChanges(oldDTHC as unknown as Record<string, unknown>, updatedDTHC as unknown as Record<string, unknown>),
        updatedDTHC as unknown as Record<string, unknown>,
        user
      );
    }
  } catch (error) {
    handleError(error, 'DTHC 수정');
  }
};

export const deleteDTHC = async (id: string, dthcList: DTHC[], user: User | null) => {
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
      await createAuditLog('dthc', id, 'delete', [], dthc as unknown as Record<string, unknown>, user);
    }
  } catch (error) {
    handleError(error, 'DTHC 삭제');
  }
};

// DP Cost Operations - REMOVED all version logic
export const addDPCost = async (dp: Omit<DPCost, 'id' | 'createdAt' | 'updatedAt'>, user: User | null) => {
  try {
    const { data, error } = await supabase
      .from(TABLES.DP_COSTS)
      .insert({
        port: dp.port,
        amount: dp.amount,
        description: dp.description,
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
        validFrom: data.valid_from,
        validTo: data.valid_to,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      await createAuditLog(
        'dpCost',
        newDP.id,
        'create',
        detectChanges(null, newDP as unknown as Record<string, unknown>),
        newDP as unknown as Record<string, unknown>,
        user
      );
    }
  } catch (error) {
    handleError(error, 'DP 비용 추가');
  }
};

export const updateDPCost = async (id: string, dp: Partial<DPCost>, dpCosts: DPCost[], user: User | null) => {
  try {
    const oldDP = dpCosts.find(d => d.id === id);
    if (!oldDP) return;

    const { data, error } = await supabase
      .from(TABLES.DP_COSTS)
      .update({
        port: dp.port,
        amount: dp.amount,
        description: dp.description,
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

    if (data) {
      const updatedDP: DPCost = {
        id: data.id,
        port: data.port,
        amount: data.amount,
        description: data.description,
        validFrom: data.valid_from,
        validTo: data.valid_to,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      await createAuditLog(
        'dpCost',
        id,
        'update',
        detectChanges(oldDP as unknown as Record<string, unknown>, updatedDP as unknown as Record<string, unknown>),
        updatedDP as unknown as Record<string, unknown>,
        user
      );
    }
  } catch (error) {
    handleError(error, 'DP 비용 수정');
  }
};

export const deleteDPCost = async (id: string, dpCosts: DPCost[], user: User | null) => {
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
      await createAuditLog('dpCost', id, 'delete', [], dp as unknown as Record<string, unknown>, user);
    }
  } catch (error) {
    handleError(error, 'DP 비용 삭제');
  }
};

// Combined Freight Operations - REMOVED all version logic
export const addCombinedFreight = async (freight: Omit<CombinedFreight, 'id' | 'createdAt' | 'updatedAt'>, user: User | null) => {
  try {
    const { data, error } = await supabase
      .from(TABLES.COMBINED_FREIGHTS)
      .insert({
        agent: freight.agent,
        pol: freight.pol,
        pod: freight.pod,
        destination_id: freight.destinationId,
        rate: freight.rate,
        description: freight.description,
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
        pol: data.pol || '인천',
        pod: data.pod,
        destinationId: data.destination_id,
        rate: data.rate,
        description: data.description,
        validFrom: data.valid_from,
        validTo: data.valid_to,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      await createAuditLog(
        'combinedFreight',
        newFreight.id,
        'create',
        detectChanges(null, newFreight as unknown as Record<string, unknown>),
        newFreight as unknown as Record<string, unknown>,
        user
      );
    }
  } catch (error) {
    handleError(error, '통합 운임 추가');
  }
};

export const updateCombinedFreight = async (id: string, freight: Partial<CombinedFreight>, combinedFreights: CombinedFreight[], user: User | null) => {
  try {
    const oldFreight = combinedFreights.find(f => f.id === id);
    if (!oldFreight) return;

    const { data, error } = await supabase
      .from(TABLES.COMBINED_FREIGHTS)
      .update({
        agent: freight.agent,
        pol: freight.pol,
        pod: freight.pod,
        destination_id: freight.destinationId,
        rate: freight.rate,
        description: freight.description,
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

    if (data) {
      const updatedFreight: CombinedFreight = {
        id: data.id,
        agent: data.agent,
        pol: data.pol || '인천',
        pod: data.pod,
        destinationId: data.destination_id,
        rate: data.rate,
        description: data.description,
        validFrom: data.valid_from,
        validTo: data.valid_to,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      await createAuditLog(
        'combinedFreight',
        id,
        'update',
        detectChanges(oldFreight as unknown as Record<string, unknown>, updatedFreight as unknown as Record<string, unknown>),
        updatedFreight as unknown as Record<string, unknown>,
        user
      );
    }
  } catch (error) {
    handleError(error, '통합 운임 수정');
  }
};

export const deleteCombinedFreight = async (id: string, combinedFreights: CombinedFreight[], user: User | null) => {
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
      await createAuditLog('combinedFreight', id, 'delete', [], freight as unknown as Record<string, unknown>, user);
    }
  } catch (error) {
    handleError(error, '통합 운임 삭제');
  }
};

// Port Border Freight Operations - REMOVED all version logic
export const addPortBorderFreight = async (freight: Omit<PortBorderFreight, 'id' | 'createdAt' | 'updatedAt'>, user: User | null) => {
  try {
    const { data, error } = await supabase
      .from(TABLES.PORT_BORDER_FREIGHTS)
      .insert({
        agent: freight.agent,
        pol: freight.pol,
        pod: freight.pod,
        rate: freight.rate,
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
        pol: data.pol || '인천',
        pod: data.pod,
        rate: data.rate,
        validFrom: data.valid_from,
        validTo: data.valid_to,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      await createAuditLog(
        'portBorderFreight',
        newFreight.id,
        'create',
        detectChanges(null, newFreight as unknown as Record<string, unknown>),
        newFreight as unknown as Record<string, unknown>,
        user
      );
    }
  } catch (error) {
    handleError(error, '항구-국경 운임 추가');
  }
};

export const updatePortBorderFreight = async (id: string, freight: Partial<PortBorderFreight>, portBorderFreights: PortBorderFreight[], user: User | null) => {
  try {
    const oldFreight = portBorderFreights.find(f => f.id === id);
    if (!oldFreight) return;

    const updateData: Record<string, unknown> = {
      rate: freight.rate,
      valid_from: freight.validFrom,
      valid_to: freight.validTo,
      updated_at: new Date().toISOString(),
    };

    if (freight.pol !== undefined) {
      updateData.pol = freight.pol;
    }

    const { data, error } = await supabase
      .from(TABLES.PORT_BORDER_FREIGHTS)
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      handleError(error, '항구-국경 운임 수정');
      return;
    }

    if (data) {
      const updatedFreight: PortBorderFreight = {
        id: data.id,
        agent: data.agent,
        pol: data.pol || '인천',
        pod: data.pod,
        rate: data.rate,
        validFrom: data.valid_from,
        validTo: data.valid_to,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      const changes = detectChanges(
        oldFreight as unknown as Record<string, unknown>,
        updatedFreight as unknown as Record<string, unknown>
      );

      if (changes.length > 0) {
        await createAuditLog(
          'portBorderFreight',
          id,
          'update',
          changes,
          updatedFreight as unknown as Record<string, unknown>,
          user
        );
      }
    }
  } catch (error) {
    handleError(error, '항구-국경 운임 수정');
  }
};

export const deletePortBorderFreight = async (id: string, portBorderFreights: PortBorderFreight[], user: User | null) => {
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
      await createAuditLog('portBorderFreight', id, 'delete', [], freight as unknown as Record<string, unknown>, user);
    }
  } catch (error) {
    handleError(error, '항구-국경 운임 삭제');
  }
};

// Border Destination Freight Operations - REMOVED all version logic
export const addBorderDestinationFreight = async (freight: Omit<BorderDestinationFreight, 'id' | 'createdAt' | 'updatedAt'>, user: User | null) => {
  try {
    const { data, error } = await supabase
      .from(TABLES.BORDER_DESTINATION_FREIGHTS)
      .insert({
        agent: freight.agent,
        destination_id: freight.destinationId,
        rate: freight.rate,
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
        validFrom: data.valid_from,
        validTo: data.valid_to,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      await createAuditLog(
        'borderDestinationFreight',
        newFreight.id,
        'create',
        detectChanges(null, newFreight as unknown as Record<string, unknown>),
        newFreight as unknown as Record<string, unknown>,
        user
      );
    }
  } catch (error) {
    handleError(error, '국경-목적지 운임 추가');
  }
};

export const updateBorderDestinationFreight = async (id: string, freight: Partial<BorderDestinationFreight>, borderDestinationFreights: BorderDestinationFreight[], user: User | null) => {
  try {
    const oldFreight = borderDestinationFreights.find(f => f.id === id);
    if (!oldFreight) return;

    const { data, error } = await supabase
      .from(TABLES.BORDER_DESTINATION_FREIGHTS)
      .update({
        agent: freight.agent,
        destination_id: freight.destinationId,
        rate: freight.rate,
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

    if (data) {
      const updatedFreight: BorderDestinationFreight = {
        id: data.id,
        agent: data.agent,
        destinationId: data.destination_id,
        rate: data.rate,
        validFrom: data.valid_from,
        validTo: data.valid_to,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      const changes = detectChanges(
        oldFreight as unknown as Record<string, unknown>,
        updatedFreight as unknown as Record<string, unknown>
      );

      if (changes.length > 0) {
        await createAuditLog(
          'borderDestinationFreight',
          id,
          'update',
          changes,
          updatedFreight as unknown as Record<string, unknown>,
          user
        );
      }
    }
  } catch (error) {
    handleError(error, '국경-목적지 운임 수정');
  }
};

export const deleteBorderDestinationFreight = async (id: string, borderDestinationFreights: BorderDestinationFreight[], user: User | null) => {
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
      await createAuditLog('borderDestinationFreight', id, 'delete', [], freight as unknown as Record<string, unknown>, user);
    }
  } catch (error) {
    handleError(error, '국경-목적지 운임 삭제');
  }
};

// Weight Surcharge Operations - REMOVED all version logic
export const addWeightSurchargeRule = async (rule: Omit<WeightSurchargeRule, 'id' | 'createdAt' | 'updatedAt'>, user: User | null) => {
  try {
    const { data, error } = await supabase
      .from(TABLES.WEIGHT_SURCHARGE_RULES)
      .insert({
        agent: rule.agent,
        min_weight: rule.minWeight,
        max_weight: rule.maxWeight,
        surcharge: rule.surcharge,
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
        validFrom: data.valid_from,
        validTo: data.valid_to,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      await createAuditLog(
        'weightSurcharge',
        newRule.id,
        'create',
        detectChanges(null, newRule as unknown as Record<string, unknown>),
        newRule as unknown as Record<string, unknown>,
        user
      );
    }
  } catch (error) {
    handleError(error, '중량 할증 규칙 추가');
  }
};

export const updateWeightSurchargeRule = async (id: string, rule: Partial<WeightSurchargeRule>, weightSurchargeRules: WeightSurchargeRule[], user: User | null) => {
  try {
    const oldRule = weightSurchargeRules.find(r => r.id === id);
    if (!oldRule) return;

    const { data, error } = await supabase
      .from(TABLES.WEIGHT_SURCHARGE_RULES)
      .update({
        agent: rule.agent,
        min_weight: rule.minWeight,
        max_weight: rule.maxWeight,
        surcharge: rule.surcharge,
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

    if (data) {
      const updatedRule: WeightSurchargeRule = {
        id: data.id,
        agent: data.agent,
        minWeight: data.min_weight,
        maxWeight: data.max_weight,
        surcharge: data.surcharge,
        validFrom: data.valid_from,
        validTo: data.valid_to,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      await createAuditLog(
        'weightSurcharge',
        id,
        'update',
        detectChanges(oldRule as unknown as Record<string, unknown>, updatedRule as unknown as Record<string, unknown>),
        updatedRule as unknown as Record<string, unknown>,
        user
      );
    }
  } catch (error) {
    handleError(error, '중량 할증 규칙 수정');
  }
};

export const deleteWeightSurchargeRule = async (id: string, weightSurchargeRules: WeightSurchargeRule[], user: User | null) => {
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
      await createAuditLog('weightSurcharge', id, 'delete', [], rule as unknown as Record<string, unknown>, user);
    }
  } catch (error) {
    handleError(error, '중량 할증 규칙 삭제');
  }
};