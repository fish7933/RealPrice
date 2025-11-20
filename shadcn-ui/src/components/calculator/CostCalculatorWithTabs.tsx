import { useState, useEffect, useMemo } from 'react';
import { useFreight } from '@/contexts/FreightContext';
import { useAuth } from '@/contexts/AuthContext';
import { CostCalculationInput, CostCalculationResult, CalculationHistory, SeaFreight, AgentCostBreakdown } from '@/types/freight';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calculator, Camera, Clock, Info, History } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import QuotationDialog from './QuotationDialog';
import TimeMachineDialog from './TimeMachineDialog';
import CostCalculatorHeader from './CostCalculatorHeader';
import CostInputForm from './CostInputForm';
import CostResultTable from './CostResultTable';
import CalculationHistoryComponent from './CalculationHistory';
import SeaFreightDialog from './SeaFreightDialog';
import { 
  ExcludedCosts, 
  CellExclusions, 
  SortConfig, 
  STORAGE_KEY_RESULT, 
  STORAGE_KEY_EXCLUDED, 
  STORAGE_KEY_CELL_EXCLUDED, 
  STORAGE_KEY_USER,
  deduplicateBreakdowns 
} from './types';

export default function CostCalculatorWithTabs() {
  const { destinations, calculateCost, getDPCost, getDestinationById, calculationHistory, addCalculationHistory, deleteCalculationHistory, getSeaFreightOptions, ports } = useFreight();
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
  const [quotationDialogOpen, setQuotationDialogOpen] = useState(false);
  const [selectedBreakdown, setSelectedBreakdown] = useState<AgentCostBreakdown | null>(null);
  const [timeMachineOpen, setTimeMachineOpen] = useState(false);
  const [historicalDate, setHistoricalDate] = useState<string>('');
  const [fullBreakdown, setFullBreakdown] = useState<AgentCostBreakdown[]>([]);

  const dpCost = input.pol ? getDPCost(input.pol) : 0;
  const polPorts = ports.filter(p => p.type === 'POL');
  const podPorts = ports.filter(p => p.type === 'POD');

  // User change effect
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

  // Load saved result
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

  // ✅ FIXED: Sea freight options with historical date support
  useEffect(() => {
    console.log('🔍 [useEffect] Sea freight options update triggered');
    console.log('   POL:', input.pol, 'POD:', input.pod, 'Historical Date:', historicalDate);
    
    if (input.pol && input.pod) {
      // ✅ Pass historicalDate to getSeaFreightOptions
      const options = getSeaFreightOptions(input.pol, input.pod, historicalDate || undefined);
      console.log(`   📦 Found ${options.length} sea freight options for date: ${historicalDate || 'current'}`);
      
      setSeaFreightOptions(options);
      setSelectedSeaFreightIds(new Set());
    } else {
      setSeaFreightOptions([]);
      setSelectedSeaFreightIds(new Set());
    }
  }, [input.pol, input.pod, historicalDate, getSeaFreightOptions]); // ✅ Added historicalDate to dependencies

  // Save result to localStorage
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

    // ✅ FIXED: Show dialog only if there are multiple general sea freight options
    if (seaFreightOptions.length > 1 && selectedSeaFreightIds.size === 0) {
      setShowSeaFreightDialog(true);
      return;
    }

    // ✅ FIXED: Prepare sea freight IDs for calculation
    // - If user selected specific freights, use those
    // - If there's only one general sea freight, use it
    // - If there are no general sea freights, pass empty array (calculation will use agent sea freight)
    const seaFreightIdsToCalculate = selectedSeaFreightIds.size > 0 
      ? Array.from(selectedSeaFreightIds)
      : seaFreightOptions.length === 1 
        ? [seaFreightOptions[0].id]
        : [];

    console.log(`\n🔍 ===== 계산 시작 =====`);
    console.log(`   일반 해상운임 옵션: ${seaFreightOptions.length}개`);
    console.log(`   선택된 일반 해상운임: ${seaFreightIdsToCalculate.length}개`);
    console.log(`   대리점 해상운임 사용 가능 여부: 계산 로직에서 자동 판단`);

    const allBreakdowns: AgentCostBreakdown[] = [];
    
    // ✅ FIXED: If no general sea freight, try calculation without it (will use agent sea freight if available)
    if (seaFreightIdsToCalculate.length === 0) {
      console.log(`   ⚠️ 일반 해상운임 없음 - 대리점 해상운임으로 계산 시도`);
      
      const calculationInput = {
        ...input,
        selectedSeaFreightId: undefined, // No general sea freight selected
        historicalDate: historicalDate || undefined,
      };

      const calculationResult = calculateCost(calculationInput);
      
      if (calculationResult) {
        allBreakdowns.push(...calculationResult.breakdown);
      }
    } else {
      // Calculate with selected general sea freight options
      seaFreightIdsToCalculate.forEach(seaFreightId => {
        const calculationInput = {
          ...input,
          selectedSeaFreightId: seaFreightId,
          historicalDate: historicalDate || undefined,
        };

        const calculationResult = calculateCost(calculationInput);
        
        if (calculationResult) {
          allBreakdowns.push(...calculationResult.breakdown);
        }
      });
    }

    if (allBreakdowns.length === 0) {
      // ✅ NEW: Clear previous results when there are no new results
      setResult(null);
      setAllFreightsResult(null);
      setFullBreakdown([]);
      localStorage.removeItem(STORAGE_KEY_RESULT);
      
      const destination = getDestinationById(input.destinationId);
      const destinationName = destination?.name || input.destinationId;
      const missingRates: string[] = [];
      
      // ✅ IMPROVED: Better error message
      missingRates.push(`${input.pol} → ${input.pod} 항로의 해상운임 (일반 또는 대리점)`);
      
      if (input.includeDP) {
        missingRates.push(`${input.pol} → ${input.pod} → ${destinationName} 경로의 철도운임 (POD → KASHGAR)`);
        missingRates.push(`${destinationName} 목적지의 트럭운임 (KASHGAR → 최종목적지)`);
      } else {
        missingRates.push(`${input.pol} → ${input.pod} → ${destinationName} 경로의 철도+트럭 통합운임`);
      }
      
      setError(`선택한 경로에 대한 운임 조합이 없습니다.\n\n누락된 운임:\n• ${missingRates.join('\n• ')}\n\n관리자 대시보드에서 해당 운임을 먼저 등록해주세요.`);
      return;
    }

    const uniqueAllBreakdowns = deduplicateBreakdowns(allBreakdowns);
    setFullBreakdown(uniqueAllBreakdowns);

    const filteredBreakdown = input.includeDP
      ? uniqueAllBreakdowns.filter(b => !b.isCombinedFreight)
      : uniqueAllBreakdowns.filter(b => b.isCombinedFreight);

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

    // ✅ IMPROVED: Better success message
    const usedAgentSeaFreight = filteredBreakdown.some(b => b.isAgentSpecificSeaFreight);
    const freightTypeMsg = usedAgentSeaFreight 
      ? '대리점 해상운임' 
      : seaFreightIdsToCalculate.length > 0 
        ? `${seaFreightIdsToCalculate.length}개의 선사 운임`
        : '해상운임';
    
    toast({
      title: '계산 완료',
      description: `${freightTypeMsg}으로 ${filteredBreakdown.length}개의 고유 조합이 계산되었습니다.`,
    });
  };

  const handleViewAllFreights = () => {
    if (result && fullBreakdown.length > 0) {
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
        description: `총 ${fullBreakdown.length}개의 고유 운임 조합(철도+트럭 통합 + 분리)이 표시됩니다.`,
      });
      
      return;
    }

    setError('먼저 "계산하기" 버튼을 클릭하여 운임을 계산해주세요.');
    toast({
      title: '계산 필요',
      description: '먼저 "계산하기"를 실행한 후 "제약 없이 보기"를 사용할 수 있습니다.',
      variant: 'destructive',
    });
  };

  const handleSaveResult = async () => {
    if (!result || !user) return;

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
    
    setFullBreakdown(updatedResult.breakdown);
    
    if (history.result.input.includeDP) {
      updatedResult.breakdown = updatedResult.breakdown.filter(b => !b.isCombinedFreight);
    } else {
      updatedResult.breakdown = updatedResult.breakdown.filter(b => b.isCombinedFreight);
    }
    
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

  const handleDeleteHistory = async (id: string) => {
    await deleteCalculationHistory(id);
    toast({
      title: '삭제 완료',
      description: '계산 기록이 삭제되었습니다.',
    });
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

  const handleSort = (key: 'agent' | 'rail' | 'truck' | 'total') => {
    let direction: 'asc' | 'desc' = 'desc';
    
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    
    setSortConfig({ key, direction });
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
      setSelectedSeaFreightIds(new Set());
    } else {
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
    
    setTimeout(() => {
      handleCalculate();
    }, 0);
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

  return (
    <div className="space-y-6">
      <CostCalculatorHeader />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            운임 조건 입력
          </CardTitle>
          <CardDescription>운송 경로를 입력하세요</CardDescription>
        </CardHeader>
        <CardContent>
          <CostInputForm
            input={input}
            setInput={setInput}
            polPorts={polPorts}
            podPorts={podPorts}
            destinations={destinations}
            dpCost={dpCost}
            seaFreightOptions={seaFreightOptions}
            selectedSeaFreightIds={selectedSeaFreightIds}
            historicalDate={historicalDate}
            error={error}
            onCalculate={handleCalculate}
            onViewAllFreights={handleViewAllFreights}
            onReset={handleReset}
            onOpenSeaFreightDialog={() => setShowSeaFreightDialog(true)}
            onOpenTimeMachine={() => setTimeMachineOpen(true)}
            result={result}
          />
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
              <Button 
                onClick={handleSaveResult} 
                variant="outline" 
                className="flex items-center gap-2 shadow-md hover:shadow-lg transition-shadow"
              >
                <Camera className="h-4 w-4" />
                조회결과 스냅샷
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <CostResultTable
              result={result}
              allFreightsResult={allFreightsResult}
              input={input}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              excludedCosts={excludedCosts}
              cellExclusions={cellExclusions}
              sortConfig={sortConfig}
              onToggleCostExclusion={toggleCostExclusion}
              onToggleCellExclusion={toggleCellExclusion}
              onSort={handleSort}
              onCreateQuotation={handleCreateQuotation}
              getDestinationName={getDestinationName}
            />
          </CardContent>
        </Card>
      )}

      {calculationHistory && calculationHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              저장된 조회 결과 기록 ({calculationHistory.length}개)
            </CardTitle>
            <CardDescription>
              기록을 클릭하면 입력 폼과 조회 결과가 자동으로 채워집니다
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CalculationHistoryComponent
              calculationHistory={calculationHistory}
              onLoadHistory={handleLoadHistory}
              onDeleteHistory={handleDeleteHistory}
              canDeleteCalculation={canDeleteCalculation}
              formatDate={formatDate}
            />
          </CardContent>
        </Card>
      )}

      <SeaFreightDialog
        open={showSeaFreightDialog}
        onOpenChange={setShowSeaFreightDialog}
        seaFreightOptions={seaFreightOptions}
        selectedSeaFreightIds={selectedSeaFreightIds}
        onToggleSelection={toggleSeaFreightSelection}
        onToggleSelectAll={toggleSelectAllSeaFreights}
        onConfirm={handleSeaFreightDialogConfirm}
        pol={input.pol}
        pod={input.pod}
        historicalDate={historicalDate}
      />

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