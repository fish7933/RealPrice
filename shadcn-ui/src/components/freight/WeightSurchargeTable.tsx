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
import { Trash2, Plus, Weight, AlertTriangle, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AuditLogTable from './AuditLogTable';
import { ValidityPeriodInput } from '@/components/ui/validity-period-input';
import { getValidityStatus, formatValidityDate, validateNoOverlap } from '@/utils/validityHelper';
import { Badge } from '@/components/ui/badge';

interface VersionChangeData {
  agent: string;
  minWeight: number;
  maxWeight: number;
  surcharge: number;
  validFrom: string;
  validTo: string;
  currentVersion: number;
  nextVersion: number;
}

export default function WeightSurchargeTable() {
  const { user } = useAuth();
  const { truckAgents, weightSurchargeRules, addWeightSurchargeRule, updateWeightSurchargeRule, deleteWeightSurchargeRule, getAuditLogsByType } = useFreight();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isVersionChangeDialogOpen, setIsVersionChangeDialogOpen] = useState(false);
  const [versionChangeData, setVersionChangeData] = useState<VersionChangeData | null>(null);
  const [originalRuleId, setOriginalRuleId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
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
    if (!formData.agent || !formData.minWeight || !formData.maxWeight || !formData.surcharge || !formData.validFrom || !formData.validTo) return;

    const error = validateNoOverlap(
      formData.validFrom,
      formData.validTo,
      '',
      weightSurchargeRules,
      (item) => item.agent === formData.agent && 
        item.minWeight === Number(formData.minWeight) && 
        item.maxWeight === Number(formData.maxWeight)
    );

    if (error) {
      setValidationError(error);
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
    setValidationError(null);
    setIsAddDialogOpen(false);
  };

  const handleVersionChangeClick = (rule: WeightSurchargeRule) => {
    const relevantItems = weightSurchargeRules.filter(
      (item) => item.agent === rule.agent && item.minWeight === rule.minWeight && item.maxWeight === rule.maxWeight
    );
    const maxVersion = Math.max(...relevantItems.map(item => item.version || 1), 0);
    const nextVersion = maxVersion + 1;

    let validFrom = '';
    let validTo = '';

    try {
      if (!rule.validTo || rule.validTo === '') {
        const today = new Date();
        validFrom = today.toISOString().split('T')[0];
      } else {
        const validFromDate = new Date(rule.validTo);
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
      agent: rule.agent,
      minWeight: rule.minWeight,
      maxWeight: rule.maxWeight,
      surcharge: rule.surcharge,
      validFrom,
      validTo,
      currentVersion: rule.version || 1,
      nextVersion,
    });
    setOriginalRuleId(rule.id);
    setValidationError(null);
    setIsVersionChangeDialogOpen(true);
  };

  const handleVersionChangeSave = () => {
    if (!versionChangeData || !originalRuleId) return;

    if (!versionChangeData.surcharge || !versionChangeData.validFrom || !versionChangeData.validTo) {
      setValidationError('❌ 모든 필수 항목을 입력해주세요.');
      return;
    }

    updateWeightSurchargeRule(originalRuleId, {
      minWeight: versionChangeData.minWeight,
      maxWeight: versionChangeData.maxWeight,
      surcharge: versionChangeData.surcharge,
      validFrom: versionChangeData.validFrom,
      validTo: versionChangeData.validTo,
    });

    setIsVersionChangeDialogOpen(false);
    setVersionChangeData(null);
    setOriginalRuleId(null);
    setValidationError(null);
  };

  const handleVersionChangeCancel = () => {
    setIsVersionChangeDialogOpen(false);
    setVersionChangeData(null);
    setOriginalRuleId(null);
    setValidationError(null);
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2"><Weight className="h-6 w-6" />중량할증 관리</h2>
          <p className="text-gray-600 mt-1">트럭 대리점별 중량 구간에 따른 할증 요율 설정</p>
        </div>
        {isAdmin && (
          <Button onClick={() => {
            setIsAddDialogOpen(true);
            setValidationError(null);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            규칙 추가
          </Button>
        )}
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
        <div key={agent} className="border rounded-lg overflow-hidden bg-white">
          <div className="bg-gray-50 px-4 py-3 border-b">
            <h3 className="font-semibold text-lg">{agent}</h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>버전</TableHead>
                <TableHead>최소 중량 (kg)</TableHead>
                <TableHead>최대 중량 (kg)</TableHead>
                <TableHead>할증 금액 (USD)</TableHead>
                <TableHead>유효기간</TableHead>
                <TableHead>상태</TableHead>
                {isAdmin && <TableHead className="text-right">작업</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.length > 0 ? (
                rules.map((rule) => {
                  const validityStatus = getValidityStatus(rule.validFrom, rule.validTo);
                  
                  return (
                    <TableRow key={rule.id}>
                      <TableCell>
                        <Badge variant="outline">v{rule.version || 1}</Badge>
                      </TableCell>
                      <TableCell>{rule.minWeight}</TableCell>
                      <TableCell>{rule.maxWeight === 999999 ? '∞' : rule.maxWeight}</TableCell>
                      <TableCell>${rule.surcharge}</TableCell>
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
                              onClick={() => handleVersionChangeClick(rule)}
                              className="bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-300"
                            >
                              <RefreshCw className="h-4 w-4 mr-1" />
                              버전 변경
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(rule.id)}
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
                  <TableCell colSpan={isAdmin ? 7 : 6} className="text-center text-gray-500">
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
        title="중량할증 버전 기록"
        description="중량할증 규칙의 모든 변경 내역이 버전별로 기록됩니다. '버전 변경' 버튼을 클릭하면 플로팅 화면에서 새 버전의 정보를 수정할 수 있습니다."
      />

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
        setIsAddDialogOpen(open);
        if (!open) setValidationError(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>중량할증 규칙 추가</DialogTitle>
            <DialogDescription>새로운 중량 구간과 할증 금액을 입력하세요.</DialogDescription>
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
              <Label>트럭 대리점</Label>
              <Select value={formData.agent} onValueChange={(value) => {
                setFormData({ ...formData, agent: value });
                setValidationError(null);
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
            <Button onClick={handleAdd}>추가</Button>
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
              새로운 버전의 중량할증 규칙을 수정하세요. 버전이 자동으로 증가하고 유효기간이 설정됩니다.
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
                <Label>트럭 대리점</Label>
                <Input value={versionChangeData.agent} disabled className="bg-gray-50" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>최소 중량 (kg)</Label>
                  <Input
                    type="number"
                    value={versionChangeData.minWeight}
                    onChange={(e) => {
                      setVersionChangeData({
                        ...versionChangeData,
                        minWeight: Number(e.target.value)
                      });
                      setValidationError(null);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>최대 중량 (kg)</Label>
                  <Input
                    type="number"
                    placeholder="∞"
                    value={versionChangeData.maxWeight === 999999 ? '' : versionChangeData.maxWeight}
                    onChange={(e) => {
                      setVersionChangeData({
                        ...versionChangeData,
                        maxWeight: e.target.value ? Number(e.target.value) : 999999
                      });
                      setValidationError(null);
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>할증 금액 (USD) *</Label>
                <Input
                  type="number"
                  value={versionChangeData.surcharge}
                  onChange={(e) => {
                    setVersionChangeData({
                      ...versionChangeData,
                      surcharge: Number(e.target.value)
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