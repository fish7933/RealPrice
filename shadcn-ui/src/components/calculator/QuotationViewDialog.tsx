import { useState, useEffect } from 'react';
import { Quotation } from '@/types/freight';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FileSpreadsheet, Copy, Edit2, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFreight } from '@/contexts/FreightContext';
import { exportQuotationToExcel, copyQuotationToClipboard } from '@/utils/excelExport';

interface QuotationViewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotation: Quotation;
}

export default function QuotationViewDialog({
  open,
  onOpenChange,
  quotation,
}: QuotationViewDialogProps) {
  const { toast } = useToast();
  const { updateQuotation } = useFreight();
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [editedNote, setEditedNote] = useState(quotation.note || '');

  // Update editedNote when quotation changes
  useEffect(() => {
    setEditedNote(quotation.note || '');
    setIsEditingNote(false);
  }, [quotation.id, quotation.note]);

  const handleExportExcel = () => {
    exportQuotationToExcel({
      breakdown: quotation.breakdown,
      input: quotation.input,
      destinationName: quotation.destinationName,
      costTotal: quotation.costTotal,
      sellingPrice: quotation.sellingPrice,
      profit: quotation.profit,
      profitRate: quotation.profitRate,
      createdByUsername: quotation.username,
      createdAt: quotation.createdAt,
      excludedCosts: quotation.excludedCosts || {},
      carrier: quotation.carrier,
      note: quotation.note,
    });

    toast({
      title: '엑셀 다운로드 완료',
      description: '견적서가 엑셀 파일로 다운로드되었습니다.',
    });
  };

  const handleCopyToClipboard = async () => {
    const success = await copyQuotationToClipboard({
      breakdown: quotation.breakdown,
      input: quotation.input,
      destinationName: quotation.destinationName,
      costTotal: quotation.costTotal,
      sellingPrice: quotation.sellingPrice,
      profit: quotation.profit,
      profitRate: quotation.profitRate,
      createdByUsername: quotation.username,
      createdAt: quotation.createdAt,
      excludedCosts: quotation.excludedCosts || {},
      carrier: quotation.carrier,
      note: quotation.note,
    });

    if (success) {
      toast({
        title: '복사 완료',
        description: '견적서 데이터가 클립보드에 복사되었습니다. 엑셀에 붙여넣기(Ctrl+V)하세요.',
      });
    } else {
      toast({
        title: '복사 실패',
        description: '클립보드 복사에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleEditNote = () => {
    setEditedNote(quotation.note || '');
    setIsEditingNote(true);
  };

  const handleSaveNote = async () => {
    try {
      await updateQuotation(quotation.id, { note: editedNote });
      setIsEditingNote(false);
      toast({
        title: '메모 저장 완료',
        description: '메모가 성공적으로 저장되었습니다.',
      });
    } catch (error) {
      toast({
        title: '메모 저장 실패',
        description: '메모 저장에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleCancelEdit = () => {
    setEditedNote(quotation.note || '');
    setIsEditingNote(false);
  };

  const { breakdown, input, destinationName, excludedCosts = {} } = quotation;
  const routeTitle = `${input.pol}-${input.pod}-${destinationName}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[1200px] max-w-[90vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-center text-gray-900">운임 견적서</DialogTitle>
          <DialogDescription className="text-center text-sm text-gray-600">
            {routeTitle} | 작성자: {quotation.username} | 작성일: {new Date(quotation.createdAt).toLocaleDateString('ko-KR')}
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-x-auto">
          <Table className="border border-gray-200">
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="border border-gray-200 font-bold text-center text-xs py-2 text-gray-900">경로</TableHead>
                <TableHead className="border border-gray-200 font-bold text-center text-xs py-2 text-gray-900">CARRIER</TableHead>
                <TableHead className="border border-gray-200 font-bold text-center text-xs py-2 text-gray-900">CNTR SIZE</TableHead>
                {!excludedCosts.seaFreight && (
                  <TableHead className="border border-gray-200 font-bold text-center text-xs py-2 text-gray-900">
                    {input.pol}-{input.pod}
                  </TableHead>
                )}
                {!excludedCosts.dthc && (
                  <TableHead className="border border-gray-200 font-bold text-center text-xs py-2 text-gray-900">D/O FEE</TableHead>
                )}
                {!breakdown.isCombinedFreight && !excludedCosts.portBorder && (
                  <TableHead className="border border-gray-200 font-bold text-center text-xs py-2 text-gray-900">
                    {input.pod}-국경
                  </TableHead>
                )}
                {!breakdown.isCombinedFreight && !excludedCosts.borderDestination && (
                  <TableHead className="border border-gray-200 font-bold text-center text-xs py-2 text-gray-900">
                    국경-{destinationName}
                  </TableHead>
                )}
                {breakdown.isCombinedFreight && !excludedCosts.combinedFreight && (
                  <TableHead className="border border-gray-200 font-bold text-center text-xs py-2 text-gray-900">
                    {input.pod}-{destinationName}
                  </TableHead>
                )}
                {!excludedCosts.weightSurcharge && breakdown.weightSurcharge > 0 && (
                  <TableHead className="border border-gray-200 font-bold text-center text-xs py-2 text-gray-900">중량할증</TableHead>
                )}
                {!excludedCosts.dp && breakdown.dp > 0 && (
                  <TableHead className="border border-gray-200 font-bold text-center text-xs py-2 text-gray-900">DP</TableHead>
                )}
                {!excludedCosts.domesticTransport && breakdown.domesticTransport > 0 && (
                  <TableHead className="border border-gray-200 font-bold text-center text-xs py-2 text-gray-900">국내운송</TableHead>
                )}
                {breakdown.otherCosts.map((item, index) => {
                  if (!excludedCosts[`other_${index}`]) {
                    return (
                      <TableHead key={index} className="border border-gray-200 font-bold text-center text-xs py-2 text-gray-900">
                        {item.category}
                      </TableHead>
                    );
                  }
                  return null;
                })}
                <TableHead className="border border-gray-200 font-bold text-center text-xs py-2 bg-blue-50 text-blue-700">TOTAL</TableHead>
                <TableHead className="border border-gray-200 font-bold text-center text-xs py-2 bg-green-50 text-green-700">SELLING</TableHead>
                <TableHead className="border border-gray-200 font-bold text-center text-xs py-2 bg-yellow-50 text-yellow-700">PROFIT</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="border border-gray-200 text-center text-xs py-2 font-medium text-gray-900">{destinationName}</TableCell>
                <TableCell className="border border-gray-200 text-center text-xs py-2 text-gray-700">{quotation.carrier || ''}</TableCell>
                <TableCell className="border border-gray-200 text-center text-xs py-2 text-gray-700">40'HQ</TableCell>
                {!excludedCosts.seaFreight && (
                  <TableCell className="border border-gray-200 text-center text-xs py-2 text-gray-700">{breakdown.seaFreight}</TableCell>
                )}
                {!excludedCosts.dthc && (
                  <TableCell className="border border-gray-200 text-center text-xs py-2 text-gray-700">{breakdown.dthc}</TableCell>
                )}
                {!breakdown.isCombinedFreight && !excludedCosts.portBorder && (
                  <TableCell className="border border-gray-200 text-center text-xs py-2 text-gray-700">{breakdown.portBorder}</TableCell>
                )}
                {!breakdown.isCombinedFreight && !excludedCosts.borderDestination && (
                  <TableCell className="border border-gray-200 text-center text-xs py-2 text-gray-700">{breakdown.borderDestination}</TableCell>
                )}
                {breakdown.isCombinedFreight && !excludedCosts.combinedFreight && (
                  <TableCell className="border border-gray-200 text-center text-xs py-2 text-gray-700">{breakdown.combinedFreight}</TableCell>
                )}
                {!excludedCosts.weightSurcharge && breakdown.weightSurcharge > 0 && (
                  <TableCell className="border border-gray-200 text-center text-xs py-2 text-gray-700">{breakdown.weightSurcharge}</TableCell>
                )}
                {!excludedCosts.dp && breakdown.dp > 0 && (
                  <TableCell className="border border-gray-200 text-center text-xs py-2 text-gray-700">{breakdown.dp}</TableCell>
                )}
                {!excludedCosts.domesticTransport && breakdown.domesticTransport > 0 && (
                  <TableCell className="border border-gray-200 text-center text-xs py-2 text-gray-700">{breakdown.domesticTransport}</TableCell>
                )}
                {breakdown.otherCosts.map((item, index) => {
                  if (!excludedCosts[`other_${index}`]) {
                    return (
                      <TableCell key={index} className="border border-gray-200 text-center text-xs py-2 text-gray-700">
                        {item.amount}
                      </TableCell>
                    );
                  }
                  return null;
                })}
                <TableCell className="border border-gray-200 text-center text-xs py-2 font-bold bg-blue-50 text-blue-700">{quotation.costTotal}</TableCell>
                <TableCell className="border border-gray-200 text-center text-xs py-2 font-bold bg-green-50 text-green-700">{quotation.sellingPrice}</TableCell>
                <TableCell className={`border border-gray-200 text-center text-xs py-2 font-bold bg-yellow-50 ${quotation.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {quotation.profit}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>

        <div className="space-y-1 text-xs text-gray-600 mt-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="font-semibold text-gray-700">중량:</span> <span className="text-gray-900">{input.weight.toLocaleString()} kg</span>
            </div>
            <div>
              <span className="font-semibold text-gray-700">이윤율:</span> <span className={`font-bold ${quotation.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{quotation.profitRate.toFixed(2)}%</span>
            </div>
          </div>
          <p className="text-gray-600">* 상기 금액은 USD 기준입니다.</p>
          <p className="text-gray-600">* 운임은 시장 상황에 따라 변동될 수 있습니다.</p>
          {Object.values(excludedCosts).some(v => v) && (
            <p className="text-gray-600">* 일부 비용 항목이 제외되어 계산되었습니다.</p>
          )}
          
          {/* Note Section */}
          <div className="mt-2 pt-2 border-t border-gray-200">
            <div className="flex items-center justify-between mb-1">
              <Label className="text-xs font-semibold text-gray-700">메모</Label>
              {!isEditingNote && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleEditNote}
                  className="h-6 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  <Edit2 className="h-3 w-3 mr-1" />
                  수정
                </Button>
              )}
            </div>
            
            {isEditingNote ? (
              <div className="space-y-2">
                <Textarea
                  value={editedNote}
                  onChange={(e) => setEditedNote(e.target.value)}
                  className="text-sm min-h-[80px] resize-none"
                  maxLength={500}
                  placeholder="메모를 입력하세요..."
                />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-600">{editedNote.length}/500</p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancelEdit}
                      className="h-7 px-3 text-xs border-gray-300 hover:bg-gray-100"
                    >
                      <X className="h-3 w-3 mr-1" />
                      취소
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSaveNote}
                      className="h-7 px-3 text-xs bg-blue-600 hover:bg-blue-700"
                    >
                      <Save className="h-3 w-3 mr-1" />
                      저장
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-gray-900 whitespace-pre-wrap bg-white p-2 rounded border border-gray-200 min-h-[60px]">
                {quotation.note || '메모가 없습니다.'}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2 flex-wrap">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-gray-300 hover:bg-gray-100">
            닫기
          </Button>
          <Button variant="outline" onClick={handleCopyToClipboard} className="flex items-center gap-2 border-gray-300 hover:bg-gray-100">
            <Copy className="h-4 w-4" />
            클립보드 복사
          </Button>
          <Button variant="outline" onClick={handleExportExcel} className="flex items-center gap-2 border-gray-300 hover:bg-gray-100">
            <FileSpreadsheet className="h-4 w-4" />
            엑셀 다운로드
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}