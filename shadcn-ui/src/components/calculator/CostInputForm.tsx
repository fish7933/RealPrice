import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calculator, Clock, Ship, Weight, Package, DollarSign, Plus, X, Info, AlertTriangle, Sparkles } from 'lucide-react';
import { CostCalculationInput, Port, Destination, SeaFreight, CostCalculationResult } from '@/types/freight';

interface CostInputFormProps {
  input: CostCalculationInput;
  setInput: (input: CostCalculationInput) => void;
  polPorts: Port[];
  podPorts: Port[];
  destinations: Destination[];
  seaFreightOptions: SeaFreight[];
  selectedSeaFreightIds: Set<string>;
  dpCost: number;
  historicalDate: string;
  error: string;
  onCalculate: () => void;
  onViewAllFreights: () => void;
  onReset: () => void;
  onTimeMachineOpen: () => void;
  onSeaFreightDialogOpen: () => void;
  result: CostCalculationResult | null;
}

export default function CostInputForm({
  input,
  setInput,
  polPorts,
  podPorts,
  destinations,
  seaFreightOptions,
  selectedSeaFreightIds,
  dpCost,
  historicalDate,
  error,
  onCalculate,
  onViewAllFreights,
  onReset,
  onTimeMachineOpen,
  onSeaFreightDialogOpen,
  result,
}: CostInputFormProps) {
  const addOtherCost = () => {
    setInput({
      ...input,
      otherCosts: [...input.otherCosts, { category: '', amount: 0 }]
    });
  };

  const updateOtherCost = (index: number, field: 'category' | 'amount', value: string | number) => {
    setInput({
      ...input,
      otherCosts: input.otherCosts.map((cost, i) => 
        i === index ? { ...cost, [field]: value } : cost
      )
    });
  };

  const removeOtherCost = (index: number) => {
    setInput({
      ...input,
      otherCosts: input.otherCosts.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="space-y-6">
      {/* Time Machine Section */}
      <div className="p-5 bg-gradient-to-br from-purple-100 via-purple-50 to-blue-50 rounded-xl border-2 border-purple-300 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl shadow-lg flex items-center justify-center">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="font-bold text-lg text-purple-900 flex items-center gap-2">
                타임머신
                {historicalDate && <Sparkles className="h-4 w-4 text-purple-600 animate-pulse" />}
              </p>
              <p className="text-sm text-purple-700 mt-1">
                {historicalDate 
                  ? `📅 ${historicalDate} 날짜 기준으로 유효했던 운임으로 계산 중` 
                  : '과거 날짜 기준으로 유효했던 운임으로 계산할 수 있습니다'}
              </p>
            </div>
          </div>
          <Button
            variant={historicalDate ? "default" : "outline"}
            onClick={onTimeMachineOpen}
            className={historicalDate 
              ? "bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-lg flex items-center justify-center" 
              : "border-2 border-purple-300 hover:bg-purple-50 flex items-center justify-center"}
          >
            <Clock className="h-4 w-4 mr-2" />
            {historicalDate ? '날짜 변경' : '날짜 선택'}
          </Button>
        </div>
      </div>

      {/* Route Selection Section */}
      <div className="p-5 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-200">
        <div className="flex items-center gap-2 mb-4">
          <Ship className="h-5 w-5 text-blue-600" />
          <h3 className="font-bold text-lg text-blue-900">운송 경로</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">선적포트 (POL)</Label>
            {polPorts.length > 0 ? (
              <Select value={input.pol} onValueChange={(value) => setInput({ ...input, pol: value })}>
                <SelectTrigger className="border-2 border-blue-200 focus:border-blue-400">
                  <SelectValue placeholder="선적포트 선택" />
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
                선적포트(POL)를 먼저 등록해주세요.
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">하역포트 (POD)</Label>
            {podPorts.length > 0 ? (
              <Select value={input.pod} onValueChange={(value) => setInput({ ...input, pod: value })}>
                <SelectTrigger className="border-2 border-blue-200 focus:border-blue-400">
                  <SelectValue placeholder="하역포트 선택" />
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
                하역포트(POD)를 먼저 등록해주세요.
              </div>
            )}
            {seaFreightOptions.length > 1 && (
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-amber-600 font-semibold">
                  ⚠️ 이 항로에 {seaFreightOptions.length}개의 해상운임 옵션이 있습니다
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onSeaFreightDialogOpen}
                  className="h-7 text-xs border-amber-300 hover:bg-amber-50 flex items-center justify-center"
                >
                  <Ship className="h-3 w-3 mr-1" />
                  선택 ({selectedSeaFreightIds.size}/{seaFreightOptions.length})
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-semibold text-gray-700">최종목적지</Label>
            <Select value={input.destinationId} onValueChange={(value) => setInput({ ...input, destinationId: value })}>
              <SelectTrigger className="border-2 border-blue-200 focus:border-blue-400">
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
      </div>

      {/* Cost Details Section */}
      <div className="p-5 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="h-5 w-5 text-green-600" />
          <h3 className="font-bold text-lg text-green-900">비용 상세</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Weight className="h-4 w-4 text-green-600" />
              중량 (kg) *
            </Label>
            <Input
              type="number"
              placeholder="0"
              value={input.weight || ''}
              onChange={(e) => setInput({ ...input, weight: Number(e.target.value) })}
              className="border-2 border-green-200 focus:border-green-400"
            />
            <p className="text-xs text-gray-500">중량할증이 자동 계산됩니다</p>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <Package className="h-4 w-4 text-green-600" />
              DP (Disposal Container)
            </Label>
            <div className="flex items-center space-x-2 h-10 px-3 border-2 border-green-200 rounded-md bg-white">
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
              {input.pol ? `${input.pol} DP: $${dpCost}` : '선적포트를 먼저 선택하세요'}
            </p>
            <p className="text-xs text-blue-600 font-medium">
              ※ DP 포함 시 철도+트럭 분리 운임만 표시 / DP 미포함 시 철도+트럭 통합 운임만 표시
            </p>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-semibold text-gray-700">
              <DollarSign className="h-4 w-4 text-green-600" />
              국내운송료 (USD)
            </Label>
            <Input
              type="number"
              placeholder="0"
              value={input.domesticTransport || ''}
              onChange={(e) => setInput({ ...input, domesticTransport: Number(e.target.value) })}
              className="border-2 border-green-200 focus:border-green-400"
            />
            <p className="text-xs text-gray-500">
              국내 운송비용을 입력하세요
            </p>
          </div>
        </div>
      </div>

      {/* Other Costs Section */}
      <div className="p-5 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border-2 border-amber-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-amber-600" />
            <h3 className="font-bold text-lg text-amber-900">기타비용</h3>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addOtherCost}
            className="border-2 border-amber-300 hover:bg-amber-100 flex items-center justify-center"
          >
            <Plus className="h-4 w-4 mr-1" />
            항목 추가
          </Button>
        </div>
        {input.otherCosts.length > 0 && (
          <div className="space-y-2">
            {input.otherCosts.map((cost, index) => (
              <div key={index} className="flex gap-2 items-center">
                <Input
                  placeholder="비용 항목 (예: 통관비용)"
                  value={cost.category}
                  onChange={(e) => updateOtherCost(index, 'category', e.target.value)}
                  className="flex-1 border-2 border-amber-200"
                />
                <Input
                  type="number"
                  placeholder="금액 (USD)"
                  value={cost.amount || ''}
                  onChange={(e) => updateOtherCost(index, 'amount', Number(e.target.value))}
                  className="w-32 border-2 border-amber-200"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeOtherCost(index)}
                  className="h-10 w-10 p-0 hover:bg-red-100 flex items-center justify-center"
                >
                  <X className="h-4 w-4 text-red-600" />
                </Button>
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-gray-500 mt-3">
          통관비용, 보험료 등 추가 비용을 입력하세요
        </p>
      </div>

      {error && (
        <Alert variant="destructive" className="border-2">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <AlertDescription style={{ whiteSpace: 'pre-line' }} className="font-medium">{error}</AlertDescription>
          </div>
        </Alert>
      )}

      <div className="flex gap-3">
        <Button 
          onClick={onCalculate} 
          className="flex-1 h-12 text-base font-bold bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg flex items-center justify-center"
        >
          <Calculator className="h-5 w-5 mr-2" />
          계산하기
        </Button>
        <Button 
          onClick={onViewAllFreights} 
          variant="outline"
          className="flex items-center justify-center gap-2 h-12 px-6 bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 border-2 border-purple-300 font-bold"
          disabled={!result}
        >
          <Sparkles className="h-5 w-5 text-purple-600" />
          제약 없이 보기
        </Button>
        <Button 
          variant="outline" 
          onClick={onReset}
          className="h-12 px-6 border-2 hover:bg-gray-100 font-bold flex items-center justify-center"
        >
          초기화
        </Button>
      </div>

      <Alert className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200">
        <div className="flex items-start gap-2">
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <AlertDescription className="text-sm">
            <strong className="text-blue-900">자동 계산 항목:</strong>
            <ul className="mt-2 space-y-1">
              <li>• <strong>D/O(DTHC):</strong> 대리점별로 설정된 금액이 자동 적용됩니다</li>
              <li>• <strong>철도+트럭 통합 운임:</strong> 설정된 경우 철도+트럭 분리 운임 대신 철도+트럭 통합 운임이 적용됩니다</li>
              <li>• <strong>중량할증:</strong> 입력한 중량에 따라 자동 계산됩니다</li>
              <li>• <strong>해상운임:</strong> 같은 항로에 여러 운임이 있는 경우 복수 선택할 수 있습니다</li>
              <li>• <strong>DP:</strong> 관리자 대시보드에서 설정한 부산/인천 DP 금액이 자동 적용됩니다</li>
            </ul>
          </AlertDescription>
        </div>
      </Alert>
    </div>
  );
}