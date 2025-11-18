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
import { Trash2, Plus, Truck, AlertTriangle, RefreshCw, Sparkles } from 'lucide-react';
import AuditLogTable from './AuditLogTable';
import { ValidityPeriodInput } from '@/components/ui/validity-period-input';
import { getValidityStatus, formatValidityDate, validateNoOverlap } from '@/utils/validityHelper';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface VersionChangeData {
  agent: string;
  rates: { [destinationId: string]: number | undefined };
  validFrom: string;
  validTo: string;
  currentVersion: number;
  nextVersion: number;
}

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
  const [isVersionChangeDialogOpen, setIsVersionChangeDialogOpen] = useState(false);
  const [versionChangeData, setVersionChangeData] = useState<VersionChangeData | null>(null);
  const [originalFreightIds, setOriginalFreightIds] = useState<string[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
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

  // Get border city name from database
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
    if (!formData.agent || !formData.validFrom || !formData.validTo) return;

    const hasAnyRate = destinations.some(dest => formData[dest.id] && formData[dest.id] !== '');
    if (!hasAnyRate) return;

    for (const dest of destinations) {
      if (formData[dest.id] && formData[dest.id] !== '') {
        const existingFreight = borderDestinationFreights.find(
          f => f.agent === formData.agent && f.destinationId === dest.id
        );
        
        const error = validateNoOverlap(
          formData.validFrom,
          formData.validTo,
          existingFreight?.id || '',
          borderDestinationFreights,
          (item) => item.agent === formData.agent && item.destinationId === dest.id
        );

        if (error) {
          setValidationError(error);
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
      setValidationError(null);
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('Error adding/updating freight:', error);
      setValidationError('운임 추가/수정 중 오류가 발생했습니다.');
    }
  };

  const handleVersionChangeClick = (agent: string, freights: { [destinationId: string]: BorderDestinationFreight | undefined }) => {
    const agentFreights = borderDestinationFreights.filter(f => f.agent === agent);
    const maxVersion = Math.max(...agentFreights.map(item => item.version || 1), 0);
    const nextVersion = maxVersion + 1;

    const firstFreight = Object.values(freights).find(f => f);
    let validFrom = '';
    let validTo = '';

    try {
      if (!firstFreight || !firstFreight.validTo || firstFreight.validTo === '') {
        const today = new Date();
        validFrom = today.toISOString().split('T')[0];
      } else {
        const validFromDate = new Date(firstFreight.validTo);
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

    const rates: { [destinationId: string]: number | undefined } = {};
    const ids: string[] = [];
    destinations.forEach(dest => {
      const freight = freights[dest.id];
      if (freight) {
        rates[dest.id] = freight.rate;
        ids.push(freight.id);
      } else {
        rates[dest.id] = undefined;
      }
    });

    setVersionChangeData({
      agent,
      rates,
      validFrom,
      validTo,
      currentVersion: firstFreight?.version || 1,
      nextVersion,
    });
    setOriginalFreightIds(ids);
    setValidationError(null);
    setIsVersionChangeDialogOpen(true);
  };

  const handleVersionChangeSave = async () => {
    if (!versionChangeData) return;

    if (!versionChangeData.validFrom || !versionChangeData.validTo) {
      setValidationError('❌ 유효기간을 입력해주세요.');
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
          f => f.agent === versionChangeData.agent && f.destinationId === dest.id
        );

        const newRate = versionChangeData.rates[dest.id];

        if (existingFreight) {
          if (newRate !== undefined && newRate > 0) {
            // Update existing freight with new rate
            operations.push({
              type: 'update',
              id: existingFreight.id,
              updates: {
                rate: newRate,
                validFrom: versionChangeData.validFrom,
                validTo: versionChangeData.validTo,
                version: versionChangeData.nextVersion,
              }
            });
          } else {
            // Delete freight if rate is undefined or 0
            operations.push({
              type: 'delete',
              id: existingFreight.id,
            });
          }
        } else if (newRate !== undefined && newRate > 0) {
          // Add new freight if it doesn't exist and has a rate
          operations.push({
            type: 'add',
            data: {
              agent: versionChangeData.agent,
              destinationId: dest.id,
              rate: newRate,
              validFrom: versionChangeData.validFrom,
              validTo: versionChangeData.validTo,
              version: versionChangeData.nextVersion,
            }
          });
        }
      });

      await batchBorderDestinationFreightOperations(operations);

      setIsVersionChangeDialogOpen(false);
      setVersionChangeData(null);
      setOriginalFreightIds([]);
      setValidationError(null);
    } catch (error) {
      console.error('Error updating version:', error);
      setValidationError('버전 변경 중 오류가 발생했습니다.');
    }
  };

  const handleVersionChangeCancel = () => {
    setIsVersionChangeDialogOpen(false);
    setVersionChangeData(null);
    setOriginalFreightIds([]);
    setValidationError(null);
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
    setValidationError(null);
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
      version: firstFreight?.version || 1,
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
      {/* Beautiful Header */}
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
              <TableHead className="font-bold">버전</TableHead>
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
            {freightsByAgent.map(({ agent, freights, validityStatus, validFrom, validTo, version }) => {
              const hasData = Object.values(freights).some(f => f);
              return (
                <TableRow key={agent} className="hover:bg-amber-50/50 transition-colors">
                  <TableCell>
                    {hasData && <Badge variant="outline" className="font-semibold">v{version}</Badge>}
                  </TableCell>
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
                            onClick={() => handleVersionChangeClick(agent, freights)}
                            className="bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-300 transition-all hover:scale-105"
                          >
                            <RefreshCw className="h-4 w-4 mr-1" />
                            버전 변경
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
        title="트럭운임 버전 기록"
        description="트럭운임의 모든 변경 내역이 버전별로 기록됩니다. '버전 변경' 버튼을 클릭하면 플로팅 화면에서 새 버전의 정보를 수정할 수 있습니다."
      />

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
        setIsAddDialogOpen(open);
        if (!open) setValidationError(null);
      }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>트럭운임 추가/수정</DialogTitle>
            <DialogDescription>트럭 대리점별 운임을 입력하세요. 기존 데이터가 있으면 자동으로 표시됩니다.</DialogDescription>
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
                  setValidationError(null);
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
              setValidationError(null);
            }}>
              취소
            </Button>
            <Button onClick={handleAdd}>
              {formData.agent && hasExistingData(formData.agent) ? '수정' : '추가'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Version Change Dialog */}
      <Dialog open={isVersionChangeDialogOpen} onOpenChange={handleVersionChangeCancel}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-purple-600" />
              버전 변경
            </DialogTitle>
            <DialogDescription>
              새로운 버전의 트럭운임 정보를 수정하세요. 버전이 자동으로 증가하고 유효기간이 설정됩니다. 운임을 비우거나 0으로 설정하면 해당 목적지 운임이 삭제됩니다.
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

              <div className="space-y-3">
                <Label>각 목적지별 운임 (USD)</Label>
                <div className="text-xs bg-amber-50 border border-amber-200 rounded p-3">
                  <p className="text-amber-700 font-medium">
                    💡 운임을 비우거나 0으로 설정하면 해당 목적지 운임이 삭제됩니다.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {destinations.map(dest => (
                    <div key={dest.id} className="space-y-2">
                      <Label className="text-sm text-gray-600">
                        {borderCityName} → {dest.name}
                      </Label>
                      <Input
                        type="number"
                        placeholder="운임 없음"
                        value={versionChangeData.rates[dest.id] !== undefined ? versionChangeData.rates[dest.id] : ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          setVersionChangeData({
                            ...versionChangeData,
                            rates: {
                              ...versionChangeData.rates,
                              [dest.id]: value === '' ? undefined : Number(value)
                            }
                          });
                          setValidationError(null);
                        }}
                      />
                    </div>
                  ))}
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