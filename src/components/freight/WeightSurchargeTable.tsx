import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFreight } from '@/contexts/FreightContext';
import { WeightSurchargeRule } from '@/types/freight';
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
import { Trash2, Plus, Weight, AlertTriangle, Edit } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AuditLogTable from './AuditLogTable';
import { ValidityPeriodInput } from '@/components/ui/validity-period-input';
import { getValidityStatus, formatValidityDate, checkOverlapWarning } from '@/utils/validityHelper';
import { Badge } from '@/components/ui/badge';

export default function WeightSurchargeTable() {
  const { user } = useAuth();
  const { truckAgents, weightSurchargeRules, addWeightSurchargeRule, updateWeightSurchargeRule, deleteWeightSurchargeRule, getAuditLogsByType } = useFreight();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<WeightSurchargeRule | null>(null);
  const [validationWarning, setValidationWarning] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    agent: '',
    minWeight: '',
    maxWeight: '',
    surcharge: '',
    validFrom: '',
    validTo: '',
  });

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  const rulesByAgent = truckAgents.map((agent) => ({
    agent: agent.name,
    rules: weightSurchargeRules
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .filter((r) => r.agent === agent.name)
      .sort((a, b) => a.minWeight - b.minWeight),
  }));

  const handleAdd = () => {
    if (!formData.agent || !formData.minWeight || !formData.maxWeight || !formData.surcharge || !formData.validFrom || !formData.validTo) {
      setValidationWarning('❌ 모든 필수 항목을 입력해주세요.');
      return;
    }

    const warning = checkOverlapWarning(
      formData.validFrom,
      formData.validTo,
      '',
      weightSurchargeRules,
      (item) => item.agent === formData.agent && 
        item.minWeight === Number(formData.minWeight) && 
        item.maxWeight === Number(formData.maxWeight)
    );

    if (warning) {
      setValidationWarning(warning);
      return;
    }

    addWeightSurchargeRule({
      agent: formData.agent,
      minWeight: Number(formData.minWeight),
      maxWeight: Number(formData.maxWeight),
      surcharge: Number(formData.surcharge),
      validFrom: formData.validFrom,
      validTo: formData.validTo,
    });

    setFormData({ agent: '', minWeight: '', maxWeight: '', surcharge: '', validFrom: '', validTo: '' });
    setValidationWarning(null);
    setIsAddDialogOpen(false);
  };

  const handleAddIgnoreWarning = () => {
    if (!formData.agent || !formData.minWeight || !formData.maxWeight || !formData.surcharge || !formData.validFrom || !formData.validTo) return;

    addWeightSurchargeRule({
      agent: formData.agent,
      minWeight: Number(formData.minWeight),
      maxWeight: Number(formData.maxWeight),
      surcharge: Number(formData.surcharge),
      validFrom: formData.validFrom,
      validTo: formData.validTo,
    });

    setFormData({ agent: '', minWeight: '', maxWeight: '', surcharge: '', validFrom: '', validTo: '' });
    setValidationWarning(null);
    setIsAddDialogOpen(false);
  };

  const handleEditClick = (rule: WeightSurchargeRule) => {
    setEditingRule(rule);
    setFormData({
      agent: rule.agent,
      minWeight: rule.minWeight.toString(),
      maxWeight: rule.maxWeight.toString(),
      surcharge: rule.surcharge.toString(),
      validFrom: rule.validFrom,
      validTo: rule.validTo,
    });
    setValidationWarning(null);
    setIsEditDialogOpen(true);
  };

  const handleEditSave = () => {
    if (!editingRule) return;
    
    if (!formData.minWeight || !formData.maxWeight || !formData.surcharge || !formData.validFrom || !formData.validTo) {
      setValidationWarning('❌ 모든 필수 항목을 입력해주세요.');
      return;
    }

    updateWeightSurchargeRule(editingRule.id, {
      minWeight: Number(formData.minWeight),
      maxWeight: Number(formData.maxWeight),
      surcharge: Number(formData.surcharge),
      validFrom: formData.validFrom,
      validTo: formData.validTo,
    });

    setIsEditDialogOpen(false);
    setEditingRule(null);
    setFormData({ agent: '', minWeight: '', maxWeight: '', surcharge: '', validFrom: '', validTo: '' });
    setValidationWarning(null);
  };

  const handleEditCancel = () => {
    setIsEditDialogOpen(false);
    setEditingRule(null);
    setFormData({ agent: '', minWeight: '', maxWeight: '', surcharge: '', validFrom: '', validTo: '' });
    setValidationWarning(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('이 중량할증 규칙을 삭제하시겠습니까?')) {
      deleteWeightSurchargeRule(id);
    }
  };

  const auditLogs = getAuditLogsByType('weightSurcharge');
  const expiredRules = weightSurchargeRules.filter(r => getValidityStatus(r.validFrom, r.validTo).status === 'expired');
  const expiringRules = weightSurchargeRules.filter(r => getValidityStatus(r.validFrom, r.validTo).status === 'expiring');

  return (
    <div className="space-y-4">
      {/* Header Section - Compact */}
      <div className="relative overflow-hidden rounded-lg bg-gray-100 p-3 text-gray-900 shadow-lg">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10 blur-2xl"></div>
        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-24 w-24 rounded-full bg-white/10 blur-2xl"></div>
        <div className="relative flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-gray-200/80 backdrop-blur-sm rounded-lg">
              <Weight className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold">중량할증 관리</h2>
              <p className="text-xs text-gray-600">트럭 대리점별 중량 구간에 따른 할증 요율 설정</p>
            </div>
          </div>
          {isAdmin && (
            <Button 
              onClick={() => {
                setIsAddDialogOpen(true);
                setValidationWarning(null);
              }}
              size="sm"
              className="bg-gray-200/80 backdrop-blur-sm hover:bg-gray-300/80 text-gray-900 border border-gray-400 h-7 text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              추가
            </Button>
          )}
        </div>
      </div>

      <Alert className="border-gray-200 bg-gray-50 py-2">
        <Weight className="h-4 w-4 text-gray-600" />
        <AlertDescription className="text-xs">
          중량할증은 트럭 운임에 추가되는 비용입니다. 화물 중량에 따라 자동으로 계산됩니다.
        </AlertDescription>
      </Alert>

      {(expiredRules.length > 0 || expiringRules.length > 0) && (
        <Alert variant="destructive" className="py-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            {expiredRules.length > 0 && <span>⚠️ {expiredRules.length}개 만료</span>}
            {expiredRules.length > 0 && expiringRules.length > 0 && <span> · </span>}
            {expiringRules.length > 0 && <span>📅 {expiringRules.length}개 만료임박</span>}
          </AlertDescription>
        </Alert>
      )}

      {rulesByAgent.map(({ agent, rules }) => (
        <div key={agent} className="rounded-lg overflow-hidden shadow-md border-2 border-gray-300">
          <div className="bg-gray-200 px-4 py-2 border-b border-gray-300">
            <h3 className="font-bold text-sm text-gray-900">{agent}</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-200">
                <TableHead className="h-10 text-sm text-gray-900 font-extrabold whitespace-nowrap">최소 중량 (kg)</TableHead>
                <TableHead className="h-10 text-sm text-gray-900 font-extrabold whitespace-nowrap">최대 중량 (kg)</TableHead>
                <TableHead className="h-10 text-sm text-gray-900 font-extrabold whitespace-nowrap">할증 금액 (USD)</TableHead>
                <TableHead className="h-10 text-sm text-gray-900 font-extrabold whitespace-nowrap">유효기간</TableHead>
                <TableHead className="h-10 text-sm text-gray-900 font-extrabold whitespace-nowrap">상태</TableHead>
                {isAdmin && <TableHead className="h-10 text-sm text-right text-gray-900 font-extrabold whitespace-nowrap">작업</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.length > 0 ? (
                rules.map((rule) => {
                  const validityStatus = getValidityStatus(rule.validFrom, rule.validTo);
                  
                  return (
                    <TableRow key={rule.id} className="hover:bg-blue-50 transition-colors duration-150">
                      <TableCell className="py-3 text-sm font-medium whitespace-nowrap">{rule.minWeight}</TableCell>
                      <TableCell className="py-3 text-sm font-medium whitespace-nowrap">{rule.maxWeight === 999999 ? '∞' : rule.maxWeight}</TableCell>
                      <TableCell className="py-3 text-sm font-semibold text-blue-600 whitespace-nowrap">${rule.surcharge}</TableCell>
                      <TableCell className="py-3 text-sm whitespace-nowrap">
                        {formatValidityDate(rule.validFrom)} ~ {formatValidityDate(rule.validTo)}
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
                              onClick={() => handleEditClick(rule)}
                              className="h-6 px-2 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(rule.id)}
                              className="h-6 w-6 p-0 hover:bg-blue-50 transition-colors duration-150 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 6 : 5} className="text-center py-6">
                    <div className="flex flex-col items-center gap-2 text-gray-700">
                      <Weight className="h-12 w-12 opacity-20" />
                      <p className="text-sm">설정된 규칙이 없습니다</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      ))}

      <AuditLogTable 
        logs={auditLogs}
        title="중량할증 변경 기록"
        description="중량할증 규칙의 모든 변경 내역이 기록됩니다."
      />

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
        setIsAddDialogOpen(open);
        if (!open) setValidationWarning(null);
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <div className="p-2 bg-gray-200 rounded-lg">
                <Weight className="h-5 w-5 text-gray-900" />
              </div>
              중량할증 규칙 추가
            </DialogTitle>
            <DialogDescription>새로운 중량 구간과 할증 금액을 입력하세요.</DialogDescription>
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
              <Label className="text-sm font-semibold text-gray-700">트럭 대리점 *</Label>
              <Select value={formData.agent} onValueChange={(value) => {
                setFormData({ ...formData, agent: value });
                setValidationWarning(null);
              }}>
                <SelectTrigger className="border-gray-300 focus:border-blue-500">
                  <SelectValue placeholder="대리점 선택" />
                </SelectTrigger>
                <SelectContent>
                  {truckAgents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.name}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">최소 중량 (kg) *</Label>
              <Input
                type="number"
                placeholder="예: 0"
                value={formData.minWeight}
                onChange={(e) => setFormData({ ...formData, minWeight: e.target.value })}
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">최대 중량 (kg) *</Label>
              <Input
                type="number"
                placeholder="예: 1000 (무제한은 999999 입력)"
                value={formData.maxWeight}
                onChange={(e) => setFormData({ ...formData, maxWeight: e.target.value })}
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">할증 금액 (USD) *</Label>
              <Input
                type="number"
                placeholder="예: 50"
                value={formData.surcharge}
                onChange={(e) => setFormData({ ...formData, surcharge: e.target.value })}
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">유효기간 *</Label>
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
            <Button 
              variant="outline" 
              onClick={() => {
                setIsAddDialogOpen(false);
                setValidationWarning(null);
              }}
              className="hover:bg-gray-100"
            >
              취소
            </Button>
            <Button 
              onClick={handleAdd}
              className="bg-gray-200 hover:bg-gray-300 text-gray-900 shadow-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              추가
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={handleEditCancel}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <div className="p-2 bg-gray-200 rounded-lg">
                <Edit className="h-5 w-5 text-gray-900" />
              </div>
              중량할증 규칙 수정
            </DialogTitle>
            <DialogDescription>
              중량할증 규칙을 수정하세요.
            </DialogDescription>
          </DialogHeader>
          {editingRule && (
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
                <Label className="text-sm font-semibold text-gray-700">트럭 대리점</Label>
                <Input value={formData.agent} disabled className="bg-gray-50" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">최소 중량 (kg) *</Label>
                  <Input
                    type="number"
                    value={formData.minWeight}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        minWeight: e.target.value
                      });
                      setValidationWarning(null);
                    }}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">최대 중량 (kg) *</Label>
                  <Input
                    type="number"
                    placeholder="∞"
                    value={formData.maxWeight === '999999' ? '' : formData.maxWeight}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        maxWeight: e.target.value || '999999'
                      });
                      setValidationWarning(null);
                    }}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">할증 금액 (USD) *</Label>
                <Input
                  type="number"
                  value={formData.surcharge}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      surcharge: e.target.value
                    });
                    setValidationWarning(null);
                  }}
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">유효기간 *</Label>
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
            <Button 
              variant="outline" 
              onClick={handleEditCancel}
              className="hover:bg-gray-100"
            >
              취소
            </Button>
            <Button 
              onClick={handleEditSave}
              className="bg-gray-200 hover:bg-gray-300 text-gray-900 shadow-lg"
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