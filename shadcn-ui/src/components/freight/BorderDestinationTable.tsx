import { useState, useMemo } from 'react';
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
import { Trash2, Plus, Truck, AlertTriangle, Sparkles, Edit, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import AuditLogTable from './AuditLogTable';
import { ValidityPeriodInput } from '@/components/ui/validity-period-input';
import { getValidityStatus, formatValidityDate, checkOverlapWarning } from '@/utils/validityHelper';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FreightGroup {
  agent: string;
  validFrom: string;
  validTo: string;
  freights: { [destinationId: string]: BorderDestinationFreight | undefined };
  validityStatus: ReturnType<typeof getValidityStatus> | null;
}

const ITEMS_PER_PAGE = 10;

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
  const [editingGroup, setEditingGroup] = useState<FreightGroup | null>(null);
  const [validationWarning, setValidationWarning] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'valid' | 'expiring' | 'expired'>('all');
  const [currentPage, setCurrentPage] = useState(1);
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

    // Check for overlaps with existing records for the same agent
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

      // Always add new records (no update logic in add dialog)
      destinations.forEach(dest => {
        if (formData[dest.id] && formData[dest.id] !== '') {
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
      });

      await batchBorderDestinationFreightOperations(operations);

      setFormData(initializeFormData());
      setValidationWarning(null);
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('Error adding freight:', error);
      setValidationWarning('운임 추가 중 오류가 발생했습니다.');
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
      });

      await batchBorderDestinationFreightOperations(operations);

      setFormData(initializeFormData());
      setValidationWarning(null);
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error('Error adding freight:', error);
      setValidationWarning('운임 추가 중 오류가 발생했습니다.');
    }
  };

  const handleEditClick = (group: FreightGroup) => {
    setEditingGroup(group);
    
    const newFormData: { agent: string; validFrom: string; validTo: string; [key: string]: string } = {
      agent: group.agent,
      validFrom: group.validFrom,
      validTo: group.validTo,
    };
    
    destinations.forEach(dest => {
      const freight = group.freights[dest.id];
      newFormData[dest.id] = freight ? freight.rate.toString() : '';
    });
    
    setFormData(newFormData);
    setValidationWarning(null);
    setIsEditDialogOpen(true);
  };

  const handleEditSave = async () => {
    if (!editingGroup) return;
    
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
        const existingFreight = editingGroup.freights[dest.id];

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
                agent: editingGroup.agent,
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
      setEditingGroup(null);
      setFormData(initializeFormData());
      setValidationWarning(null);
    } catch (error) {
      console.error('Error updating freight:', error);
      setValidationWarning('운임 수정 중 오류가 발생했습니다.');
    }
  };

  const handleEditCancel = () => {
    setIsEditDialogOpen(false);
    setEditingGroup(null);
    setFormData(initializeFormData());
    setValidationWarning(null);
  };

  const handleDeleteGroup = async (group: FreightGroup) => {
    const freightIds = Object.values(group.freights).filter(f => f).map(f => f!.id);
    const destinationNames = Object.keys(group.freights)
      .filter(destId => group.freights[destId])
      .map(destId => {
        const dest = destinations.find(d => d.id === destId);
        return dest ? dest.name : destId;
      })
      .join(', ');

    if (confirm(`"${group.agent}" 트럭 대리점의 운임을 삭제하시겠습니까?\n\n유효기간: ${formatValidityDate(group.validFrom)} ~ ${formatValidityDate(group.validTo)}\n삭제될 목적지: ${destinationNames}\n총 ${freightIds.length}개의 운임이 삭제됩니다.`)) {
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

  // Group freights by agent and validity period
  const allFreightGroups: FreightGroup[] = useMemo(() => {
    const groups: FreightGroup[] = [];
    
    // Get all unique combinations of agent + validFrom + validTo
    const uniqueCombinations = new Set<string>();
    borderDestinationFreights.forEach(freight => {
      uniqueCombinations.add(`${freight.agent}|${freight.validFrom}|${freight.validTo}`);
    });

    uniqueCombinations.forEach(combo => {
      const [agent, validFrom, validTo] = combo.split('|');
      
      const groupFreights: { [destinationId: string]: BorderDestinationFreight | undefined } = {};
      destinations.forEach(dest => {
        groupFreights[dest.id] = borderDestinationFreights.find(
          f => f.agent === agent && f.destinationId === dest.id && 
               f.validFrom === validFrom && f.validTo === validTo
        );
      });
      
      const firstFreight = Object.values(groupFreights).find(f => f);
      if (firstFreight) {
        groups.push({
          agent,
          validFrom,
          validTo,
          freights: groupFreights,
          validityStatus: getValidityStatus(validFrom, validTo)
        });
      }
    });

    // Sort by agent name, then by validFrom descending (newest first)
    groups.sort((a, b) => {
      if (a.agent !== b.agent) {
        return a.agent.localeCompare(b.agent);
      }
      return new Date(b.validFrom).getTime() - new Date(a.validFrom).getTime();
    });

    return groups;
  }, [borderDestinationFreights, destinations]);

  // Apply filters
  const filteredGroups = useMemo(() => {
    let filtered = allFreightGroups;

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(group => 
        group.agent.toLowerCase().includes(term) ||
        formatValidityDate(group.validFrom).includes(term) ||
        formatValidityDate(group.validTo).includes(term)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(group => 
        group.validityStatus?.status === statusFilter
      );
    }

    return filtered;
  }, [allFreightGroups, searchTerm, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredGroups.length / ITEMS_PER_PAGE);
  const paginatedGroups = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredGroups.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredGroups, currentPage]);

  // Reset to page 1 when filters change
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (value: 'all' | 'valid' | 'expiring' | 'expired') => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const auditLogs = getAuditLogsByType('borderDestinationFreight');
  const expiredRates = allFreightGroups.filter(f => f.validityStatus?.status === 'expired');
  const expiringRates = allFreightGroups.filter(f => f.validityStatus?.status === 'expiring');

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 p-4 shadow-lg">
        <div className="absolute inset-0 bg-grid-white/10"></div>
        <div className="relative flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-white/20 backdrop-blur-sm rounded-lg">
              <Truck className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                트럭운임 관리
                <Sparkles className="h-4 w-4 text-yellow-300 animate-pulse" />
              </h2>
              <p className="text-xs text-amber-50">{borderCityName} → 최종목적지</p>
            </div>
          </div>
          {isAdmin && (
            <Button 
              onClick={handleOpenDialog}
              size="sm"
              className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border border-white/50"
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

      {/* Search and Filter Section */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
          <Input
            placeholder="검색..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-7 h-8 text-sm"
          />
        </div>
        <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
          <SelectTrigger className="w-[120px] h-8 text-sm">
            <SelectValue placeholder="상태" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            <SelectItem value="valid">유효</SelectItem>
            <SelectItem value="expiring">만료임박</SelectItem>
            <SelectItem value="expired">만료</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-amber-50 to-orange-50">
              <TableHead className="h-9 text-xs font-bold whitespace-nowrap">대리점</TableHead>
              {destinations.map(dest => (
                <TableHead key={dest.id} className="h-9 text-xs font-bold whitespace-nowrap">
                  {dest.name}
                </TableHead>
              ))}
              <TableHead className="h-9 text-xs font-bold whitespace-nowrap">유효기간</TableHead>
              <TableHead className="h-9 text-xs font-bold whitespace-nowrap">상태</TableHead>
              {isAdmin && <TableHead className="h-9 text-xs font-bold text-right whitespace-nowrap">작업</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedGroups.length > 0 ? (
              paginatedGroups.map((group, index) => (
                <TableRow key={`${group.agent}-${group.validFrom}-${index}`} className="hover:bg-amber-50/50">
                  <TableCell className="py-2 text-xs font-medium whitespace-nowrap">{group.agent}</TableCell>
                  {destinations.map(dest => {
                    const freight = group.freights[dest.id];
                    return (
                      <TableCell key={dest.id} className="py-2 text-xs whitespace-nowrap">
                        {freight ? (
                          <span className="font-semibold text-orange-700">${freight.rate}</span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                    );
                  })}
                  <TableCell className="py-2 text-xs whitespace-nowrap">
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
                          className="h-6 w-6 p-0 hover:bg-red-50 hover:text-red-700"
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
                <TableCell colSpan={destinations.length + (isAdmin ? 4 : 3)} className="text-center text-gray-500 py-6 text-sm">
                  {searchTerm || statusFilter !== 'all' ? '검색 결과가 없습니다' : '등록된 트럭운임이 없습니다'}
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
            <DialogTitle>트럭운임 추가</DialogTitle>
            <DialogDescription>새로운 트럭운임을 추가합니다. 같은 대리점이라도 유효기간이 겹치지 않으면 여러 개의 운임을 추가할 수 있습니다.</DialogDescription>
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
              <Label>트럭 대리점 *</Label>
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
              <Label>각 목적지별 운임 (USD) *</Label>
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
              <Label>각 목적지별 운임 (USD) *</Label>
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