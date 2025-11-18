import { AgentCostBreakdown } from '@/types/freight';

export type ExcludedCosts = {
  seaFreight: boolean;
  localCharge: boolean;
  dthc: boolean;
  portBorder: boolean;
  borderDestination: boolean;
  combinedFreight: boolean;
  weightSurcharge: boolean;
  dp: boolean;
  domesticTransport: boolean;
  [key: string]: boolean;
};

export type CellExclusions = {
  [agentIndex: number]: {
    [costType: string]: boolean;
  };
};

export type SortConfig = {
  key: 'agent' | 'rail' | 'truck' | 'total' | null;
  direction: 'asc' | 'desc';
};

export const STORAGE_KEY_RESULT = 'freight_calculator_result';
export const STORAGE_KEY_EXCLUDED = 'freight_calculator_excluded';
export const STORAGE_KEY_CELL_EXCLUDED = 'freight_calculator_cell_excluded';
export const STORAGE_KEY_USER = 'freight_calculator_user';

export const ITEMS_PER_PAGE = 5;
export const FILTER_ALL_VALUE = '__all__';

// Helper function to deduplicate breakdowns
export const deduplicateBreakdowns = (breakdowns: AgentCostBreakdown[]): AgentCostBreakdown[] => {
  const uniqueMap = new Map<string, AgentCostBreakdown>();
  
  breakdowns.forEach(breakdown => {
    const key = [
      breakdown.agent,
      breakdown.railAgent,
      breakdown.truckAgent,
      breakdown.seaFreightCarrier || '',
      breakdown.isCombinedFreight ? 'combined' : 'separate',
      breakdown.seaFreight,
      breakdown.localCharge || 0,
      breakdown.dthc,
      breakdown.portBorder,
      breakdown.borderDestination,
      breakdown.combinedFreight,
      breakdown.weightSurcharge,
      breakdown.dp,
      breakdown.domesticTransport,
    ].join('|');
    
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, breakdown);
    }
  });
  
  return Array.from(uniqueMap.values());
};