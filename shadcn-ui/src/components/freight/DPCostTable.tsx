import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFreight } from '@/contexts/FreightContext';
import { DPCost } from '@/types/freight';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash2, Plus, DollarSign, AlertTriangle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AuditLogTable from './AuditLogTable';
import { ValidityPeriodInput } from '@/components/ui/validity-period-input';
import { getValidityStatus, formatValidityDate, validateNoOverlap } from '@/utils/validityHelper';
import { Badge } from '@/components/ui/badge';

interface VersionChangeData {
  port: string;
  amount: number;
  validFrom: string;
  validTo: string;
  currentVersion: number;
  nextVersion: number;
}

export default function DPCostTable() {
  const { user } = useAuth();
  const { dpCosts, addDPCost, updateDPCost, deleteDPCost, getAuditLogsByType, ports } = useFreight();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isVersionChangeDialogOpen, setIsVersionChangeDialogOpen] = useState(false);
  const [versionChangeData, setVersionChangeData] = useState<VersionChangeData | null>(null);
  const [originalDpId, setOriginalDpId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    port: '',
    amount: '',
    validFrom: '',
    validTo: '',
  });

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  
  // Get POL ports from the ports list
  const polPorts = ports.filter(p => p.type === 'POL');

  const handleAdd = () => {
    if (!formData.port || !formData.amount || !formData.validFrom || !formData.validTo) return;

    const existingDP = dpCosts.find(dp => dp.port === formData.port);
    
    const error = validateNoOverlap(
      formData.validFrom,
      formData.validTo,
      existingDP?.id || '',
      dpCosts,
      (item) => item.port === formData.port
    );

    if (error) {
      setValidationError(error);
      return;
    }

    if (existingDP) {
      updateDPCost(existingDP.id, {
        port: formData.port,
        amount: Number(formData.amount),
        validFrom: formData.validFrom,
        validTo: formData.validTo,
      });
    } else {
      addDPCost({
        port: formData.port,
        amount: Number(formData.amount),
        validFrom: formData.validFrom,
        validTo: formData.validTo,
      });
    }

    setFormData({ port: '', amount: '', validFrom: '', validTo: '' });
    setValidationError(null);
    setIsAddDialogOpen(false);
  };

  const handleVersionChangeClick = (dp: DPCost) => {
    const relevantItems = dpCosts.filter((item) => item.port === dp.port);
    const maxVersion = Math.max(...relevantItems.map(item => item.version || 1), 0);
    const nextVersion = maxVersion + 1;

    let validFrom = '';
    let validTo = '';

    try {
      if (!dp.validTo || dp.validTo === '') {
        const today = new Date();
        validFrom = today.toISOString().split('T')[0];
      } else {
        const validFromDate = new Date(dp.validTo);
        if (isNaN(validFromDate.getTime())) {
          const today = new Date();
          validFrom = today.toISOString().split('T')[0];
        } else {
          validFromDate.setDate(validFromDate.getDate() + 1);
          validFrom = validFromDate.toISOString().split('T')[0];
        }
      }

      const validToDate = new Date(validFrom);
      validToDate.setMonth(validToDate.getMonth() + 1);
      validTo = validToDate.toISOString().split('T')[0];
    } catch (error) {
      console.error('Error calculating validity dates:', error);
      const today = new Date();
      validFrom = today.toISOString().split('T')[0];
      const nextMonth = new Date(today);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      validTo = nextMonth.toISOString().split('T')[0];
    }

    setVersionChangeData({
      port: dp.port,
      amount: dp.amount,
      validFrom,
      validTo,
      currentVersion: dp.version || 1,
      nextVersion,
    });
    setOriginalDpId(dp.id);
    setValidationError(null);
    setIsVersionChangeDialogOpen(true);
  };

  const handleVersionChangeSave = () => {
    if (!versionChangeData || !originalDpId) return;

    if (!versionChangeData.amount || !versionChangeData.validFrom || !versionChangeData.validTo) {
      setValidationError('❌ 모든 필수 항목을 입력해주세요.');
      return;
    }

    updateDPCost(originalDpId, {
      amount: versionChangeData.amount,
      validFrom: versionChangeData.validFrom,
      validTo: versionChangeData.validTo,
    });

    setIsVersionChangeDialogOpen(false);
    setVersionChangeData(null);
    setOriginalDpId(null);
    setValidationError(null);
  };

  const handleVersionChangeCancel = () => {
    setIsVersionChangeDialogOpen(false);
    setVersionChangeData(null);
    setOriginalDpId(null);
    setValidationError(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('이 DP 비용을 삭제하시겠습니까?')) {
      deleteDPCost(id);
    }
  };

  const handleOpenDialog = () => {
    setFormData({ port: '', amount: '', validFrom: '', validTo: '' });
    setValidationError(null);
    setIsAddDialogOpen(true);
  };

  const auditLogs = getAuditLogsByType('dpCost');
  const expiredRates = dpCosts.filter(d => getValidityStatus(d.validFrom, d.validTo).status === 'expired');
  const expiringRates = dpCosts.filter(d => getValidityStatus(d.validFrom, d.validTo).status === 'expiring');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><Package className="h-6 w-6" />DP 비용 관리</h2>
          <p className="text-gray-600 mt-1">항구별 DP(Delivery Point) 비용 설정</p>
        </div>
        {isAdmin && (
          <Button onClick={handleOpenDialog}>
            <Plus className="h-4 w-4 mr-2" />
            DP 비용 추가
          </Button>
        )}
      </div>

      <Alert>
        <DollarSign className="h-4 w-4" />
        <AlertDescription>
          <strong>DP(Delivery Point):</strong> 항구에서 발생하는 배송 지점 비용입니다. 원가 계산 시 선택적으로 포함할 수 있습니다.
        </AlertDescription>
      </Alert>

      {(expiredRates.length > 0 || expiringRates.length > 0) && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {expiredRates.length > 0 && (
              <div className="font-semibold">
                ⚠️ {expiredRates.length}개의 DP 비용이 만료되었습니다.
              </div>
            )}
            {expiringRates.length > 0 && (
              <div className="text-sm mt-1">
                📅 {expiringRates.length}개의 DP 비용이 7일 이내에 만료됩니다.
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="border rounded-lg overflow-hidden bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>버전</TableHead>
              <TableHead>항구</TableHead>
              <TableHead>DP 비용 (USD)</TableHead>
              <TableHead>유효기간</TableHead>
              <TableHead>상태</TableHead>
              {isAdmin && <TableHead className="text-right">작업</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {dpCosts.map((dpCost) => {
              const validityStatus = getValidityStatus(dpCost.validFrom, dpCost.validTo);
              
              return (
                <TableRow key={dpCost.id}>
                  <TableCell>
                    <Badge variant="outline">v{dpCost.version || 1}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{dpCost.port}</TableCell>
                  <TableCell>${dpCost.amount}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{formatValidityDate(dpCost.validFrom)}</div>
                      <div className="text-gray-500">~ {formatValidityDate(dpCost.validTo)}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={validityStatus.variant}>
                      {validityStatus.label}
                    </Badge>
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleVersionChangeClick(dpCost)}
                          className="bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-300"
                        >
                          <RefreshCw className="h-4 w-4 mr-1" />
                          버전 변경
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(dpCost.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
            {dpCosts.length === 0 && (
              <TableRow>
                <TableCell colSpan={isAdmin ? 6 : 5} className="text-center text-gray-500">
                  설정된 DP 비용이 없습니다
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AuditLogTable 
        logs={auditLogs}
        title="DP 비용 버전 기록"
        description="DP 비용의 모든 변경 내역이 버전별로 기록됩니다. '버전 변경' 버튼을 클릭하면 플로팅 화면에서 새 버전의 정보를 수정할 수 있습니다."
      />

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
        setIsAddDialogOpen(open);
        if (!open) setValidationError(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>DP 비용 추가/수정</DialogTitle>
            <DialogDescription>항구별 DP 비용을 입력하세요.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {validationError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-semibold">유효기간 중복 오류</div>
                  <div className="text-sm mt-1">{validationError}</div>
                </AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label>항구</Label>
              {polPorts.length > 0 ? (
                <Select value={formData.port} onValueChange={(value) => {
                  setFormData({ ...formData, port: value });
                  setValidationError(null);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="항구 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {polPorts.map((port) => (
                      <SelectItem key={port.id} value={port.name}>
                        {port.name}
                        {dpCosts.find(dp => dp.port === port.name) && 
                          <span className="ml-2 text-xs text-blue-600">(기존 데이터 있음)</span>
                        }
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
              <Label>DP 비용 (USD)</Label>
              <Input
                type="number"
                placeholder="예: 50"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>유효기간 *</Label>
              <ValidityPeriodInput
                validFrom={formData.validFrom}
                validTo={formData.validTo}
                onChange={(validFrom, validTo) => {
                  setFormData({ ...formData, validFrom, validTo });
                  setValidationError(null);
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddDialogOpen(false);
              setValidationError(null);
            }}>
              취소
            </Button>
            <Button onClick={handleAdd}>
              {formData.port && dpCosts.find(dp => dp.port === formData.port) ? '수정' : '추가'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Version Change Dialog */}
      <Dialog open={isVersionChangeDialogOpen} onOpenChange={handleVersionChangeCancel}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-purple-600" />
              버전 변경
            </DialogTitle>
            <DialogDescription>
              새로운 버전의 DP 비용 정보를 수정하세요. 버전이 자동으로 증가하고 유효기간이 설정됩니다.
            </DialogDescription>
          </DialogHeader>
          {versionChangeData && (
            <div className="space-y-4 py-4">
              {validationError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-semibold">유효성 검증 오류</div>
                    <div className="text-sm mt-1 whitespace-pre-line">{validationError}</div>
                  </AlertDescription>
                </Alert>
              )}

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-base">
                      v{versionChangeData.currentVersion}
                    </Badge>
                    <span className="text-purple-600 font-bold">→</span>
                    <Badge variant="default" className="bg-purple-600 text-base">
                      v{versionChangeData.nextVersion}
                    </Badge>
                  </div>
                  <span className="text-sm text-purple-700 font-medium">
                    🆕 새 버전 생성
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>항구</Label>
                <Input value={versionChangeData.port} disabled className="bg-gray-50" />
              </div>

              <div className="space-y-2">
                <Label>DP 비용 (USD) *</Label>
                <Input
                  type="number"
                  value={versionChangeData.amount}
                  onChange={(e) => {
                    setVersionChangeData({
                      ...versionChangeData,
                      amount: Number(e.target.value)
                    });
                    setValidationError(null);
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label>유효기간 *</Label>
                <ValidityPeriodInput
                  validFrom={versionChangeData.validFrom}
                  validTo={versionChangeData.validTo}
                  onChange={(validFrom, validTo) => {
                    setVersionChangeData({
                      ...versionChangeData,
                      validFrom,
                      validTo
                    });
                    setValidationError(null);
                  }}
                />
                <div className="text-xs space-y-1 bg-blue-50 border border-blue-200 rounded p-3">
                  <p className="text-blue-700 font-medium">
                    📅 유효기간이 자동으로 설정되었습니다:
                  </p>
                  <p className="text-blue-600">
                    • 시작일: 이전 버전 종료일 + 1일
                  </p>
                  <p className="text-blue-600">
                    • 종료일: 시작일 + 1개월
                  </p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={handleVersionChangeCancel}>
              취소
            </Button>
            <Button 
              onClick={handleVersionChangeSave}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              버전 변경 저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}