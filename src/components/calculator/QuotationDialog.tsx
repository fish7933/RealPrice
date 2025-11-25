import { useState, useEffect } from 'react';
import { AgentCostBreakdown, CostCalculationInput } from '@/types/freight';
import { useFreight } from '@/contexts/FreightContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { DollarSign, FileSpreadsheet, TrendingUp, Eye, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { exportQuotationToExcel } from '@/utils/excelExport';
import type { ExcludedCosts } from './CostCalculatorWithTabs';

interface QuotationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  breakdown: AgentCostBreakdown;
  input: CostCalculationInput;
  destinationName: string;
  excludedCosts: ExcludedCosts;
}

export default function QuotationDialog({
  open,
  onOpenChange,
  breakdown,
  input,
  destinationName,
  excludedCosts,
}: QuotationDialogProps) {
  const { addQuotation, seaFreights, agentSeaFreights } = useFreight();
  const { user } = useAuth();
  const { toast } = useToast();
  const [sellingPrice, setSellingPrice] = useState<number>(0);
  const [notes, setNotes] = useState<string>('');
  const [showQuotationView, setShowQuotationView] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setSellingPrice(0);
      setNotes('');
      setShowQuotationView(false);
      setIsSaving(false);
      setHasSaved(false);
    }
  }, [open]);

  // Get carrier information
  const getCarrier = (): string | undefined => {
    // Check if using agent-specific sea freight
    if (breakdown.isAgentSpecificSeaFreight) {
      const agentSeaFreight = agentSeaFreights.find(
        (f) => f.agent === breakdown.railAgent && f.pol === input.pol && f.pod === input.pod
      );
      return agentSeaFreight?.carrier;
    }
    
    // Check if using selected sea freight
    if (breakdown.seaFreightId) {
      const seaFreight = seaFreights.find((f) => f.id === breakdown.seaFreightId);
      return seaFreight?.carrier;
    }
    
    return undefined;
  };

  // Calculate cost total with excluded costs
  const calculateCostTotal = () => {
    let total = 0;
    if (!excludedCosts.seaFreight) total += breakdown.seaFreight;
    if (!excludedCosts.localCharge) total += breakdown.localCharge;
    // ✅ FIXED: llocal should always be included in cost calculation (it's a discount/surcharge)
    total += breakdown.llocal;
    if (!excludedCosts.dthc) total += breakdown.dthc;
    
    if (breakdown.isCombinedFreight) {
      if (!excludedCosts.combinedFreight) total += breakdown.combinedFreight;
    } else {
      if (!excludedCosts.portBorder) total += breakdown.portBorder;
      if (!excludedCosts.borderDestination) total += breakdown.borderDestination;
    }
    
    if (!excludedCosts.weightSurcharge) total += breakdown.weightSurcharge;
    if (!excludedCosts.dp) total += breakdown.dp;
    if (!excludedCosts.domesticTransport) total += breakdown.domesticTransport;
    
    breakdown.otherCosts.forEach((item, index) => {
      if (!excludedCosts[`other_${index}`]) {
        total += item.amount;
      }
    });
    
    return total;
  };

  const costTotal = calculateCostTotal();
  const profit = sellingPrice - costTotal;
  const profitRate = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;
  const carrier = getCarrier();

  const handleSave = async () => {
    if (!user) return;

    if (sellingPrice <= 0) {
      toast({
        title: '오류',
        description: '제시운임을 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }

    if (sellingPrice < costTotal) {
      toast({
        title: '경고',
        description: '제시운임이 원가보다 낮습니다. 계속하시겠습니까?',
        variant: 'destructive',
      });
    }

    // ✅ Start saving
    setIsSaving(true);

    try {
      await addQuotation({
        breakdown,
        input,
        destinationName,
        costTotal,
        sellingPrice,
        profit,
        profitRate,
        createdBy: user.id,
        createdByUsername: user.username,
        carrier,
        excludedCosts,
        notes,
      });

      toast({
        title: '저장 완료',
        description: '견적서가 저장되었습니다.',
      });

      // ✅ FIXED: 저장 완료 후 isSaving을 false로 설정하고 hasSaved를 true로 설정
      setIsSaving(false);
      setHasSaved(true);
    } catch (error) {
      console.error('Error saving quotation:', error);
      toast({
        title: '저장 실패',
        description: '견적서 저장에 실패했습니다.',
        variant: 'destructive',
      });
      setIsSaving(false);
    }
  };

  const handleViewQuotation = () => {
    if (!user) {
      toast({
        title: '오류',
        description: '로그인이 필요합니다.',
        variant: 'destructive',
      });
      return;
    }

    if (sellingPrice <= 0) {
      toast({
        title: '오류',
        description: '제시운임을 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }

    setShowQuotationView(true);
  };

  const handleExportExcel = () => {
    if (!user) return;

    if (sellingPrice <= 0) {
      toast({
        title: '오류',
        description: '제시운임을 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }

    exportQuotationToExcel({
      breakdown,
      input,
      destinationName,
      costTotal,
      sellingPrice,
      profit,
      profitRate,
      createdByUsername: user.username,
      createdAt: new Date().toISOString(),
      excludedCosts,
      carrier,
      note: notes,
    });

    toast({
      title: '엑셀 다운로드 완료',
      description: '견적서가 엑셀 파일로 다운로드되었습니다.',
    });
  };

  const handleBack = () => {
    setShowQuotationView(false);
  };

  if (showQuotationView) {
    // Build route title
    const routeTitle = `${input.pol}-${input.pod}-${destinationName}`;
    
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[1200px] max-w-[90vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-center text-gray-900">운임 견적서</DialogTitle>
            <DialogDescription className="text-center text-sm text-gray-600">
              {routeTitle} | 작성자: {user?.username} | 작성일: {new Date().toLocaleDateString('ko-KR')}
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
                  {!excludedCosts.localCharge && breakdown.localCharge > 0 && (
                    <TableHead className="border border-gray-200 font-bold text-center text-xs py-2 text-gray-900">LOCAL</TableHead>
                  )}
                  {breakdown.llocal !== 0 && (
                    <TableHead className="border border-gray-200 font-bold text-center text-xs py-2 text-gray-900">L.LOCAL</TableHead>
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
                    <TableHead className="border border-gray-200 font-bold text-center text-xs py-2 text-gray-900">국내 비용</TableHead>
                  )}
                  {breakdown.otherCosts.map((item, index) => {
                    if (!excludedCosts[`other_${index}`]) {
                      return (
                        <TableHead key={index} className="border border-gray-200 font-bold text-center text-xs py-2 text-gray-900">
                          {item.category || '기타 비용'}
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
                  <TableCell className="border border-gray-200 text-center text-xs py-2 text-gray-700">{carrier || ''}</TableCell>
                  <TableCell className="border border-gray-200 text-center text-xs py-2 text-gray-700">40'HQ</TableCell>
                  {!excludedCosts.seaFreight && (
                    <TableCell className="border border-gray-200 text-center text-xs py-2 text-gray-700">${breakdown.seaFreight.toLocaleString()}</TableCell>
                  )}
                  {!excludedCosts.localCharge && breakdown.localCharge > 0 && (
                    <TableCell className="border border-gray-200 text-center text-xs py-2 text-gray-700">${breakdown.localCharge.toLocaleString()}</TableCell>
                  )}
                  {breakdown.llocal !== 0 && (
                    <TableCell className={`border border-gray-200 text-center text-xs py-2 font-semibold ${breakdown.llocal < 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${breakdown.llocal.toLocaleString()}
                    </TableCell>
                  )}
                  {!excludedCosts.dthc && (
                    <TableCell className="border border-gray-200 text-center text-xs py-2 text-gray-700">${breakdown.dthc.toLocaleString()}</TableCell>
                  )}
                  {!breakdown.isCombinedFreight && !excludedCosts.portBorder && (
                    <TableCell className="border border-gray-200 text-center text-xs py-2 text-gray-700">${breakdown.portBorder.toLocaleString()}</TableCell>
                  )}
                  {!breakdown.isCombinedFreight && !excludedCosts.borderDestination && (
                    <TableCell className="border border-gray-200 text-center text-xs py-2 text-gray-700">${breakdown.borderDestination.toLocaleString()}</TableCell>
                  )}
                  {breakdown.isCombinedFreight && !excludedCosts.combinedFreight && (
                    <TableCell className="border border-gray-200 text-center text-xs py-2 text-gray-700">${breakdown.combinedFreight.toLocaleString()}</TableCell>
                  )}
                  {!excludedCosts.weightSurcharge && breakdown.weightSurcharge > 0 && (
                    <TableCell className="border border-gray-200 text-center text-xs py-2 text-gray-700">${breakdown.weightSurcharge.toLocaleString()}</TableCell>
                  )}
                  {!excludedCosts.dp && breakdown.dp > 0 && (
                    <TableCell className="border border-gray-200 text-center text-xs py-2 text-gray-700">${breakdown.dp.toLocaleString()}</TableCell>
                  )}
                  {!excludedCosts.domesticTransport && breakdown.domesticTransport > 0 && (
                    <TableCell className="border border-gray-200 text-center text-xs py-2 text-gray-700">${breakdown.domesticTransport.toLocaleString()}</TableCell>
                  )}
                  {breakdown.otherCosts.map((item, index) => {
                    if (!excludedCosts[`other_${index}`]) {
                      return (
                        <TableCell key={index} className="border border-gray-200 text-center text-xs py-2 text-gray-700">
                          ${item.amount.toLocaleString()}
                        </TableCell>
                      );
                    }
                    return null;
                  })}
                  <TableCell className="border border-gray-200 text-center text-xs py-2 font-bold bg-blue-50 text-blue-700">${costTotal.toLocaleString()}</TableCell>
                  <TableCell className="border border-gray-200 text-center text-xs py-2 font-bold bg-green-50 text-green-700">${sellingPrice.toLocaleString()}</TableCell>
                  <TableCell className={`border border-gray-200 text-center text-xs py-2 font-bold bg-yellow-50 ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${profit.toLocaleString()}
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
                <span className="font-semibold text-gray-700">이윤율:</span> <span className={`font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{profitRate.toFixed(2)}%</span>
              </div>
            </div>
            <p className="text-gray-600">* 상기 금액은 USD 기준입니다.</p>
            <p className="text-gray-600">* 운임은 시장 상황에 따라 변동될 수 있습니다.</p>
            {Object.values(excludedCosts).some(v => v) && (
              <p className="text-gray-600">* 일부 비용 항목이 제외되어 계산되었습니다.</p>
            )}
            {notes && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <p className="font-semibold text-gray-700 mb-1">메모:</p>
                <p className="text-gray-900 whitespace-pre-wrap">{notes}</p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 flex-wrap">
            <Button variant="outline" onClick={handleBack} className="border-gray-300 hover:bg-gray-100">
              뒤로가기
            </Button>
            <Button variant="outline" onClick={handleExportExcel} className="flex items-center gap-2 border-gray-300 hover:bg-gray-100">
              <FileSpreadsheet className="h-4 w-4" />
              엑셀 다운로드
            </Button>
            <Button 
              onClick={handleSave} 
              disabled={isSaving || hasSaved} 
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  저장 중...
                </>
              ) : hasSaved ? (
                '저장 완료'
              ) : (
                '저장'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[600px] max-w-[90vw] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900">
            <DollarSign className="h-5 w-5 text-blue-600" />
            견적서 작성
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            선택한 운임에 제시운임을 입력하여 이윤을 계산하고 견적서를 확인하세요.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Route Information - Compact */}
          <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-xs mb-1.5 text-gray-900">경로 정보</h3>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
              <div className="flex items-center gap-1">
                <span className="text-gray-600">출발항:</span> <span className="font-medium text-gray-900">{input.pol}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-gray-600">중국항:</span> <span className="font-medium text-gray-900">{input.pod}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-gray-600">최종목적지:</span> <span className="font-medium text-gray-900">{destinationName}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-gray-600">중량:</span> <span className="font-medium text-gray-900">{input.weight.toLocaleString()} kg</span>
              </div>
              <div className="col-span-2 flex items-center gap-1">
                <span className="text-gray-600">선택된 조합:</span> <span className="font-medium text-gray-900">{breakdown.agent}</span>
              </div>
              {carrier && (
                <div className="col-span-2 flex items-center gap-1">
                  <span className="text-gray-600">선사:</span> <span className="font-medium text-gray-900">{carrier}</span>
                </div>
              )}
            </div>
          </div>

          {/* Cost Breakdown Table - Compact */}
          <div>
            <h3 className="font-semibold text-xs mb-1.5 text-gray-900">비용 상세</h3>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="text-xs bg-gray-50">
                    <TableHead className="py-1.5 h-auto text-gray-900 font-semibold">항목</TableHead>
                    <TableHead className="text-right py-1.5 h-auto text-gray-900 font-semibold">금액 (USD)</TableHead>
                    <TableHead className="text-center py-1.5 h-auto text-gray-900 font-semibold">포함여부</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="text-xs">
                  <TableRow className={excludedCosts.seaFreight ? 'opacity-50' : ''}>
                    <TableCell className="py-1 text-gray-700">해상운임</TableCell>
                    <TableCell className="text-right py-1 text-gray-900">${excludedCosts.seaFreight ? 0 : breakdown.seaFreight.toLocaleString()}</TableCell>
                    <TableCell className="text-center py-1 text-gray-700">{excludedCosts.seaFreight ? '제외' : '포함'}</TableCell>
                  </TableRow>
                  {breakdown.localCharge > 0 && (
                    <TableRow className={excludedCosts.localCharge ? 'opacity-50' : ''}>
                      <TableCell className="py-1 text-gray-700">LOCAL</TableCell>
                      <TableCell className="text-right py-1 text-gray-900">${excludedCosts.localCharge ? 0 : breakdown.localCharge.toLocaleString()}</TableCell>
                      <TableCell className="text-center py-1 text-gray-700">{excludedCosts.localCharge ? '제외' : '포함'}</TableCell>
                    </TableRow>
                  )}
                  {breakdown.llocal !== 0 && (
                    <TableRow>
                      <TableCell className="py-1 text-gray-700">L.LOCAL</TableCell>
                      <TableCell className={`text-right py-1 font-semibold ${breakdown.llocal < 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${breakdown.llocal.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-center py-1 text-gray-700">항상 포함</TableCell>
                    </TableRow>
                  )}
                  <TableRow className={excludedCosts.dthc ? 'opacity-50' : ''}>
                    <TableCell className="py-1 text-gray-700">D/O (DTHC)</TableCell>
                    <TableCell className="text-right py-1 text-gray-900">${excludedCosts.dthc ? 0 : breakdown.dthc.toLocaleString()}</TableCell>
                    <TableCell className="text-center py-1 text-gray-700">{excludedCosts.dthc ? '제외' : '포함'}</TableCell>
                  </TableRow>
                  {breakdown.isCombinedFreight ? (
                    <TableRow className={excludedCosts.combinedFreight ? 'opacity-50' : ''}>
                      <TableCell className="py-1 text-gray-700">통합운임</TableCell>
                      <TableCell className="text-right py-1 text-gray-900">${excludedCosts.combinedFreight ? 0 : breakdown.combinedFreight.toLocaleString()}</TableCell>
                      <TableCell className="text-center py-1 text-gray-700">{excludedCosts.combinedFreight ? '제외' : '포함'}</TableCell>
                    </TableRow>
                  ) : (
                    <>
                      <TableRow className={excludedCosts.portBorder ? 'opacity-50' : ''}>
                        <TableCell className="py-1 text-gray-700">철도운임</TableCell>
                        <TableCell className="text-right py-1 text-gray-900">${excludedCosts.portBorder ? 0 : breakdown.portBorder.toLocaleString()}</TableCell>
                        <TableCell className="text-center py-1 text-gray-700">{excludedCosts.portBorder ? '제외' : '포함'}</TableCell>
                      </TableRow>
                      <TableRow className={excludedCosts.borderDestination ? 'opacity-50' : ''}>
                        <TableCell className="py-1 text-gray-700">트럭운임</TableCell>
                        <TableCell className="text-right py-1 text-gray-900">${excludedCosts.borderDestination ? 0 : breakdown.borderDestination.toLocaleString()}</TableCell>
                        <TableCell className="text-center py-1 text-gray-700">{excludedCosts.borderDestination ? '제외' : '포함'}</TableCell>
                      </TableRow>
                    </>
                  )}
                  <TableRow className={excludedCosts.weightSurcharge ? 'opacity-50' : ''}>
                    <TableCell className="py-1 text-gray-700">중량할증</TableCell>
                    <TableCell className="text-right py-1 text-gray-900">${excludedCosts.weightSurcharge ? 0 : breakdown.weightSurcharge.toLocaleString()}</TableCell>
                    <TableCell className="text-center py-1 text-gray-700">{excludedCosts.weightSurcharge ? '제외' : '포함'}</TableCell>
                  </TableRow>
                  <TableRow className={excludedCosts.dp ? 'opacity-50' : ''}>
                    <TableCell className="py-1 text-gray-700">DP</TableCell>
                    <TableCell className="text-right py-1 text-gray-900">${excludedCosts.dp ? 0 : breakdown.dp.toLocaleString()}</TableCell>
                    <TableCell className="text-center py-1 text-gray-700">{excludedCosts.dp ? '제외' : '포함'}</TableCell>
                  </TableRow>
                  <TableRow className={excludedCosts.domesticTransport ? 'opacity-50' : ''}>
                    <TableCell className="py-1 text-gray-700">국내 비용</TableCell>
                    <TableCell className="text-right py-1 text-gray-900">${excludedCosts.domesticTransport ? 0 : breakdown.domesticTransport.toLocaleString()}</TableCell>
                    <TableCell className="text-center py-1 text-gray-700">{excludedCosts.domesticTransport ? '제외' : '포함'}</TableCell>
                  </TableRow>
                  {breakdown.otherCosts.map((item, index) => (
                    <TableRow key={index} className={excludedCosts[`other_${index}`] ? 'opacity-50' : ''}>
                      <TableCell className="py-1 text-gray-700">{item.category || '기타 비용'}</TableCell>
                      <TableCell className="text-right py-1 text-gray-900">${excludedCosts[`other_${index}`] ? 0 : item.amount.toLocaleString()}</TableCell>
                      <TableCell className="text-center py-1 text-gray-700">{excludedCosts[`other_${index}`] ? '제외' : '포함'}</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold bg-gray-50 border-t-2 border-gray-300">
                    <TableCell className="py-1.5 text-gray-900">운임 원가 (Total Cost)</TableCell>
                    <TableCell className="text-right py-1.5 text-gray-900">${costTotal.toLocaleString()}</TableCell>
                    <TableCell className="py-1.5"></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Selling Price Input - Compact */}
          <div className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor="sellingPrice" className="text-xs font-semibold text-gray-900">
                제시운임 (Selling Price) *
              </Label>
              <Input
                id="sellingPrice"
                type="number"
                placeholder="0"
                value={sellingPrice || ''}
                onChange={(e) => setSellingPrice(Number(e.target.value))}
                className="text-sm h-9"
              />
              <p className="text-xs text-gray-600">고객에게 제시할 운임을 입력하세요 (USD)</p>
            </div>

            {/* Note Input */}
            <div className="space-y-1">
              <Label htmlFor="notes" className="text-xs font-semibold text-gray-900">
                메모 (선택사항)
              </Label>
              <Textarea
                id="notes"
                placeholder="견적서에 대한 메모를 입력하세요..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="text-sm min-h-[80px] resize-none"
                maxLength={500}
              />
              <p className="text-xs text-gray-600">최대 500자까지 입력 가능합니다 ({notes.length}/500)</p>
            </div>

            {/* Profit Calculation - Compact */}
            {sellingPrice > 0 && (
              <div className="p-2.5 bg-green-50 rounded-lg border border-green-200 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-700">이윤 (Profit):</span>
                  <span className={`text-sm font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${profit.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-700">이윤율 (Profit Rate):</span>
                  <span className={`text-sm font-bold flex items-center gap-1 ${profitRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    <TrendingUp className="h-3 w-3" />
                    {profitRate.toFixed(2)}%
                  </span>
                </div>
                {profit < 0 && (
                  <p className="text-xs text-red-600 mt-1">
                    ⚠️ 제시운임이 원가보다 낮습니다. 손실이 발생합니다.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-gray-300 hover:bg-gray-100">
            취소
          </Button>
          <Button onClick={handleViewQuotation} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700">
            <Eye className="h-4 w-4" />
            견적서 보기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}