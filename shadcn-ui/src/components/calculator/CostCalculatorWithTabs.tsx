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
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' });
  const [seaFreightOptions, setSeaFreightOptions] = useState<SeaFreight[]>([]);
  const [showSeaFreightDialog, setShowSeaFreightDialog] = useState(false);
  const [selectedSeaFreightIds, setSelectedSeaFreightIds] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [historyToDelete, setHistoryToDelete] = useState<string | null>(null);
  const [quotationDialogOpen, setQuotationDialogOpen] = useState(false);
  const [selectedBreakdown, setSelectedBreakdown] = useState<AgentCostBreakdown | null>(null);
  const [timeMachineOpen, setTimeMachineOpen] = useState(false);
  const [historicalDate, setHistoricalDate] = useState<string>('');

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
      setSortConfig({ key: null, direction: 'asc' });
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
      setError('해상 운임을 선택해주세요.');
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
        // DP 포함 시 철도+트럭 분리 운임만 / DP 미포함 시 통합 운임만
        const filteredBreakdown = input.includeDP
          ? calculationResult.breakdown.filter(b => !b.isCombinedFreight)
          : calculationResult.breakdown.filter(b => b.isCombinedFreight);
        
        allBreakdowns.push(...filteredBreakdown);
      }
    });

    if (allBreakdowns.length === 0) {
      setError('선택한 경로에 대한 운임 정보를 찾을 수 없습니다.');
      return;
    }

    // CRITICAL FIX: Deduplicate breakdowns to remove identical combinations
    const uniqueBreakdowns = deduplicateBreakdowns(allBreakdowns);

    // Recalculate lowest cost
    let lowestCost = Infinity;
    let lowestAgent = '';
    
    uniqueBreakdowns.forEach(breakdown => {
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
      breakdown: uniqueBreakdowns,
      lowestCost,
      lowestCostAgent: lowestAgent,
      isHistorical: !!historicalDate,
      historicalDate: historicalDate || undefined,
    };

    setResult(combinedResult);
    setAllFreightsResult(null);
    setActiveTab('filtered');
    setSortConfig({ key: null, direction: 'asc' });
    
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
    
    if (uniqueBreakdowns.length > 0 && uniqueBreakdowns[0].otherCosts) {
      uniqueBreakdowns[0].otherCosts.forEach((item, index) => {
        resetExcluded[`other_${index}`] = false;
      });
    }
    setExcludedCosts(resetExcluded);
    setCellExclusions({});

    toast({
      title: '계산 완료',
      description: `${selectedSeaFreightIds.size}개의 선사 운임으로 ${uniqueBreakdowns.length}개의 고유 조합이 계산되었습니다.`,
    });
  };

  const handleViewAllFreights = () => {
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
      setError('해상 운임을 선택해주세요.');
      return;
    }

    // Collect all breakdowns from all selected sea freights (without DP filtering)
    const allBreakdowns: AgentCostBreakdown[] = [];
    
    seaFreightIdsToCalculate.forEach(seaFreightId => {
      const calculationInput = {
        ...input,
        selectedSeaFreightId: seaFreightId,
        historicalDate: historicalDate || undefined,
      };

      const calculationResult = calculateCost(calculationInput);
      
      if (calculationResult) {
        // 제약 없이 모든 운임 표시
        allBreakdowns.push(...calculationResult.breakdown);
      }
    });

    if (allBreakdowns.length === 0) {
      setError('선택한 경로에 대한 운임 정보를 찾을 수 없습니다.');
      return;
    }

    // CRITICAL FIX: Deduplicate breakdowns to remove identical combinations
    const uniqueBreakdowns = deduplicateBreakdowns(allBreakdowns);

    // Recalculate lowest cost
    let lowestCost = Infinity;
    let lowestAgent = '';
    
    uniqueBreakdowns.forEach(breakdown => {
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
      breakdown: uniqueBreakdowns,
      lowestCost,
      lowestCostAgent: lowestAgent,
      isHistorical: !!historicalDate,
      historicalDate: historicalDate || undefined,
    };

    setAllFreightsResult(combinedResult);
    setActiveTab('all');
    setSortConfig({ key: null, direction: 'asc' });
    
    toast({
      title: '✨ 제약 없이 보기',
      description: `${selectedSeaFreightIds.size}개의 선사 운임으로 총 ${uniqueBreakdowns.length}개의 고유 운임 조합이 표시됩니다.`,
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

    const destination = getDestinationById(result.input.destinationId);
    await addCalculationHistory({
      result,
      destinationName: destination?.name || '',
      createdBy: user.id,
      createdByUsername: user.username,
    });

    toast({
      title: '저장 완료',
      description: '조회 결과가 저장되었습니다.',
    });

    console.log('✅ Calculation result saved successfully');
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
    setSortConfig({ key: null, direction: 'asc' });
    setHistoricalDate('');
    setActiveTab('filtered');
    setSelectedSeaFreightIds(new Set());
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
    setSortConfig({ key: null, direction: 'asc' });
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
    if (!isLocalChargeExcluded && breakdown.localCharge) total += breakdown.localCharge;
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

  const renderResultTable = (resultData: CostCalculationResult) => {
    const lowestCostInfo = getLowestCostAgent(resultData.breakdown);
    const otherCostItems = resultData.breakdown.length > 0 && resultData.breakdown[0].otherCosts ? resultData.breakdown[0].otherCosts : [];
    const sortedBreakdown = getSortedBreakdown(resultData.breakdown);

    return (
      <>
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
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              이 경로에는 운임 조합이 없습니다.
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
                        <span>조합</span>
                        {sortConfig.key === 'agent' && (
                          sortConfig.direction === 'asc' ? 
                            <ArrowUp className="h-4 w-4" /> : 
                            <ArrowDown className="h-4 w-4" />
                        )}
                      </div>
                    </TableHead>
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
                            {breakdown.agent}
                            {isLowest && (
                              <span className="flex items-center gap-1 text-xs bg-green-600 text-white px-2 py-0.5 rounded whitespace-nowrap">
                                <TrendingDown className="h-3 w-3" />
                                최저가
                              </span>
                            )}
                          </div>
                        </TableCell>
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
                            ) : breakdown.seaFreight === 0 ? (
                              <span className="text-amber-600">N/A</span>
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
                            {breakdown.isAgentSpecificSeaFreight && !excludedCosts.seaFreight && !isCellExcluded(originalIndex, 'seaFreight') && breakdown.seaFreight > 0 && (
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
                          ${excludedCosts.localCharge || isCellExcluded(originalIndex, 'localCharge') ? 0 : (breakdown.localCharge || 0)}
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
                          ${adjustedTotal.toLocaleString()}
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
                <span>별표는 해당 대리점이 지정한 특별 해상운임이 적용되었음을 나타냅니다</span>
              </p>
              <p className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                <Merge className="h-3 w-3 text-purple-600" />
                <span>통합운임 아이콘은 철도+트럭 일괄 운임이 적용되었음을 나타냅니다</span>
              </p>
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
      <div>
        <h2 className="text-2xl font-bold mb-2">원가 계산기</h2>
        <p className="text-gray-600">경로와 추가 비용을 입력하여 대리점별 총 운임을 계산하세요.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            경로 및 비용 입력
          </CardTitle>
          <CardDescription>운송 경로를 입력하세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="font-semibold text-purple-900">타임머신</p>
                  <p className="text-xs text-purple-700">
                    {historicalDate 
                      ? `${historicalDate} 날짜의 운임으로 계산 중` 
                      : '과거 날짜의 운임으로 계산할 수 있습니다'}
                  </p>
                </div>
              </div>
              <Button
                variant={historicalDate ? "default" : "outline"}
                onClick={() => setTimeMachineOpen(true)}
                className={historicalDate ? "bg-purple-600 hover:bg-purple-700" : ""}
              >
                <Clock className="h-4 w-4 mr-2" />
                {historicalDate ? '날짜 변경' : '날짜 선택'}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>출발항 (POL)</Label>
              {polPorts.length > 0 ? (
                <Select value={input.pol} onValueChange={(value) => setInput({ ...input, pol: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="출발항 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {polPorts.map((port) => (
                      <SelectItem key={port.id} value={port.name}>
                        {port.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded border">
                  출발항(POL)을 먼저 등록해주세요. (운송사 탭 → 포트 관리)
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>중국항 (POD)</Label>
              {podPorts.length > 0 ? (
                <Select value={input.pod} onValueChange={(value) => setInput({ ...input, pod: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="중국항 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {podPorts.map((port) => (
                      <SelectItem key={port.id} value={port.name}>
                        {port.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded border">
                  도착항(POD)을 먼저 등록해주세요. (운송사 탭 → 포트 관리)
                </div>
              )}
              {seaFreightOptions.length > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-xs text-amber-600">
                    ⚠️ 이 항로에 {seaFreightOptions.length}개의 해상운임 옵션이 있습니다
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowSeaFreightDialog(true)}
                    className="h-7 text-xs"
                  >
                    <Ship className="h-3 w-3 mr-1" />
                    선택 ({selectedSeaFreightIds.size}/{seaFreightOptions.length})
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>최종목적지</Label>
              <Select value={input.destinationId} onValueChange={(value) => setInput({ ...input, destinationId: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="최종목적지 선택" />
                </SelectTrigger>
                <SelectContent>
                  {destinations.map((dest) => (
                    <SelectItem key={dest.id} value={dest.id}>
                      {dest.name} {dest.description && `(${dest.description})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Weight className="h-4 w-4" />
                중량 (kg) *
              </Label>
              <Input
                type="number"
                placeholder="0"
                value={input.weight || ''}
                onChange={(e) => setInput({ ...input, weight: Number(e.target.value) })}
              />
              <p className="text-xs text-gray-500">중량할증이 자동 계산됩니다</p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                DP (Disposal Container)
              </Label>
              <div className="flex items-center space-x-2 h-10 px-3 border rounded-md bg-white">
                <Checkbox
                  id="includeDP"
                  checked={input.includeDP}
                  onCheckedChange={(checked) => setInput({ ...input, includeDP: checked as boolean })}
                  disabled={!input.pol}
                />
                <label
                  htmlFor="includeDP"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                >
                  DP 포함 {dpCost > 0 && `($${dpCost})`}
                </label>
              </div>
              <p className="text-xs text-gray-500">
                {input.pol ? `${input.pol} DP: $${dpCost}` : '출발항을 먼저 선택하세요'}
              </p>
              <p className="text-xs text-blue-600 font-medium">
                ※ DP 포함 시 철도+트럭 분리 운임만 표시 / DP 미포함 시 통합 운임만 표시
              </p>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                국내운송료 (USD)
              </Label>
              <Input
                type="number"
                placeholder="0"
                value={input.domesticTransport || ''}
                onChange={(e) => setInput({ ...input, domesticTransport: Number(e.target.value) })}
              />
              <p className="text-xs text-gray-500">
                국내 운송비용을 입력하세요
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                기타비용
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addOtherCost}
                className="h-8"
              >
                <Plus className="h-4 w-4 mr-1" />
                항목 추가
              </Button>
            </div>
            {input.otherCosts.length > 0 && (
              <div className="space-y-2 p-4 border rounded-md bg-gray-50">
                {input.otherCosts.map((cost, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="비용 항목 (예: 통관비용)"
                      value={cost.category}
                      onChange={(e) => updateOtherCost(index, 'category', e.target.value)}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      placeholder="금액 (USD)"
                      value={cost.amount || ''}
                      onChange={(e) => updateOtherCost(index, 'amount', Number(e.target.value))}
                      className="w-32"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeOtherCost(index)}
                      className="h-10 w-10 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-500">
              통관비용, 보험료 등 추가 비용을 입력하세요
            </p>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>자동 계산 항목:</strong>
              <ul className="mt-2 space-y-1 text-sm">
                <li>• <strong>D/O(DTHC):</strong> 대리점별로 설정된 금액이 자동 적용됩니다</li>
                <li>• <strong>통합 운임:</strong> 설정된 경우 철도+트럭 분리 운임 대신 통합 운임이 적용됩니다</li>
                <li>• <strong>중량할증:</strong> 입력한 중량에 따라 자동 계산됩니다</li>
                <li>• <strong>해상운임:</strong> 같은 항로에 여러 운임이 있는 경우 복수 선택할 수 있습니다</li>
                <li>• <strong>DP:</strong> 관리자 대시보드에서 설정한 부산/인천 DP 금액이 자동 적용됩니다</li>
              </ul>
            </AlertDescription>
          </Alert>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button onClick={handleCalculate} className="flex-1">
              <Calculator className="h-4 w-4 mr-2" />
              계산하기
            </Button>
            <Button 
              onClick={handleViewAllFreights} 
              variant="outline"
              className="flex items-center gap-2 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 border-purple-300"
            >
              <Sparkles className="h-4 w-4 text-purple-600" />
              제약 없이 보기
            </Button>
            <Button variant="outline" onClick={handleReset}>
              초기화
            </Button>
          </div>
        </CardContent>
      </Card>

      {(result || allFreightsResult) && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  조회 결과
                  {(result?.isHistorical || allFreightsResult?.isHistorical) && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded text-sm font-normal">
                      <Clock className="h-3 w-3" />
                      과거 운임
                    </span>
                  )}
                </CardTitle>
                <CardDescription>
                  경로: {input.pol} → {input.pod} → {getDestinationName(input.destinationId)} | 중량: {input.weight.toLocaleString()}kg
                  {input.includeDP && ` | DP 포함 ($${dpCost})`}
                  {input.domesticTransport > 0 && ` | 국내운송 $${input.domesticTransport}`}
                  {(result?.isHistorical || allFreightsResult?.isHistorical) && (result?.historicalDate || allFreightsResult?.historicalDate) && (
                    <span className="block mt-1 text-purple-600">
                      📅 {result?.historicalDate || allFreightsResult?.historicalDate} 날짜의 운임으로 계산됨
                    </span>
                  )}
                </CardDescription>
              </div>
              <Button onClick={handleSaveResult} variant="outline" className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                결과 저장
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'filtered' | 'all')}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="filtered" disabled={!result}>
                  필터링된 결과 {result && `(${result.breakdown.length}개)`}
                </TabsTrigger>
                <TabsTrigger value="all" disabled={!allFreightsResult}>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    모든 운임 {allFreightsResult && `(${allFreightsResult.breakdown.length}개)`}
                  </div>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="filtered" className="space-y-4 mt-4">
                {result && (
                  <>
                    <Alert className="bg-blue-50 border-blue-200">
                      <Info className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-blue-900">
                        {input.includeDP 
                          ? '✅ DP 포함: 철도+트럭 분리 운임만 표시됩니다'
                          : '✅ DP 미포함: 통합 운임만 표시됩니다'
                        }
                      </AlertDescription>
                    </Alert>
                    {renderResultTable(result)}
                  </>
                )}
              </TabsContent>
              
              <TabsContent value="all" className="space-y-4 mt-4">
                {allFreightsResult && (
                  <>
                    <Alert className="bg-purple-50 border-purple-200">
                      <Sparkles className="h-4 w-4 text-purple-600" />
                      <AlertDescription className="text-purple-900">
                        <strong>✨ 제약 없이 보기:</strong> DP 필터를 무시하고 모든 운임 조합(통합 운임 + 분리 운임)을 표시합니다.
                      </AlertDescription>
                    </Alert>
                    {renderResultTable(allFreightsResult)}
                  </>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {calculationHistory && calculationHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              저장된 조회 결과 기록 ({filteredHistory.length}개)
            </CardTitle>
            <CardDescription>
              기록을 클릭하면 입력 폼과 조회 결과가 자동으로 채워집니다
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg border">
              <div className="flex items-center gap-2 mb-3">
                <Search className="h-4 w-4 text-gray-600" />
                <span className="font-semibold text-sm">검색 필터</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">출발항 (POL)</Label>
                  <Select value={searchFilters.pol} onValueChange={(value) => setSearchFilters(prev => ({ ...prev, pol: value }))}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="전체" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={FILTER_ALL_VALUE}>전체</SelectItem>
                      {filterOptions.pols.map((pol) => (
                        <SelectItem key={pol} value={pol}>
                          {pol}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">중국항 (POD)</Label>
                  <Select value={searchFilters.pod} onValueChange={(value) => setSearchFilters(prev => ({ ...prev, pod: value }))}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="전체" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={FILTER_ALL_VALUE}>전체</SelectItem>
                      {filterOptions.pods.map((pod) => (
                        <SelectItem key={pod} value={pod}>
                          {pod}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">최종목적지</Label>
                  <Select value={searchFilters.destination} onValueChange={(value) => setSearchFilters(prev => ({ ...prev, destination: value }))}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="전체" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={FILTER_ALL_VALUE}>전체</SelectItem>
                      {filterOptions.destinations.map((dest) => (
                        <SelectItem key={dest} value={dest}>
                          {dest}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">시작 날짜</Label>
                  <Input
                    type="date"
                    value={searchFilters.dateFrom}
                    onChange={(e) => handleDateFromChange(e.target.value)}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">종료 날짜</Label>
                  <Input
                    type="date"
                    value={searchFilters.dateTo}
                    onChange={(e) => setSearchFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                    className="h-9"
                  />
                </div>
              </div>
              <div className="mt-3 flex justify-between items-center">
                <div className="flex gap-2">
                  {selectedHistoryIds.size > 0 && (
                    <>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setBatchDeleteDialogOpen(true)}
                        className="h-8"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        선택 삭제 ({selectedHistoryIds.size}개)
                      </Button>
                    </>
                  )}
                  {deletableFilteredHistory.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteAllDialogOpen(true)}
                      className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      필터된 기록 전체 삭제 ({deletableFilteredHistory.length}개)
                    </Button>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleClearFilters}
                  className="h-8"
                >
                  <X className="h-3 w-3 mr-1" />
                  필터 초기화
                </Button>
              </div>
            </div>

            {filteredHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>검색 결과가 없습니다</p>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {deletableOnPage.length > 0 && (
                    <div className="flex items-center gap-2 p-2 bg-gray-100 rounded">
                      <Checkbox
                        checked={allPageSelected}
                        onCheckedChange={toggleSelectAllOnPage}
                        className={somePageSelected ? 'data-[state=checked]:bg-gray-400' : ''}
                      />
                      <span className="text-sm text-gray-700">
                        현재 페이지 전체 선택 ({deletableOnPage.length}개)
                      </span>
                    </div>
                  )}
                  
                  {paginatedHistory.map((history) => {
                    const canDelete = canDeleteCalculation(history.createdBy);
                    const isSelected = selectedHistoryIds.has(history.id);
                    
                    return (
                      <div
                        key={history.id}
                        className={`flex items-center gap-3 p-4 border rounded-lg transition-colors ${
                          isSelected ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'
                        }`}
                      >
                        {canDelete && (
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleHistorySelection(history.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        )}
                        <div 
                          className="flex-1 cursor-pointer"
                          onClick={() => handleLoadHistory(history)}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold">
                              {history.result.input.pol} → {history.result.input.pod} → {history.destinationName}
                            </span>
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                              {history.result.input.weight.toLocaleString()}kg
                            </span>
                            {history.result.isHistorical && (
                              <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                과거 운임
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDate(history.createdAt)}
                            </span>
                            <span className="flex items-center gap-1">
                              <TrendingDown className="h-3 w-3" />
                              최저가: ${history.result.lowestCost.toLocaleString()} ({history.result.lowestCostAgent})
                            </span>
                            <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                              작성자: {history.createdByUsername}
                            </span>
                          </div>
                        </div>
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              confirmDeleteHistory(history.id);
                            }}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="text-sm text-gray-600">
                      {filteredHistory.length}개 중 {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredHistory.length)}개 표시
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        이전
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <Button
                            key={page}
                            variant={currentPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className="w-8 h-8 p-0"
                          >
                            {page}
                          </Button>
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                      >
                        다음
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={showSeaFreightDialog} onOpenChange={setShowSeaFreightDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>해상운임 선택</DialogTitle>
            <DialogDescription>
              {input.pol} → {input.pod} 항로에 {seaFreightOptions.length}개의 해상운임 옵션이 있습니다. 
              원하는 운임을 선택하세요. (복수 선택 가능)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded border border-blue-200">
              <Checkbox
                checked={allSeaFreightsSelected}
                onCheckedChange={toggleSelectAllSeaFreights}
                className={someSeaFreightsSelected ? 'data-[state=checked]:bg-gray-400' : ''}
              />
              <span className="text-sm font-semibold text-blue-900">
                전체 선택 ({selectedSeaFreightIds.size}/{seaFreightOptions.length})
              </span>
            </div>
            
            {seaFreightOptions.map((freight) => {
              const isSelected = selectedSeaFreightIds.has(freight.id);
              
              return (
                <div
                  key={freight.id}
                  className={`flex items-center gap-3 p-4 border rounded-lg transition-colors cursor-pointer ${
                    isSelected ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'
                  }`}
                  onClick={() => toggleSeaFreightSelection(freight.id)}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleSeaFreightSelection(freight.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex flex-col gap-1 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-lg">${freight.rate}</span>
                      {freight.carrier && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded flex items-center gap-1">
                          <Ship className="h-3 w-3" />
                          {freight.carrier}
                        </span>
                      )}
                    </div>
                    {freight.localCharge && freight.localCharge > 0 && (
                      <span className="text-xs text-gray-600">
                        L.LOCAL: ${freight.localCharge}
                      </span>
                    )}
                    {freight.note && (
                      <span className="text-xs text-gray-600">{freight.note}</span>
                    )}
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>유효기간: {freight.validFrom} ~ {freight.validTo}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowSeaFreightDialog(false)}
            >
              취소
            </Button>
            <Button
              onClick={handleSeaFreightDialogConfirm}
              disabled={selectedSeaFreightIds.size === 0}
            >
              <Calculator className="h-4 w-4 mr-2" />
              선택 완료 ({selectedSeaFreightIds.size}개)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>계산 기록 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 이 계산 기록을 삭제하시겠습니까?
              이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>
              취소
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteHistory} className="bg-red-600 hover:bg-red-700">
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={batchDeleteDialogOpen} onOpenChange={setBatchDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>선택 기록 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              선택한 {selectedHistoryIds.size}개의 계산 기록을 삭제하시겠습니까?
              이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setBatchDeleteDialogOpen(false)}>
              취소
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleBatchDelete} className="bg-red-600 hover:bg-red-700">
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteAllDialogOpen} onOpenChange={setDeleteAllDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>필터된 기록 전체 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              현재 필터 조건에 해당하는 {deletableFilteredHistory.length}개의 계산 기록을 모두 삭제하시겠습니까?
              이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteAllDialogOpen(false)}>
              취소
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAllFiltered} className="bg-red-600 hover:bg-red-700">
              전체 삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {selectedBreakdown && result && (
        <QuotationDialog
          open={quotationDialogOpen}
          onOpenChange={setQuotationDialogOpen}
          breakdown={selectedBreakdown}
          input={result.input}
          destinationName={getDestinationName(result.input.destinationId)}
          excludedCosts={excludedCosts}
        />
      )}

      <TimeMachineDialog
        open={timeMachineOpen}
        onOpenChange={setTimeMachineOpen}
        onSelectDate={handleTimeMachineSelect}
        currentDate={historicalDate}
      />
    </div>
  );
}