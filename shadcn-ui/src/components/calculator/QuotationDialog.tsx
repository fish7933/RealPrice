import { useState, useEffect } from 'react';
import { AgentCostBreakdown, CostCalculationInput } from '@/types/freight';
import { useFreight } from '@/contexts/FreightContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { DollarSign, FileSpreadsheet, TrendingUp, Eye, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { exportQuotationToExcel, copyQuotationToClipboard } from '@/utils/excelExport';
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
  const [showQuotationView, setShowQuotationView] = useState(false);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setSellingPrice(0);
      setShowQuotationView(false);
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

  const handleSave = () => {
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

    addQuotation({
      breakdown,
      input,
      destinationName,
      costTotal,
      sellingPrice,
      profit,
      profitRate,
      createdBy: user.id,
      createdByUsername: user.username,
    });

    toast({
      title: '저장 완료',
      description: '견적서가 저장되었습니다.',
    });

    onOpenChange(false);
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
    });

    toast({
      title: '엑셀 다운로드 완료',
      description: '견적서가 엑셀 파일로 다운로드되었습니다.',
    });
  };

  const handleCopyToClipboard = async () => {
    if (!user) return;

    if (sellingPrice <= 0) {
      toast({
        title: '오류',
        description: '제시운임을 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }

    const success = await copyQuotationToClipboard({
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

  const handleBack = () => {
    setShowQuotationView(false);
  };

  if (showQuotationView) {
    // Build route title
    const routeTitle = `${input.pol}-${input.pod}-${destinationName}`;
    
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">운임 견적서</DialogTitle>
            <DialogDescription className="text-center">
              {routeTitle} | 작성자: {user?.username} | 작성일: {new Date().toLocaleDateString('ko-KR')}
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-x-auto">
            <Table className="border">
              <TableHeader>
                <TableRow className="bg-gray-100">
                  <TableHead className="border font-bold text-center min-w-[150px]">경로</TableHead>
                  <TableHead className="border font-bold text-center min-w-[100px]">CARRIER</TableHead>
                  <TableHead className="border font-bold text-center min-w-[100px]">CNTR SIZE</TableHead>
                  {!excludedCosts.seaFreight && (
                    <TableHead className="border font-bold text-center min-w-[100px]">
                      {input.pol}-{input.pod}
                    </TableHead>
                  )}
                  {!excludedCosts.dthc && (
                    <TableHead className="border font-bold text-center min-w-[100px]">D/O FEE</TableHead>
                  )}
                  {!breakdown.isCombinedFreight && !excludedCosts.portBorder && (
                    <TableHead className="border font-bold text-center min-w-[100px]">
                      {input.pod}-국경
                    </TableHead>
                  )}
                  {!breakdown.isCombinedFreight && !excludedCosts.borderDestination && (
                    <TableHead className="border font-bold text-center min-w-[100px]">
                      국경-{destinationName}
                    </TableHead>
                  )}
                  {breakdown.isCombinedFreight && !excludedCosts.combinedFreight && (
                    <TableHead className="border font-bold text-center min-w-[100px]">
                      {input.pod}-{destinationName}
                    </TableHead>
                  )}
                  {!excludedCosts.weightSurcharge && breakdown.weightSurcharge > 0 && (
                    <TableHead className="border font-bold text-center min-w-[100px]">중량할증</TableHead>
                  )}
                  {!excludedCosts.dp && breakdown.dp > 0 && (
                    <TableHead className="border font-bold text-center min-w-[80px]">DP</TableHead>
                  )}
                  {!excludedCosts.domesticTransport && breakdown.domesticTransport > 0 && (
                    <TableHead className="border font-bold text-center min-w-[100px]">국내운송</TableHead>
                  )}
                  {breakdown.otherCosts.map((item, index) => {
                    if (!excludedCosts[`other_${index}`]) {
                      return (
                        <TableHead key={index} className="border font-bold text-center min-w-[100px]">
                          {item.category}
                        </TableHead>
                      );
                    }
                    return null;
                  })}
                  <TableHead className="border font-bold text-center min-w-[100px] bg-blue-50">TOTAL</TableHead>
                  <TableHead className="border font-bold text-center min-w-[100px] bg-green-50">SELLING</TableHead>
                  <TableHead className="border font-bold text-center min-w-[100px] bg-yellow-50">PROFIT</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="border text-center font-medium">{destinationName}</TableCell>
                  <TableCell className="border text-center">{carrier || ''}</TableCell>
                  <TableCell className="border text-center">40'HQ</TableCell>
                  {!excludedCosts.seaFreight && (
                    <TableCell className="border text-center">{breakdown.seaFreight}</TableCell>
                  )}
                  {!excludedCosts.dthc && (
                    <TableCell className="border text-center">{breakdown.dthc}</TableCell>
                  )}
                  {!breakdown.isCombinedFreight && !excludedCosts.portBorder && (
                    <TableCell className="border text-center">{breakdown.portBorder}</TableCell>
                  )}
                  {!breakdown.isCombinedFreight && !excludedCosts.borderDestination && (
                    <TableCell className="border text-center">{breakdown.borderDestination}</TableCell>
                  )}
                  {breakdown.isCombinedFreight && !excludedCosts.combinedFreight && (
                    <TableCell className="border text-center">{breakdown.combinedFreight}</TableCell>
                  )}
                  {!excludedCosts.weightSurcharge && breakdown.weightSurcharge > 0 && (
                    <TableCell className="border text-center">{breakdown.weightSurcharge}</TableCell>
                  )}
                  {!excludedCosts.dp && breakdown.dp > 0 && (
                    <TableCell className="border text-center">{breakdown.dp}</TableCell>
                  )}
                  {!excludedCosts.domesticTransport && breakdown.domesticTransport > 0 && (
                    <TableCell className="border text-center">{breakdown.domesticTransport}</TableCell>
                  )}
                  {breakdown.otherCosts.map((item, index) => {
                    if (!excludedCosts[`other_${index}`]) {
                      return (
                        <TableCell key={index} className="border text-center">
                          {item.amount}
                        </TableCell>
                      );
                    }
                    return null;
                  })}
                  <TableCell className="border text-center font-bold bg-blue-50">{costTotal}</TableCell>
                  <TableCell className="border text-center font-bold bg-green-50">{sellingPrice}</TableCell>
                  <TableCell className={`border text-center font-bold bg-yellow-50 ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {profit}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          <div className="space-y-2 text-sm text-gray-600 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="font-semibold">중량:</span> {input.weight.toLocaleString()} kg
              </div>
              <div>
                <span className="font-semibold">이윤율:</span> <span className={profit >= 0 ? 'text-green-600' : 'text-red-600'}>{profitRate.toFixed(2)}%</span>
              </div>
            </div>
            <p>* 상기 금액은 USD 기준입니다.</p>
            <p>* 운임은 시장 상황에 따라 변동될 수 있습니다.</p>
            {Object.values(excludedCosts).some(v => v) && (
              <p>* 일부 비용 항목이 제외되어 계산되었습니다.</p>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleBack}>
              뒤로가기
            </Button>
            <Button variant="outline" onClick={handleCopyToClipboard} className="flex items-center gap-2">
              <Copy className="h-4 w-4" />
              클립보드 복사
            </Button>
            <Button variant="outline" onClick={handleExportExcel} className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              엑셀 다운로드
            </Button>
            <Button onClick={handleSave}>
              저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            견적서 작성
          </DialogTitle>
          <DialogDescription>
            선택한 운임에 제시운임을 입력하여 이윤을 계산하고 견적서를 확인하세요.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Route Information */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">경로 정보</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-600">출발항:</span> <span className="font-medium">{input.pol}</span>
              </div>
              <div>
                <span className="text-gray-600">중국항:</span> <span className="font-medium">{input.pod}</span>
              </div>
              <div>
                <span className="text-gray-600">최종목적지:</span> <span className="font-medium">{destinationName}</span>
              </div>
              <div>
                <span className="text-gray-600">중량:</span> <span className="font-medium">{input.weight.toLocaleString()} kg</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-600">선택된 조합:</span> <span className="font-medium">{breakdown.agent}</span>
              </div>
              {carrier && (
                <div className="col-span-2">
                  <span className="text-gray-600">선사:</span> <span className="font-medium">{carrier}</span>
                </div>
              )}
            </div>
          </div>

          {/* Cost Breakdown Table */}
          <div>
            <h3 className="font-semibold mb-2">비용 상세</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>항목</TableHead>
                  <TableHead className="text-right">금액 (USD)</TableHead>
                  <TableHead className="text-center">포함여부</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className={excludedCosts.seaFreight ? 'opacity-50' : ''}>
                  <TableCell>해상운임</TableCell>
                  <TableCell className="text-right">${excludedCosts.seaFreight ? 0 : breakdown.seaFreight}</TableCell>
                  <TableCell className="text-center">{excludedCosts.seaFreight ? '제외' : '포함'}</TableCell>
                </TableRow>
                <TableRow className={excludedCosts.dthc ? 'opacity-50' : ''}>
                  <TableCell>D/O (DTHC)</TableCell>
                  <TableCell className="text-right">${excludedCosts.dthc ? 0 : breakdown.dthc}</TableCell>
                  <TableCell className="text-center">{excludedCosts.dthc ? '제외' : '포함'}</TableCell>
                </TableRow>
                {breakdown.isCombinedFreight ? (
                  <TableRow className={excludedCosts.combinedFreight ? 'opacity-50' : ''}>
                    <TableCell>통합운임</TableCell>
                    <TableCell className="text-right">${excludedCosts.combinedFreight ? 0 : breakdown.combinedFreight}</TableCell>
                    <TableCell className="text-center">{excludedCosts.combinedFreight ? '제외' : '포함'}</TableCell>
                  </TableRow>
                ) : (
                  <>
                    <TableRow className={excludedCosts.portBorder ? 'opacity-50' : ''}>
                      <TableCell>철도운임</TableCell>
                      <TableCell className="text-right">${excludedCosts.portBorder ? 0 : breakdown.portBorder}</TableCell>
                      <TableCell className="text-center">{excludedCosts.portBorder ? '제외' : '포함'}</TableCell>
                    </TableRow>
                    <TableRow className={excludedCosts.borderDestination ? 'opacity-50' : ''}>
                      <TableCell>트럭운임</TableCell>
                      <TableCell className="text-right">${excludedCosts.borderDestination ? 0 : breakdown.borderDestination}</TableCell>
                      <TableCell className="text-center">{excludedCosts.borderDestination ? '제외' : '포함'}</TableCell>
                    </TableRow>
                  </>
                )}
                <TableRow className={excludedCosts.weightSurcharge ? 'opacity-50' : ''}>
                  <TableCell>중량할증</TableCell>
                  <TableCell className="text-right">${excludedCosts.weightSurcharge ? 0 : breakdown.weightSurcharge}</TableCell>
                  <TableCell className="text-center">{excludedCosts.weightSurcharge ? '제외' : '포함'}</TableCell>
                </TableRow>
                <TableRow className={excludedCosts.dp ? 'opacity-50' : ''}>
                  <TableCell>DP</TableCell>
                  <TableCell className="text-right">${excludedCosts.dp ? 0 : breakdown.dp}</TableCell>
                  <TableCell className="text-center">{excludedCosts.dp ? '제외' : '포함'}</TableCell>
                </TableRow>
                <TableRow className={excludedCosts.domesticTransport ? 'opacity-50' : ''}>
                  <TableCell>국내운송료</TableCell>
                  <TableCell className="text-right">${excludedCosts.domesticTransport ? 0 : breakdown.domesticTransport}</TableCell>
                  <TableCell className="text-center">{excludedCosts.domesticTransport ? '제외' : '포함'}</TableCell>
                </TableRow>
                {breakdown.otherCosts.map((item, index) => (
                  <TableRow key={index} className={excludedCosts[`other_${index}`] ? 'opacity-50' : ''}>
                    <TableCell>{item.category}</TableCell>
                    <TableCell className="text-right">${excludedCosts[`other_${index}`] ? 0 : item.amount}</TableCell>
                    <TableCell className="text-center">{excludedCosts[`other_${index}`] ? '제외' : '포함'}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-bold bg-gray-100">
                  <TableCell>운임 원가 (Total Cost)</TableCell>
                  <TableCell className="text-right">${costTotal.toLocaleString()}</TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* Selling Price Input */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sellingPrice" className="text-base font-semibold">
                제시운임 (Selling Price) *
              </Label>
              <Input
                id="sellingPrice"
                type="number"
                placeholder="0"
                value={sellingPrice || ''}
                onChange={(e) => setSellingPrice(Number(e.target.value))}
                className="text-lg"
              />
              <p className="text-xs text-gray-500">고객에게 제시할 운임을 입력하세요 (USD)</p>
            </div>

            {/* Profit Calculation */}
            {sellingPrice > 0 && (
              <div className="p-4 bg-green-50 rounded-lg border border-green-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">이윤 (Profit):</span>
                  <span className={`text-lg font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${profit.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold">이윤율 (Profit Rate):</span>
                  <span className={`text-lg font-bold flex items-center gap-1 ${profitRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    <TrendingUp className="h-4 w-4" />
                    {profitRate.toFixed(2)}%
                  </span>
                </div>
                {profit < 0 && (
                  <p className="text-xs text-red-600 mt-2">
                    ⚠️ 제시운임이 원가보다 낮습니다. 손실이 발생합니다.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          <Button onClick={handleViewQuotation} className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            견적서 보기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}