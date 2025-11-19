import { useState, useMemo, useEffect } from 'react';
import { useFreight } from '@/contexts/FreightContext';
import { useAuth } from '@/contexts/AuthContext';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash2, Plus, AlertTriangle, Search, X, ChevronLeft, ChevronRight, Merge, Sparkles, Edit } from 'lucide-react';
import { CombinedFreight } from '@/types/freight';
import AuditLogTable from './AuditLogTable';
import { ValidityPeriodInput } from '@/components/ui/validity-period-input';
import { getValidityStatus, formatValidityDate, checkOverlapWarning } from '@/utils/validityHelper';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

const ITEMS_PER_PAGE = 10;
const FILTER_ALL_VALUE = '__all__';

export default function CombinedFreightTable() {
  const { user } = useAuth();
  const {
    combinedFreights,
    addCombinedFreight,
    updateCombinedFreight,
    deleteCombinedFreight,
    railAgents,
    destinations,
    getAuditLogsByType,
    ports,
  } = useFreight();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingFreight, setEditingFreight] = useState<CombinedFreight | null>(null);
  const [validationWarning, setValidationWarning] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    agent: '',
    pol: '',
    pod: '',
    destinationId: '',
    rate: '',
    description: '',
    validFrom: '',
    validTo: '',
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [searchFilters, setSearchFilters] = useState({
    agent: FILTER_ALL_VALUE,
    pol: FILTER_ALL_VALUE,
    pod: FILTER_ALL_VALUE,
    destination: FILTER_ALL_VALUE,
    status: FILTER_ALL_VALUE,
  });

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  
  const polPorts = ports.filter(p => p.type === 'POL');
  const podPorts = ports.filter(p => p.type === 'POD');

  const filterOptions = useMemo(() => {
    const agents = new Set<string>();
    const pols = new Set<string>();
    const pods = new Set<string>();
    const destinationIds = new Set<string>();

    combinedFreights.forEach(freight => {
      if (freight.agent) agents.add(freight.agent);
      if (freight.pol) pols.add(freight.pol);
      if (freight.pod) pods.add(freight.pod);
      if (freight.destinationId) destinationIds.add(freight.destinationId);
    });

    return {
      agents: Array.from(agents).sort((a, b) => a.localeCompare(b, 'ko')),
      pols: Array.from(pols).sort((a, b) => a.localeCompare(b, 'ko')),
      pods: Array.from(pods).sort((a, b) => a.localeCompare(b, 'ko')),
      destinations: Array.from(destinationIds).map(id => {
        const dest = destinations.find(d => d.id === id);
        return { id, name: dest?.name || id };
      }).sort((a, b) => a.name.localeCompare(b.name, 'ko')),
    };
  }, [combinedFreights, destinations]);

  const filteredFreights = useMemo(() => {
    return combinedFreights.filter((freight) => {
      if (searchFilters.agent !== FILTER_ALL_VALUE && freight.agent !== searchFilters.agent) {
        return false;
      }
      if (searchFilters.pol !== FILTER_ALL_VALUE && freight.pol !== searchFilters.pol) {
        return false;
      }
      if (searchFilters.pod !== FILTER_ALL_VALUE && freight.pod !== searchFilters.pod) {
        return false;
      }
      if (searchFilters.destination !== FILTER_ALL_VALUE && freight.destinationId !== searchFilters.destination) {
        return false;
      }
      if (searchFilters.status !== FILTER_ALL_VALUE) {
        const validityStatus = getValidityStatus(freight.validFrom, freight.validTo);
        if (searchFilters.status === 'expired' && validityStatus.status !== 'expired') {
          return false;
        }
        if (searchFilters.status === 'expiring' && validityStatus.status !== 'expiring') {
          return false;
        }
        if (searchFilters.status === 'active' && validityStatus.status !== 'active') {
          return false;
        }
      }
      return true;
    });
  }, [combinedFreights, searchFilters]);

  const totalPages = Math.ceil(filteredFreights.length / ITEMS_PER_PAGE);
  const paginatedFreights = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredFreights.slice(startIndex, endIndex);
  }, [filteredFreights, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchFilters]);

  const resetForm = () => {
    setFormData({
      agent: '',
      pol: '',
      pod: '',
      destinationId: '',
      rate: '',
      description: '',
      validFrom: '',
      validTo: '',
    });
    setValidationWarning(null);
  };

  const handleAdd = () => {
    if (!formData.agent || !formData.pol || !formData.pod || !formData.destinationId || !formData.rate || !formData.validFrom || !formData.validTo) {
      setValidationWarning('❌ 모든 필수 항목을 입력해주세요.');
      return;
    }

    const warning = checkOverlapWarning(
      formData.validFrom,
      formData.validTo,
      '',
      combinedFreights,
      (item) => item.agent === formData.agent && item.pol === formData.pol && item.pod === formData.pod && item.destinationId === formData.destinationId
    );

    if (warning) {
      setValidationWarning(warning);
      return;
    }

    addCombinedFreight({
      agent: formData.agent,
      pol: formData.pol,
      pod: formData.pod,
      destinationId: formData.destinationId,
      rate: parseFloat(formData.rate),
      description: formData.description,
      validFrom: formData.validFrom,
      validTo: formData.validTo,
    });

    resetForm();
    setIsAddDialogOpen(false);
  };

  const handleAddIgnoreWarning = () => {
    if (!formData.agent || !formData.pol || !formData.pod || !formData.destinationId || !formData.rate || !formData.validFrom || !formData.validTo) return;

    addCombinedFreight({
      agent: formData.agent,
      pol: formData.pol,
      pod: formData.pod,
      destinationId: formData.destinationId,
      rate: parseFloat(formData.rate),
      description: formData.description,
      validFrom: formData.validFrom,
      validTo: formData.validTo,
    });

    resetForm();
    setIsAddDialogOpen(false);
  };

  const handleEditClick = (freight: CombinedFreight) => {
    setEditingFreight(freight);
    setFormData({
      agent: freight.agent,
      pol: freight.pol,
      pod: freight.pod,
      destinationId: freight.destinationId,
      rate: freight.rate.toString(),
      description: freight.description || '',
      validFrom: freight.validFrom,
      validTo: freight.validTo,
    });
    setValidationWarning(null);
    setIsEditDialogOpen(true);
  };

  const handleEditSave = () => {
    if (!editingFreight) return;
    
    if (!formData.rate || !formData.validFrom || !formData.validTo) {
      setValidationWarning('❌ 모든 필수 항목을 입력해주세요.');
      return;
    }

    updateCombinedFreight(editingFreight.id, {
      rate: parseFloat(formData.rate),
      description: formData.description,
      validFrom: formData.validFrom,
      validTo: formData.validTo,
    });

    setIsEditDialogOpen(false);
    setEditingFreight(null);
    resetForm();
  };

  const handleEditCancel = () => {
    setIsEditDialogOpen(false);
    setEditingFreight(null);
    resetForm();
  };

  const handleDelete = (id: string) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      deleteCombinedFreight(id);
    }
  };

  const handleClearFilters = () => {
    setSearchFilters({
      agent: FILTER_ALL_VALUE,
      pol: FILTER_ALL_VALUE,
      pod: FILTER_ALL_VALUE,
      destination: FILTER_ALL_VALUE,
      status: FILTER_ALL_VALUE,
    });
  };

  const getDestinationName = (destinationId: string) => {
    const destination = destinations.find((d) => d.id === destinationId);
    return destination ? destination.name : destinationId;
  };

  const auditLogs = getAuditLogsByType('combinedFreight');
  const expiredRates = combinedFreights.filter(f => getValidityStatus(f.validFrom, f.validTo).status === 'expired');
  const expiringRates = combinedFreights.filter(f => getValidityStatus(f.validFrom, f.validTo).status === 'expiring');

  return (
    <div className="space-y-4">
      {/* Header - Compact */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 p-4 shadow-lg">
        <div className="absolute inset-0 bg-grid-white/10"></div>
        <div className="relative flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-white/20 backdrop-blur-sm rounded-lg">
              <Merge className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                철도+트럭 통합운임
                <Sparkles className="h-4 w-4 text-yellow-300 animate-pulse" />
              </h2>
              <p className="text-xs text-emerald-50">POL → POD → 최종목적지</p>
            </div>
          </div>
          {isAdmin && (
            <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
              setIsAddDialogOpen(open);
              if (!open) setValidationWarning(null);
            }}>
              <DialogTrigger asChild>
                <Button 
                  onClick={() => resetForm()}
                  size="sm"
                  className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border border-white/50"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  추가
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>육상운송 통합운임 추가</DialogTitle>
                  <DialogDescription>
                    새로운 통합 운임을 추가합니다. 선적항에서 양하항을 거쳐 최종목적지까지의 일괄 운임입니다.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
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
                  <div className="grid gap-2">
                    <Label htmlFor="agent">대리점 *</Label>
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
                  <div className="grid gap-2">
                    <Label htmlFor="pol">선적항 (POL) *</Label>
                    {polPorts.length > 0 ? (
                      <Select value={formData.pol} onValueChange={(value) => {
                        setFormData({ ...formData, pol: value });
                        setValidationWarning(null);
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="선적항 선택" />
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
                        선적항(POL)을 먼저 등록해주세요. (운송사 탭 → 포트 관리)
                      </div>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="pod">양하항 (POD) *</Label>
                    {podPorts.length > 0 ? (
                      <Select value={formData.pod} onValueChange={(value) => {
                        setFormData({ ...formData, pod: value });
                        setValidationWarning(null);
                      }}>
                        <SelectTrigger>
                          <SelectValue placeholder="양하항 선택" />
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
                        양하항(POD)을 먼저 등록해주세요. (운송사 탭 → 포트 관리)
                      </div>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="destination">최종목적지 *</Label>
                    <Select
                      value={formData.destinationId}
                      onValueChange={(value) => {
                        setFormData({ ...formData, destinationId: value });
                        setValidationWarning(null);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="목적지 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {destinations.map((dest) => (
                          <SelectItem key={dest.id} value={dest.id}>
                            {dest.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="rate">통합 운임 (USD) *</Label>
                    <Input
                      id="rate"
                      type="number"
                      step="0.01"
                      placeholder="예: 4550"
                      value={formData.rate}
                      onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
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
                  <div className="grid gap-2">
                    <Label htmlFor="description">설명</Label>
                    <Input
                      id="description"
                      placeholder="예: 인천→청도→OSH 통합 운임"
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
          )}
        </div>
      </div>

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

      {/* Search Filters - Compact */}
      <div className="p-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg border border-emerald-200">
        <div className="flex items-center gap-2 mb-2">
          <Search className="h-3 w-3 text-emerald-600" />
          <span className="text-xs font-semibold text-emerald-900">검색 필터</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2">
          <div className="space-y-1">
            <Label className="text-xs">대리점</Label>
            <Select value={searchFilters.agent} onValueChange={(value) => setSearchFilters(prev => ({ ...prev, agent: value }))}>
              <SelectTrigger className="h-8 text-xs">
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
            <Label className="text-xs">POL</Label>
            <Select value={searchFilters.pol} onValueChange={(value) => setSearchFilters(prev => ({ ...prev, pol: value }))}>
              <SelectTrigger className="h-8 text-xs">
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
            <Label className="text-xs">POD</Label>
            <Select value={searchFilters.pod} onValueChange={(value) => setSearchFilters(prev => ({ ...prev, pod: value }))}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="전체" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={FILTER_ALL_VALUE}>전체</SelectItem>
                {filterOptions.pods.map((pod) => (
                  <SelectItem key={pod} value={pod}>{pod}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">목적지</Label>
            <Select value={searchFilters.destination} onValueChange={(value) => setSearchFilters(prev => ({ ...prev, destination: value }))}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="전체" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={FILTER_ALL_VALUE}>전체</SelectItem>
                {filterOptions.destinations.map((dest) => (
                  <SelectItem key={dest.id} value={dest.id}>{dest.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">상태</Label>
            <Select value={searchFilters.status} onValueChange={(value) => setSearchFilters(prev => ({ ...prev, status: value }))}>
              <SelectTrigger className="h-8 text-xs">
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
        </div>
        <div className="mt-2 flex justify-end">
          <Button variant="outline" size="sm" onClick={handleClearFilters} className="h-7 text-xs">
            <X className="h-3 w-3 mr-1" />
            초기화
          </Button>
        </div>
      </div>

      {/* Results Summary */}
      <div className="text-xs text-gray-600 font-medium">
        총 {filteredFreights.length}개 (전체 {combinedFreights.length}개 중)
      </div>

      {/* Table - Compact */}
      <div className="rounded-lg border overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-emerald-50 to-teal-50">
              <TableHead className="h-9 text-xs font-bold whitespace-nowrap">대리점</TableHead>
              <TableHead className="h-9 text-xs font-bold whitespace-nowrap">POL</TableHead>
              <TableHead className="h-9 text-xs font-bold whitespace-nowrap">POD</TableHead>
              <TableHead className="h-9 text-xs font-bold whitespace-nowrap">목적지</TableHead>
              <TableHead className="h-9 text-xs text-right font-bold whitespace-nowrap">통합운임</TableHead>
              <TableHead className="h-9 text-xs font-bold whitespace-nowrap">유효기간</TableHead>
              <TableHead className="h-9 text-xs font-bold whitespace-nowrap">상태</TableHead>
              <TableHead className="h-9 text-xs font-bold whitespace-nowrap">설명</TableHead>
              {isAdmin && <TableHead className="h-9 text-xs text-right font-bold whitespace-nowrap">작업</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedFreights.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 9 : 8} className="text-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    <Merge className="h-12 w-12 text-emerald-400" />
                    <p className="text-base font-semibold text-emerald-900">
                      {combinedFreights.length === 0 ? '등록된 통합 운임이 없습니다.' : '검색 결과가 없습니다'}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedFreights.map((freight) => {
                const validityStatus = getValidityStatus(freight.validFrom, freight.validTo);
                
                return (
                  <TableRow key={freight.id} className="hover:bg-emerald-50/50">
                    <TableCell className="py-2 text-xs font-medium whitespace-nowrap">{freight.agent}</TableCell>
                    <TableCell className="py-2 text-xs whitespace-nowrap">{freight.pol}</TableCell>
                    <TableCell className="py-2 text-xs whitespace-nowrap">{freight.pod}</TableCell>
                    <TableCell className="py-2 text-xs whitespace-nowrap">{getDestinationName(freight.destinationId)}</TableCell>
                    <TableCell className="py-2 text-xs text-right font-semibold text-emerald-700 whitespace-nowrap">${freight.rate}</TableCell>
                    <TableCell className="py-2 text-xs whitespace-nowrap">
                      {formatValidityDate(freight.validFrom)} ~ {formatValidityDate(freight.validTo)}
                    </TableCell>
                    <TableCell className="py-2 whitespace-nowrap">
                      <Badge variant={validityStatus.variant} className="text-xs px-1.5 py-0">
                        {validityStatus.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2 text-xs whitespace-nowrap">
                      <span className={!freight.description ? 'text-gray-400' : ''}>
                        {freight.description || '-'}
                      </span>
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="py-2 text-right whitespace-nowrap">
                        <div className="flex justify-end gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditClick(freight)}
                            className="h-6 px-2 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDelete(freight.id)}
                            className="h-6 w-6 p-0 hover:bg-red-50 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination - Compact */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs">
          <div className="text-gray-600">
            총 {filteredFreights.length}개 중 {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredFreights.length)}개
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
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
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
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
        title="육상운송 통합운임 변경 기록"
        description="육상운송 통합운임의 모든 변경 내역이 기록됩니다."
      />

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={handleEditCancel}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-blue-600" />
              통합운임 수정
            </DialogTitle>
            <DialogDescription>
              통합운임 정보를 수정하세요.
            </DialogDescription>
          </DialogHeader>
          {editingFreight && (
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
                  <Label>선적항</Label>
                  <Input value={formData.pol} disabled className="bg-gray-50" />
                </div>
                <div className="space-y-2">
                  <Label>양하항</Label>
                  <Input value={formData.pod} disabled className="bg-gray-50" />
                </div>
                <div className="space-y-2">
                  <Label>최종목적지</Label>
                  <Input value={getDestinationName(formData.destinationId)} disabled className="bg-gray-50" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>통합 운임 (USD) *</Label>
                <Input
                  type="number"
                  value={formData.rate}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      rate: e.target.value
                    });
                    setValidationWarning(null);
                  }}
                />
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
                <Input
                  placeholder="예: 인천→청도→OSH 통합 운임"
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