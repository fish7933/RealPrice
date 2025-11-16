import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFreight } from '@/contexts/FreightContext';
import { DTHC } from '@/types/freight';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Trash2, Plus, FileText, AlertTriangle, RefreshCw, Ship } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AuditLogTable from './AuditLogTable';
import { ValidityPeriodInput } from '@/components/ui/validity-period-input';
import { getValidityStatus, formatValidityDate, validateNoOverlap } from '@/utils/validityHelper';
import { Badge } from '@/components/ui/badge';

interface VersionChangeData {
  agent: string;
  pol: string;
  pod: string;
  carrier: string;
  amount: number;
  description?: string;
  validFrom: string;
  validTo: string;
  currentVersion: number;
  nextVersion: number;
}

export default function DTHCTable() {
  const { user } = useAuth();
  const { railAgents, shippingLines, dthcList, addDTHC, updateDTHC, deleteDTHC, getAuditLogsByType, ports } = useFreight();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isVersionChangeDialogOpen, setIsVersionChangeDialogOpen] = useState(false);
  const [versionChangeData, setVersionChangeData] = useState<VersionChangeData | null>(null);
  const [originalDthcId, setOriginalDthcId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    agent: '',
    pol: '',
    pod: '',
    carrier: '',
    amount: '',
    description: '',
    validFrom: '',
    validTo: '',
  });

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  
  // Get POL and POD ports from the ports list
  const polPorts = ports.filter(p => p.type === 'POL');
  const podPorts = ports.filter(p => p.type === 'POD');

  // Group DTHC by agent, then by route (filter out invalid entries)
  const dthcByAgent = dthcList
    .filter(dthc => dthc && dthc.agent && dthc.pol && dthc.pod && dthc.carrier && dthc.amount !== undefined)
    .reduce((acc, dthc) => {
      if (!acc[dthc.agent]) {
        acc[dthc.agent] = [];
      }
      acc[dthc.agent].push(dthc);
      return acc;
    }, {} as Record<string, DTHC[]>);

  const handleAdd = () => {
    if (!formData.agent || !formData.pol || !formData.pod || !formData.carrier || !formData.amount || !formData.validFrom || !formData.validTo) {
      setValidationError('❌ 모든 필수 항목을 입력해주세요.');
      return;
    }

    const error = validateNoOverlap(
      formData.validFrom,
      formData.validTo,
      '',
      dthcList,
      (item) => item.agent === formData.agent && item.pol === formData.pol && item.pod === formData.pod && item.carrier === formData.carrier
    );

    if (error) {
      setValidationError(error);
      return;
    }

    addDTHC({
      agent: formData.agent,
      pol: formData.pol,
      pod: formData.pod,
      carrier: formData.carrier,
      amount: Number(formData.amount),
      description: formData.description || undefined,
      validFrom: formData.validFrom,
      validTo: formData.validTo,
    });

    setFormData({ agent: '', pol: '', pod: '', carrier: '', amount: '', description: '', validFrom: '', validTo: '' });
    setValidationError(null);
    setIsAddDialogOpen(false);
  };

  const handleVersionChangeClick = (dthc: DTHC) => {
    const relevantItems = dthcList.filter(
      (item) => item.agent === dthc.agent && item.pol === dthc.pol && item.pod === dthc.pod && item.carrier === dthc.carrier
    );
    const maxVersion = Math.max(...relevantItems.map(item => item.version || 1), 0);
    const nextVersion = maxVersion + 1;

    let validFrom = '';
    let validTo = '';

    try {
      if (!dthc.validTo || dthc.validTo === '') {
        const today = new Date();
        validFrom = today.toISOString().split('T')[0];
      } else {
        const validFromDate = new Date(dthc.validTo);
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
      agent: dthc.agent,
      pol: dthc.pol,
      pod: dthc.pod,
      carrier: dthc.carrier,
      amount: dthc.amount,
      description: dthc.description,
      validFrom,
      validTo,
      currentVersion: dthc.version || 1,
      nextVersion,
    });
    setOriginalDthcId(dthc.id);
    setValidationError(null);
    setIsVersionChangeDialogOpen(true);
  };

  const handleVersionChangeSave = () => {
    if (!versionChangeData || !originalDthcId) return;

    if (!versionChangeData.carrier || !versionChangeData.amount || !versionChangeData.validFrom || !versionChangeData.validTo) {
      setValidationError('❌ 모든 필수 항목을 입력해주세요.');
      return;
    }

    updateDTHC(originalDthcId, {
      carrier: versionChangeData.carrier,
      amount: versionChangeData.amount,
      description: versionChangeData.description,
      validFrom: versionChangeData.validFrom,
      validTo: versionChangeData.validTo,
    });

    setIsVersionChangeDialogOpen(false);
    setVersionChangeData(null);
    setOriginalDthcId(null);
    setValidationError(null);
  };

  const handleVersionChangeCancel = () => {
    setIsVersionChangeDialogOpen(false);
    setVersionChangeData(null);
    setOriginalDthcId(null);
    setValidationError(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('이 D/O(DTHC)를 삭제하시겠습니까?')) {
      deleteDTHC(id);
    }
  };

  const auditLogs = getAuditLogsByType('dthc');
  const expiredRates = dthcList.filter(d => getValidityStatus(d.validFrom, d.validTo).status === 'expired');
  const expiringRates = dthcList.filter(d => getValidityStatus(d.validFrom, d.validTo).status === 'expiring');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">D/O(DTHC) 관리</h2>
          <p className="text-gray-600 mt-1">대리점, 출발항, 도착항 및 선사별 D/O(DTHC) 비용 설정</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            D/O(DTHC) 추가
          </Button>
        )}
      </div>

      <Alert>
        <FileText className="h-4 w-4" />
        <AlertDescription>
          <strong>D/O(DTHC):</strong> Document Only - Destination Terminal Handling Charge. 철도 대리점, 출발항, 도착항 및 선사별로 설정되며, 원가 계산 시 자동으로 적용됩니다.
          <br />
          <span className="text-sm text-gray-600 mt-1 block">
            각 철도 대리점마다 경로(출발항→도착항) 및 선사에 따라 다른 D/O(DTHC) 금액을 설정할 수 있습니다.
          </span>
        </AlertDescription>
      </Alert>

      {(expiredRates.length > 0 || expiringRates.length > 0) && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {expiredRates.length > 0 && (
              <div className="font-semibold">
                ⚠️ {expiredRates.length}개의 D/O(DTHC)가 만료되었습니다.
              </div>
            )}
            {expiringRates.length > 0 && (
              <div className="text-sm mt-1">
                📅 {expiringRates.length}개의 D/O(DTHC)가 7일 이내에 만료됩니다.
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {Object.keys(dthcByAgent).length > 0 ? (
        Object.entries(dthcByAgent).map(([agent, dthcs]) => (
          <div key={agent} className="border rounded-lg overflow-hidden bg-white">
            <div className="bg-blue-50 px-4 py-3 border-b">
              <h3 className="font-semibold text-lg">{agent}</h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>버전</TableHead>
                  <TableHead>경로 (POL → POD)</TableHead>
                  <TableHead>선사</TableHead>
                  <TableHead>D/O(DTHC) (USD)</TableHead>
                  <TableHead>유효기간</TableHead>
                  <TableHead>상태</TableHead>
                  <TableHead>설명</TableHead>
                  {isAdmin && <TableHead className="text-right">작업</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {dthcs.map((dthc) => {
                  const validityStatus = getValidityStatus(dthc.validFrom, dthc.validTo);
                  
                  return (
                    <TableRow key={dthc.id}>
                      <TableCell>
                        <Badge variant="outline">v{dthc.version || 1}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {dthc.pol || '-'} → {dthc.pod || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Ship className="h-4 w-4 text-cyan-600" />
                          <span className="font-medium">{dthc.carrier || '-'}</span>
                        </div>
                      </TableCell>
                      <TableCell>${dthc.amount ?? 0}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{formatValidityDate(dthc.validFrom)}</div>
                          <div className="text-gray-500">~ {formatValidityDate(dthc.validTo)}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={validityStatus.variant}>
                          {validityStatus.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className={!dthc.description ? 'text-gray-400' : ''}>
                          {dthc.description || '-'}
                        </span>
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleVersionChangeClick(dthc)}
                              className="bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-300"
                            >
                              <RefreshCw className="h-4 w-4 mr-1" />
                              버전 변경
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(dthc.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ))
      ) : (
        <div className="border rounded-lg bg-white p-8 text-center text-gray-500">
          <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
          <p>설정된 D/O(DTHC)가 없습니다</p>
          <p className="text-sm mt-1">대리점, 경로 및 선사별로 D/O(DTHC)를 추가해보세요</p>
        </div>
      )}

      <AuditLogTable 
        logs={auditLogs}
        title="D/O(DTHC) 버전 기록"
        description="D/O(DTHC)의 모든 변경 내역이 버전별로 기록됩니다. '버전 변경' 버튼을 클릭하면 플로팅 화면에서 새 버전의 정보를 수정할 수 있습니다."
      />

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
        setIsAddDialogOpen(open);
        if (!open) setValidationError(null);
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>D/O(DTHC) 추가</DialogTitle>
            <DialogDescription>철도 대리점, 경로 및 선사별 D/O(DTHC) 비용을 입력하세요.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            {validationError && (
              <div className="col-span-2">
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-semibold">유효기간 중복 오류</div>
                    <div className="text-sm mt-1">{validationError}</div>
                  </AlertDescription>
                </Alert>
              </div>
            )}
            <div className="col-span-2 space-y-2">
              <Label>철도 대리점 *</Label>
              <Select value={formData.agent} onValueChange={(value) => {
                setFormData({ ...formData, agent: value });
                setValidationError(null);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="대리점 선택" />
                </SelectTrigger>
                <SelectContent>
                  {railAgents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.name}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>출발항 (POL) *</Label>
              {polPorts.length > 0 ? (
                <Select value={formData.pol} onValueChange={(value) => {
                  setFormData({ ...formData, pol: value });
                  setValidationError(null);
                }}>
                  <SelectTrigger>
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
              ) : (
                <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded border">
                  출발항(POL)을 먼저 등록해주세요. (운송사 탭 → 포트 관리)
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>도착항 (POD) *</Label>
              {podPorts.length > 0 ? (
                <Select value={formData.pod} onValueChange={(value) => {
                  setFormData({ ...formData, pod: value });
                  setValidationError(null);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="도착항 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {podPorts.map((port) => (
                      <SelectItem key={port.id} value={port.name}>
                        {port.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded border">
                  도착항(POD)을 먼저 등록해주세요. (운송사 탭 → 포트 관리)
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>선사 *</Label>
              {shippingLines.length > 0 ? (
                <Select value={formData.carrier} onValueChange={(value) => {
                  setFormData({ ...formData, carrier: value });
                  setValidationError(null);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="선사 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {shippingLines.map((line) => (
                      <SelectItem key={line.id} value={line.name}>
                        {line.name} ({line.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded border">
                  선사를 먼저 등록해주세요. (운송사 탭 → 선사 관리)
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>D/O(DTHC) 금액 (USD) *</Label>
              <Input
                type="number"
                placeholder="예: 100"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
            </div>
            <div className="col-span-2 space-y-2">
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
            <div className="col-span-2 space-y-2">
              <Label>설명 (선택)</Label>
              <Textarea
                placeholder="추가 정보를 입력하세요"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
              새로운 버전의 D/O(DTHC) 정보를 수정하세요. 버전이 자동으로 증가하고 유효기간이 설정됩니다.
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>대리점</Label>
                  <Input value={versionChangeData.agent} disabled className="bg-gray-50" />
                </div>
                <div className="space-y-2">
                  <Label>경로</Label>
                  <Input value={`${versionChangeData.pol} → ${versionChangeData.pod}`} disabled className="bg-gray-50" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>선사 *</Label>
                  {shippingLines.length > 0 ? (
                    <Select 
                      value={versionChangeData.carrier} 
                      onValueChange={(value) => {
                        setVersionChangeData({
                          ...versionChangeData,
                          carrier: value
                        });
                        setValidationError(null);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="선사 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {shippingLines.map((line) => (
                          <SelectItem key={line.id} value={line.name}>
                            {line.name} ({line.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input value={versionChangeData.carrier} disabled className="bg-gray-50" />
                  )}
                </div>
                <div className="space-y-2">
                  <Label>D/O(DTHC) 금액 (USD) *</Label>
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

              <div className="space-y-2">
                <Label>설명</Label>
                <Textarea
                  placeholder="추가 정보를 입력하세요"
                  value={versionChangeData.description || ''}
                  onChange={(e) => {
                    setVersionChangeData({
                      ...versionChangeData,
                      description: e.target.value || undefined
                    });
                  }}
                />
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