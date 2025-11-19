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
import { Trash2, Plus, FileText, AlertTriangle, Ship, Sparkles, Edit } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AuditLogTable from './AuditLogTable';
import { ValidityPeriodInput } from '@/components/ui/validity-period-input';
import { getValidityStatus, formatValidityDate, checkOverlapWarning } from '@/utils/validityHelper';
import { Badge } from '@/components/ui/badge';

export default function DTHCTable() {
  const { user } = useAuth();
  const { railAgents, shippingLines, dthcList, addDTHC, updateDTHC, deleteDTHC, getAuditLogsByType, ports } = useFreight();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingDthc, setEditingDthc] = useState<DTHC | null>(null);
  const [validationWarning, setValidationWarning] = useState<string | null>(null);
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
  
  const polPorts = ports.filter(p => p.type === 'POL');
  const podPorts = ports.filter(p => p.type === 'POD');

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
      setValidationWarning('❌ 모든 필수 항목을 입력해주세요.');
      return;
    }

    const warning = checkOverlapWarning(
      formData.validFrom,
      formData.validTo,
      '',
      dthcList,
      (item) => item.agent === formData.agent && item.pol === formData.pol && item.pod === formData.pod && item.carrier === formData.carrier
    );

    if (warning) {
      setValidationWarning(warning);
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
    setValidationWarning(null);
    setIsAddDialogOpen(false);
  };

  const handleAddIgnoreWarning = () => {
    if (!formData.agent || !formData.pol || !formData.pod || !formData.carrier || !formData.amount || !formData.validFrom || !formData.validTo) return;

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
    setValidationWarning(null);
    setIsAddDialogOpen(false);
  };

  const handleEditClick = (dthc: DTHC) => {
    setEditingDthc(dthc);
    setFormData({
      agent: dthc.agent,
      pol: dthc.pol,
      pod: dthc.pod,
      carrier: dthc.carrier,
      amount: dthc.amount.toString(),
      description: dthc.description || '',
      validFrom: dthc.validFrom,
      validTo: dthc.validTo,
    });
    setValidationWarning(null);
    setIsEditDialogOpen(true);
  };

  const handleEditSave = () => {
    if (!editingDthc) return;
    
    if (!formData.carrier || !formData.amount || !formData.validFrom || !formData.validTo) {
      setValidationWarning('❌ 모든 필수 항목을 입력해주세요.');
      return;
    }

    updateDTHC(editingDthc.id, {
      carrier: formData.carrier,
      amount: Number(formData.amount),
      description: formData.description || undefined,
      validFrom: formData.validFrom,
      validTo: formData.validTo,
    });

    setIsEditDialogOpen(false);
    setEditingDthc(null);
    setFormData({ agent: '', pol: '', pod: '', carrier: '', amount: '', description: '', validFrom: '', validTo: '' });
    setValidationWarning(null);
  };

  const handleEditCancel = () => {
    setIsEditDialogOpen(false);
    setEditingDthc(null);
    setFormData({ agent: '', pol: '', pod: '', carrier: '', amount: '', description: '', validFrom: '', validTo: '' });
    setValidationWarning(null);
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
      {/* Beautiful Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 p-6 shadow-xl">
        <div className="absolute inset-0 bg-grid-white/10"></div>
        <div className="relative flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white flex items-center gap-2">
                D/O(DTHC) 관리
                <Sparkles className="h-5 w-5 text-yellow-300 animate-pulse" />
              </h2>
            </div>
            <p className="text-orange-50 ml-14">대리점, 출발항, 도착항 및 선사별 D/O(DTHC) 비용 설정</p>
          </div>
          {isAdmin && (
            <Button 
              onClick={() => setIsAddDialogOpen(true)}
              className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border-2 border-white/50 shadow-lg transition-all hover:scale-105"
            >
              <Plus className="h-4 w-4 mr-2" />
              D/O(DTHC) 추가
            </Button>
          )}
        </div>
      </div>

      <Alert className="border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-red-50">
        <FileText className="h-4 w-4 text-orange-600" />
        <AlertDescription>
          <strong className="text-orange-900">D/O(DTHC):</strong> Document Only - Destination Terminal Handling Charge. 철도 대리점, 출발항, 도착항 및 선사별로 설정되며, 원가 계산 시 자동으로 적용됩니다.
          <br />
          <span className="text-sm text-orange-700 mt-1 block">
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
          <div key={agent} className="border-2 rounded-xl overflow-hidden bg-white shadow-lg hover:shadow-xl transition-shadow">
            <div className="bg-gradient-to-r from-orange-100 via-red-100 to-pink-100 px-6 py-4 border-b-2 border-orange-200">
              <h3 className="font-bold text-xl text-orange-900">{agent}</h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-orange-50 to-red-50">
                  <TableHead className="font-bold">경로 (POL → POD)</TableHead>
                  <TableHead className="font-bold">선사</TableHead>
                  <TableHead className="font-bold">D/O(DTHC) (USD)</TableHead>
                  <TableHead className="font-bold">유효기간</TableHead>
                  <TableHead className="font-bold">상태</TableHead>
                  <TableHead className="font-bold">설명</TableHead>
                  {isAdmin && <TableHead className="text-right font-bold">작업</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {dthcs.map((dthc) => {
                  const validityStatus = getValidityStatus(dthc.validFrom, dthc.validTo);
                  
                  return (
                    <TableRow key={dthc.id} className="hover:bg-orange-50/50 transition-colors">
                      <TableCell className="font-medium">
                        {dthc.pol || '-'} → {dthc.pod || '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Ship className="h-4 w-4 text-cyan-600" />
                          <span className="font-medium">{dthc.carrier || '-'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-orange-700">${dthc.amount ?? 0}</TableCell>
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
                              onClick={() => handleEditClick(dthc)}
                              className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300"
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              수정
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(dthc.id)}
                              className="hover:bg-red-50 hover:text-red-700 transition-all hover:scale-105"
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
        <div className="border-2 rounded-xl bg-gradient-to-br from-orange-50 to-red-50 p-12 text-center shadow-lg">
          <FileText className="h-16 w-16 mx-auto mb-4 text-orange-400" />
          <p className="text-xl font-semibold text-orange-900">설정된 D/O(DTHC)가 없습니다</p>
          <p className="text-sm mt-2 text-orange-700">대리점, 경로 및 선사별로 D/O(DTHC)를 추가해보세요</p>
        </div>
      )}

      <AuditLogTable 
        logs={auditLogs}
        title="D/O(DTHC) 변경 기록"
        description="D/O(DTHC)의 모든 변경 내역이 기록됩니다."
      />

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
        setIsAddDialogOpen(open);
        if (!open) setValidationWarning(null);
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>D/O(DTHC) 추가</DialogTitle>
            <DialogDescription>철도 대리점, 경로 및 선사별 D/O(DTHC) 비용을 입력하세요.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            {validationWarning && (
              <div className="col-span-2">
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
              </div>
            )}
            <div className="col-span-2 space-y-2">
              <Label>철도 대리점 *</Label>
              <Select value={formData.agent} onValueChange={(value) => {
                setFormData({ ...formData, agent: value });
                setValidationWarning(null);
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
                  setValidationWarning(null);
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
                  setValidationWarning(null);
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
                  setValidationWarning(null);
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
                  setValidationWarning(null);
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
              D/O(DTHC) 수정
            </DialogTitle>
            <DialogDescription>
              D/O(DTHC) 정보를 수정하세요.
            </DialogDescription>
          </DialogHeader>
          {editingDthc && (
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>대리점</Label>
                  <Input value={formData.agent} disabled className="bg-gray-50" />
                </div>
                <div className="space-y-2">
                  <Label>경로</Label>
                  <Input value={`${formData.pol} → ${formData.pod}`} disabled className="bg-gray-50" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>선사 *</Label>
                  {shippingLines.length > 0 ? (
                    <Select 
                      value={formData.carrier} 
                      onValueChange={(value) => {
                        setFormData({
                          ...formData,
                          carrier: value
                        });
                        setValidationWarning(null);
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
                    <Input value={formData.carrier} disabled className="bg-gray-50" />
                  )}
                </div>
                <div className="space-y-2">
                  <Label>D/O(DTHC) 금액 (USD) *</Label>
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

              <div className="space-y-2">
                <Label>설명</Label>
                <Textarea
                  placeholder="추가 정보를 입력하세요"
                  value={formData.description}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      description: e.target.value
                    });
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