import { useState, useEffect } from 'react';
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
  const [editingAgent, setEditingAgent] = useState<string>('');
  const [editingPol, setEditingPol] = useState<string>('');
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

  useEffect(() => {
    if (formData.agent && formData.pol && isAddDialogOpen) {
      const firstFreight = portBorderFreights.find(f => f.agent === formData.agent && f.pol === formData.pol);
      
      const newFormData: { agent: string; pol: string; validFrom: string; validTo: string; [key: string]: string } = { 
        agent: formData.agent,
        pol: formData.pol,
        validFrom: firstFreight?.validFrom || '',
        validTo: firstFreight?.validTo || '',
      };
      
      podPorts.forEach(pod => {
        const existingFreight = portBorderFreights.find(
          f => f.agent === formData.agent && f.pol === formData.pol && f.pod === pod.name
        );
        newFormData[pod.name] = existingFreight ? existingFreight.rate.toString() : '';
      });
      
      setFormData(newFormData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.agent, formData.pol, isAddDialogOpen]);

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

    // Check for overlaps
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

    // Add or update freights for each POD
    podPorts.forEach(pod => {
      if (formData[pod.name] && formData[pod.name] !== '') {
        const existingFreight = portBorderFreights.find(
          f => f.agent === formData.agent && f.pol === formData.pol && f.pod === pod.name
        );

        const freightData = {
          agent: formData.agent,
          pol: formData.pol,
          pod: pod.name,
          rate: Number(formData[pod.name]),
          validFrom: formData.validFrom,
          validTo: formData.validTo,
        };

        if (existingFreight) {
          updatePortBorderFreight(existingFreight.id, freightData);
        } else {
          addPortBorderFreight(freightData);
        }
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
        const existingFreight = portBorderFreights.find(
          f => f.agent === formData.agent && f.pol === formData.pol && f.pod === pod.name
        );

        const freightData = {
          agent: formData.agent,
          pol: formData.pol,
          pod: pod.name,
          rate: Number(formData[pod.name]),
          validFrom: formData.validFrom,
          validTo: formData.validTo,
        };

        if (existingFreight) {
          updatePortBorderFreight(existingFreight.id, freightData);
        } else {
          addPortBorderFreight(freightData);
        }
      }
    });

    setFormData(initializeFormData());
    setValidationWarning(null);
    setIsAddDialogOpen(false);
  };

  const handleEditClick = (agent: string, pol: string, freights: { [pod: string]: PortBorderFreight | undefined }) => {
    setEditingAgent(agent);
    setEditingPol(pol);
    
    const firstFreight = Object.values(freights).find(f => f);
    const newFormData: { agent: string; pol: string; validFrom: string; validTo: string; [key: string]: string } = {
      agent,
      pol,
      validFrom: firstFreight?.validFrom || '',
      validTo: firstFreight?.validTo || '',
    };
    
    podPorts.forEach(pod => {
      const freight = freights[pod.name];
      newFormData[pod.name] = freight ? freight.rate.toString() : '';
    });
    
    setFormData(newFormData);
    setValidationWarning(null);
    setIsEditDialogOpen(true);
  };

  const handleEditSave = () => {
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
      const existingFreight = portBorderFreights.find(
        f => f.agent === editingAgent && f.pol === editingPol && f.pod === pod.name
      );

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
            agent: editingAgent,
            pol: editingPol,
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
    setEditingAgent('');
    setEditingPol('');
    setFormData(initializeFormData());
    setValidationWarning(null);
  };

  const handleEditCancel = () => {
    setIsEditDialogOpen(false);
    setEditingAgent('');
    setEditingPol('');
    setFormData(initializeFormData());
    setValidationWarning(null);
  };

  const handleDeleteAgent = async (agent: string, pol: string, freights: { [pod: string]: PortBorderFreight | undefined }) => {
    const freightIds = Object.values(freights)
      .filter(f => f !== undefined)
      .map(f => f!.id);
    
    if (freightIds.length === 0) return;
    
    if (confirm(`${agent} (${pol})의 모든 철도운임(${freightIds.length}개)을 삭제하시겠습니까?`)) {
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

  // Group freights by agent and POL
  const freightsByAgentAndPol = railAgents.flatMap((agent) => {
    const agentPolGroups = polPorts.map(pol => {
      const agentFreights: { [pod: string]: PortBorderFreight | undefined } = {};
      podPorts.forEach(pod => {
        agentFreights[pod.name] = portBorderFreights.find(
          f => f.agent === agent.name && f.pol === pol.name && f.pod === pod.name
        );
      });
      
      const firstFreight = Object.values(agentFreights).find(f => f);
      const validityStatus = firstFreight ? getValidityStatus(firstFreight.validFrom, firstFreight.validTo) : null;
      
      return {
        agent: agent.name,
        pol: pol.name,
        freights: agentFreights,
        validityStatus,
        validFrom: firstFreight?.validFrom || '',
        validTo: firstFreight?.validTo || '',
        hasData: Object.values(agentFreights).some(f => f)
      };
    }).filter(group => group.hasData);
    
    return agentPolGroups;
  });

  const hasExistingData = (agentName: string, polName: string) => {
    return portBorderFreights.some(f => f.agent === agentName && f.pol === polName);
  };

  const auditLogs = getAuditLogsByType('portBorderFreight');
  const expiredRates = freightsByAgentAndPol.filter(f => f.validityStatus?.status === 'expired');
  const expiringRates = freightsByAgentAndPol.filter(f => f.validityStatus?.status === 'expiring');

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
            {freightsByAgentAndPol.map(({ agent, pol, freights, validityStatus, validFrom, validTo }) => {
              const hasData = Object.values(freights).some(f => f);
              return (
                <TableRow key={`${agent}-${pol}`} className="hover:bg-green-50/50 transition-colors">
                  <TableCell className="font-medium">{agent}</TableCell>
                  <TableCell className="font-medium text-blue-700">{pol}</TableCell>
                  {podPorts.map(pod => {
                    const freight = freights[pod.name];
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
                    {validFrom && validTo ? (
                      <div className="text-sm">
                        <div>{formatValidityDate(validFrom)}</div>
                        <div className="text-gray-500">~ {formatValidityDate(validTo)}</div>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {validityStatus && (
                      <Badge variant={validityStatus.variant}>
                        {validityStatus.label}
                      </Badge>
                    )}
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="text-right">
                      {hasData && (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditClick(agent, pol, freights)}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            수정
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteAgent(agent, pol, freights)}
                            className="hover:bg-red-50 hover:text-red-700 transition-all hover:scale-105"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              );
            })}
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
            <DialogTitle>철도운임 추가/수정</DialogTitle>
            <DialogDescription>철도 대리점별 운임을 입력하세요. 기존 데이터가 있으면 자동으로 표시됩니다.</DialogDescription>
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
                      {hasExistingData(formData.agent, port.name) && <span className="ml-2 text-xs text-blue-600">(기존 데이터 있음)</span>}
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
            <Button onClick={handleAdd}>
              {formData.agent && formData.pol && hasExistingData(formData.agent, formData.pol) ? '수정' : '추가'}
            </Button>
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