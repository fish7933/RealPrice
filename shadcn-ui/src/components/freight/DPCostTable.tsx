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
import { Trash2, Plus, DollarSign, AlertTriangle, Package, Sparkles, Edit } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AuditLogTable from './AuditLogTable';
import { ValidityPeriodInput } from '@/components/ui/validity-period-input';
import { getValidityStatus, formatValidityDate, checkOverlapWarning } from '@/utils/validityHelper';
import { Badge } from '@/components/ui/badge';

export default function DPCostTable() {
  const { user } = useAuth();
  const { dpCosts, addDPCost, updateDPCost, deleteDPCost, getAuditLogsByType, ports } = useFreight();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingDp, setEditingDp] = useState<DPCost | null>(null);
  const [validationWarning, setValidationWarning] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    port: '',
    amount: '',
    validFrom: '',
    validTo: '',
  });

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  
  const polPorts = ports.filter(p => p.type === 'POL');

  const handleAdd = () => {
    if (!formData.port || !formData.amount || !formData.validFrom || !formData.validTo) {
      setValidationWarning('❌ 모든 필수 항목을 입력해주세요.');
      return;
    }

    const warning = checkOverlapWarning(
      formData.validFrom,
      formData.validTo,
      '',
      dpCosts,
      (item) => item.port === formData.port
    );

    if (warning) {
      setValidationWarning(warning);
      return;
    }

    addDPCost({
      port: formData.port,
      amount: Number(formData.amount),
      validFrom: formData.validFrom,
      validTo: formData.validTo,
    });

    setFormData({ port: '', amount: '', validFrom: '', validTo: '' });
    setValidationWarning(null);
    setIsAddDialogOpen(false);
  };

  const handleAddIgnoreWarning = () => {
    if (!formData.port || !formData.amount || !formData.validFrom || !formData.validTo) return;

    addDPCost({
      port: formData.port,
      amount: Number(formData.amount),
      validFrom: formData.validFrom,
      validTo: formData.validTo,
    });

    setFormData({ port: '', amount: '', validFrom: '', validTo: '' });
    setValidationWarning(null);
    setIsAddDialogOpen(false);
  };

  const handleEditClick = (dp: DPCost) => {
    setEditingDp(dp);
    setFormData({
      port: dp.port,
      amount: dp.amount.toString(),
      validFrom: dp.validFrom,
      validTo: dp.validTo,
    });
    setValidationWarning(null);
    setIsEditDialogOpen(true);
  };

  const handleEditSave = () => {
    if (!editingDp) return;
    
    if (!formData.amount || !formData.validFrom || !formData.validTo) {
      setValidationWarning('❌ 모든 필수 항목을 입력해주세요.');
      return;
    }

    updateDPCost(editingDp.id, {
      amount: Number(formData.amount),
      validFrom: formData.validFrom,
      validTo: formData.validTo,
    });

    setIsEditDialogOpen(false);
    setEditingDp(null);
    setFormData({ port: '', amount: '', validFrom: '', validTo: '' });
    setValidationWarning(null);
  };

  const handleEditCancel = () => {
    setIsEditDialogOpen(false);
    setEditingDp(null);
    setFormData({ port: '', amount: '', validFrom: '', validTo: '' });
    setValidationWarning(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('이 DP 비용을 삭제하시겠습니까?')) {
      deleteDPCost(id);
    }
  };

  const handleOpenDialog = () => {
    setFormData({ port: '', amount: '', validFrom: '', validTo: '' });
    setValidationWarning(null);
    setIsAddDialogOpen(true);
  };

  const auditLogs = getAuditLogsByType('dpCost');
  const expiredRates = dpCosts.filter(d => getValidityStatus(d.validFrom, d.validTo).status === 'expired');
  const expiringRates = dpCosts.filter(d => getValidityStatus(d.validFrom, d.validTo).status === 'expiring');

  return (
    <div className="space-y-4">
      {/* Header - Compact */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-rose-500 via-pink-500 to-fuchsia-500 p-4 shadow-lg">
        <div className="absolute inset-0 bg-grid-white/10"></div>
        <div className="relative flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-white/20 backdrop-blur-sm rounded-lg">
              <Package className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                DP 비용 관리
                <Sparkles className="h-4 w-4 text-yellow-300 animate-pulse" />
              </h2>
              <p className="text-xs text-rose-50">항구별 DP 비용</p>
            </div>
          </div>
          {isAdmin && (
            <Button 
              onClick={handleOpenDialog}
              size="sm"
              className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border border-white/50"
            >
              <Plus className="h-3 w-3 mr-1" />
              추가
            </Button>
          )}
        </div>
      </div>

      {/* Info Alert - Compact */}
      <Alert className="py-2">
        <DollarSign className="h-4 w-4" />
        <AlertDescription className="text-xs">
          <strong>DP(Delivery Point):</strong> 항구에서 발생하는 배송 지점 비용입니다. 원가 계산 시 선택적으로 포함할 수 있습니다.
        </AlertDescription>
      </Alert>

      {/* Warning Alert - Compact */}
      {(expiredRates.length > 0 || expiringRates.length > 0) && (
        <Alert variant="destructive" className="py-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            {expiredRates.length > 0 && <span>⚠️ {expiredRates.length}개 만료</span>}
            {expiredRates.length > 0 && expiringRates.length > 0 && <span> · </span>}
            {expiringRates.length > 0 && <span>📅 {expiringRates.length}개 만료임박</span>}
          </AlertDescription>
        </Alert>
      )}

      {/* Table - Compact */}
      <div className="rounded-lg border overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-600">
              <TableHead className="h-9 text-xs font-bold whitespace-nowrap">항구</TableHead>
              <TableHead className="h-9 text-xs font-bold whitespace-nowrap">DP 비용</TableHead>
              <TableHead className="h-9 text-xs font-bold whitespace-nowrap">유효기간</TableHead>
              <TableHead className="h-9 text-xs font-bold whitespace-nowrap">상태</TableHead>
              {isAdmin && <TableHead className="h-9 text-xs text-right font-bold whitespace-nowrap">작업</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {dpCosts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((dpCost) => {
              const validityStatus = getValidityStatus(dpCost.validFrom, dpCost.validTo);
              
              return (
                <TableRow key={dpCost.id} className="hover:bg-gray-50/50">
                  <TableCell className="py-2 text-xs font-medium whitespace-nowrap">{dpCost.port}</TableCell>
                  <TableCell className="py-2 text-xs font-semibold text-rose-700 whitespace-nowrap">${dpCost.amount}</TableCell>
                  <TableCell className="py-2 text-xs whitespace-nowrap">
                    {formatValidityDate(dpCost.validFrom)} ~ {formatValidityDate(dpCost.validTo)}
                  </TableCell>
                  <TableCell className="py-2 whitespace-nowrap">
                    <Badge variant={validityStatus.variant} className="text-xs px-1.5 py-0">
                      {validityStatus.label}
                    </Badge>
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="py-2 text-right whitespace-nowrap">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditClick(dpCost)}
                          className="h-6 px-2 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(dpCost.id)}
                          className="h-6 w-6 p-0 hover:bg-gray-50 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
            {dpCosts.length === 0 && (
              <TableRow>
                <TableCell colSpan={isAdmin ? 5 : 4} className="text-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    <Package className="h-12 w-12 text-rose-400" />
                    <p className="text-base font-semibold text-rose-900">설정된 DP 비용이 없습니다</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AuditLogTable 
        logs={auditLogs}
        title="DP 비용 변경 기록"
        description="DP 비용의 모든 변경 내역이 기록됩니다."
      />

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
        setIsAddDialogOpen(open);
        if (!open) setValidationWarning(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>DP 비용 추가</DialogTitle>
            <DialogDescription>항구별 DP 비용을 입력하세요.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {validationWarning && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-semibold">유효기간 중복 경고</div>
                  <div className="text-sm mt-1 whitespace-pre-line">{validationWarning}</div>
                  <div className="flex gap-2 mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setValidationWarning(null)}
                    >
                      취소
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleAddIgnoreWarning}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      경고 무시하고 계속
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label>항구</Label>
              {polPorts.length > 0 ? (
                <Select value={formData.port} onValueChange={(value) => {
                  setFormData({ ...formData, port: value });
                  setValidationWarning(null);
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
                  setValidationWarning(null);
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddDialogOpen(false);
              setValidationWarning(null);
            }}>
              취소
            </Button>
            <Button onClick={handleAdd}>추가</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={handleEditCancel}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-blue-600" />
              DP 비용 수정
            </DialogTitle>
            <DialogDescription>
              DP 비용 정보를 수정하세요.
            </DialogDescription>
          </DialogHeader>
          {editingDp && (
            <div className="space-y-4 py-4">
              {validationWarning && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-semibold">유효성 검증 오류</div>
                    <div className="text-sm mt-1 whitespace-pre-line">{validationWarning}</div>
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label>항구</Label>
                <Input value={formData.port} disabled className="bg-gray-50" />
              </div>

              <div className="space-y-2">
                <Label>DP 비용 (USD) *</Label>
                <Input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      amount: e.target.value
                    });
                    setValidationWarning(null);
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label>유효기간 *</Label>
                <ValidityPeriodInput
                  validFrom={formData.validFrom}
                  validTo={formData.validTo}
                  onChange={(validFrom, validTo) => {
                    setFormData({
                      ...formData,
                      validFrom,
                      validTo
                    });
                    setValidationWarning(null);
                  }}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={handleEditCancel}>
              취소
            </Button>
            <Button 
              onClick={handleEditSave}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Edit className="h-4 w-4 mr-2" />
              수정 저장
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}