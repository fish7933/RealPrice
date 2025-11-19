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
import { Trash2, Plus, Weight, AlertTriangle, Sparkles, Edit } from 'lucide-react';
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
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-6 shadow-xl">
        <div className="absolute inset-0 bg-grid-white/10"></div>
        <div className="relative flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl">
                <Weight className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white flex items-center gap-2">
                중량할증 관리
                <Sparkles className="h-5 w-5 text-yellow-300 animate-pulse" />
              </h2>
            </div>
            <p className="text-indigo-50 ml-14">트럭 대리점별 중량 구간에 따른 할증 요율 설정</p>
          </div>
          {isAdmin && (
            <Button 
              onClick={() => {
                setIsAddDialogOpen(true);
                setValidationWarning(null);
              }}
              className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border-2 border-white/50 shadow-lg transition-all hover:scale-105"
            >
              <Plus className="h-4 w-4 mr-2" />
              규칙 추가
            </Button>
          )}
        </div>
      </div>

      <Alert>
        <Weight className="h-4 w-4" />
        <AlertDescription>
          중량할증은 트럭 운임에 추가되는 비용입니다. 화물 중량에 따라 자동으로 계산됩니다.
        </AlertDescription>
      </Alert>

      {(expiredRules.length > 0 || expiringRules.length > 0) && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {expiredRules.length > 0 && (
              <div className="font-semibold">
                ⚠️ {expiredRules.length}개의 중량할증 규칙이 만료되었습니다.
              </div>
            )}
            {expiringRules.length > 0 && (
              <div className="text-sm mt-1">
                📅 {expiringRules.length}개의 중량할증 규칙이 7일 이내에 만료됩니다.
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {rulesByAgent.map(({ agent, rules }) => (
        <div key={agent} className="rounded-xl border-2 shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-4 py-3 border-b">
            <h3 className="font-semibold text-lg">{agent}</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-bold">최소 중량 (kg)</TableHead>
                <TableHead className="font-bold">최대 중량 (kg)</TableHead>
                <TableHead className="font-bold">할증 금액 (USD)</TableHead>
                <TableHead className="font-bold">유효기간</TableHead>
                <TableHead className="font-bold">상태</TableHead>
                {isAdmin && <TableHead className="text-right font-bold">작업</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.length > 0 ? (
                rules.map((rule) => {
                  const validityStatus = getValidityStatus(rule.validFrom, rule.validTo);
                  
                  return (
                    <TableRow key={rule.id} className="hover:bg-indigo-50/50 transition-colors">
                      <TableCell className="font-medium">{rule.minWeight}</TableCell>
                      <TableCell className="font-medium">{rule.maxWeight === 999999 ? '∞' : rule.maxWeight}</TableCell>
                      <TableCell className="font-semibold text-purple-700">${rule.surcharge}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{formatValidityDate(rule.validFrom)}</div>
                          <div className="text-gray-500">~ {formatValidityDate(rule.validTo)}</div>
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
                              onClick={() => handleEditClick(rule)}
                              className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300"
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              수정
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(rule.id)}
                              className="hover:bg-red-50 hover:text-red-700 transition-all hover:scale-105"
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={isAdmin ? 6 : 5} className="text-center text-gray-500 py-8">
                    설정된 규칙이 없습니다
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>중량할증 규칙 추가</DialogTitle>
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
              <Label>트럭 대리점</Label>
              <Select value={formData.agent} onValueChange={(value) => {
                setFormData({ ...formData, agent: value });
                setValidationWarning(null);
              }}>
                <SelectTrigger>
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
              <Label>최소 중량 (kg)</Label>
              <Input
                type="number"
                placeholder="예: 0"
                value={formData.minWeight}
                onChange={(e) => setFormData({ ...formData, minWeight: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>최대 중량 (kg)</Label>
              <Input
                type="number"
                placeholder="예: 1000 (무제한은 999999 입력)"
                value={formData.maxWeight}
                onChange={(e) => setFormData({ ...formData, maxWeight: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>할증 금액 (USD)</Label>
              <Input
                type="number"
                placeholder="예: 50"
                value={formData.surcharge}
                onChange={(e) => setFormData({ ...formData, surcharge: e.target.value })}
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
                <Label>트럭 대리점</Label>
                <Input value={formData.agent} disabled className="bg-gray-50" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>최소 중량 (kg) *</Label>
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
                  />
                </div>
                <div className="space-y-2">
                  <Label>최대 중량 (kg) *</Label>
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
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>할증 금액 (USD) *</Label>
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