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
import { Trash2, Plus, FileText, AlertTriangle, Ship, Edit } from 'lucide-react';
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
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
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
    <div className="space-y-4">
      {/* Header Section - Compact */}
      <div className="relative overflow-hidden rounded-lg bg-gray-100 p-3 text-gray-900 shadow-lg">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10 blur-2xl"></div>
        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-24 w-24 rounded-full bg-white/10 blur-2xl"></div>
        <div className="relative flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-gray-200/80 backdrop-blur-sm rounded-lg">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold">D/O(DTHC) 관리</h2>
              <p className="text-xs text-gray-600">대리점별 D/O(DTHC) 비용</p>
            </div>
          </div>
          {isAdmin && (
            <Button 
              onClick={() => setIsAddDialogOpen(true)}
              size="sm"
              className="bg-gray-200/80 backdrop-blur-sm hover:bg-gray-300/80 text-gray-900 border border-gray-400 h-7 text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              추가
            </Button>
          )}
        </div>
      </div>

      {/* Info Alert - Compact */}
      <Alert className="border-gray-200 bg-gray-50 py-2">
        <FileText className="h-4 w-4 text-gray-600" />
        <AlertDescription className="text-xs">
          <strong className="text-gray-900">D/O(DTHC):</strong> Document Only - Destination Terminal Handling Charge. 철도 대리점, 출발항, 도착항 및 선사별로 설정되며, 원가 계산 시 자동으로 적용됩니다.
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

      {/* Tables by Agent - Compact */}
      {Object.keys(dthcByAgent).length > 0 ? (
        Object.entries(dthcByAgent).map(([agent, dthcs]) => (
          <div key={agent} className="rounded-lg overflow-hidden shadow-md border-2 border-gray-300">
            <div className="bg-gray-200 px-4 py-2 border-b border-gray-300">
              <h3 className="font-bold text-sm text-gray-900">{agent}</h3>
            </div>
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-200">
                  <TableHead className="h-10 text-sm text-gray-900 font-extrabold whitespace-nowrap">경로</TableHead>
                  <TableHead className="h-10 text-sm text-gray-900 font-extrabold whitespace-nowrap">선사</TableHead>
                  <TableHead className="h-10 text-sm text-gray-900 font-extrabold whitespace-nowrap">D/O(DTHC)</TableHead>
                  <TableHead className="h-10 text-sm text-gray-900 font-extrabold whitespace-nowrap">유효기간</TableHead>
                  <TableHead className="h-10 text-sm text-gray-900 font-extrabold whitespace-nowrap">상태</TableHead>
                  <TableHead className="h-10 text-sm text-gray-900 font-extrabold whitespace-nowrap">설명</TableHead>
                  {isAdmin && <TableHead className="h-10 text-sm text-right text-gray-900 font-extrabold whitespace-nowrap">작업</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {dthcs.map((dthc) => {
                  const validityStatus = getValidityStatus(dthc.validFrom, dthc.validTo);
                  
                  return (
                    <TableRow key={dthc.id} className="hover:bg-blue-50 transition-colors duration-150">
                      <TableCell className="py-3 text-sm font-medium whitespace-nowrap">
                        {dthc.pol || '-'} → {dthc.pod || '-'}
                      </TableCell>
                      <TableCell className="py-3 text-sm whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <Ship className="h-3 w-3 text-cyan-600" />
                          <span className="font-medium">{dthc.carrier || '-'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3 text-sm font-semibold text-blue-600 whitespace-nowrap">${dthc.amount ?? 0}</TableCell>
                      <TableCell className="py-3 text-sm whitespace-nowrap">
                        {formatValidityDate(dthc.validFrom)} ~ {formatValidityDate(dthc.validTo)}
                      </TableCell>
                      <TableCell className="py-2 whitespace-nowrap">
                        <Badge variant={validityStatus.variant} className="text-xs px-1.5 py-0">
                          {validityStatus.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3 text-sm whitespace-nowrap">
                        {dthc.description || '-'}
                      </TableCell>
                      {isAdmin && (
                        <TableCell className="py-2 text-right whitespace-nowrap">
                          <div className="flex justify-end gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditClick(dthc)}
                              className="h-6 px-2 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(dthc.id)}
                              className="h-6 w-6 p-0 hover:bg-blue-50 transition-colors duration-150 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3 text-red-600" />
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
        <div className="border rounded-lg bg-gray-50 p-8 text-center shadow-sm">
          <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400 opacity-20" />
          <p className="text-sm font-semibold text-gray-700">설정된 D/O(DTHC)가 없습니다</p>
          <p className="text-xs mt-1 text-gray-600">대리점, 경로 및 선사별로 D/O(DTHC)를 추가해보세요</p>
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
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <div className="p-2 bg-gray-200 rounded-lg">
                <FileText className="h-5 w-5 text-gray-900" />
              </div>
              D/O(DTHC) 추가
            </DialogTitle>
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
              <Label className="text-sm font-semibold text-gray-700">철도 대리점 *</Label>
              <Select value={formData.agent} onValueChange={(value) => {
                setFormData({ ...formData, agent: value });
                setValidationWarning(null);
              }}>
                <SelectTrigger className="border-gray-300 focus:border-blue-500">
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
              <Label className="text-sm font-semibold text-gray-700">출발항 (POL) *</Label>
              {polPorts.length > 0 ? (
                <Select value={formData.pol} onValueChange={(value) => {
                  setFormData({ ...formData, pol: value });
                  setValidationWarning(null);
                }}>
                  <SelectTrigger className="border-gray-300 focus:border-blue-500">
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
                <div className="text-sm text-gray-800 p-3 bg-gray-50 rounded border">
                  출발항(POL)을 먼저 등록해주세요. (운송사 탭 → 포트 관리)
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">도착항 (POD) *</Label>
              {podPorts.length > 0 ? (
                <Select value={formData.pod} onValueChange={(value) => {
                  setFormData({ ...formData, pod: value });
                  setValidationWarning(null);
                }}>
                  <SelectTrigger className="border-gray-300 focus:border-blue-500">
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
                <div className="text-sm text-gray-800 p-3 bg-gray-50 rounded border">
                  도착항(POD)을 먼저 등록해주세요. (운송사 탭 → 포트 관리)
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">선사 *</Label>
              {shippingLines.length > 0 ? (
                <Select value={formData.carrier} onValueChange={(value) => {
                  setFormData({ ...formData, carrier: value });
                  setValidationWarning(null);
                }}>
                  <SelectTrigger className="border-gray-300 focus:border-blue-500">
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
                <div className="text-sm text-gray-800 p-3 bg-gray-50 rounded border">
                  선사를 먼저 등록해주세요. (운송사 탭 → 선사 관리)
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">D/O(DTHC) 금액 (USD) *</Label>
              <Input
                type="number"
                placeholder="예: 100"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="col-span-2 space-y-2">
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
            <div className="col-span-2 space-y-2">
              <Label className="text-sm font-semibold text-gray-700">설명 (선택)</Label>
              <Textarea
                placeholder="추가 정보를 입력하세요"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
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
                  <Label className="text-sm font-semibold text-gray-700">대리점</Label>
                  <Input value={formData.agent} disabled className="bg-gray-50" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">경로</Label>
                  <Input value={`${formData.pol} → ${formData.pod}`} disabled className="bg-gray-50" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">선사 *</Label>
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
                      <SelectTrigger className="border-gray-300 focus:border-blue-500">
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
                  <Label className="text-sm font-semibold text-gray-700">D/O(DTHC) 금액 (USD) *</Label>
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
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
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

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">설명</Label>
                <Textarea
                  placeholder="추가 정보를 입력하세요"
                  value={formData.description}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      description: e.target.value
                    });
                  }}
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
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