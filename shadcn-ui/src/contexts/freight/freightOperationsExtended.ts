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

// DTHC Operations
export const addDTHC = async (dthc: Omit<DTHC, 'id' | 'createdAt' | 'updatedAt' | 'version'>, user: User | null) => {
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

      await createAuditLog(
        'dthc',
        newDTHC.id,
        'create',
        detectChanges(null, newDTHC as unknown as Record<string, unknown>),
        newDTHC as unknown as Record<string, unknown>,
        user,
        1
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

      await createAuditLog(
        'dthc',
        id,
        'update',
        detectChanges(oldDTHC as unknown as Record<string, unknown>, updatedDTHC as unknown as Record<string, unknown>),
        updatedDTHC as unknown as Record<string, unknown>,
        user,
        newVersion
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
      await createAuditLog('dthc', id, 'delete', [], dthc as unknown as Record<string, unknown>, user, dthc.version);
    }
  } catch (error) {
    handleError(error, 'DTHC 삭제');
  }
};

// DP Cost Operations
export const addDPCost = async (dp: Omit<DPCost, 'id' | 'createdAt' | 'updatedAt' | 'version'>, user: User | null) => {
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

      await createAuditLog(
        'dpCost',
        newDP.id,
        'create',
        detectChanges(null, newDP as unknown as Record<string, unknown>),
        newDP as unknown as Record<string, unknown>,
        user,
        1
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

      await createAuditLog(
        'dpCost',
        id,
        'update',
        detectChanges(oldDP as unknown as Record<string, unknown>, updatedDP as unknown as Record<string, unknown>),
        updatedDP as unknown as Record<string, unknown>,
        user,
        newVersion
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
      await createAuditLog('dpCost', id, 'delete', [], dp as unknown as Record<string, unknown>, user, dp.version);
    }
  } catch (error) {
    handleError(error, 'DP 비용 삭제');
  }
};

// Combined Freight Operations
export const addCombinedFreight = async (freight: Omit<CombinedFreight, 'id' | 'createdAt' | 'updatedAt' | 'version'>, user: User | null) => {
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

      await createAuditLog(
        'combinedFreight',
        newFreight.id,
        'create',
        detectChanges(null, newFreight as unknown as Record<string, unknown>),
        newFreight as unknown as Record<string, unknown>,
        user,
        1
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

      await createAuditLog(
        'combinedFreight',
        id,
        'update',
        detectChanges(oldFreight as unknown as Record<string, unknown>, updatedFreight as unknown as Record<string, unknown>),
        updatedFreight as unknown as Record<string, unknown>,
        user,
        newVersion
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
      await createAuditLog('combinedFreight', id, 'delete', [], freight as unknown as Record<string, unknown>, user, freight.version);
    }
  } catch (error) {
    handleError(error, '통합 운임 삭제');
  }
};

// Port Border Freight Operations
export const addPortBorderFreight = async (freight: Omit<PortBorderFreight, 'id' | 'createdAt' | 'updatedAt' | 'version'>, user: User | null) => {
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

      await createAuditLog(
        'portBorderFreight',
        newFreight.id,
        'create',
        detectChanges(null, newFreight as unknown as Record<string, unknown>),
        newFreight as unknown as Record<string, unknown>,
        user,
        1
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

    const rateChanged = freight.rate !== undefined && freight.rate !== oldFreight.rate;
    const validFromChanged = freight.validFrom !== undefined && freight.validFrom !== oldFreight.validFrom;
    const validToChanged = freight.validTo !== undefined && freight.validTo !== oldFreight.validTo;
    const validityChanged = validFromChanged || validToChanged;

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

      if (versionWillChange || (changes.length > 0 && !versionWillChange)) {
        await createAuditLog(
          'portBorderFreight',
          id,
          'update',
          changes,
          updatedFreight as unknown as Record<string, unknown>,
          user,
          newVersion
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
      await createAuditLog('portBorderFreight', id, 'delete', [], freight as unknown as Record<string, unknown>, user, freight.version);
    }
  } catch (error) {
    handleError(error, '항구-국경 운임 삭제');
  }
};

// Border Destination Freight Operations
export const addBorderDestinationFreight = async (freight: Omit<BorderDestinationFreight, 'id' | 'createdAt' | 'updatedAt' | 'version'>, user: User | null) => {
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

      await createAuditLog(
        'borderDestinationFreight',
        newFreight.id,
        'create',
        detectChanges(null, newFreight as unknown as Record<string, unknown>),
        newFreight as unknown as Record<string, unknown>,
        user,
        1
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

    const rateChanged = freight.rate !== undefined && freight.rate !== oldFreight.rate;
    const validFromChanged = freight.validFrom !== undefined && freight.validFrom !== oldFreight.validFrom;
    const validToChanged = freight.validTo !== undefined && freight.validTo !== oldFreight.validTo;
    const validityChanged = validFromChanged || validToChanged;

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

      if (versionWillChange || (changes.length > 0 && !versionWillChange)) {
        await createAuditLog(
          'borderDestinationFreight',
          id,
          'update',
          changes,
          updatedFreight as unknown as Record<string, unknown>,
          user,
          newVersion
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
      await createAuditLog('borderDestinationFreight', id, 'delete', [], freight as unknown as Record<string, unknown>, user, freight.version);
    }
  } catch (error) {
    handleError(error, '국경-목적지 운임 삭제');
  }
};

// Weight Surcharge Operations
export const addWeightSurchargeRule = async (rule: Omit<WeightSurchargeRule, 'id' | 'createdAt' | 'updatedAt' | 'version'>, user: User | null) => {
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

      await createAuditLog(
        'weightSurcharge',
        newRule.id,
        'create',
        detectChanges(null, newRule as unknown as Record<string, unknown>),
        newRule as unknown as Record<string, unknown>,
        user,
        1
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

      await createAuditLog(
        'weightSurcharge',
        id,
        'update',
        detectChanges(oldRule as unknown as Record<string, unknown>, updatedRule as unknown as Record<string, unknown>),
        updatedRule as unknown as Record<string, unknown>,
        user,
        newVersion
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
      await createAuditLog('weightSurcharge', id, 'delete', [], rule as unknown as Record<string, unknown>, user, rule.version);
    }
  } catch (error) {
    handleError(error, '중량 할증 규칙 삭제');
  }
};