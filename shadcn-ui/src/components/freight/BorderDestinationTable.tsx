import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFreight } from '@/contexts/FreightContext';
import { BorderDestinationFreight } from '@/types/freight';
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
import { Trash2, Plus, Truck, AlertTriangle, Sparkles, Edit } from 'lucide-react';
import AuditLogTable from './AuditLogTable';
import { ValidityPeriodInput } from '@/components/ui/validity-period-input';
import { getValidityStatus, formatValidityDate, checkOverlapWarning } from '@/utils/validityHelper';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function BorderDestinationTable() {
  const { user } = useAuth();
  const { 
    destinations,
    truckAgents,
    borderDestinationFreights, 
    batchBorderDestinationFreightOperations,
    getAuditLogsByType,
    getDefaultBorderCity,
    getSystemSettingValue
  } = useFreight();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<string>('');
  const [validationWarning, setValidationWarning] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    agent: string;
    validFrom: string;
    validTo: string;
    [key: string]: string;
  }>({
    agent: '',
    validFrom: '',
    validTo: '',
  });

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  const borderCity = getDefaultBorderCity();
  const borderCityName = borderCity?.name || getSystemSettingValue('default_border_city', 'KASHGAR');

  const initializeFormData = () => {
    const data: { agent: string; validFrom: string; validTo: string; [key: string]: string } = { 
      agent: '', 
      validFrom: '', 
      validTo: '' 
    };
    destinations.forEach(dest => {
      data[dest.id] = '';
    });
    return data;
  };

  useEffect(() => {
    if (formData.agent) {
      const data: { agent: string; validFrom: string; validTo: string; [key: string]: string } = { 
        agent: formData.agent,
        validFrom: '',
        validTo: '',
      };
      
      const firstFreight = borderDestinationFreights.find(f => f.agent === formData.agent);
      if (firstFreight) {
        data.validFrom = firstFreight.validFrom;
        data.validTo = firstFreight.validTo;
      }
      
      destinations.forEach(dest => {
        const existingFreight = borderDestinationFreights.find(
          f => f.agent === formData.agent && f.destinationId === dest.id
        );
        data[dest.id] = existingFreight ? existingFreight.rate.toString() : '';
      });
      setFormData(data);
    }
  }, [formData.agent, destinations, borderDestinationFreights]);

  const handleAdd = async () => {
    if (!formData.agent || !formData.validFrom || !formData.validTo) {
      setValidationWarning('❌ 모든 필수 항목을 입력해주세요.');
      return;
    }

    const hasAnyRate = destinations.some(dest => formData[dest.id] && formData[dest.id] !== '');
    if (!hasAnyRate) {
      setValidationWarning('❌ 최소 하나 이상의 목적지 운임을 입력해주세요.');
      return;
    }

    // Check for overlaps
    for (const dest of destinations) {
      if (formData[dest.id] && formData[dest.id] !== '') {
        const warning = checkOverlapWarning(
          formData.validFrom,
          formData.validTo,
          '',
          borderDestinationFreights,
          (item) => item.agent === formData.agent && item.destinationId === dest.id
        );

        if (warning) {
          setValidationWarning(warning);
          return;
        }
      }
    }

    try {
      const operations: Array<{
        type: 'add' | 'update' | 'delete';
        data?: Omit<BorderDestinationFreight, 'id' | 'createdAt'>;
        id?: string;
        updates?: Partial<BorderDestinationFreight>;
      }> = [];

      destinations.forEach(dest => {
        if (formData[dest.id] && formData[dest.id] !== '') {
          const existingFreight = borderDestinationFreights.find(
            f => f.agent === formData.agent && f.destinationId === dest.id
          );

          if (existingFreight) {
            operations.push({
              type: 'update',
              id: existingFreight.id,
              updates: {
                agent: formData.agent,
                destinationId: dest.id,
                rate: Number(formData[dest.id]),
                validFrom: formData.validFrom,
                validTo: formData.validTo,
              }
            });
          } else {
            operations.push({
              type: 'add',
              data: {
                agent: formData.agent,
                destinationId: dest.id,
                rate: Number(formData[dest.id]),
                validFrom: formData.validFrom,
                validTo: formData.validTo,
              }
            });
          }
        }
      });

      await batchBorderDestinationFreightOperations(operations);

      setFormData(initializeFormData());
      setValidationWarning(null);
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('Error adding/updating freight:', error);
      setValidationWarning('운임 추가/수정 중 오류가 발생했습니다.');
    }
  };

  const handleAddIgnoreWarning = async () => {
    if (!formData.agent || !formData.validFrom || !formData.validTo) return;

    const hasAnyRate = destinations.some(dest => formData[dest.id] && formData[dest.id] !== '');
    if (!hasAnyRate) return;

    try {
      const operations: Array<{
        type: 'add' | 'update' | 'delete';
        data?: Omit<BorderDestinationFreight, 'id' | 'createdAt'>;
        id?: string;
        updates?: Partial<BorderDestinationFreight>;
      }> = [];

      destinations.forEach(dest => {
        if (formData[dest.id] && formData[dest.id] !== '') {
          const existingFreight = borderDestinationFreights.find(
            f => f.agent === formData.agent && f.destinationId === dest.id
          );

          if (existingFreight) {
            operations.push({
              type: 'update',
              id: existingFreight.id,
              updates: {
                agent: formData.agent,
                destinationId: dest.id,
                rate: Number(formData[dest.id]),
                validFrom: formData.validFrom,
                validTo: formData.validTo,
              }
            });
          } else {
            operations.push({
              type: 'add',
              data: {
                agent: formData.agent,
                destinationId: dest.id,
                rate: Number(formData[dest.id]),
                validFrom: formData.validFrom,
                validTo: formData.validTo,
              }
            });
          }
        }
      });

      await batchBorderDestinationFreightOperations(operations);

      setFormData(initializeFormData());
      setValidationWarning(null);
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('Error adding/updating freight:', error);
      setValidationWarning('운임 추가/수정 중 오류가 발생했습니다.');
    }
  };

  const handleEditClick = (agent: string, freights: { [destinationId: string]: BorderDestinationFreight | undefined }) => {
    setEditingAgent(agent);
    
    const firstFreight = Object.values(freights).find(f => f);
    const newFormData: { agent: string; validFrom: string; validTo: string; [key: string]: string } = {
      agent,
      validFrom: firstFreight?.validFrom || '',
      validTo: firstFreight?.validTo || '',
    };
    
    destinations.forEach(dest => {
      const freight = freights[dest.id];
      newFormData[dest.id] = freight ? freight.rate.toString() : '';
    });
    
    setFormData(newFormData);
    setValidationWarning(null);
    setIsEditDialogOpen(true);
  };

  const handleEditSave = async () => {
    if (!formData.validFrom || !formData.validTo) {
      setValidationWarning('❌ 유효기간을 입력해주세요.');
      return;
    }

    const hasAnyRate = destinations.some(dest => formData[dest.id] && formData[dest.id] !== '');
    if (!hasAnyRate) {
      setValidationWarning('❌ 최소 하나 이상의 목적지 운임을 입력해주세요.');
      return;
    }

    try {
      const operations: Array<{
        type: 'add' | 'update' | 'delete';
        data?: Omit<BorderDestinationFreight, 'id' | 'createdAt'>;
        id?: string;
        updates?: Partial<BorderDestinationFreight>;
      }> = [];

      destinations.forEach(dest => {
        const existingFreight = borderDestinationFreights.find(
          f => f.agent === editingAgent && f.destinationId === dest.id
        );

        if (formData[dest.id] && formData[dest.id] !== '') {
          if (existingFreight) {
            operations.push({
              type: 'update',
              id: existingFreight.id,
              updates: {
                rate: Number(formData[dest.id]),
                validFrom: formData.validFrom,
                validTo: formData.validTo,
              }
            });
          } else {
            operations.push({
              type: 'add',
              data: {
                agent: editingAgent,
                destinationId: dest.id,
                rate: Number(formData[dest.id]),
                validFrom: formData.validFrom,
                validTo: formData.validTo,
              }
            });
          }
        } else if (existingFreight) {
          operations.push({
            type: 'delete',
            id: existingFreight.id,
          });
        }
      });

      await batchBorderDestinationFreightOperations(operations);

      setIsEditDialogOpen(false);
      setEditingAgent('');
      setFormData(initializeFormData());
      setValidationWarning(null);
    } catch (error) {
      console.error('Error updating freight:', error);
      setValidationWarning('운임 수정 중 오류가 발생했습니다.');
    }
  };

  const handleEditCancel = () => {
    setIsEditDialogOpen(false);
    setEditingAgent('');
    setFormData(initializeFormData());
    setValidationWarning(null);
  };

  const handleDeleteAgent = async (agent: string, freights: { [destinationId: string]: BorderDestinationFreight | undefined }) => {
    const freightIds = Object.values(freights).filter(f => f).map(f => f!.id);
    const destinationNames = Object.keys(freights)
      .filter(destId => freights[destId])
      .map(destId => {
        const dest = destinations.find(d => d.id === destId);
        return dest ? dest.name : destId;
      })
      .join(', ');

    if (confirm(`"${agent}" 트럭 대리점의 모든 운임을 삭제하시겠습니까?\n\n삭제될 목적지: ${destinationNames}\n총 ${freightIds.length}개의 운임이 삭제됩니다.`)) {
      try {
        const operations = freightIds.map(id => ({
          type: 'delete' as const,
          id,
        }));

        await batchBorderDestinationFreightOperations(operations);
      } catch (error) {
        console.error('Error deleting freights:', error);
        alert('운임 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  const handleOpenDialog = () => {
    setFormData(initializeFormData());
    setValidationWarning(null);
    setIsAddDialogOpen(true);
  };

  const freightsByAgent = truckAgents.map((agent) => {
    const agentFreights: { [destinationId: string]: BorderDestinationFreight | undefined } = {};
    destinations.forEach(dest => {
      agentFreights[dest.id] = borderDestinationFreights.find(
        f => f.agent === agent.name && f.destinationId === dest.id
      );
    });
    
    const firstFreight = Object.values(agentFreights).find(f => f);
    const validityStatus = firstFreight ? getValidityStatus(firstFreight.validFrom, firstFreight.validTo) : null;
    
    return {
      agent: agent.name,
      freights: agentFreights,
      validityStatus,
      validFrom: firstFreight?.validFrom || '',
      validTo: firstFreight?.validTo || '',
    };
  });

  const hasExistingData = (agentName: string) => {
    return borderDestinationFreights.some(f => f.agent === agentName);
  };

  const auditLogs = getAuditLogsByType('borderDestinationFreight');
  const expiredRates = freightsByAgent.filter(f => f.validityStatus?.status === 'expired');
  const expiringRates = freightsByAgent.filter(f => f.validityStatus?.status === 'expiring');

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 p-6 shadow-xl">
        <div className="absolute inset-0 bg-grid-white/10"></div>
        <div className="relative flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-white/20 backdrop-blur-sm rounded-xl">
                <Truck className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-white flex items-center gap-2">
                트럭운임 관리
                <Sparkles className="h-5 w-5 text-yellow-300 animate-pulse" />
              </h2>
            </div>
            <p className="text-amber-50 ml-14">{borderCityName} → 최종목적지 트럭 운임</p>
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
                ⚠️ {expiredRates.length}개의 트럭운임이 만료되었습니다.
              </div>
            )}
            {expiringRates.length > 0 && (
              <div className="text-sm mt-1">
                📅 {expiringRates.length}개의 트럭운임이 7일 이내에 만료됩니다.
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="rounded-xl border-2 shadow-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-amber-50 to-orange-50">
              <TableHead className="font-bold">
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  트럭 대리점
                </div>
              </TableHead>
              {destinations.map(dest => (
                <TableHead key={dest.id} className="font-bold">
                  {borderCityName} → {dest.name}
                </TableHead>
              ))}
              <TableHead className="font-bold">유효기간</TableHead>
              <TableHead className="font-bold">상태</TableHead>
              {isAdmin && <TableHead className="text-right font-bold">작업</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {freightsByAgent.map(({ agent, freights, validityStatus, validFrom, validTo }) => {
              const hasData = Object.values(freights).some(f => f);
              return (
                <TableRow key={agent} className="hover:bg-amber-50/50 transition-colors">
                  <TableCell className="font-medium">{agent}</TableCell>
                  {destinations.map(dest => {
                    const freight = freights[dest.id];
                    return (
                      <TableCell key={dest.id}>
                        {freight ? (
                          <span className="font-semibold text-orange-700">${freight.rate}</span>
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
                            onClick={() => handleEditClick(agent, freights)}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            수정
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteAgent(agent, freights)}
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
        title="트럭운임 변경 기록"
        description="트럭운임의 모든 변경 내역이 기록됩니다."
      />

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
        setIsAddDialogOpen(open);
        if (!open) setValidationWarning(null);
      }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>트럭운임 추가/수정</DialogTitle>
            <DialogDescription>트럭 대리점별 운임을 입력하세요. 기존 데이터가 있으면 자동으로 표시됩니다.</DialogDescription>
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
                      {hasExistingData(agent.name) && <span className="ml-2 text-xs text-blue-600">(기존 데이터 있음)</span>}
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
              <Label>각 목적지별 운임 (USD)</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {destinations.map(dest => (
                  <div key={dest.id} className="space-y-2">
                    <Label className="text-sm text-gray-600">
                      {borderCityName} → {dest.name}
                    </Label>
                    <Input
                      type="number"
                      placeholder="운임을 입력하세요"
                      value={formData[dest.id] || ''}
                      onChange={(e) => setFormData({ ...formData, [dest.id]: e.target.value })}
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
              {formData.agent && hasExistingData(formData.agent) ? '수정' : '추가'}
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
              트럭운임 수정
            </DialogTitle>
            <DialogDescription>
              트럭운임 정보를 수정하세요. 운임을 비우면 해당 목적지 운임이 삭제됩니다.
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
              <Label>트럭 대리점</Label>
              <Input value={formData.agent} disabled className="bg-gray-50" />
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
              <Label>각 목적지별 운임 (USD)</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {destinations.map(dest => (
                  <div key={dest.id} className="space-y-2">
                    <Label className="text-sm text-gray-600">
                      {borderCityName} → {dest.name}
                    </Label>
                    <Input
                      type="number"
                      placeholder="운임 입력 (비우면 삭제)"
                      value={formData[dest.id] || ''}
                      onChange={(e) => {
                        setFormData({ ...formData, [dest.id]: e.target.value });
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