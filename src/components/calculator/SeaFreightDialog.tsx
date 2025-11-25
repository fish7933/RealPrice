import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Ship, Calculator, AlertCircle } from 'lucide-react';
import { SeaFreight } from '@/types/freight';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SeaFreightDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  seaFreightOptions: SeaFreight[];
  selectedSeaFreightIds: Set<string>;
  onToggleSelection: (freightId: string) => void;
  onToggleSelectAll: () => void;
  onConfirm: () => void;
  pol: string;
  pod: string;
  historicalDate?: string;
}

export default function SeaFreightDialog({
  open,
  onOpenChange,
  seaFreightOptions,
  selectedSeaFreightIds,
  onToggleSelection,
  onToggleSelectAll,
  onConfirm,
  pol,
  pod,
  historicalDate,
}: SeaFreightDialogProps) {
  const allSeaFreightsSelected = seaFreightOptions.length > 0 && selectedSeaFreightIds.size === seaFreightOptions.length;
  const someSeaFreightsSelected = selectedSeaFreightIds.size > 0 && !allSeaFreightsSelected;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>해상운임 선택</DialogTitle>
          <DialogDescription>
            {pol} → {pod} 항로에 {seaFreightOptions.length}개의 해상운임 옵션이 있습니다. 
            원하는 운임을 선택하세요. (복수 선택 가능)
            {historicalDate && (
              <span className="block mt-2 text-purple-600 font-semibold">
                📅 {historicalDate} 날짜에 유효한 운임만 표시됩니다
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {seaFreightOptions.length === 0 ? (
          <Alert variant="destructive" className="my-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {historicalDate 
                ? `${historicalDate} 날짜에 유효한 해상운임이 없습니다. 다른 날짜를 선택하거나 운임 관리에서 해당 날짜의 운임을 등록해주세요.`
                : '선택한 항로에 등록된 해상운임이 없습니다. 운임 관리에서 먼저 운임을 등록해주세요.'
              }
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <div className="space-y-3 py-4">
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded border border-blue-200">
                <Checkbox
                  checked={allSeaFreightsSelected}
                  onCheckedChange={onToggleSelectAll}
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
                    onClick={() => onToggleSelection(freight.id)}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => onToggleSelection(freight.id)}
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
                      <div className="flex items-center gap-2 text-xs text-gray-800">
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
                onClick={() => onOpenChange(false)}
              >
                취소
              </Button>
              <Button
                onClick={onConfirm}
                disabled={selectedSeaFreightIds.size === 0}
              >
                <Calculator className="h-4 w-4 mr-2" />
                선택 완료 ({selectedSeaFreightIds.size}개)
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}