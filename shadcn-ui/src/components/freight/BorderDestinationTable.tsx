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
import { Trash2, Plus, Truck, AlertTriangle, RefreshCw } from 'lucide-react';
import AuditLogTable from './AuditLogTable';
import { ValidityPeriodInput } from '@/components/ui/validity-period-input';
import { getValidityStatus, formatValidityDate, validateNoOverlap } from '@/utils/validityHelper';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface VersionChangeData {
  agent: string;
  rates: { [destinationId: string]: number };
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
    addBorderDestinationFreight, 
    updateBorderDestinationFreight, 
    deleteBorderDestinationFreight,
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

  const handleAdd = () => {
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

    destinations.forEach(dest => {
      if (formData[dest.id] && formData[dest.id] !== '') {
        const existingFreight = borderDestinationFreights.find(
          f => f.agent === formData.agent && f.destinationId === dest.id
        );

        if (existingFreight) {
          updateBorderDestinationFreight(existingFreight.id, {
            agent: formData.agent,
            destinationId: dest.id,
            rate: Number(formData[dest.id]),
            validFrom: formData.validFrom,
            validTo: formData.validTo,
          });
        } else {
          addBorderDestinationFreight({
            agent: formData.agent,
            destinationId: dest.id,
            rate: Number(formData[dest.id]),
            validFrom: formData.validFrom,
            validTo: formData.validTo,
          });
        }
      }
    });

    setFormData(initializeFormData());
    setValidationError(null);
    setIsAddDialogOpen(false);
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

    const rates: { [destinationId: string]: number } = {};
    const ids: string[] = [];
    destinations.forEach(dest => {
      const freight = freights[dest.id];
      if (freight) {
        rates[dest.id] = freight.rate;
        ids.push(freight.id);
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

  const handleVersionChangeSave = () => {
    if (!versionChangeData) return;

    const hasAnyRate = Object.values(versionChangeData.rates).some(rate => rate > 0);
    if (!hasAnyRate || !versionChangeData.validFrom || !versionChangeData.validTo) {
      setValidationError('❌ 모든 필수 항목을 입력해주세요.');
      return;
    }

    destinations.forEach(dest => {
      if (versionChangeData.rates[dest.id] && versionChangeData.rates[dest.id] > 0) {
        const existingFreight = borderDestinationFreights.find(
          f => f.agent === versionChangeData.agent && f.destinationId === dest.id
        );

        if (existingFreight) {
          updateBorderDestinationFreight(existingFreight.id, {
            rate: versionChangeData.rates[dest.id],
            validFrom: versionChangeData.validFrom,
            validTo: versionChangeData.validTo,
          });
        }
      }
    });

    setIsVersionChangeDialogOpen(false);
    setVersionChangeData(null);
    setOriginalFreightIds([]);
    setValidationError(null);
  };

  const handleVersionChangeCancel = () => {
    setIsVersionChangeDialogOpen(false);
    setVersionChangeData(null);
    setOriginalFreightIds([]);
    setValidationError(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('이 운임을 삭제하시겠습니까?')) {
      deleteBorderDestinationFreight(id);
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
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Truck className="h-6 w-6" />
            트럭운임 관리
          </h2>
          <p className="text-gray-600 mt-1">{borderCityName} → 최종목적지 트럭 운임</p>
        </div>
        {isAdmin && (
          <Button onClick={handleOpenDialog}>
            <Plus className="h-4 w-4 mr-2" />
            운임 추가
          </Button>
        )}
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

      <div className="border rounded-lg overflow-hidden bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>버전</TableHead>
              <TableHead>
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  트럭 대리점
                </div>
              </TableHead>
              {destinations.map(dest => (
                <TableHead key={dest.id}>
                  {borderCityName} → {dest.name}
                </TableHead>
              ))}
              <TableHead>유효기간</TableHead>
              <TableHead>상태</TableHead>
              {isAdmin && <TableHead className="text-right">작업</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {freightsByAgent.map(({ agent, freights, validityStatus, validFrom, validTo, version }) => {
              const hasData = Object.values(freights).some(f => f);
              return (
                <TableRow key={agent}>
                  <TableCell>
                    {hasData && <Badge variant="outline">v{version}</Badge>}
                  </TableCell>
                  <TableCell className="font-medium">{agent}</TableCell>
                  {destinations.map(dest => {
                    const freight = freights[dest.id];
                    return (
                      <TableCell key={dest.id}>
                        {freight ? (
                          <span>${freight.rate}</span>
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
                            className="bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-300"
                          >
                            <RefreshCw className="h-4 w-4 mr-1" />
                            버전 변경
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              Object.values(freights).forEach(freight => {
                                if (freight) handleDelete(freight.id);
                              });
                            }}
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
              새로운 버전의 트럭운임 정보를 수정하세요. 버전이 자동으로 증가하고 유효기간이 설정됩니다.
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
                <Label>각 목적지별 운임 (USD) *</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {destinations.map(dest => (
                    <div key={dest.id} className="space-y-2">
                      <Label className="text-sm text-gray-600">
                        {borderCityName} → {dest.name}
                      </Label>
                      <Input
                        type="number"
                        value={versionChangeData.rates[dest.id] || 0}
                        onChange={(e) => {
                          setVersionChangeData({
                            ...versionChangeData,
                            rates: {
                              ...versionChangeData.rates,
                              [dest.id]: Number(e.target.value)
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