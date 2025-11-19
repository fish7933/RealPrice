import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFreight } from '@/contexts/FreightContext';
import { PortBorderFreight } from '@/types/freight';
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
import { Trash2, Plus, Train, AlertTriangle, Sparkles, Edit } from 'lucide-react';
import AuditLogTable from './AuditLogTable';
import { ValidityPeriodInput } from '@/components/ui/validity-period-input';
import { getValidityStatus, formatValidityDate, checkOverlapWarning } from '@/utils/validityHelper';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FreightGroup {
  agent: string;
  pol: string;
  validFrom: string;
  validTo: string;
  freights: { [pod: string]: PortBorderFreight | undefined };
  validityStatus: ReturnType<typeof getValidityStatus> | null;
}

export default function PortBorderTable() {
  const { user } = useAuth();
  const { 
    railAgents, 
    ports,
    portBorderFreights, 
    addPortBorderFreight, 
    updatePortBorderFreight, 
    deletePortBorderFreight, 
    getAuditLogsByType,
    getDefaultBorderCity,
    getSystemSettingValue
  } = useFreight();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<FreightGroup | null>(null);
  const [validationWarning, setValidationWarning] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    agent: string;
    pol: string;
    validFrom: string;
    validTo: string;
    [key: string]: string;
  }>({
    agent: '',
    pol: '',
    validFrom: '',
    validTo: '',
  });

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  const borderCity = getDefaultBorderCity();
  const borderCityName = borderCity?.name || getSystemSettingValue('default_border_city', 'KASHGAR');

  const polPorts = ports.filter(p => p.type === 'POL');
  const podPorts = ports.filter(p => p.type === 'POD');

  const initializeFormData = () => {
    const data: { agent: string; pol: string; validFrom: string; validTo: string; [key: string]: string } = { 
      agent: '', 
      pol: '',
      validFrom: '', 
      validTo: '' 
    };
    podPorts.forEach(pod => {
      data[pod.name] = '';
    });
    return data;
  };

  const handleAdd = () => {
    if (!formData.agent || formData.agent.trim() === '') {
      setValidationWarning('❌ 철도 대리점을 선택해주세요.');
      return;
    }
    
    if (!formData.pol || formData.pol.trim() === '') {
      setValidationWarning('❌ 선적포트(POL)를 선택해주세요.');
      return;
    }
    
    if (!formData.validFrom || formData.validFrom.trim() === '') {
      setValidationWarning('❌ 유효기간 시작일을 입력해주세요.');
      return;
    }
    
    if (!formData.validTo || formData.validTo.trim() === '') {
      setValidationWarning('❌ 유효기간 종료일을 입력해주세요.');
      return;
    }

    const hasAnyRate = podPorts.some(pod => formData[pod.name] && formData[pod.name] !== '');
    if (!hasAnyRate) {
      setValidationWarning('❌ 최소 하나 이상의 양하포트 운임을 입력해주세요.');
      return;
    }

    // Check for overlaps with existing records for the same agent and POL
    for (const pod of podPorts) {
      if (formData[pod.name] && formData[pod.name] !== '') {
        const warning = checkOverlapWarning(
          formData.validFrom,
          formData.validTo,
          '',
          portBorderFreights,
          (item) => item.agent === formData.agent && item.pol === formData.pol && item.pod === pod.name
        );

        if (warning) {
          setValidationWarning(warning);
          return;
        }
      }
    }

    // Always add new records (no update logic in add dialog)
    podPorts.forEach(pod => {
      if (formData[pod.name] && formData[pod.name] !== '') {
        const freightData = {
          agent: formData.agent,
          pol: formData.pol,
          pod: pod.name,
          rate: Number(formData[pod.name]),
          validFrom: formData.validFrom,
          validTo: formData.validTo,
        };

        addPortBorderFreight(freightData);
      }
    });

    setFormData(initializeFormData());
    setValidationWarning(null);
    setIsAddDialogOpen(false);
  };

  const handleAddIgnoreWarning = () => {
    if (!formData.agent || !formData.pol || !formData.validFrom || !formData.validTo) return;

    const hasAnyRate = podPorts.some(pod => formData[pod.name] && formData[pod.name] !== '');
    if (!hasAnyRate) return;

    podPorts.forEach(pod => {
      if (formData[pod.name] && formData[pod.name] !== '') {
        const freightData = {
          agent: formData.agent,
          pol: formData.pol,
          pod: pod.name,
          rate: Number(formData[pod.name]),
          validFrom: formData.validFrom,
          validTo: formData.validTo,
        };

        addPortBorderFreight(freightData);
      }
    });

    setFormData(initializeFormData());
    setValidationWarning(null);
    setIsAddDialogOpen(false);
  };

  const handleEditClick = (group: FreightGroup) => {
    setEditingGroup(group);
    
    const newFormData: { agent: string; pol: string; validFrom: string; validTo: string; [key: string]: string } = {
      agent: group.agent,
      pol: group.pol,
      validFrom: group.validFrom,
      validTo: group.validTo,
    };
    
    podPorts.forEach(pod => {
      const freight = group.freights[pod.name];
      newFormData[pod.name] = freight ? freight.rate.toString() : '';
    });
    
    setFormData(newFormData);
    setValidationWarning(null);
    setIsEditDialogOpen(true);
  };

  const handleEditSave = () => {
    if (!editingGroup) return;
    
    if (!formData.validFrom || !formData.validTo) {
      setValidationWarning('❌ 유효기간을 입력해주세요.');
      return;
    }

    const hasAnyRate = podPorts.some(pod => formData[pod.name] && formData[pod.name] !== '');
    if (!hasAnyRate) {
      setValidationWarning('❌ 최소 하나 이상의 양하포트 운임을 입력해주세요.');
      return;
    }

    // Update each POD
    podPorts.forEach(pod => {
      const existingFreight = editingGroup.freights[pod.name];

      if (formData[pod.name] && formData[pod.name] !== '') {
        const freightData = {
          rate: Number(formData[pod.name]),
          validFrom: formData.validFrom,
          validTo: formData.validTo,
        };

        if (existingFreight) {
          updatePortBorderFreight(existingFreight.id, freightData);
        } else {
          addPortBorderFreight({
            agent: editingGroup.agent,
            pol: editingGroup.pol,
            pod: pod.name,
            ...freightData,
          });
        }
      } else if (existingFreight) {
        // If rate is empty and freight exists, delete it
        deletePortBorderFreight(existingFreight.id);
      }
    });

    setIsEditDialogOpen(false);
    setEditingGroup(null);
    setFormData(initializeFormData());
    setValidationWarning(null);
  };

  const handleEditCancel = () => {
    setIsEditDialogOpen(false);
    setEditingGroup(null);
    setFormData(initializeFormData());
    setValidationWarning(null);
  };

  const handleDeleteGroup = async (group: FreightGroup) => {
    const freightIds = Object.values(group.freights)
      .filter(f => f !== undefined)
      .map(f => f!.id);
    
    if (freightIds.length === 0) return;
    
    if (confirm(`${group.agent} (${group.pol})의 철도운임을 삭제하시겠습니까?\n\n유효기간: ${formatValidityDate(group.validFrom)} ~ ${formatValidityDate(group.validTo)}\n총 ${freightIds.length}개의 운임이 삭제됩니다.`)) {
      try {
        for (const id of freightIds) {
          await deletePortBorderFreight(id);
        }
      } catch (error) {
        console.error('Error during deletion:', error);
      }
    }
  };

  const handleOpenDialog = () => {
    setFormData(initializeFormData());
    setValidationWarning(null);
    setIsAddDialogOpen(true);
  };

  // Group freights by agent, POL, and validity period
  const freightGroups: FreightGroup[] = [];
  
  // Get all unique combinations of agent + pol + validFrom + validTo
  const uniqueCombinations = new Set<string>();
  portBorderFreights.forEach(freight => {
    uniqueCombinations.add(`${freight.agent}|${freight.pol}|${freight.validFrom}|${freight.validTo}`);
  });

  uniqueCombinations.forEach(combo => {
    const [agent, pol, validFrom, validTo] = combo.split('|');
    
    const groupFreights: { [pod: string]: PortBorderFreight | undefined } = {};
    podPorts.forEach(pod => {
      groupFreights[pod.name] = portBorderFreights.find(
        f => f.agent === agent && f.pol === pol && f.pod === pod.name && 
             f.validFrom === validFrom && f.validTo === validTo
      );
    });
    
    const firstFreight = Object.values(groupFreights).find(f => f);
    if (firstFreight) {
      freightGroups.push({
        agent,
        pol,
        validFrom,
        validTo,
        freights: groupFreights,
        validityStatus: getValidityStatus(validFrom, validTo)
      });
    }
  });

  // Sort by agent name, then by POL, then by validFrom descending (newest first)
  freightGroups.sort((a, b) => {
    if (a.agent !== b.agent) {
      return a.agent.localeCompare(b.agent);
    }
    if (a.pol !== b.pol) {
      return a.pol.localeCompare(b.pol);
    }
    return new Date(b.validFrom).getTime() - new Date(a.validFrom).getTime();
  });

  const auditLogs = getAuditLogsByType('portBorderFreight');
  const expiredRates = freightGroups.filter(f => f.validityStatus?.status === 'expired');
  const expiringRates = freightGroups.filter(f => f.validityStatus?.status === 'expiring');

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 p-6 shadow-xl">
        <div className="absolute inset-0 bg-grid-white/10"></div>
        <div className="relative flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl">
                <Train className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white flex items-center gap-2">
                철도운임 관리
                <Sparkles className="h-5 w-5 text-yellow-300 animate-pulse" />
              </h2>
            </div>
            <p className="text-green-50 ml-14">선적포트(POL) → 양하포트(POD) → {borderCityName} 철도 운임</p>
          </div>
          {isAdmin && (
            <Button 
              onClick={handleOpenDialog}
              className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border-2 border-white/50 shadow-lg transition-all hover:scale-105"
            >
              <Plus className="h-4 w-4 mr-2" />
              운임 추가
            </Button>
          )}
        </div>
      </div>

      {(expiredRates.length > 0 || expiringRates.length > 0) && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {expiredRates.length > 0 && (
              <div className="font-semibold">
                ⚠️ {expiredRates.length}개의 철도운임이 만료되었습니다.
              </div>
            )}
            {expiringRates.length > 0 && (
              <div className="text-sm mt-1">
                📅 {expiringRates.length}개의 철도운임이 7일 이내에 만료됩니다.
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="rounded-xl border-2 shadow-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-green-50 to-teal-50">
              <TableHead className="font-bold">
                <div className="flex items-center gap-2">
                  <Train className="h-4 w-4" />
                  철도 대리점
                </div>
              </TableHead>
              <TableHead className="font-bold">선적포트 (POL)</TableHead>
              {podPorts.map(pod => (
                <TableHead key={pod.id} className="font-bold">
                  양하포트 {pod.name} → {borderCityName}
                </TableHead>
              ))}
              <TableHead className="font-bold">유효기간</TableHead>
              <TableHead className="font-bold">상태</TableHead>
              {isAdmin && <TableHead className="text-right font-bold">작업</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {freightGroups.length > 0 ? (
              freightGroups.map((group, index) => (
                <TableRow key={`${group.agent}-${group.pol}-${group.validFrom}-${index}`} className="hover:bg-green-50/50 transition-colors">
                  <TableCell className="font-medium">{group.agent}</TableCell>
                  <TableCell className="font-medium text-blue-700">{group.pol}</TableCell>
                  {podPorts.map(pod => {
                    const freight = group.freights[pod.name];
                    return (
                      <TableCell key={pod.id}>
                        {freight ? (
                          freight.rate === 0 ? (
                            <span className="font-semibold text-orange-600">$0</span>
                          ) : (
                            <span className="font-semibold text-green-700">${freight.rate}</span>
                          )
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                    );
                  })}
                  <TableCell>
                    <div className="text-sm">
                      <div>{formatValidityDate(group.validFrom)}</div>
                      <div className="text-gray-500">~ {formatValidityDate(group.validTo)}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {group.validityStatus && (
                      <Badge variant={group.validityStatus.variant}>
                        {group.validityStatus.label}
                      </Badge>
                    )}
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditClick(group)}
                          className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          수정
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteGroup(group)}
                          className="hover:bg-red-50 hover:text-red-700 transition-all hover:scale-105"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={podPorts.length + (isAdmin ? 5 : 4)} className="text-center text-gray-500 py-8">
                  등록된 철도운임이 없습니다
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AuditLogTable 
        logs={auditLogs}
        title="철도운임 변경 기록"
        description="철도운임의 모든 변경 내역이 기록됩니다."
      />

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
        setIsAddDialogOpen(open);
        if (!open) setValidationWarning(null);
      }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>철도운임 추가</DialogTitle>
            <DialogDescription>새로운 철도운임을 추가합니다. 같은 대리점과 선적포트라도 유효기간이 겹치지 않으면 여러 개의 운임을 추가할 수 있습니다.</DialogDescription>
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
              <Label>선적포트 (POL) *</Label>
              <Select value={formData.pol} onValueChange={(value) => {
                setFormData({ ...formData, pol: value });
                setValidationWarning(null);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="선적포트 선택" />
                </SelectTrigger>
                <SelectContent>
                  {polPorts.map((port) => (
                    <SelectItem key={port.id} value={port.name}>
                      {port.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            <div className="space-y-3">
              <Label>각 양하포트별 운임 (USD) *</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {podPorts.map(pod => (
                  <div key={pod.id} className="space-y-2">
                    <Label className="text-sm text-gray-600">
                      양하포트 {pod.name} → {borderCityName}
                    </Label>
                    <Input
                      type="number"
                      placeholder="운임을 입력하세요"
                      value={formData[pod.name] || ''}
                      onChange={(e) => setFormData({ ...formData, [pod.name]: e.target.value })}
                    />
                  </div>
                ))}
              </div>
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
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-blue-600" />
              철도운임 수정
            </DialogTitle>
            <DialogDescription>
              철도운임 정보를 수정하세요. 운임을 비우면 해당 포트의 운임이 삭제됩니다.
            </DialogDescription>
          </DialogHeader>
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
              <Label>철도 대리점</Label>
              <Input value={formData.agent} disabled className="bg-gray-50" />
            </div>

            <div className="space-y-2">
              <Label>선적포트 (POL)</Label>
              <Input value={formData.pol} disabled className="bg-gray-50" />
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

            <div className="space-y-3">
              <Label>각 양하포트별 운임 (USD) *</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {podPorts.map(pod => (
                  <div key={pod.id} className="space-y-2">
                    <Label className="text-sm text-gray-600">
                      양하포트 {pod.name} → {borderCityName}
                    </Label>
                    <Input
                      type="number"
                      placeholder="운임 입력 (비우면 삭제)"
                      value={formData[pod.name] || ''}
                      onChange={(e) => {
                        setFormData({ ...formData, [pod.name]: e.target.value });
                        setValidationWarning(null);
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
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