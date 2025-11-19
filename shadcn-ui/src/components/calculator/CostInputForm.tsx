import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calculator, RotateCcw, Sparkles, Ship, Clock, Plus, X } from 'lucide-react';
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
      otherCosts: [...input.otherCosts, { name: '', amount: 0 }]
    });
  };

  const handleRemoveOtherCost = (index: number) => {
    const newOtherCosts = input.otherCosts.filter((_, i) => i !== index);
    setInput({
      ...input,
      otherCosts: newOtherCosts
    });
  };

  const handleOtherCostChange = (index: number, field: 'name' | 'amount', value: string | number) => {
    const newOtherCosts = [...input.otherCosts];
    if (field === 'name') {
      newOtherCosts[index].name = value as string;
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
          <Label htmlFor="pol" className="text-sm">선적포트 (POL)</Label>
          <Select
            value={input.pol}
            onValueChange={(value) => setInput({ ...input, pol: value })}
          >
            <SelectTrigger id="pol" className="h-9">
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
          <Label htmlFor="pod" className="text-sm">하역포트 (POD)</Label>
          <Select
            value={input.pod}
            onValueChange={(value) => setInput({ ...input, pod: value })}
          >
            <SelectTrigger id="pod" className="h-9">
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
          <Label htmlFor="destination" className="text-sm">최종목적지</Label>
          <Select
            value={input.destinationId}
            onValueChange={(value) => setInput({ ...input, destinationId: value })}
          >
            <SelectTrigger id="destination" className="h-9">
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
          <Label htmlFor="weight" className="text-sm">중량 (kg)</Label>
          <Input
            id="weight"
            type="number"
            value={input.weight || ''}
            onChange={(e) => setInput({ ...input, weight: parseFloat(e.target.value) || 0 })}
            placeholder="중량"
            className="h-9"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="includeDP"
          checked={input.includeDP}
          onCheckedChange={(checked) => setInput({ ...input, includeDP: checked as boolean })}
        />
        <Label htmlFor="includeDP" className="cursor-pointer">
          DP 포함 {input.includeDP && dpCost > 0 && `($${dpCost})`}
        </Label>
      </div>

      {/* 기타 비용 섹션 - Only show inputs when added */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">기타 비용 (선택)</Label>
          {input.otherCosts.length < MAX_OTHER_COSTS && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddOtherCost}
              className="h-8"
            >
              <Plus className="h-4 w-4 mr-1" />
              추가
            </Button>
          )}
        </div>
        
        {input.otherCosts.length > 0 && (
          <div className="space-y-3 p-3 border rounded-lg bg-gray-50">
            {input.otherCosts.map((cost, index) => (
              <div key={index} className="flex items-end gap-2">
                <div className="flex-1 space-y-2">
                  <Label htmlFor={`other-cost-name-${index}`} className="text-xs">
                    비용명
                  </Label>
                  <Input
                    id={`other-cost-name-${index}`}
                    type="text"
                    value={cost.name}
                    onChange={(e) => handleOtherCostChange(index, 'name', e.target.value)}
                    placeholder="예: 보험료, 검역비 등"
                    className="h-9"
                  />
                </div>
                <div className="flex-1 space-y-2">
                  <Label htmlFor={`other-cost-amount-${index}`} className="text-xs">
                    금액 ($)
                  </Label>
                  <Input
                    id={`other-cost-amount-${index}`}
                    type="number"
                    value={cost.amount || ''}
                    onChange={(e) => handleOtherCostChange(index, 'amount', e.target.value)}
                    placeholder="0"
                    className="h-9"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveOtherCost(index)}
                  className="h-9 w-9 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {input.otherCosts.length > 0 && (
              <div className="pt-2 border-t">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium text-gray-700">기타 비용 합계:</span>
                  <span className="font-semibold text-blue-600">
                    ${input.otherCosts.reduce((sum, cost) => sum + (cost.amount || 0), 0).toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {seaFreightOptions.length > 0 && (
        <Alert className="bg-blue-50 border-blue-200">
          <Ship className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            <div className="flex items-center justify-between">
              <span>
                {seaFreightOptions.length}개의 해상 운임 옵션이 있습니다.
                {selectedSeaFreightIds.size > 0 && ` (${selectedSeaFreightIds.size}개 선택됨)`}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenSeaFreightDialog}
                className="ml-2"
              >
                선택하기
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {historicalDate && (
        <Alert className="bg-purple-50 border-purple-200">
          <Clock className="h-4 w-4 text-purple-600" />
          <AlertDescription className="text-purple-900">
            <div className="flex items-center justify-between">
              <span>
                📅 타임머신 활성화: {historicalDate} 날짜의 운임으로 계산합니다
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={onOpenTimeMachine}
                className="ml-2"
              >
                날짜 변경
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertDescription className="whitespace-pre-line">{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap gap-2">
        {/* 계산하기 버튼 - 가로 크기 2배 */}
        <Button onClick={onCalculate} className="flex items-center gap-2 px-8">
          <Calculator className="h-4 w-4" />
          계산하기
        </Button>

        {!historicalDate && (
          <Button
            onClick={onOpenTimeMachine}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Clock className="h-4 w-4" />
            타임머신
          </Button>
        )}

        {result && (
          <Button
            onClick={onViewAllFreights}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4" />
            제약 없이 보기
          </Button>
        )}

        <Button onClick={onReset} variant="outline" className="flex items-center gap-2">
          <RotateCcw className="h-4 w-4" />
          초기화
        </Button>
      </div>
    </div>
  );
}