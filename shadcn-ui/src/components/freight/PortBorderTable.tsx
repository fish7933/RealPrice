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
import { Trash2, Plus, Train, AlertTriangle, RefreshCw, Sparkles } from 'lucide-react';
import AuditLogTable from './AuditLogTable';
import { ValidityPeriodInput } from '@/components/ui/validity-period-input';
import { getValidityStatus, formatValidityDate, validateNoOverlap } from '@/utils/validityHelper';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface VersionChangeData {
  agent: string;
  pol: string;
  rates: { [pod: string]: number | null };
  validFrom: string;
  validTo: string;
  currentVersion: number;
  nextVersion: number;
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
  const [isVersionChangeDialogOpen, setIsVersionChangeDialogOpen] = useState(false);
  const [versionChangeData, setVersionChangeData] = useState<VersionChangeData | null>(null);
  const [originalFreightIds, setOriginalFreightIds] = useState<string[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);
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

  // Get border city name from database
  const borderCity = getDefaultBorderCity();
  const borderCityName = borderCity?.name || getSystemSettingValue('default_border_city', 'KASHGAR');

  // Get POL ports (type === 'POL') and POD ports (type === 'POD')
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

  // Load existing data when agent and pol are selected
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
    console.log('=== handleAdd 시작 ===');
    console.log('전체 formData:', JSON.stringify(formData, null, 2));
    
    if (!formData.agent || formData.agent.trim() === '') {
      console.error('❌ 검증 실패: agent가 비어있음');
      setValidationError('❌ 철도 대리점을 선택해주세요.');
      return;
    }
    
    if (!formData.pol || formData.pol.trim() === '') {
      console.error('❌ 검증 실패: pol이 비어있음');
      setValidationError('❌ 선적포트(POL)를 선택해주세요.');
      return;
    }
    
    if (!formData.validFrom || formData.validFrom.trim() === '') {
      console.error('❌ 검증 실패: validFrom이 비어있음');
      setValidationError('❌ 유효기간 시작일을 입력해주세요.');
      return;
    }
    
    if (!formData.validTo || formData.validTo.trim() === '') {
      console.error('❌ 검증 실패: validTo가 비어있음');
      setValidationError('❌ 유효기간 종료일을 입력해주세요.');
      return;
    }

    const hasAnyRate = podPorts.some(pod => formData[pod.name] && formData[pod.name] !== '');
    if (!hasAnyRate) {
      console.error('❌ 검증 실패: 운임이 하나도 입력되지 않음');
      setValidationError('❌ 최소 하나 이상의 양하포트 운임을 입력해주세요.');
      return;
    }

    // Validate no overlap for each POD
    for (const pod of podPorts) {
      if (formData[pod.name] && formData[pod.name] !== '') {
        const existingFreight = portBorderFreights.find(
          f => f.agent === formData.agent && f.pol === formData.pol && f.pod === pod.name
        );
        
        const error = validateNoOverlap(
          formData.validFrom,
          formData.validTo,
          existingFreight?.id || '',
          portBorderFreights,
          (item) => item.agent === formData.agent && item.pol === formData.pol && item.pod === pod.name
        );

        if (error) {
          console.error('❌ 유효기간 중복 오류:', error);
          setValidationError(error);
          return;
        }
      }
    }

    console.log('=== 운임 추가/수정 시작 ===');

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

    console.log('=== 운임 추가/수정 완료 ===\n');
    setFormData(initializeFormData());
    setValidationError(null);
    setIsAddDialogOpen(false);
  };

  const handleVersionChangeClick = (agent: string, pol: string, freights: { [pod: string]: PortBorderFreight | undefined }) => {
    const agentFreights = portBorderFreights.filter(f => f.agent === agent && f.pol === pol);
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

    const rates: { [pod: string]: number | null } = {};
    const ids: string[] = [];
    podPorts.forEach(pod => {
      const freight = freights[pod.name];
      if (freight) {
        rates[pod.name] = freight.rate;
        ids.push(freight.id);
      } else {
        rates[pod.name] = null;
      }
    });

    setVersionChangeData({
      agent,
      pol,
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

    console.log('🔄 [VERSION CHANGE] Starting version change save...');
    console.log('📊 [VERSION CHANGE] Current version:', versionChangeData.currentVersion);
    console.log('📊 [VERSION CHANGE] Next version:', versionChangeData.nextVersion);
    console.log('📊 [VERSION CHANGE] Current rates:', versionChangeData.rates);

    const hasAnyRate = Object.values(versionChangeData.rates).some(rate => rate !== null);
    if (!hasAnyRate || !versionChangeData.validFrom || !versionChangeData.validTo) {
      setValidationError('❌ 모든 필수 항목을 입력해주세요.');
      return;
    }

    try {
      // ✅ 각 POD에 대해 처리
      for (const pod of podPorts) {
        const newRate = versionChangeData.rates[pod.name];
        const existingFreight = portBorderFreights.find(
          f => f.agent === versionChangeData.agent && f.pol === versionChangeData.pol && f.pod === pod.name
        );

        console.log(`\n--- ${pod.name} 처리 ---`);
        console.log('새 운임:', newRate);
        console.log('기존 운임:', existingFreight);

        if (newRate !== null) {
          // ✅ 운임이 입력된 경우 (0 포함)
          if (existingFreight) {
            console.log(`✏️ [VERSION CHANGE] Updating freight for ${pod.name} with version ${versionChangeData.nextVersion}`);
            await updatePortBorderFreight(existingFreight.id, {
              rate: newRate,
              version: versionChangeData.nextVersion,  // ✅ 버전 번호 업데이트!
              validFrom: versionChangeData.validFrom,
              validTo: versionChangeData.validTo,
            });
          } else {
            console.log(`➕ [VERSION CHANGE] Adding new freight for ${pod.name} with version ${versionChangeData.nextVersion}`);
            await addPortBorderFreight({
              agent: versionChangeData.agent,
              pol: versionChangeData.pol,
              pod: pod.name,
              rate: newRate,
              version: versionChangeData.nextVersion,  // ✅ 버전 번호 설정!
              validFrom: versionChangeData.validFrom,
              validTo: versionChangeData.validTo,
            });
          }
        } else {
          // ✅ 운임이 null인 경우 (운임 없음) - 기존 운임이 있으면 삭제
          if (existingFreight) {
            console.log(`🗑️ [VERSION CHANGE] Deleting freight for ${pod.name}`);
            await deletePortBorderFreight(existingFreight.id);
          }
        }
      }

      console.log('✅ [VERSION CHANGE] Version change completed successfully');
      setIsVersionChangeDialogOpen(false);
      setVersionChangeData(null);
      setOriginalFreightIds([]);
      setValidationError(null);
    } catch (error) {
      console.error('❌ [VERSION CHANGE] Error during version change:', error);
      setValidationError('버전 변경 중 오류가 발생했습니다.');
    }
  };

  const handleVersionChangeCancel = () => {
    setIsVersionChangeDialogOpen(false);
    setVersionChangeData(null);
    setOriginalFreightIds([]);
    setValidationError(null);
  };

  const handleDeleteAgent = async (agent: string, pol: string, freights: { [pod: string]: PortBorderFreight | undefined }) => {
    const freightIds = Object.values(freights)
      .filter(f => f !== undefined)
      .map(f => f!.id);
    
    if (freightIds.length === 0) return;
    
    if (confirm(`${agent} (${pol})의 모든 철도운임(${freightIds.length}개)을 삭제하시겠습니까?`)) {
      console.log('🗑️ [DELETE] Starting deletion of all freights:', freightIds);
      
      try {
        for (const id of freightIds) {
          console.log(`🗑️ [DELETE] Deleting freight ID: ${id}`);
          await deletePortBorderFreight(id);
        }
        console.log('✅ [DELETE] All freights deleted successfully');
      } catch (error) {
        console.error('❌ [DELETE] Error during deletion:', error);
      }
    }
  };

  const handleOpenDialog = () => {
    setFormData(initializeFormData());
    setValidationError(null);
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
        version: firstFreight?.version || 1,
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
      {/* Beautiful Header */}
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
              <TableHead className="font-bold">버전</TableHead>
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
            {freightsByAgentAndPol.map(({ agent, pol, freights, validityStatus, validFrom, validTo, version }) => {
              const hasData = Object.values(freights).some(f => f);
              return (
                <TableRow key={`${agent}-${pol}`} className="hover:bg-green-50/50 transition-colors">
                  <TableCell>
                    {hasData && <Badge variant="outline" className="font-semibold">v{version}</Badge>}
                  </TableCell>
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
                            onClick={() => handleVersionChangeClick(agent, pol, freights)}
                            className="bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-300 transition-all hover:scale-105"
                          >
                            <RefreshCw className="h-4 w-4 mr-1" />
                            버전 변경
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
        title="철도운임 버전 기록"
        description="철도운임의 모든 변경 내역이 버전별로 기록됩니다. '버전 변경' 버튼을 클릭하면 플로팅 화면에서 새 버전의 정보를 수정할 수 있습니다."
      />

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
        setIsAddDialogOpen(open);
        if (!open) setValidationError(null);
      }}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>철도운임 추가/수정</DialogTitle>
            <DialogDescription>철도 대리점별 운임을 입력하세요. 기존 데이터가 있으면 자동으로 표시됩니다.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {validationError && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-semibold">입력 오류</div>
                  <div className="text-sm mt-1">{validationError}</div>
                </AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
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
              <Label>선적포트 (POL) *</Label>
              <Select value={formData.pol} onValueChange={(value) => {
                setFormData({ ...formData, pol: value });
                setValidationError(null);
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
                  setValidationError(null);
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
              setValidationError(null);
            }}>
              취소
            </Button>
            <Button onClick={handleAdd}>
              {formData.agent && formData.pol && hasExistingData(formData.agent, formData.pol) ? '수정' : '추가'}
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
              새로운 버전의 철도운임 정보를 수정하세요. 버전이 자동으로 증가하고 유효기간이 설정됩니다.
              <br />
              <span className="text-orange-600 font-medium">💡 운임을 비우면 해당 포트의 운임이 삭제됩니다.</span>
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
                <Label>철도 대리점</Label>
                <Input value={versionChangeData.agent} disabled className="bg-gray-50" />
              </div>

              <div className="space-y-2">
                <Label>선적포트 (POL)</Label>
                <Input value={versionChangeData.pol} disabled className="bg-gray-50" />
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
                        value={versionChangeData.rates[pod.name] === null ? '' : versionChangeData.rates[pod.name]}
                        onChange={(e) => {
                          const value = e.target.value;
                          setVersionChangeData({
                            ...versionChangeData,
                            rates: {
                              ...versionChangeData.rates,
                              [pod.name]: value === '' ? null : Number(value)
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