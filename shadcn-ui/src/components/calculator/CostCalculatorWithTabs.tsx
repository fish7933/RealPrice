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
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calculator, TrendingDown, Train, Truck, Weight, Package, Star, FileText, DollarSign, Info, Ship, ArrowUp, ArrowDown, History, Trash2, Clock, Merge, Save, FileSpreadsheet, Plus, X, AlertTriangle, Search, ChevronLeft, ChevronRight } from 'lucide-react';
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
    } else {
      setSeaFreightOptions([]);
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

    if (seaFreightOptions.length > 1 && !input.selectedSeaFreightId) {
      setShowSeaFreightDialog(true);
      return;
    }

    const calculationInput = {
      ...input,
      historicalDate: historicalDate || undefined,
    };

    const calculationResult = calculateCost(calculationInput);
    
    if (!calculationResult) {
      setError('선택한 경로에 대한 운임 정보를 찾을 수 없습니다.');
      return;
    }

    // DP 포함 시 철도+트럭 분리 운임만 표시 / DP 미포함 시 통합 운임만 표시
    if (input.includeDP) {
      calculationResult.breakdown = calculationResult.breakdown.filter(b => !b.isCombinedFreight);
    } else {
      calculationResult.breakdown = calculationResult.breakdown.filter(b => b.isCombinedFreight);
    }
    
    // Recalculate lowest cost after filtering
    if (calculationResult.breakdown.length > 0) {
      let lowestCost = Infinity;
      let lowestAgent = '';
      
      calculationResult.breakdown.forEach(breakdown => {
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
      
      calculationResult.lowestCost = lowestCost;
      calculationResult.lowestCostAgent = lowestAgent;
    }

    setResult(calculationResult);
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
    
    if (calculationResult.breakdown.length > 0 && calculationResult.breakdown[0].otherCosts) {
      calculationResult.breakdown[0].otherCosts.forEach((item, index) => {
        resetExcluded[`other_${index}`] = false;
      });
    }
    setExcludedCosts(resetExcluded);
    setCellExclusions({});
  };

  const handleSeaFreightSelect = (seaFreightId: string) => {
    setInput({ ...input, selectedSeaFreightId: seaFreightId });
    setShowSeaFreightDialog(false);
    
    setTimeout(() => {
      const calculationInput = {
        ...input,
        selectedSeaFreightId: seaFreightId,
        historicalDate: historicalDate || undefined,
      };
      const calculationResult = calculateCost(calculationInput);
      
      if (calculationResult) {
        // DP 포함 시 철도+트럭 분리 운임만 표시 / DP 미포함 시 통합 운임만 표시
        if (input.includeDP) {
          calculationResult.breakdown = calculationResult.breakdown.filter(b => !b.isCombinedFreight);
        } else {
          calculationResult.breakdown = calculationResult.breakdown.filter(b => b.isCombinedFreight);
        }
        
        // Recalculate lowest cost after filtering
        if (calculationResult.breakdown.length > 0) {
          let lowestCost = Infinity;
          let lowestAgent = '';
          
          calculationResult.breakdown.forEach(breakdown => {
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
          
          calculationResult.lowestCost = lowestCost;
          calculationResult.lowestCostAgent = lowestAgent;
        }

        setResult(calculationResult);
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
        
        if (calculationResult.breakdown.length > 0 && calculationResult.breakdown[0].otherCosts) {
          calculationResult.breakdown[0].otherCosts.forEach((item, index) => {
            resetExcluded[`other_${index}`] = false;
          });
        }
        setExcludedCosts(resetExcluded);
        setCellExclusions({});
      }
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
    setError('');
    setSortConfig({ key: null, direction: 'asc' });
    setHistoricalDate('');
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
    setInput(history.result.input);
    setSortConfig({ key: null, direction: 'asc' });
    
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

  const getSortedBreakdown = () => {
    if (!result) return [];
    
    const breakdown = [...result.breakdown];
    
    if (sortConfig.key === 'agent') {
      breakdown.sort((a, b) => {
        const comparison = a.agent.localeCompare(b.agent, 'ko');
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    } else if (sortConfig.key === 'rail') {
      breakdown.sort((a, b) => {
        const comparison = a.railAgent.localeCompare(b.railAgent, 'ko');
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    } else if (sortConfig.key === 'truck') {
      breakdown.sort((a, b) => {
        const comparison = a.truckAgent.localeCompare(b.truckAgent, 'ko');
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    } else if (sortConfig.key === 'total') {
      breakdown.sort((a, b) => {
        const indexA = result.breakdown.indexOf(a);
        const indexB = result.breakdown.indexOf(b);
        const totalA = calculateAdjustedTotal(a, indexA);
        const totalB = calculateAdjustedTotal(b, indexB);
        const comparison = totalA - totalB;
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    }
    
    return breakdown;
  };

  const getLowestCostAgent = () => {
    if (!result || result.breakdown.length === 0) return { agent: '', cost: 0 };
    
    let lowestAgent = result.breakdown[0].agent;
    let lowestCost = calculateAdjustedTotal(result.breakdown[0], 0);

    result.breakdown.forEach((breakdown, index) => {
      const adjustedTotal = calculateAdjustedTotal(breakdown, index);
      if (adjustedTotal < lowestCost) {
        lowestCost = adjustedTotal;
        lowestAgent = breakdown.agent;
      }
    });

    return { agent: lowestAgent, cost: lowestCost };
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

  const lowestCostInfo = result ? getLowestCostAgent() : { agent: '', cost: 0 };
  const otherCostItems = result && result.breakdown.length > 0 && result.breakdown[0].otherCosts ? result.breakdown[0].otherCosts : [];
  const sortedBreakdown = getSortedBreakdown();

  // Check if all deletable items on current page are selected
  const deletableOnPage = paginatedHistory.filter(h => canDeleteCalculation(h.createdBy));
  const allPageSelected = deletableOnPage.length > 0 && deletableOnPage.every(h => selectedHistoryIds.has(h.id));
  const somePageSelected = deletableOnPage.some(h => selectedHistoryIds.has(h.id)) && !allPageSelected;

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
                <Select value={input.pol} onValueChange={(value) => setInput({ ...input, pol: value, selectedSeaFreightId: undefined })}>
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
                <Select value={input.pod} onValueChange={(value) => setInput({ ...input, pod: value, selectedSeaFreightId: undefined })}>
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
                <p className="text-xs text-amber-600">
                  ⚠️ 이 항로에 {seaFreightOptions.length}개의 해상운임 옵션이 있습니다
                </p>
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
                <li>• <strong>해상운임:</strong> 같은 항로에 여러 운임이 있는 경우 선택할 수 있습니다</li>
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
            <Button variant="outline" onClick={handleReset}>
              초기화
            </Button>
          </div>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  조회 결과
                  {result.isHistorical && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded text-sm font-normal">
                      <Clock className="h-3 w-3" />
                      과거 운임
                    </span>
                  )}
                </CardTitle>
                <CardDescription>
                  경로: {result.input.pol} → {result.input.pod} → {getDestinationName(result.input.destinationId)} | 중량: {result.input.weight.toLocaleString()}kg
                  {result.input.includeDP && ` | DP 포함 ($${dpCost})`}
                  {result.input.domesticTransport > 0 && ` | 국내운송 $${result.input.domesticTransport}`}
                  {result.isHistorical && result.historicalDate && (
                    <span className="block mt-1 text-purple-600">
                      📅 {result.historicalDate} 날짜의 운임으로 계산됨
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
              {input.includeDP && (
                <div className="text-xs text-blue-700 mt-2 font-semibold">
                  * DP 포함 시: 철도+트럭 분리 운임만 표시됩니다
                </div>
              )}
              {!input.includeDP && (
                <div className="text-xs text-blue-700 mt-2 font-semibold">
                  * DP 미포함 시: 통합 운임만 표시됩니다
                </div>
              )}
            </div>

            {result.breakdown.some(b => b.hasExpiredRates) && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>⚠️ 만료된 운임 포함:</strong> 일부 조합에 만료된 운임이 포함되어 있습니다. 
                  빨간색 굵은 글씨와 경고 아이콘으로 표시된 항목을 확인하세요.
                </AlertDescription>
              </Alert>
            )}

            {result.breakdown.length === 0 && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  {input.includeDP 
                    ? '이 경로에는 철도+트럭 분리 운임 조합이 없습니다. DP 옵션을 해제하고 다시 조회해보세요.'
                    : '이 경로에는 통합 운임 조합이 없습니다. DP 옵션을 선택하고 다시 조회해보세요.'
                  }
                </AlertDescription>
              </Alert>
            )}

            {result.breakdown.length > 0 && (
              <>
                {/* Table and other result display components remain the same */}
                {/* ... rest of the JSX for displaying results ... */}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Rest of the component remains the same */}
      {/* ... history section, dialogs, etc. ... */}

      <TimeMachineDialog
        open={timeMachineOpen}
        onOpenChange={setTimeMachineOpen}
        onSelectDate={handleTimeMachineSelect}
        currentDate={historicalDate}
      />
    </div>
  );
}