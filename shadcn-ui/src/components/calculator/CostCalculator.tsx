import { useState, useEffect } from 'react';
import { useFreight } from '@/contexts/FreightContext';
import { CostCalculationInput, CostCalculationResult } from '@/types/freight';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calculator, TrendingDown, Train, Truck, Weight, Package, Star, FileText, DollarSign, Info, Ship, Clock, AlertTriangle, Minus } from 'lucide-react';

export default function CostCalculator() {
  const { destinations, calculateCost, getDPCost, getDestinationById, getTotalOtherCosts, ports, getAvailableHistoricalDates } = useFreight();
  const [input, setInput] = useState<CostCalculationInput>({
    pol: '',
    pod: '',
    destinationId: '',
    weight: 0,
    includeDP: false,
    domesticTransport: 0,
    otherCosts: [],
  });
  const [result, setResult] = useState<CostCalculationResult | null>(null);
  const [error, setError] = useState('');
  const [dpCost, setDpCost] = useState(0);
  const [totalOtherCosts, setTotalOtherCosts] = useState(0);
  const [excludedCostItems, setExcludedCostItems] = useState<Map<number, Set<string>>>(new Map());
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [availableDates, setAvailableDates] = useState<string[]>([]);

  // Get POL and POD ports from the ports list
  const polPorts = ports.filter(p => p.type === 'POL');
  const podPorts = ports.filter(p => p.type === 'POD');

  // Load available historical dates
  useEffect(() => {
    const dates = getAvailableHistoricalDates();
    setAvailableDates(dates);
  }, [getAvailableHistoricalDates]);

  // Update DP cost when POL or date changes
  useEffect(() => {
    if (input.pol) {
      const cost = getDPCost(input.pol, selectedDate || undefined);
      setDpCost(cost);
    } else {
      setDpCost(0);
    }
  }, [input.pol, selectedDate, getDPCost]);

  // Update total other costs
  useEffect(() => {
    const costs = getTotalOtherCosts();
    setTotalOtherCosts(costs);
  }, [getTotalOtherCosts]);

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

    const calculationInput: CostCalculationInput = {
      ...input,
      historicalDate: selectedDate || undefined,
    };

    const calculationResult = calculateCost(calculationInput);
    
    if (!calculationResult) {
      setError('선택한 경로에 대한 운임 정보를 찾을 수 없습니다.');
      return;
    }

    setResult(calculationResult);
  };

  const handleReset = () => {
    setInput({
      pol: '',
      pod: '',
      destinationId: '',
      weight: 0,
      includeDP: false,
      domesticTransport: 0,
      otherCosts: [],
    });
    setSelectedDate('');
    setResult(null);
    setError('');
    setDpCost(0);
    setExcludedCostItems(new Map());
  };

  const toggleCostItem = (rowIndex: number, itemKey: string) => {
    setExcludedCostItems(prev => {
      const newMap = new Map(prev);
      const rowSet = newMap.get(rowIndex) || new Set<string>();
      const newRowSet = new Set(rowSet);
      
      if (newRowSet.has(itemKey)) {
        newRowSet.delete(itemKey);
      } else {
        newRowSet.add(itemKey);
      }
      
      if (newRowSet.size === 0) {
        newMap.delete(rowIndex);
      } else {
        newMap.set(rowIndex, newRowSet);
      }
      
      return newMap;
    });
  };

  const calculateAdjustedTotal = (breakdown: typeof result.breakdown[0], rowIndex: number) => {
    const excludedSet = excludedCostItems.get(rowIndex) || new Set<string>();
    let total = 0;
    if (!excludedSet.has('seaFreight')) total += breakdown.seaFreight;
    if (!excludedSet.has('portBorder')) total += breakdown.portBorder;
    if (!excludedSet.has('borderDestination')) total += breakdown.borderDestination;
    if (!excludedSet.has('weightSurcharge')) total += breakdown.weightSurcharge;
    if (!excludedSet.has('dp')) total += breakdown.dp;
    if (!excludedSet.has('dthc')) total += breakdown.dthc;
    if (!excludedSet.has('otherCosts')) total += breakdown.otherCosts;
    if (!excludedSet.has('domesticTransport')) total += breakdown.domesticTransport;
    if (!excludedSet.has('llocal')) total -= (breakdown.llocal || 0);
    return total;
  };
  
  const isCostExcluded = (rowIndex: number, itemKey: string) => {
    const excludedSet = excludedCostItems.get(rowIndex);
    return excludedSet ? excludedSet.has(itemKey) : false;
  };

  const getDestinationName = (destinationId: string) => {
    const destination = getDestinationById(destinationId);
    return destination ? destination.name : destinationId;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });
  };

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
          <CardDescription>운송 경로와 추가 비용을 입력하세요</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Time Machine Date Selection */}
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-5 w-5 text-purple-600" />
              <Label className="text-base font-semibold text-purple-900">타임머신 (과거 운임 조회)</Label>
            </div>
            <div className="space-y-2">
              <Select value={selectedDate} onValueChange={setSelectedDate}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="현재 운임으로 계산 (날짜 선택 안 함)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">현재 운임</SelectItem>
                  {availableDates.map((date) => (
                    <SelectItem key={date} value={date}>
                      {formatDate(date)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-purple-700">
                {selectedDate 
                  ? `선택한 날짜: ${formatDate(selectedDate)} - 이 날짜에 유효했던 운임으로 계산됩니다`
                  : '날짜를 선택하지 않으면 현재 유효한 운임으로 계산됩니다'}
              </p>
            </div>
          </div>

          {/* Route Selection */}
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

          {/* Weight and DP */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>
          </div>

          {/* Other Costs - Single column */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              기타비용 (자동 계산)
            </Label>
            <div className="h-10 px-3 border rounded-md bg-gray-50 flex items-center text-sm text-gray-700">
              ${totalOtherCosts} (DP 제외)
            </div>
            <p className="text-xs text-gray-500">
              기타비용 메뉴에서 설정한 항목들이 자동으로 합산됩니다
            </p>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>자동 계산 항목:</strong>
              <ul className="mt-2 space-y-1 text-sm">
                <li>• <strong>D/O(DTHC):</strong> 대리점별로 설정된 금액이 자동 적용됩니다</li>
                <li>• <strong>기타비용:</strong> 기타비용 메뉴에서 설정한 항목(DP 제외)이 자동 합산됩니다</li>
                <li>• <strong>중량할증:</strong> 입력한 중량에 따라 자동 계산됩니다</li>
                <li>• <strong>L.LOCAL:</strong> 대리점별 해상운임에 설정된 경우 총액에서 차감됩니다</li>
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

      {/* Results */}
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              조회 결과
              {result.isHistorical && (
                <span className="flex items-center gap-1 text-sm font-normal text-purple-600 bg-purple-100 px-2 py-1 rounded">
                  <Clock className="h-4 w-4" />
                  과거 운임 ({formatDate(result.historicalDate!)})
                </span>
              )}
            </CardTitle>
            <CardDescription>
              경로: {result.input.pol} → {result.input.pod} → {getDestinationName(result.input.destinationId)} | 중량: {result.input.weight.toLocaleString()}kg
              {result.input.includeDP && ` | DP 포함 ($${dpCost})`}
              {totalOtherCosts > 0 && ` | 기타비용: $${totalOtherCosts}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {result.breakdown.some(b => b.hasExpiredRates) && (
              <Alert className="mb-4 border-amber-300 bg-amber-50">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-900">
                  <strong>주의:</strong> 일부 운임이 선택한 날짜에 유효하지 않아 만료된 운임을 사용했습니다. 
                  결과가 정확하지 않을 수 있습니다.
                </AlertDescription>
              </Alert>
            )}

            <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 text-sm text-blue-900 mb-2">
                <Ship className="h-4 w-4" />
                <span className="font-semibold">선사:</span>
                <span>해상 운송을 담당하는 선박 회사</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-blue-900 mb-2">
                <Train className="h-4 w-4" />
                <span className="font-semibold">철도 운임:</span>
                <span>포트국경운임 (중국항 → KASHGAR)</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-blue-900 mb-2">
                <Truck className="h-4 w-4" />
                <span className="font-semibold">트럭 운임:</span>
                <span>국경목적지운임 (KASHGAR → 최종목적지)</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-blue-900 mb-2">
                <Weight className="h-4 w-4" />
                <span className="font-semibold">중량할증:</span>
                <span>트럭 대리점별로 중량에 따라 자동 계산됩니다</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-blue-900 mb-2">
                <FileText className="h-4 w-4" />
                <span className="font-semibold">D/O(DTHC):</span>
                <span>철도 대리점별로 설정된 금액이 자동 적용됩니다</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-blue-900 mb-2">
                <DollarSign className="h-4 w-4" />
                <span className="font-semibold">기타비용:</span>
                <span>기타비용 메뉴에서 설정한 항목(DP 제외)이 자동 합산됩니다</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-blue-900 mb-2">
                <Package className="h-4 w-4" />
                <span className="font-semibold">DP:</span>
                <span>Disposal Container - 컨테이너 재산권 이전 비용</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-blue-900 mb-2">
                <Star className="h-4 w-4" />
                <span className="font-semibold">대리점별 해상운임:</span>
                <span>철도 대리점이 지정한 해상운임이 우선 적용됩니다</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-blue-900">
                <Minus className="h-4 w-4 text-red-600" />
                <span className="font-semibold">L.LOCAL:</span>
                <span>대리점이 회사로 돌려주는 금액 (총액에서 차감)</span>
              </div>
              <div className="mt-2 text-xs text-blue-700">
                * 각 철도 대리점은 자체 트럭 또는 COWIN 트럭을 선택할 수 있습니다
              </div>
            </div>

            <div className="mb-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-sm text-amber-900 font-medium">
                💡 비용 항목을 클릭하면 해당 행의 계산에서 제외할 수 있습니다
              </p>
            </div>

            <div className="border rounded-lg overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="min-w-[180px]">조합</TableHead>
                    <TableHead className="text-center min-w-[100px]">
                      <div className="flex flex-col items-center gap-1">
                        <Train className="h-4 w-4" />
                        <span>철도</span>
                      </div>
                    </TableHead>
                    <TableHead className="text-center min-w-[100px]">
                      <div className="flex flex-col items-center gap-1">
                        <Truck className="h-4 w-4" />
                        <span>트럭</span>
                      </div>
                    </TableHead>
                    <TableHead className="text-right">해상운임</TableHead>
                    <TableHead className="text-right">
                      <div className="flex flex-col items-end gap-1">
                        <Minus className="h-4 w-4 text-red-600" />
                        <span>L.LOCAL</span>
                      </div>
                    </TableHead>
                    <TableHead className="text-right">철도운임</TableHead>
                    <TableHead className="text-right">트럭운임</TableHead>
                    <TableHead className="text-right">
                      <div className="flex flex-col items-end gap-1">
                        <Weight className="h-4 w-4" />
                        <span>중량할증</span>
                      </div>
                    </TableHead>
                    <TableHead className="text-right">
                      <div className="flex flex-col items-end gap-1">
                        <Package className="h-4 w-4" />
                        <span>DP</span>
                      </div>
                    </TableHead>
                    <TableHead className="text-right">
                      <div className="flex flex-col items-end gap-1">
                        <FileText className="h-4 w-4" />
                        <span>D/O(DTHC)</span>
                      </div>
                    </TableHead>
                    <TableHead className="text-right">
                      <div className="flex flex-col items-end gap-1">
                        <DollarSign className="h-4 w-4" />
                        <span>기타</span>
                      </div>
                    </TableHead>
                    <TableHead className="text-right font-bold">총액</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {result.breakdown.map((breakdown, index) => {
                    const isLowest = breakdown.agent === result.lowestCostAgent;
                    const hasExpired = breakdown.hasExpiredRates;
                    return (
                      <TableRow
                        key={index}
                        className={`${isLowest ? 'bg-green-50 font-semibold' : ''} ${hasExpired ? 'bg-amber-50/50' : ''}`}
                      >
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{breakdown.agent}</span>
                              {isLowest && (
                                <span className="flex items-center gap-1 text-xs bg-green-600 text-white px-2 py-0.5 rounded whitespace-nowrap">
                                  <TrendingDown className="h-3 w-3" />
                                  최저가
                                </span>
                              )}
                              {hasExpired && (
                                <span className="flex items-center gap-1 text-xs bg-amber-600 text-white px-2 py-0.5 rounded whitespace-nowrap" title={`만료된 운임: ${breakdown.expiredRateDetails?.join(', ')}`}>
                                  <AlertTriangle className="h-3 w-3" />
                                  만료
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-600">
                              <Ship className="h-3 w-3" />
                              <span>선사: {breakdown.seaFreightCarrier || 'N/A'}</span>
                              {breakdown.isAgentSpecificSeaFreight && (
                                <Star className="h-3 w-3 text-amber-600" title="대리점 지정 해상운임" />
                              )}
                            </div>
                          </div>
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
                          className="text-right cursor-pointer hover:bg-blue-100 active:bg-blue-200 transition-colors select-none border-l-2 border-transparent hover:border-l-blue-500"
                          onClick={() => toggleCostItem(index, 'seaFreight')}
                          title="클릭하여 계산에서 제외/포함"
                        >
                          <div className={`flex items-center justify-end gap-1 ${isCostExcluded(index, 'seaFreight') ? 'line-through text-gray-400' : ''}`}>
                            ${breakdown.seaFreight}
                          </div>
                        </TableCell>
                        <TableCell 
                          className="text-right cursor-pointer hover:bg-red-50 active:bg-red-100 transition-colors select-none border-l-2 border-transparent hover:border-l-red-500"
                          onClick={() => toggleCostItem(index, 'llocal')}
                          title="클릭하여 계산에서 제외/포함"
                        >
                          {breakdown.llocal && breakdown.llocal > 0 ? (
                            <span className={`text-red-600 font-medium ${isCostExcluded(index, 'llocal') ? 'line-through text-gray-400' : ''}`}>
                              -${breakdown.llocal}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell 
                          className="text-right cursor-pointer hover:bg-blue-100 active:bg-blue-200 transition-colors select-none border-l-2 border-transparent hover:border-l-blue-500"
                          onClick={() => toggleCostItem(index, 'portBorder')}
                          title="클릭하여 계산에서 제외/포함"
                        >
                          <span className={isCostExcluded(index, 'portBorder') ? 'line-through text-gray-400' : ''}>
                            ${breakdown.portBorder}
                          </span>
                        </TableCell>
                        <TableCell 
                          className="text-right cursor-pointer hover:bg-blue-100 active:bg-blue-200 transition-colors select-none border-l-2 border-transparent hover:border-l-blue-500"
                          onClick={() => toggleCostItem(index, 'borderDestination')}
                          title="클릭하여 계산에서 제외/포함"
                        >
                          <span className={isCostExcluded(index, 'borderDestination') ? 'line-through text-gray-400' : ''}>
                            ${breakdown.borderDestination}
                          </span>
                        </TableCell>
                        <TableCell 
                          className="text-right cursor-pointer hover:bg-blue-100 active:bg-blue-200 transition-colors select-none border-l-2 border-transparent hover:border-l-blue-500"
                          onClick={() => toggleCostItem(index, 'weightSurcharge')}
                          title="클릭하여 계산에서 제외/포함"
                        >
                          <span className={isCostExcluded(index, 'weightSurcharge') ? 'line-through text-gray-400' : ''}>
                            ${breakdown.weightSurcharge}
                          </span>
                        </TableCell>
                        <TableCell 
                          className="text-right cursor-pointer hover:bg-blue-100 active:bg-blue-200 transition-colors select-none border-l-2 border-transparent hover:border-l-blue-500"
                          onClick={() => toggleCostItem(index, 'dp')}
                          title="클릭하여 계산에서 제외/포함"
                        >
                          <span className={isCostExcluded(index, 'dp') ? 'line-through text-gray-400' : ''}>
                            ${breakdown.dp}
                          </span>
                        </TableCell>
                        <TableCell 
                          className="text-right cursor-pointer hover:bg-blue-100 active:bg-blue-200 transition-colors select-none border-l-2 border-transparent hover:border-l-blue-500"
                          onClick={() => toggleCostItem(index, 'dthc')}
                          title="클릭하여 계산에서 제외/포함"
                        >
                          <span className={isCostExcluded(index, 'dthc') ? 'line-through text-gray-400' : ''}>
                            ${breakdown.dthc}
                          </span>
                        </TableCell>
                        <TableCell 
                          className="text-right cursor-pointer hover:bg-blue-100 active:bg-blue-200 transition-colors select-none border-l-2 border-transparent hover:border-l-blue-500"
                          onClick={() => toggleCostItem(index, 'otherCosts')}
                          title="클릭하여 계산에서 제외/포함"
                        >
                          <span className={isCostExcluded(index, 'otherCosts') ? 'line-through text-gray-400' : ''}>
                            ${breakdown.otherCosts}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-bold">
                          {(excludedCostItems.get(index)?.size || 0) > 0 ? (
                            <div className="flex flex-col items-end">
                              <div className="text-gray-400 line-through text-sm">
                                ${breakdown.total.toLocaleString()}
                              </div>
                              <div className="text-blue-600">
                                ${calculateAdjustedTotal(breakdown, index).toLocaleString()}
                              </div>
                            </div>
                          ) : (
                            <div>${breakdown.total.toLocaleString()}</div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">최저가 조합:</span> {result.lowestCostAgent}
              </p>
              <p className="text-sm text-gray-700">
                <span className="font-semibold">최저 총액:</span> ${result.lowestCost.toLocaleString()}
              </p>
              <p className="text-xs text-gray-600 mt-2 flex items-center gap-1">
                <Star className="h-3 w-3 text-amber-600" />
                <span>별표는 해당 대리점이 지정한 특별 해상운임이 적용되었음을 나타냅니다</span>
              </p>
              <p className="text-xs text-gray-600 mt-1 flex items-center gap-1">
                <Minus className="h-3 w-3 text-red-600" />
                <span>L.LOCAL은 대리점이 회사로 돌려주는 금액으로 총액에서 차감됩니다</span>
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}