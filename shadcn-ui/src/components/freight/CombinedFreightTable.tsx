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
import { Trash2, Plus, AlertTriangle, RefreshCw, Search, X, ChevronLeft, ChevronRight, Merge } from 'lucide-react';
import { CombinedFreight } from '@/types/freight';
import AuditLogTable from './AuditLogTable';
import { ValidityPeriodInput } from '@/components/ui/validity-period-input';
import { getValidityStatus, formatValidityDate, validateNoOverlap } from '@/utils/validityHelper';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface VersionChangeData {
  agent: string;
  pol: string;
  pod: string;
  destinationId: string;
  rate: number;
  description?: string;
  validFrom: string;
  validTo: string;
  currentVersion: number;
  nextVersion: number;
}

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
  const [isVersionChangeDialogOpen, setIsVersionChangeDialogOpen] = useState(false);
  const [versionChangeData, setVersionChangeData] = useState<VersionChangeData | null>(null);
  const [originalFreightId, setOriginalFreightId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
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

  // Pagination and filter states
  const [currentPage, setCurrentPage] = useState(1);
  const [searchFilters, setSearchFilters] = useState({
    agent: FILTER_ALL_VALUE,
    pol: FILTER_ALL_VALUE,
    pod: FILTER_ALL_VALUE,
    destination: FILTER_ALL_VALUE,
    status: FILTER_ALL_VALUE, // 'all', 'active', 'expiring', 'expired'
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

  // Filter combined freights
  const filteredFreights = useMemo(() => {
    return combinedFreights.filter((freight) => {
      // Agent filter
      if (searchFilters.agent !== FILTER_ALL_VALUE && freight.agent !== searchFilters.agent) {
        return false;
      }

      // POL filter
      if (searchFilters.pol !== FILTER_ALL_VALUE && freight.pol !== searchFilters.pol) {
        return false;
      }

      // POD filter
      if (searchFilters.pod !== FILTER_ALL_VALUE && freight.pod !== searchFilters.pod) {
        return false;
      }

      // Destination filter
      if (searchFilters.destination !== FILTER_ALL_VALUE && freight.destinationId !== searchFilters.destination) {
        return false;
      }

      // Status filter (expired rates)
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

  // Reset to page 1 when filters change
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
    setValidationError(null);
  };

  const handleAdd = () => {
    if (!formData.agent || !formData.pol || !formData.pod || !formData.destinationId || !formData.rate || !formData.validFrom || !formData.validTo) {
      alert('대리점, 선적항, 양하항, 목적지, 운임, 유효기간을 모두 입력해주세요.');
      return;
    }

    const error = validateNoOverlap(
      formData.validFrom,
      formData.validTo,
      '',
      combinedFreights,
      (item) => item.agent === formData.agent && item.pol === formData.pol && item.pod === formData.pod && item.destinationId === formData.destinationId
    );

    if (error) {
      setValidationError(error);
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

  const handleVersionChangeClick = (freight: CombinedFreight) => {
    const relevantItems = combinedFreights.filter(
      (item) => item.agent === freight.agent && item.pol === freight.pol && item.pod === freight.pod && item.destinationId === freight.destinationId
    );
    const maxVersion = Math.max(...relevantItems.map(item => item.version || 1), 0);
    const nextVersion = maxVersion + 1;

    let validFrom = '';
    let validTo = '';

    try {
      if (!freight.validTo || freight.validTo === '') {
        const today = new Date();
        validFrom = today.toISOString().split('T')[0];
      } else {
        const validFromDate = new Date(freight.validTo);
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

    setVersionChangeData({
      agent: freight.agent,
      pol: freight.pol,
      pod: freight.pod,
      destinationId: freight.destinationId,
      rate: freight.rate,
      description: freight.description,
      validFrom,
      validTo,
      currentVersion: freight.version || 1,
      nextVersion,
    });
    setOriginalFreightId(freight.id);
    setValidationError(null);
    setIsVersionChangeDialogOpen(true);
  };

  const handleVersionChangeSave = () => {
    if (!versionChangeData || !originalFreightId) return;

    if (!versionChangeData.rate || !versionChangeData.validFrom || !versionChangeData.validTo) {
      setValidationError('❌ 모든 필수 항목을 입력해주세요.');
      return;
    }

    updateCombinedFreight(originalFreightId, {
      rate: versionChangeData.rate,
      description: versionChangeData.description,
      validFrom: versionChangeData.validFrom,
      validTo: versionChangeData.validTo,
    });

    setIsVersionChangeDialogOpen(false);
    setVersionChangeData(null);
    setOriginalFreightId(null);
    setValidationError(null);
  };

  const handleVersionChangeCancel = () => {
    setIsVersionChangeDialogOpen(false);
    setVersionChangeData(null);
    setOriginalFreightId(null);
    setValidationError(null);
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Merge className="h-6 w-6" />
            철도+트럭 통합운임 관리
          </h2>
          <p className="text-gray-600 mt-1">
            선적항 → 양하항 → 최종목적지 통합 운임 (철도+트럭 일괄)
          </p>
        </div>
        {isAdmin && (
          <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
            setIsAddDialogOpen(open);
            if (!open) setValidationError(null);
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="mr-2 h-4 w-4" />
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
                {validationError && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="font-semibold">유효기간 중복 오류</div>
                      <div className="text-sm mt-1">{validationError}</div>
                    </AlertDescription>
                  </Alert>
                )}
                <div className="grid gap-2">
                  <Label htmlFor="agent">대리점 *</Label>
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
                <div className="grid gap-2">
                  <Label htmlFor="pol">선적항 (POL) *</Label>
                  {polPorts.length > 0 ? (
                    <Select value={formData.pol} onValueChange={(value) => {
                      setFormData({ ...formData, pol: value });
                      setValidationError(null);
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
                      setValidationError(null);
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
                      setValidationError(null);
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
                      setValidationError(null);
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
                  setValidationError(null);
                }}>
                  취소
                </Button>
                <Button onClick={handleAdd}>추가</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {(expiredRates.length > 0 || expiringRates.length > 0) && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {expiredRates.length > 0 && (
              <div className="font-semibold">
                ⚠️ {expiredRates.length}개의 통합운임이 만료되었습니다.
              </div>
            )}
            {expiringRates.length > 0 && (
              <div className="text-sm mt-1">
                📅 {expiringRates.length}개의 통합운임이 7일 이내에 만료됩니다.
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Search Filters */}
      <div className="p-4 bg-gray-50 rounded-lg border">
        <div className="flex items-center gap-2 mb-3">
          <Search className="h-4 w-4 text-gray-600" />
          <span className="font-semibold text-sm">검색 필터</span>
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
            <Label className="text-xs">선적항 (POL)</Label>
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
            <Label className="text-xs">양하항 (POD)</Label>
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
            <Label className="text-xs">최종목적지</Label>
            <Select value={searchFilters.destination} onValueChange={(value) => setSearchFilters(prev => ({ ...prev, destination: value }))}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="전체" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={FILTER_ALL_VALUE}>전체</SelectItem>
                {filterOptions.destinations.map((dest) => (
                  <SelectItem key={dest.id} value={dest.id}>
                    {dest.name}
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
        총 {filteredFreights.length}개의 운임 (전체 {combinedFreights.length}개 중)
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>버전</TableHead>
              <TableHead>대리점</TableHead>
              <TableHead>선적항</TableHead>
              <TableHead>양하항</TableHead>
              <TableHead>최종목적지</TableHead>
              <TableHead className="text-right">통합 운임 (USD)</TableHead>
              <TableHead>유효기간</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>설명</TableHead>
              {isAdmin && <TableHead className="text-right">작업</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedFreights.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 10 : 9} className="text-center py-8 text-gray-500">
                  {combinedFreights.length === 0 ? '등록된 통합 운임이 없습니다.' : '검색 결과가 없습니다'}
                </TableCell>
              </TableRow>
            ) : (
              paginatedFreights.map((freight) => {
                const validityStatus = getValidityStatus(freight.validFrom, freight.validTo);
                
                return (
                  <TableRow key={freight.id}>
                    <TableCell>
                      <Badge variant="outline">v{freight.version || 1}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{freight.agent}</TableCell>
                    <TableCell>{freight.pol}</TableCell>
                    <TableCell>{freight.pod}</TableCell>
                    <TableCell>{getDestinationName(freight.destinationId)}</TableCell>
                    <TableCell className="text-right">${freight.rate}</TableCell>
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
                    <TableCell>
                      <span className={!freight.description ? 'text-gray-400' : ''}>
                        {freight.description || '-'}
                      </span>
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleVersionChangeClick(freight)}
                            className="bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-300"
                          >
                            <RefreshCw className="h-4 w-4 mr-1" />
                            버전 변경
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(freight.id)}>
                            <Trash2 className="h-4 w-4 text-red-600" />
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
        title="육상운송 통합운임 버전 기록"
        description="육상운송 통합운임의 모든 변경 내역이 버전별로 기록됩니다. '버전 변경' 버튼을 클릭하면 플로팅 화면에서 새 버전의 정보를 수정할 수 있습니다."
      />

      {/* Version Change Dialog */}
      <Dialog open={isVersionChangeDialogOpen} onOpenChange={handleVersionChangeCancel}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-purple-600" />
              버전 변경
            </DialogTitle>
            <DialogDescription>
              새로운 버전의 통합운임 정보를 수정하세요. 버전이 자동으로 증가하고 유효기간이 설정됩니다.
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

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>대리점</Label>
                  <Input value={versionChangeData.agent} disabled className="bg-gray-50" />
                </div>
                <div className="space-y-2">
                  <Label>선적항</Label>
                  <Input value={versionChangeData.pol} disabled className="bg-gray-50" />
                </div>
                <div className="space-y-2">
                  <Label>양하항</Label>
                  <Input value={versionChangeData.pod} disabled className="bg-gray-50" />
                </div>
                <div className="space-y-2">
                  <Label>최종목적지</Label>
                  <Input value={getDestinationName(versionChangeData.destinationId)} disabled className="bg-gray-50" />
                </div>
              </div>

              <div className="space-y-2">
                <Label>통합 운임 (USD) *</Label>
                <Input
                  type="number"
                  value={versionChangeData.rate}
                  onChange={(e) => {
                    setVersionChangeData({
                      ...versionChangeData,
                      rate: Number(e.target.value)
                    });
                    setValidationError(null);
                  }}
                />
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

              <div className="space-y-2">
                <Label>설명</Label>
                <Input
                  placeholder="예: 인천→청도→OSH 통합 운임"
                  value={versionChangeData.description || ''}
                  onChange={(e) => {
                    setVersionChangeData({
                      ...versionChangeData,
                      description: e.target.value || undefined
                    });
                  }}
                />
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