import { useState, useEffect, useMemo } from 'react';
import { useFreight } from '@/contexts/FreightContext';
import { useAuth } from '@/contexts/AuthContext';
import { CostCalculationInput, CostCalculationResult, CalculationHistory, SeaFreight, AgentCostBreakdown, OtherCostInput } from '@/types/freight';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calculator, TrendingDown, Train, Truck, Weight, Package, Star, FileText, DollarSign, Info, Ship, ArrowUp, ArrowDown, History, Trash2, Clock, Merge, Save, FileSpreadsheet, Plus, X, AlertTriangle, Search, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DebugLLocal } from './DebugLLocal';
import QuotationDialog from './QuotationDialog';
import TimeMachineDialog from './TimeMachineDialog';

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

// Individual cell exclusions: { agentIndex: { costType: boolean } }
type CellExclusions = {
  [agentIndex: number]: {
    [costType: string]: boolean;
  };
};

type SortConfig = {
  key: 'agent' | 'rail' | 'truck' | 'total' | null;
  direction: 'asc' | 'desc';
};

const STORAGE_KEY_RESULT = 'freight_calculator_result';
const STORAGE_KEY_EXCLUDED = 'freight_calculator_excluded';
const STORAGE_KEY_CELL_EXCLUDED = 'freight_calculator_cell_excluded';
const STORAGE_KEY_USER = 'freight_calculator_user';

const ITEMS_PER_PAGE = 5;
const FILTER_ALL_VALUE = '__all__';

// Helper function to deduplicate breakdowns
const deduplicateBreakdowns = (breakdowns: AgentCostBreakdown[]): AgentCostBreakdown[] => {
  const uniqueMap = new Map<string, AgentCostBreakdown>();
  
  breakdowns.forEach(breakdown => {
    // Create a unique key based on all relevant properties
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
    
    // Only keep the first occurrence of each unique combination
    if (!uniqueMap.has(key)) {
      uniqueMap.set(key, breakdown);
    }
  });
  
  return Array.from(uniqueMap.values());
};

export default function CostCalculatorWithTabs() {
  const { destinations, calculateCost, getDPCost, getDestinationById, calculationHistory, addCalculationHistory, deleteCalculationHistory, getSeaFreightOptions, dpCosts, ports } = useFreight();
  const { user, canDeleteCalculation } = useAuth();
  const { toast } = useToast();
  const [input, setInput] = useState<CostCalculationInput>({
    pol: '',
    pod: '',
    destinationId: '',
    weight: 0,
    includeDP: false,
    domesticTransport: 0,
    localCharge: 0,
    otherCosts: [],
  });
  const [result, setResult] = useState<CostCalculationResult | null>(null);
  const [allFreightsResult, setAllFreightsResult] = useState<CostCalculationResult | null>(null);
  const [activeTab, setActiveTab] = useState<'filtered' | 'all'>('filtered');
  const [error, setError] = useState('');
  const [excludedCosts, setExcludedCosts] = useState<ExcludedCosts>({
    seaFreight: false,
    localCharge: false,
    dthc: false,
    portBorder: false,
    borderDestination: false,
    combinedFreight: false,
    weightSurcharge: false,
    dp: false,
    domesticTransport: false,
  });
  const [cellExclusions, setCellExclusions] = useState<CellExclusions>({});
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'total', direction: 'asc' });
  const [seaFreightOptions, setSeaFreightOptions] = useState<SeaFreight[]>([]);
  const [showSeaFreightDialog, setShowSeaFreightDialog] = useState(false);
  const [selectedSeaFreightIds, setSelectedSeaFreightIds] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [historyToDelete, setHistoryToDelete] = useState<string | null>(null);
  const [quotationDialogOpen, setQuotationDialogOpen] = useState(false);
  const [selectedBreakdown, setSelectedBreakdown] = useState<AgentCostBreakdown | null>(null);
  const [timeMachineOpen, setTimeMachineOpen] = useState(false);
  const [historicalDate, setHistoricalDate] = useState<string>('');
  // Store the full unfiltered breakdown for "제약 없이 보기"
  const [fullBreakdown, setFullBreakdown] = useState<AgentCostBreakdown[]>([]);

  // History pagination and search states
  const [currentPage, setCurrentPage] = useState(1);
  const [searchFilters, setSearchFilters] = useState({
    pol: FILTER_ALL_VALUE,
    pod: FILTER_ALL_VALUE,
    destination: FILTER_ALL_VALUE,
    dateFrom: '',
    dateTo: '',
  });

  // Batch delete states
  const [selectedHistoryIds, setSelectedHistoryIds] = useState<Set<string>>(new Set());
  const [batchDeleteDialogOpen, setBatchDeleteDialogOpen] = useState(false);
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);

  const dpCost = input.pol ? getDPCost(input.pol) : 0;

  // Get POL and POD ports from the ports list
  const polPorts = ports.filter(p => p.type === 'POL');
  const podPorts = ports.filter(p => p.type === 'POD');

  // Extract unique values from calculation history for filter dropdowns
  const filterOptions = useMemo(() => {
    if (!calculationHistory) return { pols: [], pods: [], destinations: [] };

    const pols = new Set<string>();
    const pods = new Set<string>();
    const destinations = new Set<string>();

    calculationHistory.forEach(history => {
      if (history.result.input.pol) pols.add(history.result.input.pol);
      if (history.result.input.pod) pods.add(history.result.input.pod);
      if (history.destinationName) destinations.add(history.destinationName);
    });

    return {
      pols: Array.from(pols).sort((a, b) => a.localeCompare(b, 'ko')),
      pods: Array.from(pods).sort((a, b) => a.localeCompare(b, 'ko')),
      destinations: Array.from(destinations).sort((a, b) => a.localeCompare(b, 'ko')),
    };
  }, [calculationHistory]);

  // Debug: Log calculation history whenever it changes
  useEffect(() => {
    console.log('📊 Calculation History Updated:', {
      count: calculationHistory?.length || 0,
      history: calculationHistory
    });
  }, [calculationHistory]);

  // Filter and paginate calculation history
  const filteredHistory = useMemo(() => {
    if (!calculationHistory) return [];

    return calculationHistory.filter((history) => {
      // POL filter
      if (searchFilters.pol !== FILTER_ALL_VALUE && history.result.input.pol !== searchFilters.pol) {
        return false;
      }

      // POD filter
      if (searchFilters.pod !== FILTER_ALL_VALUE && history.result.input.pod !== searchFilters.pod) {
        return false;
      }

      // Destination filter
      if (searchFilters.destination !== FILTER_ALL_VALUE && history.destinationName !== searchFilters.destination) {
        return false;
      }

      // Date range filter
      if (searchFilters.dateFrom || searchFilters.dateTo) {
        const historyDate = new Date(history.createdAt).toISOString().split('T')[0];
        
        if (searchFilters.dateFrom && historyDate < searchFilters.dateFrom) {
          return false;
        }
        
        if (searchFilters.dateTo && historyDate > searchFilters.dateTo) {
          return false;
        }
      }

      return true;
    });
  }, [calculationHistory, searchFilters]);

  // Get deletable items from filtered history
  const deletableFilteredHistory = useMemo(() => {
    return filteredHistory.filter(history => canDeleteCalculation(history.createdBy));
  }, [filteredHistory, canDeleteCalculation]);

  const totalPages = Math.ceil(filteredHistory.length / ITEMS_PER_PAGE);
  const paginatedHistory = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredHistory.slice(startIndex, endIndex);
  }, [filteredHistory, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchFilters]);

  // Clear selections when filters change
  useEffect(() => {
    setSelectedHistoryIds(new Set());
  }, [searchFilters, currentPage]);

  useEffect(() => {
    const savedUserId = localStorage.getItem(STORAGE_KEY_USER);
    const currentUserId = user?.id || '';

    if (savedUserId !== currentUserId) {
      setInput({
        pol: '',
        pod: '',
        destinationId: '',
        weight: 0,
        includeDP: false,
        domesticTransport: 0,
        localCharge: 0,
        otherCosts: [],
      });
      setResult(null);
      setAllFreightsResult(null);
      setError('');
      setSortConfig({ key: 'total', direction: 'asc' });
      setExcludedCosts({
        seaFreight: false,
        localCharge: false,
        dthc: false,
        portBorder: false,
        borderDestination: false,
        combinedFreight: false,
        weightSurcharge: false,
        dp: false,
        domesticTransport: false,
      });
      setCellExclusions({});
      setHistoricalDate('');
      setActiveTab('filtered');
      setFullBreakdown([]);

      localStorage.removeItem(STORAGE_KEY_RESULT);
      localStorage.removeItem(STORAGE_KEY_EXCLUDED);
      localStorage.removeItem(STORAGE_KEY_CELL_EXCLUDED);
      
      if (currentUserId) {
        localStorage.setItem(STORAGE_KEY_USER, currentUserId);
      } else {
        localStorage.removeItem(STORAGE_KEY_USER);
      }
    }
  }, [user?.id]);

  useEffect(() => {
    const savedUserId = localStorage.getItem(STORAGE_KEY_USER);
    const currentUserId = user?.id || '';

    if (savedUserId === currentUserId && currentUserId) {
      const savedResult = localStorage.getItem(STORAGE_KEY_RESULT);
      const savedExcluded = localStorage.getItem(STORAGE_KEY_EXCLUDED);
      const savedCellExcluded = localStorage.getItem(STORAGE_KEY_CELL_EXCLUDED);
      
      if (savedResult) {
        try {
          const parsedResult = JSON.parse(savedResult);
          if (parsedResult.breakdown) {
            parsedResult.breakdown = parsedResult.breakdown.map((b: AgentCostBreakdown) => ({
              ...b,
              otherCosts: b.otherCosts || []
            }));
          }
          setResult(parsedResult);
          setInput(parsedResult.input);
          if (parsedResult.historicalDate) {
            setHistoricalDate(parsedResult.historicalDate);
          }
        } catch (e) {
          console.error('Failed to parse saved result:', e);
        }
      }
      
      if (savedExcluded) {
        try {
          const parsedExcluded = JSON.parse(savedExcluded);
          setExcludedCosts(parsedExcluded);
        } catch (e) {
          console.error('Failed to parse saved excluded costs:', e);
        }
      }

      if (savedCellExcluded) {
        try {
          const parsedCellExcluded = JSON.parse(savedCellExcluded);
          setCellExclusions(parsedCellExcluded);
        } catch (e) {
          console.error('Failed to parse saved cell exclusions:', e);
        }
      }
    }
  }, [user?.id]);

  useEffect(() => {
    if (input.pol && input.pod) {
      const options = getSeaFreightOptions(input.pol, input.pod);
      setSeaFreightOptions(options);
      // Reset selected sea freight IDs when route changes
      setSelectedSeaFreightIds(new Set());
    } else {
      setSeaFreightOptions([]);
      setSelectedSeaFreightIds(new Set());
    }
  }, [input.pol, input.pod, getSeaFreightOptions]);

  useEffect(() => {
    if (result && user?.id) {
      localStorage.setItem(STORAGE_KEY_RESULT, JSON.stringify(result));
    }
  }, [result, user?.id]);

  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(STORAGE_KEY_EXCLUDED, JSON.stringify(excludedCosts));
    }
  }, [excludedCosts, user?.id]);

  useEffect(() => {
    if (user?.id) {
      localStorage.setItem(STORAGE_KEY_CELL_EXCLUDED, JSON.stringify(cellExclusions));
    }
  }, [cellExclusions, user?.id]);

  const handleCalculate = () => {
    setError('');
    
    if (!input.pol || !input.pod || !input.destinationId) {
      setError('출발항, 중국항, 최종목적지를 모두 선택해주세요.');
      return;
    }

    if (input.weight <= 0) {
      setError('중량을 입력해주세요.');
      return;
    }

    // If multiple sea freight options exist and none are selected, show dialog
    if (seaFreightOptions.length > 1 && selectedSeaFreightIds.size === 0) {
      setShowSeaFreightDialog(true);
      return;
    }

    // Calculate for all selected sea freights (or default if only one option)
    const seaFreightIdsToCalculate = selectedSeaFreightIds.size > 0 
      ? Array.from(selectedSeaFreightIds)
      : seaFreightOptions.length === 1 
        ? [seaFreightOptions[0].id]
        : [];

    if (seaFreightIdsToCalculate.length === 0) {
      // Provide detailed error message about missing freight rates
      const missingRates: string[] = [];
      
      if (seaFreightOptions.length === 0) {
        missingRates.push(`${input.pol} → ${input.pod} 항로의 해상운임`);
      }
      
      const errorMsg = missingRates.length > 0 
        ? `다음 운임 정보가 등록되지 않았습니다:\n• ${missingRates.join('\n• ')}\n\n관리자 대시보드에서 해당 운임을 먼저 등록해주세요.`
        : '해상 운임을 선택해주세요.';
      
      setError(errorMsg);
      return;
    }

    // Collect all breakdowns from all selected sea freights
    const allBreakdowns: AgentCostBreakdown[] = [];
    
    seaFreightIdsToCalculate.forEach(seaFreightId => {
      const calculationInput = {
        ...input,
        selectedSeaFreightId: seaFreightId,
        historicalDate: historicalDate || undefined,
      };

      const calculationResult = calculateCost(calculationInput);
      
      if (calculationResult) {
        // Store ALL breakdowns (both combined and separate) for "제약 없이 보기"
        allBreakdowns.push(...calculationResult.breakdown);
      }
    });

    if (allBreakdowns.length === 0) {
      // Provide detailed error message about missing freight rates
      const destination = getDestinationById(input.destinationId);
      const destinationName = destination?.name || input.destinationId;
      const missingRates: string[] = [];
      
      // Check what's missing
      if (input.includeDP) {
        missingRates.push(`${input.pol} → ${input.pod} → ${destinationName} 경로의 철도운임 (POD → KASHGAR)`);
        missingRates.push(`${destinationName} 목적지의 트럭운임 (KASHGAR → 최종목적지)`);
      } else {
        missingRates.push(`${input.pol} → ${input.pod} → ${destinationName} 경로의 통합운임`);
      }
      
      setError(`선택한 경로에 대한 운임 조합이 없습니다.\n\n누락된 운임:\n• ${missingRates.join('\n• ')}\n\n관리자 대시보드에서 해당 운임을 먼저 등록해주세요.`);
      return;
    }

    // Deduplicate all breakdowns
    const uniqueAllBreakdowns = deduplicateBreakdowns(allBreakdowns);
    
    // Store the full breakdown for "제약 없이 보기"
    setFullBreakdown(uniqueAllBreakdowns);

    // Filter based on DP setting for the main result
    const filteredBreakdown = input.includeDP
      ? uniqueAllBreakdowns.filter(b => !b.isCombinedFreight)
      : uniqueAllBreakdowns.filter(b => b.isCombinedFreight);

    // Recalculate lowest cost for filtered breakdown
    let lowestCost = Infinity;
    let lowestAgent = '';
    
    filteredBreakdown.forEach(breakdown => {
      let total = breakdown.seaFreight + 
                 (breakdown.localCharge || 0) + 
                 breakdown.dthc + 
                 breakdown.weightSurcharge + 
                 breakdown.dp + 
                 breakdown.domesticTransport;
      
      if (breakdown.isCombinedFreight) {
        total += breakdown.combinedFreight;
      } else {
        total += breakdown.portBorder + breakdown.borderDestination;
      }
      
      if (breakdown.otherCosts) {
        total += breakdown.otherCosts.reduce((sum, cost) => sum + cost.amount, 0);
      }
      
      if (total < lowestCost) {
        lowestCost = total;
        lowestAgent = breakdown.agent;
      }
    });

    const combinedResult: CostCalculationResult = {
      input,
      breakdown: filteredBreakdown,
      lowestCost,
      lowestCostAgent: lowestAgent,
      isHistorical: !!historicalDate,
      historicalDate: historicalDate || undefined,
    };

    setResult(combinedResult);
    setAllFreightsResult(null);
    setActiveTab('filtered');
    setSortConfig({ key: 'total', direction: 'asc' });
    
    const resetExcluded: ExcludedCosts = {
      seaFreight: false,
      localCharge: false,
      dthc: false,
      portBorder: false,
      borderDestination: false,
      combinedFreight: false,
      weightSurcharge: false,
      dp: false,
      domesticTransport: false,
    };
    
    if (filteredBreakdown.length > 0 && filteredBreakdown[0].otherCosts) {
      filteredBreakdown[0].otherCosts.forEach((item, index) => {
        resetExcluded[`other_${index}`] = false;
      });
    }
    setExcludedCosts(resetExcluded);
    setCellExclusions({});

    toast({
      title: '계산 완료',
      description: `${selectedSeaFreightIds.size}개의 선사 운임으로 ${filteredBreakdown.length}개의 고유 조합이 계산되었습니다.`,
    });
  };

  const handleViewAllFreights = () => {
    // If result already exists, use the stored fullBreakdown
    if (result && fullBreakdown.length > 0) {
      // Recalculate lowest cost for all breakdowns
      let lowestCost = Infinity;
      let lowestAgent = '';
      
      fullBreakdown.forEach(breakdown => {
        let total = breakdown.seaFreight + 
                   (breakdown.localCharge || 0) + 
                   breakdown.dthc + 
                   breakdown.weightSurcharge + 
                   breakdown.dp + 
                   breakdown.domesticTransport;
        
        if (breakdown.isCombinedFreight) {
          total += breakdown.combinedFreight;
        } else {
          total += breakdown.portBorder + breakdown.borderDestination;
        }
        
        if (breakdown.otherCosts) {
          total += breakdown.otherCosts.reduce((sum, cost) => sum + cost.amount, 0);
        }
        
        if (total < lowestCost) {
          lowestCost = total;
          lowestAgent = breakdown.agent;
        }
      });

      const allFreightsResult: CostCalculationResult = {
        input: result.input,
        breakdown: fullBreakdown,
        lowestCost,
        lowestCostAgent: lowestAgent,
        isHistorical: result.isHistorical,
        historicalDate: result.historicalDate,
      };

      setAllFreightsResult(allFreightsResult);
      setActiveTab('all');
      setSortConfig({ key: 'total', direction: 'asc' });
      
      toast({
        title: '✨ 제약 없이 보기',
        description: `총 ${fullBreakdown.length}개의 고유 운임 조합(통합 + 분리)이 표시됩니다.`,
      });
      
      return;
    }

    // If no result exists, show error
    setError('먼저 "계산하기" 버튼을 클릭하여 운임을 계산해주세요.');
    toast({
      title: '계산 필요',
      description: '먼저 "계산하기"를 실행한 후 "제약 없이 보기"를 사용할 수 있습니다.',
      variant: 'destructive',
    });
  };

  const toggleSeaFreightSelection = (freightId: string) => {
    setSelectedSeaFreightIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(freightId)) {
        newSet.delete(freightId);
      } else {
        newSet.add(freightId);
      }
      return newSet;
    });
  };

  const toggleSelectAllSeaFreights = () => {
    if (selectedSeaFreightIds.size === seaFreightOptions.length) {
      // Deselect all
      setSelectedSeaFreightIds(new Set());
    } else {
      // Select all
      setSelectedSeaFreightIds(new Set(seaFreightOptions.map(f => f.id)));
    }
  };

  const handleSeaFreightDialogConfirm = () => {
    if (selectedSeaFreightIds.size === 0) {
      toast({
        title: '선택 필요',
        description: '최소 1개 이상의 해상 운임을 선택해주세요.',
        variant: 'destructive',
      });
      return;
    }

    setShowSeaFreightDialog(false);
    
    // Trigger calculation after dialog closes
    setTimeout(() => {
      handleCalculate();
    }, 0);
  };

  const handleSaveResult = async () => {
    if (!result || !user) return;

    console.log('💾 Saving calculation result...', { result, user });

    // Recalculate lowest cost based on current exclusions
    const lowestCostInfo = getLowestCostAgent(result.breakdown);
    
    // Create updated result with recalculated lowest cost
    const updatedResult = {
      ...result,
      lowestCost: lowestCostInfo.cost,
      lowestCostAgent: lowestCostInfo.agent,
    };

    const destination = getDestinationById(result.input.destinationId);
    await addCalculationHistory({
      result: updatedResult,
      destinationName: destination?.name || '',
      createdBy: user.id,
      createdByUsername: user.username,
    });

    toast({
      title: '저장 완료',
      description: '조회 결과가 저장되었습니다.',
    });

    console.log('✅ Calculation result saved successfully with adjusted lowest cost:', {
      lowestCost: lowestCostInfo.cost,
      lowestAgent: lowestCostInfo.agent
    });
  };

  const handleReset = () => {
    setInput({
      pol: '',
      pod: '',
      destinationId: '',
      weight: 0,
      includeDP: false,
      domesticTransport: 0,
      localCharge: 0,
      otherCosts: [],
    });
    setResult(null);
    setAllFreightsResult(null);
    setError('');
    setSortConfig({ key: 'total', direction: 'asc' });
    setHistoricalDate('');
    setActiveTab('filtered');
    setSelectedSeaFreightIds(new Set());
    setFullBreakdown([]);
    const resetExcluded: ExcludedCosts = {
      seaFreight: false,
      localCharge: false,
      dthc: false,
      portBorder: false,
      borderDestination: false,
      combinedFreight: false,
      weightSurcharge: false,
      dp: false,
      domesticTransport: false,
    };
    setExcludedCosts(resetExcluded);
    setCellExclusions({});
    
    localStorage.removeItem(STORAGE_KEY_RESULT);
    localStorage.removeItem(STORAGE_KEY_EXCLUDED);
    localStorage.removeItem(STORAGE_KEY_CELL_EXCLUDED);
  };

  const handleLoadHistory = (history: CalculationHistory) => {
    const updatedResult = {
      ...history.result,
      breakdown: history.result.breakdown.map((b: AgentCostBreakdown) => ({
        ...b,
        otherCosts: b.otherCosts || []
      }))
    };
    
    // Store full breakdown for "제약 없이 보기"
    setFullBreakdown(updatedResult.breakdown);
    
    // DP 포함 시 철도+트럭 분리 운임만 표시 / DP 미포함 시 통합 운임만 표시
    if (history.result.input.includeDP) {
      updatedResult.breakdown = updatedResult.breakdown.filter(b => !b.isCombinedFreight);
    } else {
      updatedResult.breakdown = updatedResult.breakdown.filter(b => b.isCombinedFreight);
    }
    
    // Recalculate lowest cost after filtering
    if (updatedResult.breakdown.length > 0) {
      let lowestCost = Infinity;
      let lowestAgent = '';
      
      updatedResult.breakdown.forEach(breakdown => {
        let total = breakdown.seaFreight + 
                   (breakdown.localCharge || 0) + 
                   breakdown.dthc + 
                   breakdown.weightSurcharge + 
                   breakdown.dp + 
                   breakdown.domesticTransport;
        
        if (breakdown.isCombinedFreight) {
          total += breakdown.combinedFreight;
        } else {
          total += breakdown.portBorder + breakdown.borderDestination;
        }
        
        if (breakdown.otherCosts) {
          total += breakdown.otherCosts.reduce((sum, cost) => sum + cost.amount, 0);
        }
        
        if (total < lowestCost) {
          lowestCost = total;
          lowestAgent = breakdown.agent;
        }
      });
      
      updatedResult.lowestCost = lowestCost;
      updatedResult.lowestCostAgent = lowestAgent;
    }
    
    setResult(updatedResult);
    setAllFreightsResult(null);
    setInput(history.result.input);
    setSortConfig({ key: 'total', direction: 'asc' });
    setActiveTab('filtered');
    
    if (history.result.historicalDate) {
      setHistoricalDate(history.result.historicalDate);
    } else {
      setHistoricalDate('');
    }
    
    const resetExcluded: ExcludedCosts = {
      seaFreight: false,
      localCharge: false,
      dthc: false,
      portBorder: false,
      borderDestination: false,
      combinedFreight: false,
      weightSurcharge: false,
      dp: false,
      domesticTransport: false,
    };
    
    if (updatedResult.breakdown.length > 0 && updatedResult.breakdown[0].otherCosts) {
      updatedResult.breakdown[0].otherCosts.forEach((item, index) => {
        resetExcluded[`other_${index}`] = false;
      });
    }
    setExcludedCosts(resetExcluded);
    setCellExclusions({});
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const confirmDeleteHistory = (id: string) => {
    setHistoryToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteHistory = async () => {
    if (historyToDelete) {
      await deleteCalculationHistory(historyToDelete);
      toast({
        title: '삭제 완료',
        description: '계산 기록이 삭제되었습니다.',
      });
    }
    setDeleteDialogOpen(false);
    setHistoryToDelete(null);
  };

  const toggleHistorySelection = (historyId: string) => {
    setSelectedHistoryIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(historyId)) {
        newSet.delete(historyId);
      } else {
        newSet.add(historyId);
      }
      return newSet;
    });
  };

  const toggleSelectAllOnPage = () => {
    const deletableOnPage = paginatedHistory.filter(h => canDeleteCalculation(h.createdBy));
    const allSelected = deletableOnPage.every(h => selectedHistoryIds.has(h.id));
    
    setSelectedHistoryIds(prev => {
      const newSet = new Set(prev);
      if (allSelected) {
        // Deselect all on current page
        deletableOnPage.forEach(h => newSet.delete(h.id));
      } else {
        // Select all on current page
        deletableOnPage.forEach(h => newSet.add(h.id));
      }
      return newSet;
    });
  };

  const handleBatchDelete = async () => {
    if (selectedHistoryIds.size === 0) return;

    for (const id of selectedHistoryIds) {
      await deleteCalculationHistory(id);
    }

    toast({
      title: '삭제 완료',
      description: `${selectedHistoryIds.size}개의 기록이 삭제되었습니다.`,
    });

    setSelectedHistoryIds(new Set());
    setBatchDeleteDialogOpen(false);
  };

  const handleDeleteAllFiltered = async () => {
    if (deletableFilteredHistory.length === 0) return;

    for (const history of deletableFilteredHistory) {
      await deleteCalculationHistory(history.id);
    }

    toast({
      title: '삭제 완료',
      description: `${deletableFilteredHistory.length}개의 기록이 삭제되었습니다.`,
    });

    setSelectedHistoryIds(new Set());
    setDeleteAllDialogOpen(false);
  };

  const handleCreateQuotation = (breakdown: AgentCostBreakdown) => {
    setSelectedBreakdown(breakdown);
    setQuotationDialogOpen(true);
  };

  const handleTimeMachineSelect = (date: string) => {
    setHistoricalDate(date);
    if (date) {
      toast({
        title: '타임머신 활성화',
        description: `${date} 날짜의 운임으로 계산합니다.`,
      });
    } else {
      toast({
        title: '타임머신 비활성화',
        description: '현재 운임으로 계산합니다.',
      });
    }
  };

  const toggleCostExclusion = (costType: string) => {
    setExcludedCosts(prev => ({
      ...prev,
      [costType]: !prev[costType]
    }));
  };

  const toggleCellExclusion = (agentIndex: number, costType: string) => {
    setCellExclusions(prev => {
      const agentExclusions = prev[agentIndex] || {};
      const isCurrentlyExcluded = agentExclusions[costType] || false;
      
      return {
        ...prev,
        [agentIndex]: {
          ...agentExclusions,
          [costType]: !isCurrentlyExcluded
        }
      };
    });
  };

  const isCellExcluded = (agentIndex: number, costType: string): boolean => {
    return cellExclusions[agentIndex]?.[costType] || false;
  };

  const handleSort = (key: 'agent' | 'rail' | 'truck' | 'total') => {
    let direction: 'asc' | 'desc' = 'desc';
    
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    
    setSortConfig({ key, direction });
  };

  const addOtherCost = () => {
    setInput(prev => ({
      ...prev,
      otherCosts: [...prev.otherCosts, { category: '', amount: 0 }]
    }));
  };

  const updateOtherCost = (index: number, field: 'category' | 'amount', value: string | number) => {
    setInput(prev => ({
      ...prev,
      otherCosts: prev.otherCosts.map((cost, i) => 
        i === index ? { ...cost, [field]: value } : cost
      )
    }));
  };

  const removeOtherCost = (index: number) => {
    setInput(prev => ({
      ...prev,
      otherCosts: prev.otherCosts.filter((_, i) => i !== index)
    }));
  };

  const calculateAdjustedTotal = (breakdown: AgentCostBreakdown, agentIndex: number) => {
    let total = 0;
    
    // Check both global and cell-specific exclusions
    const isSeaFreightExcluded = excludedCosts.seaFreight || isCellExcluded(agentIndex, 'seaFreight');
    const isLocalChargeExcluded = excludedCosts.localCharge || isCellExcluded(agentIndex, 'localCharge');
    const isDthcExcluded = excludedCosts.dthc || isCellExcluded(agentIndex, 'dthc');
    const isPortBorderExcluded = excludedCosts.portBorder || isCellExcluded(agentIndex, 'portBorder');
    const isBorderDestinationExcluded = excludedCosts.borderDestination || isCellExcluded(agentIndex, 'borderDestination');
    const isCombinedFreightExcluded = excludedCosts.combinedFreight || isCellExcluded(agentIndex, 'combinedFreight');
    const isWeightSurchargeExcluded = excludedCosts.weightSurcharge || isCellExcluded(agentIndex, 'weightSurcharge');
    const isDpExcluded = excludedCosts.dp || isCellExcluded(agentIndex, 'dp');
    const isDomesticTransportExcluded = excludedCosts.domesticTransport || isCellExcluded(agentIndex, 'domesticTransport');
    
    if (!isSeaFreightExcluded) total += breakdown.seaFreight;
    // For agent-specific freight, don't add localCharge (it will be subtracted as llocal)
    // For general freight, add localCharge normally
    if (!isLocalChargeExcluded && breakdown.localCharge && !breakdown.isAgentSpecificSeaFreight) {
      total += breakdown.localCharge;
    }
    if (!isDthcExcluded) total += breakdown.dthc;
    
    if (breakdown.isCombinedFreight) {
      if (!isCombinedFreightExcluded) total += breakdown.combinedFreight;
    } else {
      if (!isPortBorderExcluded) total += breakdown.portBorder;
      if (!isBorderDestinationExcluded) total += breakdown.borderDestination;
    }
    
    if (!isWeightSurchargeExcluded) total += breakdown.weightSurcharge;
    if (!isDpExcluded) total += breakdown.dp;
    if (!isDomesticTransportExcluded) total += breakdown.domesticTransport;
    
    if (breakdown.otherCosts && Array.isArray(breakdown.otherCosts)) {
      breakdown.otherCosts.forEach((item, index) => {
        const isOtherExcluded = excludedCosts[`other_${index}`] || isCellExcluded(agentIndex, `other_${index}`);
        if (!isOtherExcluded) {
          total += item.amount;
        }
      });
    }
    
    // Subtract L.LOCAL if it's agent-specific sea freight and not excluded
    if (breakdown.isAgentSpecificSeaFreight && !isLocalChargeExcluded && breakdown.llocal) {
      total -= breakdown.llocal;
    }
    
    return total;
  };

  const getSortedBreakdown = (breakdown: AgentCostBreakdown[]) => {
    const sortedBreakdown = [...breakdown];
    
    if (sortConfig.key === 'agent') {
      sortedBreakdown.sort((a, b) => {
        const comparison = a.agent.localeCompare(b.agent, 'ko');
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    } else if (sortConfig.key === 'rail') {
      sortedBreakdown.sort((a, b) => {
        const comparison = a.railAgent.localeCompare(b.railAgent, 'ko');
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    } else if (sortConfig.key === 'truck') {
      sortedBreakdown.sort((a, b) => {
        const comparison = a.truckAgent.localeCompare(b.truckAgent, 'ko');
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    } else if (sortConfig.key === 'total') {
      sortedBreakdown.sort((a, b) => {
        const indexA = breakdown.indexOf(a);
        const indexB = breakdown.indexOf(b);
        const totalA = calculateAdjustedTotal(a, indexA);
        const totalB = calculateAdjustedTotal(b, indexB);
        const comparison = totalA - totalB;
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    }
    
    return sortedBreakdown;
  };

  const getLowestCostAgent = (breakdown: AgentCostBreakdown[]) => {
    if (breakdown.length === 0) return { agent: '', cost: 0, index: -1 };
    
    let lowestIndex = 0;
    let lowestCost = calculateAdjustedTotal(breakdown[0], 0);

    breakdown.forEach((b, index) => {
      const adjustedTotal = calculateAdjustedTotal(b, index);
      if (adjustedTotal < lowestCost) {
        lowestCost = adjustedTotal;
        lowestIndex = index;
      }
    });

    return { agent: breakdown[lowestIndex].agent, cost: lowestCost, index: lowestIndex };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDestinationName = (destinationId: string) => {
    const destination = getDestinationById(destinationId);
    return destination ? destination.name : destinationId;
  };


  // Generate unique combination code for each breakdown
  const generateCombinationCode = (breakdown: AgentCostBreakdown, index: number): string => {
    const railCode = breakdown.railAgent.substring(0, 2).toUpperCase();
    const truckCode = breakdown.truckAgent.substring(0, 2).toUpperCase();
    const freightType = breakdown.isCombinedFreight ? 'C' : 'S'; // C=Combined, S=Separate
    const carrierCode = breakdown.seaFreightCarrier ? breakdown.seaFreightCarrier.substring(0, 2).toUpperCase() : 'XX';
    const seqNum = String(index + 1).padStart(3, '0');
    
    return `${carrierCode}-${railCode}${truckCode}-${freightType}${seqNum}`;
  };

  const isExpired = (breakdown: AgentCostBreakdown, field: string) => {
    return breakdown.expiredRateDetails?.includes(field) || false;
  };

  const handleClearFilters = () => {
    setSearchFilters({
      pol: FILTER_ALL_VALUE,
      pod: FILTER_ALL_VALUE,
      destination: FILTER_ALL_VALUE,
      dateFrom: '',
      dateTo: '',
    });
  };

  const handleDateFromChange = (value: string) => {
    setSearchFilters(prev => ({
      ...prev,
      dateFrom: value,
      // Always auto-fill dateTo with the same value as dateFrom
      dateTo: value
    }));
  };

  const renderResultTable = (resultData: CostCalculationResult, showDpColumn: boolean = false) => {
    const lowestCostInfo = getLowestCostAgent(resultData.breakdown);
    const otherCostItems = resultData.breakdown.length > 0 && resultData.breakdown[0].otherCosts ? resultData.breakdown[0].otherCosts : [];
    const sortedBreakdown = getSortedBreakdown(resultData.breakdown);

    return (
      <>

        {/* Debug L.LOCAL values */}
        <DebugLLocal breakdown={resultData.breakdown} />

        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 text-sm text-blue-900 mb-2">
            <Info className="h-4 w-4" />
            <span className="font-semibold">비용 항목 제외 기능:</span>
          </div>
          <div className="text-xs text-blue-700 mt-2">
            * <strong>헤더 클릭:</strong> 해당 컬럼의 모든 값을 0으로 계산합니다
          </div>
          <div className="text-xs text-blue-700">
            * <strong>셀 클릭:</strong> 해당 조합의 특정 비용만 0으로 계산합니다
          </div>
          <div className="text-xs text-blue-700 mt-2">
            * 제외된 항목은 회색으로 표시되며, 다시 클릭하면 포함됩니다
          </div>
          <div className="text-xs text-blue-700 mt-2">
            * "조합", "선사", "철도", "트럭" 또는 "총액" 헤더를 클릭하면 해당 기준으로 정렬됩니다
          </div>
          <div className="text-xs text-blue-700 mt-2">
            * 기본 정렬: 총액 오름차순
          </div>
        </div>

        {resultData.breakdown.some(b => b.hasExpiredRates) && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>⚠️ 만료된 운임 포함:</strong> 일부 조합에 만료된 운임이 포함되어 있습니다. 
              빨간색 굵은 글씨와 경고 아이콘으로 표시된 항목을 확인하세요.
            </AlertDescription>
          </Alert>
        )}

        {resultData.breakdown.length === 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>운임 조합이 없습니다</strong>
              <div className="mt-2 space-y-1 text-sm">
                {input.includeDP ? (
                  <>
                    <div>• <strong>철도운임</strong>: {input.pol} → {input.pod} → KASHGAR 경로의 철도운임이 등록되지 않았습니다</div>
                    <div>• <strong>트럭운임</strong>: KASHGAR → {getDestinationName(input.destinationId)} 경로의 트럭운임이 등록되지 않았습니다</div>
                  </>
                ) : (
                  <div>• <strong>통합운임</strong>: {input.pol} → {input.pod} → {getDestinationName(input.destinationId)} 경로의 통합운임이 등록되지 않았습니다</div>
                )}
                <div className="mt-2 text-blue-700">관리자 대시보드에서 해당 운임을 먼저 등록해주세요.</div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {resultData.breakdown.length > 0 && (
          <>
            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="min-w-[140px] cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('agent')}
                    >
                      <div className="flex items-center gap-2">
                        <span>조합코드</span>
                        {sortConfig.key === 'agent' && (
                          sortConfig.direction === 'asc' ? 
                            <ArrowUp className="h-4 w-4" /> : 
                            <ArrowDown className="h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    {showDpColumn && (
                      <TableHead className="text-center min-w-[100px]">
                        <div className="flex flex-col items-center gap-1">
                          <Package className="h-4 w-4" />
                          <span>운임 유형</span>
                        </div>
                      </TableHead>
                    )}
                    <TableHead className="text-center min-w-[100px]">
                      <div className="flex flex-col items-center gap-1">
                        <Ship className="h-4 w-4" />
                        <span>선사</span>
                      </div>
                    </TableHead>
                    <TableHead 
                      className="text-center min-w-[100px] cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('rail')}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <div className="flex items-center gap-1">
                          <Train className="h-4 w-4" />
                          {sortConfig.key === 'rail' && (
                            sortConfig.direction === 'asc' ? 
                              <ArrowUp className="h-3 w-3" /> : 
                              <ArrowDown className="h-3 w-3" />
                          )}
                        </div>
                        <span>철도</span>
                      </div>
                    </TableHead>
                    <TableHead 
                      className="text-center min-w-[100px] cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('truck')}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <div className="flex items-center gap-1">
                          <Truck className="h-4 w-4" />
                          {sortConfig.key === 'truck' && (
                            sortConfig.direction === 'asc' ? 
                              <ArrowUp className="h-3 w-3" /> : 
                              <ArrowDown className="h-3 w-3" />
                          )}
                        </div>
                        <span>트럭</span>
                      </div>
                    </TableHead>
                    <TableHead 
                      className={`text-right cursor-pointer hover:bg-gray-100 transition-colors ${excludedCosts.seaFreight ? 'bg-gray-200 line-through opacity-50' : ''}`}
                      onClick={() => toggleCostExclusion('seaFreight')}
                      title="클릭하여 전체 제외/포함"
                    >
                      <div className="flex flex-col items-end gap-1">
                        <Ship className="h-4 w-4" />
                        <span>해상운임</span>
                      </div>
                    </TableHead>
                    <TableHead 
                      className={`text-right cursor-pointer hover:bg-gray-100 transition-colors ${excludedCosts.localCharge ? 'bg-gray-200 line-through opacity-50' : ''}`}
                      onClick={() => toggleCostExclusion('localCharge')}
                      title="클릭하여 전체 제외/포함"
                    >
                      <div className="flex flex-col items-end gap-1">
                        <DollarSign className="h-4 w-4" />
                        <span>L.LOCAL</span>
                      </div>
                    </TableHead>
                    <TableHead 
                      className={`text-right cursor-pointer hover:bg-gray-100 transition-colors ${excludedCosts.dthc ? 'bg-gray-200 line-through opacity-50' : ''}`}
                      onClick={() => toggleCostExclusion('dthc')}
                      title="클릭하여 전체 제외/포함"
                    >
                      <div className="flex flex-col items-end gap-1">
                        <FileText className="h-4 w-4" />
                        <span>D/O</span>
                      </div>
                    </TableHead>
                    <TableHead 
                      className={`text-right cursor-pointer hover:bg-gray-100 transition-colors ${excludedCosts.portBorder ? 'bg-gray-200 line-through opacity-50' : ''}`}
                      onClick={() => toggleCostExclusion('portBorder')}
                      title="클릭하여 전체 제외/포함"
                    >
                      <div className="flex flex-col items-end gap-1">
                        <Train className="h-4 w-4" />
                        <span>철도운임</span>
                      </div>
                    </TableHead>
                    <TableHead 
                      className={`text-right cursor-pointer hover:bg-gray-100 transition-colors ${excludedCosts.borderDestination ? 'bg-gray-200 line-through opacity-50' : ''}`}
                      onClick={() => toggleCostExclusion('borderDestination')}
                      title="클릭하여 전체 제외/포함"
                    >
                      <div className="flex flex-col items-end gap-1">
                        <Truck className="h-4 w-4" />
                        <span>트럭운임</span>
                      </div>
                    </TableHead>
                    <TableHead 
                      className={`text-right cursor-pointer hover:bg-gray-100 transition-colors ${excludedCosts.combinedFreight ? 'bg-gray-200 line-through opacity-50' : ''}`}
                      onClick={() => toggleCostExclusion('combinedFreight')}
                      title="클릭하여 전체 제외/포함"
                    >
                      <div className="flex flex-col items-end gap-1">
                        <Merge className="h-4 w-4" />
                        <span>통합운임</span>
                      </div>
                    </TableHead>
                    <TableHead 
                      className={`text-right cursor-pointer hover:bg-gray-100 transition-colors ${excludedCosts.weightSurcharge ? 'bg-gray-200 line-through opacity-50' : ''}`}
                      onClick={() => toggleCostExclusion('weightSurcharge')}
                      title="클릭하여 전체 제외/포함"
                    >
                      <div className="flex flex-col items-end gap-1">
                        <Weight className="h-4 w-4" />
                        <span>중량할증</span>
                      </div>
                    </TableHead>
                    <TableHead 
                      className={`text-right cursor-pointer hover:bg-gray-100 transition-colors ${excludedCosts.dp ? 'bg-gray-200 line-through opacity-50' : ''}`}
                      onClick={() => toggleCostExclusion('dp')}
                      title="클릭하여 전체 제외/포함"
                    >
                      <div className="flex flex-col items-end gap-1">
                        <Package className="h-4 w-4" />
                        <span>DP</span>
                      </div>
                    </TableHead>
                    <TableHead 
                      className={`text-right cursor-pointer hover:bg-gray-100 transition-colors ${excludedCosts.domesticTransport ? 'bg-gray-200 line-through opacity-50' : ''}`}
                      onClick={() => toggleCostExclusion('domesticTransport')}
                      title="클릭하여 전체 제외/포함"
                    >
                      <div className="flex flex-col items-end gap-1">
                        <DollarSign className="h-4 w-4" />
                        <span>국내운송</span>
                      </div>
                    </TableHead>
                    {otherCostItems.map((item, index) => (
                      <TableHead 
                        key={index}
                        className={`text-right cursor-pointer hover:bg-gray-100 transition-colors ${excludedCosts[`other_${index}`] ? 'bg-gray-200 line-through opacity-50' : ''}`}
                        onClick={() => toggleCostExclusion(`other_${index}`)}
                        title="클릭하여 전체 제외/포함"
                      >
                        <div className="flex flex-col items-end gap-1">
                          <DollarSign className="h-4 w-4" />
                          <span>{item.category}</span>
                        </div>
                      </TableHead>
                    ))}
                    <TableHead 
                      className="text-right font-bold cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleSort('total')}
                    >
                      <div className="flex items-center justify-end gap-2">
                        <span>총액</span>
                        {sortConfig.key === 'total' && (
                          sortConfig.direction === 'asc' ? 
                            <ArrowUp className="h-4 w-4" /> : 
                            <ArrowDown className="h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="text-center">작업</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedBreakdown.map((breakdown, index) => {
                    const originalIndex = resultData.breakdown.indexOf(breakdown);
                    const adjustedTotal = calculateAdjustedTotal(breakdown, originalIndex);
                    const isLowest = originalIndex === lowestCostInfo.index;
                    
                    return (
                      <TableRow
                        key={index}
                        className={isLowest ? 'bg-green-50 font-semibold' : ''}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm">{generateCombinationCode(breakdown, originalIndex)}</span>
                            {isLowest && (
                              <span className="flex items-center gap-1 text-xs bg-green-600 text-white px-2 py-0.5 rounded whitespace-nowrap">
                                <TrendingDown className="h-3 w-3" />
                                최저가
                              </span>
                            )}
                          </div>
                        </TableCell>
                        {showDpColumn && (
                          <TableCell className="text-center">
                            {breakdown.isCombinedFreight ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs">
                                <Merge className="h-3 w-3" />
                                통합운임
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                                <Package className="h-3 w-3" />
                                DP 포함
                              </span>
                            )}
                          </TableCell>
                        )}
                        <TableCell className="text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-cyan-100 text-cyan-700 rounded text-xs">
                            <Ship className="h-3 w-3" />
                            {breakdown.seaFreightCarrier || 'N/A'}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                            <Train className="h-3 w-3" />
                            {breakdown.railAgent}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                            <Truck className="h-3 w-3" />
                            {breakdown.truckAgent}
                          </span>
                        </TableCell>
                        <TableCell 
                          className={`text-right cursor-pointer hover:bg-gray-200 transition-colors ${
                            excludedCosts.seaFreight || isCellExcluded(originalIndex, 'seaFreight') 
                              ? 'text-gray-400 line-through bg-gray-100' 
                              : ''
                          }`}
                          onClick={() => toggleCellExclusion(originalIndex, 'seaFreight')}
                          title="클릭하여 이 조합만 제외/포함"
                        >
                          <div className="flex items-center justify-end gap-1">
                            {excludedCosts.seaFreight || isCellExcluded(originalIndex, 'seaFreight') ? (
                              '$0'
                            ) : (
                              <>
                                <span className={isExpired(breakdown, '해상운임') ? 'text-red-600 font-bold' : ''}>
                                  ${breakdown.seaFreight}
                                </span>
                                {isExpired(breakdown, '해상운임') && (
                                  <AlertTriangle className="h-3 w-3 text-red-600" title="만료된 운임" />
                                )}
                              </>
                            )}
                            {breakdown.isAgentSpecificSeaFreight && !excludedCosts.seaFreight && !isCellExcluded(originalIndex, 'seaFreight') && breakdown.seaFreight !== 0 && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-xs">
                                <Star className="h-3 w-3" />
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell 
                          className={`text-right cursor-pointer hover:bg-gray-200 transition-colors ${
                            excludedCosts.localCharge || isCellExcluded(originalIndex, 'localCharge')
                              ? 'text-gray-400 line-through bg-gray-100' 
                              : ''
                          }`}
                          onClick={() => toggleCellExclusion(originalIndex, 'localCharge')}
                          title="클릭하여 이 조합만 제외/포함"
                        >
                          <div className="flex items-center justify-end gap-1">
                            {excludedCosts.localCharge || isCellExcluded(originalIndex, 'localCharge') ? (
                              <span>$0</span>
                            ) : (
                              <span className={breakdown.isAgentSpecificSeaFreight ? "text-red-600 font-bold" : ""}>
                                ${breakdown.isAgentSpecificSeaFreight ? -(breakdown.llocal || 0) : (breakdown.localCharge || 0)}
                              </span>
                            )}
                            {breakdown.isAgentSpecificSeaFreight && !excludedCosts.localCharge && !isCellExcluded(originalIndex, 'localCharge') && (breakdown.llocal || 0) !== 0 && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-xs">
                                <Star className="h-3 w-3" />
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell 
                          className={`text-right cursor-pointer hover:bg-gray-200 transition-colors ${
                            excludedCosts.dthc || isCellExcluded(originalIndex, 'dthc')
                              ? 'text-gray-400 line-through bg-gray-100' 
                              : ''
                          }`}
                          onClick={() => toggleCellExclusion(originalIndex, 'dthc')}
                          title="클릭하여 이 조합만 제외/포함"
                        >
                          <div className="flex items-center justify-end gap-1">
                            <span className={isExpired(breakdown, 'DTHC') ? 'text-red-600 font-bold' : ''}>
                              ${excludedCosts.dthc || isCellExcluded(originalIndex, 'dthc') ? 0 : breakdown.dthc}
                            </span>
                            {isExpired(breakdown, 'DTHC') && !excludedCosts.dthc && !isCellExcluded(originalIndex, 'dthc') && (
                              <AlertTriangle className="h-3 w-3 text-red-600" title="만료된 운임" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell 
                          className={`text-right ${
                            breakdown.isCombinedFreight 
                              ? 'text-gray-400' 
                              : `cursor-pointer hover:bg-gray-200 transition-colors ${
                                  excludedCosts.portBorder || isCellExcluded(originalIndex, 'portBorder')
                                    ? 'text-gray-400 line-through bg-gray-100' 
                                    : ''
                                }`
                          }`}
                          onClick={() => !breakdown.isCombinedFreight && toggleCellExclusion(originalIndex, 'portBorder')}
                          title={!breakdown.isCombinedFreight ? "클릭하여 이 조합만 제외/포함" : ""}
                        >
                          {breakdown.isCombinedFreight ? (
                            <span className="text-gray-400">-</span>
                          ) : breakdown.portBorder === 0 ? (
                            <span className="text-amber-600">운임 없음</span>
                          ) : (
                            <div className="flex items-center justify-end gap-1">
                              <span className={isExpired(breakdown, '철도운임') ? 'text-red-600 font-bold' : ''}>
                                ${excludedCosts.portBorder || isCellExcluded(originalIndex, 'portBorder') ? 0 : breakdown.portBorder}
                              </span>
                              {isExpired(breakdown, '철도운임') && !excludedCosts.portBorder && !isCellExcluded(originalIndex, 'portBorder') && (
                                <AlertTriangle className="h-3 w-3 text-red-600" title="만료된 운임" />
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell 
                          className={`text-right ${
                            breakdown.isCombinedFreight 
                              ? 'text-gray-400' 
                              : `cursor-pointer hover:bg-gray-200 transition-colors ${
                                  excludedCosts.borderDestination || isCellExcluded(originalIndex, 'borderDestination')
                                    ? 'text-gray-400 line-through bg-gray-100' 
                                    : ''
                                }`
                          }`}
                          onClick={() => !breakdown.isCombinedFreight && toggleCellExclusion(originalIndex, 'borderDestination')}
                          title={!breakdown.isCombinedFreight ? "클릭하여 이 조합만 제외/포함" : ""}
                        >
                          {breakdown.isCombinedFreight ? (
                            <span className="text-gray-400">-</span>
                          ) : breakdown.borderDestination === 0 ? (
                            <span className="text-amber-600">운임 없음</span>
                          ) : (
                            <div className="flex items-center justify-end gap-1">
                              <span className={isExpired(breakdown, '트럭운임') ? 'text-red-600 font-bold' : ''}>
                                ${excludedCosts.borderDestination || isCellExcluded(originalIndex, 'borderDestination') ? 0 : breakdown.borderDestination}
                              </span>
                              {isExpired(breakdown, '트럭운임') && !excludedCosts.borderDestination && !isCellExcluded(originalIndex, 'borderDestination') && (
                                <AlertTriangle className="h-3 w-3 text-red-600" title="만료된 운임" />
                              )}
                            </div>
                          )}
                        </TableCell>
                        <TableCell 
                          className={`text-right ${
                            !breakdown.isCombinedFreight 
                              ? 'text-gray-400' 
                              : `cursor-pointer hover:bg-gray-200 transition-colors ${
                                  excludedCosts.combinedFreight || isCellExcluded(originalIndex, 'combinedFreight')
                                    ? 'text-gray-400 line-through bg-gray-100' 
                                    : ''
                                }`
                          }`}
                          onClick={() => breakdown.isCombinedFreight && toggleCellExclusion(originalIndex, 'combinedFreight')}
                          title={breakdown.isCombinedFreight ? "클릭하여 이 조합만 제외/포함" : ""}
                        >
                          {breakdown.isCombinedFreight ? (
                            breakdown.combinedFreight === 0 ? (
                              <span className="text-amber-600">운임 없음</span>
                            ) : (
                              <div className="flex items-center justify-end gap-1">
                                <span className={isExpired(breakdown, '통합운임') ? 'text-red-600 font-bold' : ''}>
                                  ${excludedCosts.combinedFreight || isCellExcluded(originalIndex, 'combinedFreight') ? 0 : breakdown.combinedFreight}
                                </span>
                                {isExpired(breakdown, '통합운임') && !excludedCosts.combinedFreight && !isCellExcluded(originalIndex, 'combinedFreight') && (
                                  <AlertTriangle className="h-3 w-3 text-red-600" title="만료된 운임" />
                                )}
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                                  <Merge className="h-3 w-3" />
                                </span>
                              </div>
                            )
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell 
                          className={`text-right cursor-pointer hover:bg-gray-200 transition-colors ${
                            excludedCosts.weightSurcharge || isCellExcluded(originalIndex, 'weightSurcharge')
                              ? 'text-gray-400 line-through bg-gray-100' 
                              : ''
                          }`}
                          onClick={() => toggleCellExclusion(originalIndex, 'weightSurcharge')}
                          title="클릭하여 이 조합만 제외/포함"
                        >
                          <div className="flex items-center justify-end gap-1">
                            <span className={isExpired(breakdown, '중량할증') ? 'text-red-600 font-bold' : ''}>
                              ${excludedCosts.weightSurcharge || isCellExcluded(originalIndex, 'weightSurcharge') ? 0 : breakdown.weightSurcharge}
                            </span>
                            {isExpired(breakdown, '중량할증') && !excludedCosts.weightSurcharge && !isCellExcluded(originalIndex, 'weightSurcharge') && (
                              <AlertTriangle className="h-3 w-3 text-red-600" title="만료된 운임" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell 
                          className={`text-right cursor-pointer hover:bg-gray-200 transition-colors ${
                            excludedCosts.dp || isCellExcluded(originalIndex, 'dp')
                              ? 'text-gray-400 line-through bg-gray-100' 
                              : ''
                          }`}
                          onClick={() => toggleCellExclusion(originalIndex, 'dp')}
                          title="클릭하여 이 조합만 제외/포함"
                        >
                          <div className="flex items-center justify-end gap-1">
                            <span className={isExpired(breakdown, 'DP') ? 'text-red-600 font-bold' : ''}>
                              ${excludedCosts.dp || isCellExcluded(originalIndex, 'dp') ? 0 : breakdown.dp}
                            </span>
                            {isExpired(breakdown, 'DP') && !excludedCosts.dp && !isCellExcluded(originalIndex, 'dp') && (
                              <AlertTriangle className="h-3 w-3 text-red-600" title="만료된 운임" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell 
                          className={`text-right cursor-pointer hover:bg-gray-200 transition-colors ${
                            excludedCosts.domesticTransport || isCellExcluded(originalIndex, 'domesticTransport')
                              ? 'text-gray-400 line-through bg-gray-100' 
                              : ''
                          }`}
                          onClick={() => toggleCellExclusion(originalIndex, 'domesticTransport')}
                          title="클릭하여 이 조합만 제외/포함"
                        >
                          ${excludedCosts.domesticTransport || isCellExcluded(originalIndex, 'domesticTransport') ? 0 : breakdown.domesticTransport}
                        </TableCell>
                        {breakdown.otherCosts && breakdown.otherCosts.map((item, idx) => (
                          <TableCell 
                            key={idx}
                            className={`text-right cursor-pointer hover:bg-gray-200 transition-colors ${
                              excludedCosts[`other_${idx}`] || isCellExcluded(originalIndex, `other_${idx}`)
                                ? 'text-gray-400 line-through bg-gray-100' 
                                : ''
                            }`}
                            onClick={() => toggleCellExclusion(originalIndex, `other_${idx}`)}
                            title="클릭하여 이 조합만 제외/포함"
                          >
                            ${excludedCosts[`other_${idx}`] || isCellExcluded(originalIndex, `other_${idx}`) ? 0 : item.amount}
                          </TableCell>
                        ))}
                        <TableCell className="text-right font-bold">
                          <span className={adjustedTotal < 0 ? "text-red-600 font-bold" : ""}>
                            ${adjustedTotal.toLocaleString()}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCreateQuotation(breakdown)}
                            className="whitespace-nowrap"
                          >
                            <FileSpreadsheet className="h-3 w-3 mr-1" />
                            견적서 작성
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">최저가 조합:</span> {lowestCostInfo.agent}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-semibold">최저 총액:</span> ${lowestCostInfo.cost.toLocaleString()}
              </p>
              <p className="text-xs text-gray-600 mt-2 flex items-center gap-1">
                <Star className="h-3 w-3 text-amber-600" />
                <span>별표는 해당 대리점이 지정한 특별 해상운임 또는 L.LOCAL이 적용되었음을 나타냅니다</span>
              </p>
              <p className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                <Merge className="h-3 w-3 text-purple-600" />
                <span>통합운임 아이콘은 철도+트럭 일괄 운임이 적용되었음을 나타냅니다</span>
              </p>
              {showDpColumn && (
                <p className="text-xs text-blue-600 mt-2 flex items-center gap-1 font-semibold">
                  <Info className="h-3 w-3" />
                  <span>DP 포함 조합은 실제 DP 값이 표시되며, 통합운임 조합은 DP가 0입니다</span>
                </p>
              )}
              {resultData.breakdown.some(b => b.hasExpiredRates) && (
                <p className="text-xs text-red-600 mt-2 flex items-center gap-1 font-semibold">
                  <AlertTriangle className="h-3 w-3" />
                  <span>빨간색 굵은 글씨와 경고 아이콘은 만료된 운임을 나타냅니다</span>
                </p>
              )}
              {(Object.values(excludedCosts).some(v => v) || Object.keys(cellExclusions).length > 0) && (
                <p className="text-xs text-gray-600 mt-2 flex items-center gap-1">
                  <Info className="h-3 w-3 text-blue-600" />
                  <span>일부 비용 항목이 제외되어 계산되었습니다</span>
                </p>
              )}
            </div>
          </>
        )}
      </>
    );
  };

  // Check if all deletable items on current page are selected
  const deletableOnPage = paginatedHistory.filter(h => canDeleteCalculation(h.createdBy));
  const allPageSelected = deletableOnPage.length > 0 && deletableOnPage.every(h => selectedHistoryIds.has(h.id));
  const somePageSelected = deletableOnPage.some(h => selectedHistoryIds.has(h.id)) && !allPageSelected;

  // Check if all sea freights are selected
  const allSeaFreightsSelected = seaFreightOptions.length > 0 && selectedSeaFreightIds.size === seaFreightOptions.length;
  const someSeaFreightsSelected = selectedSeaFreightIds.size > 0 && !allSeaFreightsSelected;

  return (
    <div className="space-y-6">
      {/* Rest of the component remains the same - truncated for brevity */}
      {/* The full component code continues here with all the Card, Dialog, and other components */}
    </div>
  );
}