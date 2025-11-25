import { useState, useMemo } from 'react';
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
import { Trash2, Plus, Train, AlertTriangle, Edit, ChevronLeft, ChevronRight, X, Search } from 'lucide-react';
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

const ITEMS_PER_PAGE = 10;
const FILTER_ALL_VALUE = '__all__';

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
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    agent: FILTER_ALL_VALUE,
    pol: FILTER_ALL_VALUE,
    status: FILTER_ALL_VALUE,
  });
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

  const handleClearFilters = () => {
    setFilters({
      agent: FILTER_ALL_VALUE,
      pol: FILTER_ALL_VALUE,
      status: FILTER_ALL_VALUE,
    });
    setCurrentPage(1);
  };

  // Group freights by agent, POL, and validity period
  const allFreightGroups: FreightGroup[] = useMemo(() => {
    const groups: FreightGroup[] = [];
    
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
        groups.push({
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
    groups.sort((a, b) => {
      if (a.agent !== b.agent) {
        return a.agent.localeCompare(b.agent);
      }
      if (a.pol !== b.pol) {
        return a.pol.localeCompare(b.pol);
      }
      return new Date(b.validFrom).getTime() - new Date(a.validFrom).getTime();
    });

    return groups;
  }, [portBorderFreights, podPorts]);

  // Extract unique filter options
  const filterOptions = useMemo(() => {
    const agents = new Set<string>();
    const pols = new Set<string>();

    allFreightGroups.forEach(group => {
      agents.add(group.agent);
      pols.add(group.pol);
    });

    return {
      agents: Array.from(agents).sort((a, b) => a.localeCompare(b, 'ko')),
      pols: Array.from(pols).sort((a, b) => a.localeCompare(b, 'ko')),
    };
  }, [allFreightGroups]);

  // Apply filters
  const filteredGroups = useMemo(() => {
    let filtered = allFreightGroups;

    // Agent filter
    if (filters.agent !== FILTER_ALL_VALUE) {
      filtered = filtered.filter(group => group.agent === filters.agent);
    }

    // POL filter
    if (filters.pol !== FILTER_ALL_VALUE) {
      filtered = filtered.filter(group => group.pol === filters.pol);
    }

    // Status filter
    if (filters.status !== FILTER_ALL_VALUE) {
      filtered = filtered.filter(group => 
        group.validityStatus?.status === filters.status
      );
    }

    return filtered;
  }, [allFreightGroups, filters]);

  // Pagination
  const totalPages = Math.ceil(filteredGroups.length / ITEMS_PER_PAGE);
  const paginatedGroups = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredGroups.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredGroups, currentPage]);

  // Reset to page 1 when filters change
  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const auditLogs = getAuditLogsByType('portBorderFreight');
  const expiredRates = allFreightGroups.filter(f => f.validityStatus?.status === 'expired');
  const expiringRates = allFreightGroups.filter(f => f.validityStatus?.status === 'expiring');

  return (
    <div className="space-y-4">
      {/* Header Section - Compact */}
      <div className="relative overflow-hidden rounded-lg bg-gray-100 p-3 text-gray-900 shadow-lg">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10 blur-2xl"></div>
        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-24 w-24 rounded-full bg-white/10 blur-2xl"></div>
        <div className="relative flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-gray-200/80 backdrop-blur-sm rounded-lg">
              <Train className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold">철도운임</h2>
              <p className="text-xs text-gray-600">선적포트(POL) → 양하포트(POD) → {borderCityName}</p>
            </div>
          </div>
          {isAdmin && (
            <Button 
              onClick={handleOpenDialog}
              size="sm"
              className="bg-gray-200/80 backdrop-blur-sm hover:bg-gray-300/80 text-gray-900 border border-gray-400 h-7 text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              추가
            </Button>
          )}
        </div>
      </div>

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

      {/* Filter Section - Compact */}
      <div className="p-4 bg-gradient-to-r from-gray-100 to-gray-200 rounded-lg border-2 border-gray-400 shadow-lg">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1 bg-blue-100 rounded">
            <Search className="h-3 w-3 text-blue-600" />
          </div>
          <span className="text-xs font-semibold text-gray-800">검색 필터</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-gray-700">대리점</Label>
            <Select value={filters.agent} onValueChange={(value) => handleFilterChange('agent', value)}>
              <SelectTrigger className="h-8 text-xs bg-white">
                <SelectValue placeholder="전체" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={FILTER_ALL_VALUE}>전체</SelectItem>
                {filterOptions.agents.map((agent) => (
                  <SelectItem key={agent} value={agent}>{agent}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-gray-700">선적항 (POL)</Label>
            <Select value={filters.pol} onValueChange={(value) => handleFilterChange('pol', value)}>
              <SelectTrigger className="h-8 text-xs bg-white">
                <SelectValue placeholder="전체" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={FILTER_ALL_VALUE}>전체</SelectItem>
                {filterOptions.pols.map((pol) => (
                  <SelectItem key={pol} value={pol}>{pol}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-gray-700">상태</Label>
            <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
              <SelectTrigger className="h-8 text-xs bg-white">
                <SelectValue placeholder="전체" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={FILTER_ALL_VALUE}>전체</SelectItem>
                <SelectItem value="active">유효</SelectItem>
                <SelectItem value="expiring">만료임박</SelectItem>
                <SelectItem value="expired">만료</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button variant="outline" size="sm" onClick={handleClearFilters} className="h-7 text-xs w-full">
              <X className="h-3 w-3 mr-1" />
              초기화
            </Button>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="text-xs text-gray-600 font-medium">
        총 {filteredGroups.length}개 (전체 {allFreightGroups.length}개 중)
      </div>

      <div className="rounded-lg overflow-hidden shadow-md border-2 border-gray-300">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-200">
              <TableHead className="h-10 text-sm text-gray-900 font-extrabold whitespace-nowrap">대리점</TableHead>
              <TableHead className="h-10 text-sm text-gray-900 font-extrabold whitespace-nowrap">POL</TableHead>
              {podPorts.map(pod => (
                <TableHead key={pod.id} className="h-10 text-sm text-gray-900 font-extrabold whitespace-nowrap">
                  {pod.name}
                </TableHead>
              ))}
              <TableHead className="h-10 text-sm text-gray-900 font-extrabold whitespace-nowrap">유효기간</TableHead>
              <TableHead className="h-10 text-sm text-gray-900 font-extrabold whitespace-nowrap">상태</TableHead>
              {isAdmin && <TableHead className="h-10 text-sm text-right text-gray-900 font-extrabold whitespace-nowrap">작업</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedGroups.length > 0 ? (
              paginatedGroups.map((group, index) => (
                <TableRow key={`${group.agent}-${group.pol}-${group.validFrom}-${index}`} className="hover:bg-blue-50 transition-colors duration-150">
                  <TableCell className="py-3 text-sm font-medium whitespace-nowrap">{group.agent}</TableCell>
                  <TableCell className="py-3 text-sm font-medium whitespace-nowrap">{group.pol}</TableCell>
                  {podPorts.map(pod => {
                    const freight = group.freights[pod.name];
                    return (
                      <TableCell key={pod.id} className="py-3 text-sm whitespace-nowrap">
                        {freight ? (
                          <span className="font-semibold text-blue-600">
                            ${freight.rate}
                          </span>
                        ) : (
                          <span className="text-gray-700">-</span>
                        )}
                      </TableCell>
                    );
                  })}
                  <TableCell className="py-3 text-sm whitespace-nowrap">
                    {formatValidityDate(group.validFrom)} ~ {formatValidityDate(group.validTo)}
                  </TableCell>
                  <TableCell className="py-2 whitespace-nowrap">
                    {group.validityStatus && (
                      <Badge variant={group.validityStatus.variant} className="text-xs px-1.5 py-0">
                        {group.validityStatus.label}
                      </Badge>
                    )}
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="py-2 text-right whitespace-nowrap">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditClick(group)}
                          className="h-6 px-2 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteGroup(group)}
                          className="h-6 w-6 p-0 hover:bg-blue-50 transition-colors duration-150 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={podPorts.length + (isAdmin ? 5 : 4)} className="text-center py-6">
                  <div className="flex flex-col items-center gap-2 text-gray-700">
                    <Train className="h-12 w-12 opacity-20" />
                    <p className="text-sm">
                      {filters.agent !== FILTER_ALL_VALUE || filters.pol !== FILTER_ALL_VALUE || filters.status !== FILTER_ALL_VALUE ? '검색 결과가 없습니다' : '등록된 철도운임이 없습니다'}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs">
          <div className="text-gray-600">
            총 {filteredGroups.length}개 중 {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredGroups.length)}개
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-7 px-2"
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>
            <div className="text-xs font-medium px-2">
              {currentPage} / {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-7 px-2"
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

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
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <div className="p-2 bg-gray-200 rounded-lg">
                <Train className="h-5 w-5 text-gray-900" />
              </div>
              철도운임 추가
            </DialogTitle>
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
              <Label className="text-sm font-semibold text-gray-700">선적포트 (POL) *</Label>
              <Select value={formData.pol} onValueChange={(value) => {
                setFormData({ ...formData, pol: value });
                setValidationWarning(null);
              }}>
                <SelectTrigger className="border-gray-300 focus:border-blue-500">
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
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-gray-700">각 양하포트별 운임 (USD) *</Label>
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
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                ))}
              </div>
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
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <div className="p-2 bg-gray-200 rounded-lg">
                <Edit className="h-5 w-5 text-gray-900" />
              </div>
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
              <Label className="text-sm font-semibold text-gray-700">철도 대리점</Label>
              <Input value={formData.agent} disabled className="bg-gray-50" />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">선적포트 (POL)</Label>
              <Input value={formData.pol} disabled className="bg-gray-50" />
            </div>

            <div className="space-y-2">
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

            <div className="space-y-3">
              <Label className="text-sm font-semibold text-gray-700">각 양하포트별 운임 (USD) *</Label>
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
                      className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
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