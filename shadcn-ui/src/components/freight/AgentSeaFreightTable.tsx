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
import { Trash2, Plus, Star, AlertTriangle, RefreshCw, Search, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AuditLogTable from './AuditLogTable';
import { ValidityPeriodInput } from '@/components/ui/validity-period-input';
import { getValidityStatus, formatValidityDate, checkOverlapWarning } from '@/utils/validityHelper';
import { Badge } from '@/components/ui/badge';

interface VersionChangeData {
  agent: string;
  pol: string;
  pod: string;
  rate: number;
  llocal?: number;
  carrier?: string;
  note?: string;
  validFrom: string;
  validTo: string;
  currentVersion: number;
  nextVersion: number;
}

const ITEMS_PER_PAGE = 10;
const FILTER_ALL_VALUE = '__all__';

export default function AgentSeaFreightTable() {
  const { user } = useAuth();
  const { railAgents, agentSeaFreights, addAgentSeaFreight, updateAgentSeaFreight, deleteAgentSeaFreight, getAuditLogsByType, shippingLines, ports } = useFreight();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isVersionChangeDialogOpen, setIsVersionChangeDialogOpen] = useState(false);
  const [versionChangeData, setVersionChangeData] = useState<VersionChangeData | null>(null);
  const [originalFreightId, setOriginalFreightId] = useState<string | null>(null);
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

      // Carrier filter
      if (searchFilters.carrier !== FILTER_ALL_VALUE && freight.carrier !== searchFilters.carrier) {
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
  }, [agentSeaFreights, searchFilters]);

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

  const handleVersionChangeClick = (freight: AgentSeaFreight) => {
    const relevantItems = agentSeaFreights.filter(
      (item) => item.agent === freight.agent && item.pol === freight.pol && item.pod === freight.pod
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
      rate: freight.rate,
      llocal: freight.llocal,
      carrier: freight.carrier,
      note: freight.note,
      validFrom,
      validTo,
      currentVersion: freight.version || 1,
      nextVersion,
    });
    setOriginalFreightId(freight.id);
    setValidationWarning(null);
    setIsVersionChangeDialogOpen(true);
  };

  const handleVersionChangeSave = () => {
    if (!versionChangeData || !originalFreightId) return;

    // Check for required fields - allow rate to be 0
    if (versionChangeData.rate === null || versionChangeData.rate === undefined || !versionChangeData.validFrom || !versionChangeData.validTo) {
      setValidationWarning('❌ 모든 필수 항목을 입력해주세요.');
      return;
    }

    updateAgentSeaFreight(originalFreightId, {
      rate: versionChangeData.rate,
      llocal: versionChangeData.llocal,
      carrier: versionChangeData.carrier,
      note: versionChangeData.note,
      validFrom: versionChangeData.validFrom,
      validTo: versionChangeData.validTo,
    });

    setIsVersionChangeDialogOpen(false);
    setVersionChangeData(null);
    setOriginalFreightId(null);
    setValidationWarning(null);
  };

  const handleVersionChangeCancel = () => {
    setIsVersionChangeDialogOpen(false);
    setVersionChangeData(null);
    setOriginalFreightId(null);
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Star className="h-6 w-6" />
            대리점별 해상운임 관리
          </h2>
          <p className="text-gray-600 mt-1">철도 대리점이 지정한 특별 해상운임</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            운임 추가
          </Button>
        )}
      </div>

      <Alert>
        <Star className="h-4 w-4" />
        <AlertDescription>
          <strong>대리점별 해상운임:</strong> 철도 대리점이 특정 경로에 대해 지정한 해상운임입니다. 설정된 경우 일반 해상운임보다 우선 적용됩니다.
          <br />
          <span className="text-sm text-gray-600 mt-1 block">
            D/O(DTHC)는 별도의 "D/O(DTHC) 관리" 페이지에서 대리점별로 설정됩니다.
          </span>
        </AlertDescription>
      </Alert>

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

      <div className="border rounded-lg overflow-hidden bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>버전</TableHead>
              <TableHead>대리점</TableHead>
              <TableHead>선적포트 (POL)</TableHead>
              <TableHead>양하포트 (POD)</TableHead>
              <TableHead>운임 (USD)</TableHead>
              <TableHead>L.LOCAL (USD)</TableHead>
              <TableHead>선사</TableHead>
              <TableHead>유효기간</TableHead>
              <TableHead>상태</TableHead>
              <TableHead>비고</TableHead>
              {isAdmin && <TableHead className="text-right">작업</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedFreights.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 11 : 10} className="text-center py-8 text-gray-500">
                  {agentSeaFreights.length === 0 ? '설정된 대리점별 해상운임이 없습니다' : '검색 결과가 없습니다'}
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
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-amber-600" />
                        {freight.agent}
                      </div>
                    </TableCell>
                    <TableCell>{freight.pol}</TableCell>
                    <TableCell>{freight.pod}</TableCell>
                    <TableCell>${freight.rate}</TableCell>
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
                    <TableCell>{freight.note || '-'}</TableCell>
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
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(freight.id)}
                          >
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
        title="대리점별 해상운임 버전 기록"
        description="대리점별 해상운임의 모든 변경 내역이 버전별로 기록됩니다. '버전 변경' 버튼을 클릭하면 플로팅 화면에서 새 버전의 정보를 수정할 수 있습니다."
      />

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
        setIsAddDialogOpen(open);
        if (!open) setValidationWarning(null);
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>대리점별 해상운임 추가</DialogTitle>
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
            <Button onClick={handleAdd}>추가</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Version Change Dialog */}
      <Dialog open={isVersionChangeDialogOpen} onOpenChange={handleVersionChangeCancel}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-purple-600" />
              버전 변경
            </DialogTitle>
            <DialogDescription>
              새로운 버전의 운임 정보를 수정하세요. 버전이 자동으로 증가하고 유효기간이 설정됩니다.
            </DialogDescription>
          </DialogHeader>
          {versionChangeData && (
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
                  <Label>선적포트 (POL)</Label>
                  <Input value={versionChangeData.pol} disabled className="bg-gray-50" />
                </div>
                <div className="space-y-2">
                  <Label>양하포트 (POD)</Label>
                  <Input value={versionChangeData.pod} disabled className="bg-gray-50" />
                </div>
                <div className="space-y-2">
                  <Label>운임 (USD) *</Label>
                  <Input
                    type="number"
                    value={versionChangeData.rate}
                    onChange={(e) => {
                      setVersionChangeData({
                        ...versionChangeData,
                        rate: Number(e.target.value)
                      });
                      setValidationWarning(null);
                    }}
                  />
                  <p className="text-xs text-green-600">✅ 운임이 0이어도 유효합니다</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>선사</Label>
                  <Select 
                    value={versionChangeData.carrier || 'NONE'} 
                    onValueChange={(value) => {
                      setVersionChangeData({
                        ...versionChangeData,
                        carrier: value === 'NONE' ? undefined : value
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
                    value={versionChangeData.llocal || ''}
                    onChange={(e) => {
                      setVersionChangeData({
                        ...versionChangeData,
                        llocal: e.target.value ? Number(e.target.value) : undefined
                      });
                    }}
                  />
                </div>
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
                    setValidationWarning(null);
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
                <Label>비고</Label>
                <Input
                  placeholder="비고를 입력하세요"
                  value={versionChangeData.note || ''}
                  onChange={(e) => {
                    setVersionChangeData({
                      ...versionChangeData,
                      note: e.target.value || undefined
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