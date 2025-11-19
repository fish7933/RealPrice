import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFreight } from '@/contexts/FreightContext';
import { AgentSeaFreight } from '@/types/freight';
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
import { Trash2, Plus, Star, AlertTriangle, Search, X, ChevronLeft, ChevronRight, Ship, Anchor, TrendingUp, Edit } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AuditLogTable from './AuditLogTable';
import { ValidityPeriodInput } from '@/components/ui/validity-period-input';
import { getValidityStatus, formatValidityDate, checkOverlapWarning } from '@/utils/validityHelper';
import { Badge } from '@/components/ui/badge';

const ITEMS_PER_PAGE = 10;
const FILTER_ALL_VALUE = '__all__';

export default function AgentSeaFreightTable() {
  const { user } = useAuth();
  const { railAgents, agentSeaFreights, addAgentSeaFreight, updateAgentSeaFreight, deleteAgentSeaFreight, getAuditLogsByType, shippingLines, ports } = useFreight();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingFreight, setEditingFreight] = useState<AgentSeaFreight | null>(null);
  const [validationWarning, setValidationWarning] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    agent: '',
    pol: '',
    pod: '',
    rate: '',
    llocal: '',
    carrier: '',
    note: '',
    validFrom: '',
    validTo: '',
  });

  // Pagination and filter states
  const [currentPage, setCurrentPage] = useState(1);
  const [searchFilters, setSearchFilters] = useState({
    agent: FILTER_ALL_VALUE,
    pol: FILTER_ALL_VALUE,
    pod: FILTER_ALL_VALUE,
    carrier: FILTER_ALL_VALUE,
    status: FILTER_ALL_VALUE,
  });

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  // Get POL and POD ports from the ports list
  const polPorts = ports.filter(p => p.type === 'POL');
  const podPorts = ports.filter(p => p.type === 'POD');

  // Extract unique values for filter dropdowns
  const filterOptions = useMemo(() => {
    const agents = new Set<string>();
    const pols = new Set<string>();
    const pods = new Set<string>();
    const carriers = new Set<string>();

    agentSeaFreights.forEach(freight => {
      if (freight.agent) agents.add(freight.agent);
      if (freight.pol) pols.add(freight.pol);
      if (freight.pod) pods.add(freight.pod);
      if (freight.carrier) carriers.add(freight.carrier);
    });

    return {
      agents: Array.from(agents).sort((a, b) => a.localeCompare(b, 'ko')),
      pols: Array.from(pols).sort((a, b) => a.localeCompare(b, 'ko')),
      pods: Array.from(pods).sort((a, b) => a.localeCompare(b, 'ko')),
      carriers: Array.from(carriers).sort((a, b) => a.localeCompare(b, 'ko')),
    };
  }, [agentSeaFreights]);

  // Filter agent sea freights
  const filteredFreights = useMemo(() => {
    return agentSeaFreights.filter((freight) => {
      if (searchFilters.agent !== FILTER_ALL_VALUE && freight.agent !== searchFilters.agent) {
        return false;
      }

      if (searchFilters.pol !== FILTER_ALL_VALUE && freight.pol !== searchFilters.pol) {
        return false;
      }

      if (searchFilters.pod !== FILTER_ALL_VALUE && freight.pod !== searchFilters.pod) {
        return false;
      }

      if (searchFilters.carrier !== FILTER_ALL_VALUE && freight.carrier !== searchFilters.carrier) {
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
  }, [agentSeaFreights, searchFilters]);

  const totalPages = Math.ceil(filteredFreights.length / ITEMS_PER_PAGE);
  const paginatedFreights = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredFreights.slice(startIndex, endIndex);
  }, [filteredFreights, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchFilters]);

  const handleAdd = () => {
    if (!formData.agent || !formData.pol || !formData.pod || !formData.rate || !formData.validFrom || !formData.validTo) return;

    const warning = checkOverlapWarning(
      formData.validFrom,
      formData.validTo,
      '',
      agentSeaFreights,
      (item) => item.agent === formData.agent && item.pol === formData.pol && item.pod === formData.pod
    );

    if (warning) {
      setValidationWarning(warning);
      return;
    }

    addAgentSeaFreight({
      agent: formData.agent,
      pol: formData.pol,
      pod: formData.pod,
      rate: Number(formData.rate),
      llocal: formData.llocal ? Number(formData.llocal) : undefined,
      carrier: formData.carrier || undefined,
      note: formData.note || undefined,
      validFrom: formData.validFrom,
      validTo: formData.validTo,
    });

    setFormData({ agent: '', pol: '', pod: '', rate: '', llocal: '', carrier: '', note: '', validFrom: '', validTo: '' });
    setValidationWarning(null);
    setIsAddDialogOpen(false);
  };

  const handleAddIgnoreWarning = () => {
    if (!formData.agent || !formData.pol || !formData.pod || !formData.rate || !formData.validFrom || !formData.validTo) return;

    addAgentSeaFreight({
      agent: formData.agent,
      pol: formData.pol,
      pod: formData.pod,
      rate: Number(formData.rate),
      llocal: formData.llocal ? Number(formData.llocal) : undefined,
      carrier: formData.carrier || undefined,
      note: formData.note || undefined,
      validFrom: formData.validFrom,
      validTo: formData.validTo,
    });

    setFormData({ agent: '', pol: '', pod: '', rate: '', llocal: '', carrier: '', note: '', validFrom: '', validTo: '' });
    setValidationWarning(null);
    setIsAddDialogOpen(false);
  };

  const handleEditClick = (freight: AgentSeaFreight) => {
    setEditingFreight(freight);
    setFormData({
      agent: freight.agent,
      pol: freight.pol,
      pod: freight.pod,
      rate: freight.rate.toString(),
      llocal: freight.llocal?.toString() || '',
      carrier: freight.carrier || '',
      note: freight.note || '',
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

    updateAgentSeaFreight(editingFreight.id, {
      rate: Number(formData.rate),
      llocal: formData.llocal ? Number(formData.llocal) : undefined,
      carrier: formData.carrier || undefined,
      note: formData.note || undefined,
      validFrom: formData.validFrom,
      validTo: formData.validTo,
    });

    setIsEditDialogOpen(false);
    setEditingFreight(null);
    setFormData({ agent: '', pol: '', pod: '', rate: '', llocal: '', carrier: '', note: '', validFrom: '', validTo: '' });
    setValidationWarning(null);
  };

  const handleEditCancel = () => {
    setIsEditDialogOpen(false);
    setEditingFreight(null);
    setFormData({ agent: '', pol: '', pod: '', rate: '', llocal: '', carrier: '', note: '', validFrom: '', validTo: '' });
    setValidationWarning(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('이 운임을 삭제하시겠습니까?')) {
      deleteAgentSeaFreight(id);
    }
  };

  const handleClearFilters = () => {
    setSearchFilters({
      agent: FILTER_ALL_VALUE,
      pol: FILTER_ALL_VALUE,
      pod: FILTER_ALL_VALUE,
      carrier: FILTER_ALL_VALUE,
      status: FILTER_ALL_VALUE,
    });
  };

  const auditLogs = getAuditLogsByType('agentSeaFreight');
  const expiredRates = agentSeaFreights.filter(f => getValidityStatus(f.validFrom, f.validTo).status === 'expired');
  const expiringRates = agentSeaFreights.filter(f => getValidityStatus(f.validFrom, f.validTo).status === 'expiring');
  const activeRates = agentSeaFreights.filter(f => getValidityStatus(f.validFrom, f.validTo).status === 'active');

  return (
    <div className="space-y-6">
      {/* Modern Header with Gradient */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 p-8 text-white shadow-lg">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Star className="h-8 w-8" />
                </div>
                <h2 className="text-3xl font-bold">대리점별 해상운임 관리</h2>
              </div>
              <p className="text-white/90 text-lg">철도 대리점이 지정한 특별 해상운임</p>
            </div>
            {isAdmin && (
              <Button 
                onClick={() => setIsAddDialogOpen(true)}
                size="lg"
                className="bg-white text-orange-600 hover:bg-white/90 hover:scale-105 transition-all shadow-lg"
              >
                <Plus className="h-5 w-5 mr-2" />
                운임 추가
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-amber-600">총 운임</p>
              <p className="text-3xl font-bold text-amber-900 mt-2">{agentSeaFreights.length}</p>
            </div>
            <div className="p-3 bg-amber-500/20 rounded-lg">
              <Ship className="h-8 w-8 text-amber-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">유효 운임</p>
              <p className="text-3xl font-bold text-green-900 mt-2">{activeRates.length}</p>
            </div>
            <div className="p-3 bg-green-500/20 rounded-lg">
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-amber-50 border border-yellow-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-600">만료 임박</p>
              <p className="text-3xl font-bold text-yellow-900 mt-2">{expiringRates.length}</p>
            </div>
            <div className="p-3 bg-yellow-500/20 rounded-lg">
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-rose-50 border border-red-200 rounded-xl p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600">만료됨</p>
              <p className="text-3xl font-bold text-red-900 mt-2">{expiredRates.length}</p>
            </div>
            <div className="p-3 bg-red-500/20 rounded-lg">
              <X className="h-8 w-8 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Info Alert */}
      <Alert className="border-amber-200 bg-amber-50">
        <Star className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-900">
          <strong>대리점별 해상운임:</strong> 철도 대리점이 특정 경로에 대해 지정한 해상운임입니다. 설정된 경우 일반 해상운임보다 우선 적용됩니다.
          <br />
          <span className="text-sm text-amber-700 mt-1 block">
            D/O(DTHC)는 별도의 "D/O(DTHC) 관리" 페이지에서 대리점별로 설정됩니다.
          </span>
        </AlertDescription>
      </Alert>

      {/* Warning Alert */}
      {(expiredRates.length > 0 || expiringRates.length > 0) && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {expiredRates.length > 0 && (
              <div className="font-semibold">
                ⚠️ {expiredRates.length}개의 대리점별 운임이 만료되었습니다.
              </div>
            )}
            {expiringRates.length > 0 && (
              <div className="text-sm mt-1">
                📅 {expiringRates.length}개의 대리점별 운임이 7일 이내에 만료됩니다.
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Search Filters */}
      <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border border-gray-200">
        <div className="flex items-center gap-2 mb-4">
          <Search className="h-5 w-5 text-gray-600" />
          <span className="font-semibold">검색 필터</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">대리점</Label>
            <Select value={searchFilters.agent} onValueChange={(value) => setSearchFilters(prev => ({ ...prev, agent: value }))}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="전체" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={FILTER_ALL_VALUE}>전체</SelectItem>
                {filterOptions.agents.map((agent) => (
                  <SelectItem key={agent} value={agent}>
                    {agent}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">선적포트 (POL)</Label>
            <Select value={searchFilters.pol} onValueChange={(value) => setSearchFilters(prev => ({ ...prev, pol: value }))}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="전체" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={FILTER_ALL_VALUE}>전체</SelectItem>
                {filterOptions.pols.map((pol) => (
                  <SelectItem key={pol} value={pol}>
                    {pol}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">양하포트 (POD)</Label>
            <Select value={searchFilters.pod} onValueChange={(value) => setSearchFilters(prev => ({ ...prev, pod: value }))}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="전체" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={FILTER_ALL_VALUE}>전체</SelectItem>
                {filterOptions.pods.map((pod) => (
                  <SelectItem key={pod} value={pod}>
                    {pod}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">선사</Label>
            <Select value={searchFilters.carrier} onValueChange={(value) => setSearchFilters(prev => ({ ...prev, carrier: value }))}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="전체" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={FILTER_ALL_VALUE}>전체</SelectItem>
                {filterOptions.carriers.map((carrier) => (
                  <SelectItem key={carrier} value={carrier}>
                    {carrier}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">만료 상태</Label>
            <Select value={searchFilters.status} onValueChange={(value) => setSearchFilters(prev => ({ ...prev, status: value }))}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="전체" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={FILTER_ALL_VALUE}>전체</SelectItem>
                <SelectItem value="active">유효</SelectItem>
                <SelectItem value="expiring">만료 임박</SelectItem>
                <SelectItem value="expired">만료됨</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="mt-3 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearFilters}
            className="h-8"
          >
            <X className="h-3 w-3 mr-1" />
            필터 초기화
          </Button>
        </div>
      </div>

      {/* Results Summary */}
      <div className="text-sm text-gray-600">
        총 {filteredFreights.length}개의 운임 (전체 {agentSeaFreights.length}개 중)
      </div>

      <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100">
              <TableHead className="font-semibold">대리점</TableHead>
              <TableHead className="font-semibold">선적포트 (POL)</TableHead>
              <TableHead className="font-semibold">양하포트 (POD)</TableHead>
              <TableHead className="font-semibold">운임 (USD)</TableHead>
              <TableHead className="font-semibold">L.LOCAL (USD)</TableHead>
              <TableHead className="font-semibold">선사</TableHead>
              <TableHead className="font-semibold">유효기간</TableHead>
              <TableHead className="font-semibold">상태</TableHead>
              <TableHead className="font-semibold">비고</TableHead>
              {isAdmin && <TableHead className="text-right font-semibold">작업</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedFreights.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 10 : 9} className="text-center py-12">
                  <div className="flex flex-col items-center gap-3">
                    <Anchor className="h-12 w-12 text-gray-300" />
                    <p className="text-gray-500 font-medium">
                      {agentSeaFreights.length === 0 ? '설정된 대리점별 해상운임이 없습니다' : '검색 결과가 없습니다'}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedFreights.map((freight, index) => {
                const validityStatus = getValidityStatus(freight.validFrom, freight.validTo);
                
                return (
                  <TableRow key={freight.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-amber-600" />
                        {freight.agent}
                      </div>
                    </TableCell>
                    <TableCell>{freight.pol}</TableCell>
                    <TableCell>{freight.pod}</TableCell>
                    <TableCell className="font-semibold">${freight.rate}</TableCell>
                    <TableCell>
                      {freight.llocal !== undefined && freight.llocal !== null ? (
                        <span className="font-medium">
                          {freight.llocal >= 0 ? `$${freight.llocal}` : `-$${Math.abs(freight.llocal)}`}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>{freight.carrier || '-'}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{formatValidityDate(freight.validFrom)}</div>
                        <div className="text-gray-500">~ {formatValidityDate(freight.validTo)}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={validityStatus.variant}>
                        {validityStatus.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{freight.note || '-'}</TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditClick(freight)}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            수정
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(freight.id)}
                            className="hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-gray-600">
            {filteredFreights.length}개 중 {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredFreights.length)}개 표시
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              이전
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className="w-8 h-8 p-0"
                >
                  {page}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              다음
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <AuditLogTable 
        logs={auditLogs}
        title="대리점별 해상운임 변경 기록"
        description="대리점별 해상운임의 모든 변경 내역이 기록됩니다."
      />

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
        setIsAddDialogOpen(open);
        if (!open) setValidationWarning(null);
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-amber-600" />
              대리점별 해상운임 추가
            </DialogTitle>
            <DialogDescription>철도 대리점이 지정한 특별 해상운임을 입력하세요.</DialogDescription>
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
              {polPorts.length > 0 ? (
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
              ) : (
                <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded border">
                  선적포트(POL)를 먼저 등록해주세요. (선사 & 중국 파트너사 탭 → 포트 관리)
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>양하포트 (POD) *</Label>
              {podPorts.length > 0 ? (
                <Select value={formData.pod} onValueChange={(value) => {
                  setFormData({ ...formData, pod: value });
                  setValidationWarning(null);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="양하포트 선택" />
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
                  양하포트(POD)를 먼저 등록해주세요. (선사 & 중국 파트너사 탭 → 포트 관리)
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>해상운임 (USD) *</Label>
              <Input
                type="number"
                placeholder="예: 580"
                value={formData.rate}
                onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>선사 (선택)</Label>
              {shippingLines.length > 0 ? (
                <Select value={formData.carrier} onValueChange={(value) => setFormData({ ...formData, carrier: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="선사 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {shippingLines.map((line) => (
                      <SelectItem key={line.id} value={line.name}>
                        {line.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded border">
                  선사를 먼저 등록해주세요. (선사 & 중국 파트너사 탭 → 선사 관리)
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>L.LOCAL (USD) <span className="text-xs text-gray-500">(선택)</span></Label>
              <Input
                type="number"
                placeholder="예: 50 또는 -50"
                value={formData.llocal}
                onChange={(e) => setFormData({ ...formData, llocal: e.target.value })}
              />
            </div>
            <div className="col-span-2 space-y-2">
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
            <div className="col-span-2 space-y-2">
              <Label>비고</Label>
              <Textarea
                placeholder="추가 정보를 입력하세요"
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
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
            <Button onClick={handleAdd} className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">추가</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={handleEditCancel}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-blue-600" />
              대리점별 해상운임 수정
            </DialogTitle>
            <DialogDescription>
              운임 정보를 수정하세요.
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
                  <Label>선적포트 (POL)</Label>
                  <Input value={formData.pol} disabled className="bg-gray-50" />
                </div>
                <div className="space-y-2">
                  <Label>양하포트 (POD)</Label>
                  <Input value={formData.pod} disabled className="bg-gray-50" />
                </div>
                <div className="space-y-2">
                  <Label>운임 (USD) *</Label>
                  <Input
                    type="number"
                    value={formData.rate}
                    onChange={(e) => {
                      setFormData({ ...formData, rate: e.target.value });
                      setValidationWarning(null);
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>선사</Label>
                  <Select 
                    value={formData.carrier || 'NONE'} 
                    onValueChange={(value) => {
                      setFormData({
                        ...formData,
                        carrier: value === 'NONE' ? '' : value
                      });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="선사 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">-</SelectItem>
                      {shippingLines.map((line) => (
                        <SelectItem key={line.id} value={line.name}>
                          {line.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>L.LOCAL (USD)</Label>
                  <Input
                    type="number"
                    placeholder="예: 50 또는 -50"
                    value={formData.llocal}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        llocal: e.target.value
                      });
                    }}
                  />
                </div>
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
                <Label>비고</Label>
                <Input
                  placeholder="비고를 입력하세요"
                  value={formData.note}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      note: e.target.value
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
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
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