import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calculator, RotateCcw, Sparkles, Ship, Clock, Database } from 'lucide-react';
import { CostCalculationInput, Destination, Port, SeaFreight, CostCalculationResult } from '@/types/freight';
import { Checkbox } from '@/components/ui/checkbox';
import { useState } from 'react';
import CalculationSqlPreviewDialog from './CalculationSqlPreviewDialog';

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
  const [sqlPreviewOpen, setSqlPreviewOpen] = useState(false);

  const getDestinationName = (destinationId: string) => {
    const destination = destinations.find(d => d.id === destinationId);
    return destination ? destination.name : destinationId;
  };

  const canShowSqlPreview = input.pol && input.pod && input.destinationId && input.weight > 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="pol">출발항 (POL)</Label>
          <Select
            value={input.pol}
            onValueChange={(value) => setInput({ ...input, pol: value })}
          >
            <SelectTrigger id="pol">
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
        </div>

        <div className="space-y-2">
          <Label htmlFor="pod">중국항 (POD)</Label>
          <Select
            value={input.pod}
            onValueChange={(value) => setInput({ ...input, pod: value })}
          >
            <SelectTrigger id="pod">
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
        </div>

        <div className="space-y-2">
          <Label htmlFor="destination">최종목적지</Label>
          <Select
            value={input.destinationId}
            onValueChange={(value) => setInput({ ...input, destinationId: value })}
          >
            <SelectTrigger id="destination">
              <SelectValue placeholder="목적지 선택" />
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
          <Label htmlFor="weight">중량 (kg)</Label>
          <Input
            id="weight"
            type="number"
            value={input.weight || ''}
            onChange={(e) => setInput({ ...input, weight: parseFloat(e.target.value) || 0 })}
            placeholder="중량 입력"
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
        <Button onClick={onCalculate} className="flex items-center gap-2">
          <Calculator className="h-4 w-4" />
          계산하기
        </Button>

        {canShowSqlPreview && (
          <Button 
            onClick={() => setSqlPreviewOpen(true)} 
            variant="outline"
            className="flex items-center gap-2"
          >
            <Database className="h-4 w-4" />
            SQL 미리보기
          </Button>
        )}

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

      <CalculationSqlPreviewDialog
        open={sqlPreviewOpen}
        onOpenChange={setSqlPreviewOpen}
        input={input}
        historicalDate={historicalDate}
        getDestinationName={getDestinationName}
      />
    </div>
  );
}