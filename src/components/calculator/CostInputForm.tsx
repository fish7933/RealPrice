import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calculator, RotateCcw, Sparkles, Ship, Clock, Plus, X, Package, Truck } from 'lucide-react';
import { CostCalculationInput, Destination, Port, SeaFreight, CostCalculationResult, OtherCost } from '@/types/freight';
import { Checkbox } from '@/components/ui/checkbox';

interface CostInputFormProps {
  input: CostCalculationInput;
  setInput: (input: CostCalculationInput) => void;
  polPorts: Port[];
  podPorts: Port[];
  destinations: Destination[];
  dpCost: number;
  seaFreightOptions: SeaFreight[];
  selectedSeaFreightIds: Set<string>;
  historicalDate: string;
  error: string;
  onCalculate: () => void;
  onViewAllFreights: () => void;
  onReset: () => void;
  onOpenSeaFreightDialog: () => void;
  onOpenTimeMachine: () => void;
  result: CostCalculationResult | null;
}

const MAX_OTHER_COSTS = 5;

export default function CostInputForm({
  input,
  setInput,
  polPorts,
  podPorts,
  destinations,
  dpCost,
  seaFreightOptions,
  selectedSeaFreightIds,
  historicalDate,
  error,
  onCalculate,
  onViewAllFreights,
  onReset,
  onOpenSeaFreightDialog,
  onOpenTimeMachine,
  result,
}: CostInputFormProps) {
  const getDestinationName = (destinationId: string) => {
    const destination = destinations.find(d => d.id === destinationId);
    return destination ? destination.name : destinationId;
  };

  const handleAddOtherCost = () => {
    if (input.otherCosts.length >= MAX_OTHER_COSTS) {
      return;
    }
    setInput({
      ...input,
      otherCosts: [...input.otherCosts, { category: '', amount: 0 }]
    });
  };

  const handleRemoveOtherCost = (index: number) => {
    const newOtherCosts = input.otherCosts.filter((_, i) => i !== index);
    setInput({
      ...input,
      otherCosts: newOtherCosts
    });
  };

  const handleOtherCostChange = (index: number, field: 'category' | 'amount', value: string | number) => {
    const newOtherCosts = [...input.otherCosts];
    if (field === 'category') {
      newOtherCosts[index].category = value as string;
    } else {
      newOtherCosts[index].amount = typeof value === 'number' ? value : parseFloat(value as string) || 0;
    }
    setInput({
      ...input,
      otherCosts: newOtherCosts
    });
  };

  return (
    <div className="space-y-4">
      {/* 한 줄로 모든 입력 필드 배치 */}
      <div className="grid grid-cols-4 gap-3">
        <div className="space-y-2">
          <Label htmlFor="pol" className="text-sm font-semibold text-gray-900">선적포트 (POL)</Label>
          <Select
            value={input.pol}
            onValueChange={(value) => setInput({ ...input, pol: value })}
          >
            <SelectTrigger id="pol" className="h-10 border-gray-300">
              <SelectValue placeholder="선적포트" />
            </SelectTrigger>
            <SelectContent>
              {polPorts.map((port) => (
                <SelectItem key={port.id} value={port.name}>
                  {port.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="pod" className="text-sm font-semibold text-gray-900">하역포트 (POD)</Label>
          <Select
            value={input.pod}
            onValueChange={(value) => setInput({ ...input, pod: value })}
          >
            <SelectTrigger id="pod" className="h-10 border-gray-300">
              <SelectValue placeholder="하역포트" />
            </SelectTrigger>
            <SelectContent>
              {podPorts.map((port) => (
                <SelectItem key={port.id} value={port.name}>
                  {port.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="destination" className="text-sm font-semibold text-gray-900">최종목적지</Label>
          <Select
            value={input.destinationId}
            onValueChange={(value) => setInput({ ...input, destinationId: value })}
          >
            <SelectTrigger id="destination" className="h-10 border-gray-300">
              <SelectValue placeholder="목적지" />
            </SelectTrigger>
            <SelectContent>
              {destinations.map((dest) => (
                <SelectItem key={dest.id} value={dest.id}>
                  {dest.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="weight" className="text-sm font-semibold text-gray-900">중량 (kg)</Label>
          <Input
            id="weight"
            type="number"
            value={input.weight || ''}
            onChange={(e) => setInput({ ...input, weight: parseFloat(e.target.value) || 0 })}
            placeholder="중량"
            className="h-10 border-gray-300"
          />
        </div>
      </div>

      {/* 운임 조건 섹션 */}
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-300 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900">운임 조건</h3>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {/* DP 포함 */}
          <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-300 hover:border-blue-400 transition-colors">
            <Checkbox
              id="includeDP"
              checked={input.includeDP}
              onCheckedChange={(checked) => setInput({ ...input, includeDP: checked as boolean })}
              className="h-5 w-5"
            />
            <Label htmlFor="includeDP" className="cursor-pointer flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Package className="h-4 w-4 text-blue-600" />
              <span>DP 포함</span>
              {input.includeDP && dpCost > 0 && (
                <span className="text-blue-600 font-bold">(${dpCost})</span>
              )}
            </Label>
          </div>

          {/* 국내 비용 입력 */}
          <div className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-300">
            <Truck className="h-4 w-4 text-green-600" />
            <div className="flex-1 flex items-center gap-2">
              <Label htmlFor="domesticTransport" className="text-sm font-semibold text-gray-900 whitespace-nowrap">
                국내 비용
              </Label>
              <Input
                id="domesticTransport"
                type="number"
                value={input.domesticTransport || ''}
                onChange={(e) => setInput({ ...input, domesticTransport: parseFloat(e.target.value) || 0 })}
                placeholder="0"
                className="h-8 border-gray-300 text-sm"
              />
            </div>
          </div>

          {/* 기타 비용 추가 버튼 */}
          <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-300">
            <Label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Plus className="h-4 w-4 text-gray-600" />
              기타 비용 (선택)
            </Label>
            {input.otherCosts.length < MAX_OTHER_COSTS && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddOtherCost}
                className="h-8 border-blue-300 hover:border-blue-400 hover:bg-blue-50 text-blue-700 font-semibold"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                추가
              </Button>
            )}
          </div>
        </div>

        {/* 기타 비용 입력 필드 */}
        {input.otherCosts.length > 0 && (
          <div className="space-y-3 p-4 border-2 border-blue-200 rounded-lg bg-blue-50">
            <div className="flex items-center gap-2 mb-2">
              <Plus className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-bold text-blue-900">추가된 기타 비용</span>
            </div>
            {input.otherCosts.map((cost, index) => (
              <div key={index} className="flex items-end gap-2 p-3 bg-white rounded-lg border border-blue-200">
                <div className="flex-1 space-y-1.5">
                  <Label htmlFor={`other-cost-category-${index}`} className="text-xs font-semibold text-gray-900">
                    비용명
                  </Label>
                  <Input
                    id={`other-cost-category-${index}`}
                    type="text"
                    value={cost.category}
                    onChange={(e) => handleOtherCostChange(index, 'category', e.target.value)}
                    placeholder="예: 보험료, 검역비 등"
                    className="h-9 border-gray-300"
                  />
                </div>
                <div className="flex-1 space-y-1.5">
                  <Label htmlFor={`other-cost-amount-${index}`} className="text-xs font-semibold text-gray-900">
                    금액 ($)
                  </Label>
                  <Input
                    id={`other-cost-amount-${index}`}
                    type="number"
                    value={cost.amount || ''}
                    onChange={(e) => handleOtherCostChange(index, 'amount', e.target.value)}
                    placeholder="0"
                    className="h-9 border-gray-300"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveOtherCost(index)}
                  className="h-9 w-9 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 border border-red-200"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {input.otherCosts.length > 0 && (
              <div className="pt-3 border-t-2 border-blue-300">
                <div className="flex justify-between items-center p-2 bg-white rounded-lg">
                  <span className="font-bold text-gray-900">기타 비용 합계:</span>
                  <span className="font-bold text-blue-600 text-lg">
                    ${input.otherCosts.reduce((sum, cost) => sum + (cost.amount || 0), 0).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {seaFreightOptions.length > 0 && (
        <Alert className="bg-blue-50 border-blue-300">
          <Ship className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            <div className="flex items-center justify-between">
              <span className="font-semibold">
                {seaFreightOptions.length}개의 해상 운임 옵션이 있습니다.
                {selectedSeaFreightIds.size > 0 && ` (${selectedSeaFreightIds.size}개 선택됨)`}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenSeaFreightDialog}
                className="ml-2 border-blue-400 hover:bg-blue-100 text-blue-700 font-semibold"
              >
                선택하기
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {historicalDate && (
        <Alert className="bg-purple-50 border-purple-300">
          <Clock className="h-4 w-4 text-purple-600" />
          <AlertDescription className="text-purple-900">
            <div className="flex items-center justify-between">
              <span className="font-semibold">
                📅 타임머신 활성화: {historicalDate} 날짜의 운임으로 계산합니다
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenTimeMachine}
                className="ml-2 border-purple-400 hover:bg-purple-100 text-purple-700 font-semibold"
              >
                날짜 변경
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive" className="border-red-300 bg-red-50">
          <AlertDescription className="whitespace-pre-line text-red-900 font-semibold">{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap gap-2">
        {/* 계산하기 버튼 */}
        <Button onClick={onCalculate} className="flex items-center gap-2 px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md">
          <Calculator className="h-4 w-4" />
          계산하기
        </Button>

        {!historicalDate && (
          <Button
            onClick={onOpenTimeMachine}
            variant="outline"
            className="flex items-center gap-2 border-gray-300 hover:bg-gray-100 font-semibold"
          >
            <Clock className="h-4 w-4" />
            타임머신
          </Button>
        )}

        {result && (
          <Button
            onClick={onViewAllFreights}
            variant="outline"
            className="flex items-center gap-2 border-gray-300 hover:bg-gray-100 font-semibold"
          >
            <Sparkles className="h-4 w-4" />
            제약 없이 보기
          </Button>
        )}

        <Button onClick={onReset} variant="outline" className="flex items-center gap-2 border-gray-300 hover:bg-gray-100 font-semibold">
          <RotateCcw className="h-4 w-4" />
          초기화
        </Button>
      </div>
    </div>
  );
}