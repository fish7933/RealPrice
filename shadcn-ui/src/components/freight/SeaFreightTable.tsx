import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFreight } from '@/contexts/FreightContext';
import { SeaFreight } from '@/types/freight';
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
import { Trash2, Plus, AlertTriangle, RefreshCw, Search, X, ChevronLeft, ChevronRight, Ship } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AuditLogTable from './AuditLogTable';
import { ValidityPeriodInput } from '@/components/ui/validity-period-input';
import { 
  getValidityStatus, 
  formatValidityDate, 
  validateVersionContinuity,
  autoPopulateValidityDates,
} from '@/utils/validityHelper';
import { Badge } from '@/components/ui/badge';

interface VersionChangeData {
  pol: string;
  pod: string;
  rate: number;
  localCharge?: number;
  carrier?: string;
  note?: string;
  validFrom: string;
  validTo: string;
  currentVersion: number;
  nextVersion: number;
}

const ITEMS_PER_PAGE = 10;
const FILTER_ALL_VALUE = '__all__';

export default function SeaFreightTable() {
  const { user } = useAuth();
  const { seaFreights, addSeaFreight, updateSeaFreight, deleteSeaFreight, getAuditLogsByType, shippingLines, ports } = useFreight();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isVersionChangeDialogOpen, setIsVersionChangeDialogOpen] = useState(false);
  const [versionChangeData, setVersionChangeData] = useState<VersionChangeData | null>(null);
  const [originalFreightId, setOriginalFreightId] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    pol: '',
    pod: '',
    rate: '',
    localCharge: '',
    carrier: '',
    note: '',
    validFrom: '',
    validTo: '',
  });

  // Pagination and filter states
  const [currentPage, setCurrentPage] = useState(1);
  const [searchFilters, setSearchFilters] = useState({
    pol: FILTER_ALL_VALUE,
    pod: FILTER_ALL_VALUE,
    carrier: FILTER_ALL_VALUE,
    status: FILTER_ALL_VALUE, // 'all', 'active', 'expiring', 'expired'
  });

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  // Get POL and POD ports from the ports list
  const polPorts = ports.filter(p => p.type === 'POL');
  const podPorts = ports.filter(p => p.type === 'POD');

  // Extract unique values from sea freights for filter dropdowns
  const filterOptions = useMemo(() => {
    const pols = new Set<string>();
    const pods = new Set<string>();
    const carriers = new Set<string>();

    seaFreights.forEach(freight => {
      if (freight.pol) pols.add(freight.pol);
      if (freight.pod) pods.add(freight.pod);
      if (freight.carrier) carriers.add(freight.carrier);
    });

    return {
      pols: Array.from(pols).sort((a, b) => a.localeCompare(b, 'ko')),
      pods: Array.from(pods).sort((a, b) => a.localeCompare(b, 'ko')),
      carriers: Array.from(carriers).sort((a, b) => a.localeCompare(b, 'ko')),
    };
  }, [seaFreights]);

  // Filter sea freights
  const filteredFreights = useMemo(() => {
    return seaFreights.filter((freight) => {
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
  }, [seaFreights, searchFilters]);

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

  // Auto-populate validity dates when route or carrier changes
  useEffect(() => {
    if (isAddDialogOpen && formData.pol && formData.pod) {
      const dates = autoPopulateValidityDates(
        '',
        seaFreights,
        (item) => item.carrier === (formData.carrier || undefined) && item.pol === formData.pol && item.pod === formData.pod
      );
      setFormData(prev => ({
        ...prev,
        validFrom: dates.validFrom,
        validTo: dates.validTo
      }));
    }
  }, [formData.pol, formData.pod, formData.carrier, isAddDialogOpen, seaFreights]);

  const handleAdd = () => {
    if (!formData.pol || !formData.pod || !formData.rate || !formData.validFrom || !formData.validTo) {
      setValidationError('❌ 모든 필수 항목을 입력해주세요.');
      return;
    }

    // Validate version continuity (includes basic validation and continuity check)
    const error = validateVersionContinuity(
      formData.validFrom,
      formData.validTo,
      '', // empty ID for new item
      seaFreights,
      (item) => item.carrier === (formData.carrier || undefined) && item.pol === formData.pol && item.pod === formData.pod
    );

    if (error) {
      setValidationError(error);
      return;
    }

    addSeaFreight({
      pol: formData.pol,
      pod: formData.pod,
      rate: Number(formData.rate),
      localCharge: formData.localCharge ? Number(formData.localCharge) : 0,
      carrier: formData.carrier || undefined,
      note: formData.note || undefined,
      validFrom: formData.validFrom,
      validTo: formData.validTo,
    });

    setFormData({ pol: '', pod: '', rate: '', localCharge: '', carrier: '', note: '', validFrom: '', validTo: '' });
    setValidationError(null);
    setIsAddDialogOpen(false);
  };

  const handleVersionChangeClick = (freight: SeaFreight) => {
    // Calculate next version number - include ALL items in the same group (including current)
    const relevantItems = seaFreights.filter(
      (item) => item.carrier === freight.carrier && item.pol === freight.pol && item.pod === freight.pod
    );
    const maxVersion = Math.max(...relevantItems.map(item => item.version || 1), 0);
    const nextVersion = maxVersion + 1;

    // Calculate validity dates with validation
    let validFrom = '';
    let validTo = '';

    try {
      // Validate that freight.validTo is a valid date
      if (!freight.validTo || freight.validTo === '') {
        // If no validTo, use today as starting point
        const today = new Date();
        validFrom = today.toISOString().split('T')[0];
      } else {
        const validFromDate = new Date(freight.validTo);
        
        // Check if date is valid
        if (isNaN(validFromDate.getTime())) {
          // Invalid date, use today
          const today = new Date();
          validFrom = today.toISOString().split('T')[0];
        } else {
          // Valid date, add 1 day
          validFromDate.setDate(validFromDate.getDate() + 1);
          validFrom = validFromDate.toISOString().split('T')[0];
        }
      }

      // Calculate validTo (1 month after validFrom)
      const validToDate = new Date(validFrom);
      validToDate.setMonth(validToDate.getMonth() + 1);
      validTo = validToDate.toISOString().split('T')[0];
    } catch (error) {
      // If any error occurs, use today and today + 1 month
      console.error('Error calculating validity dates:', error);
      const today = new Date();
      validFrom = today.toISOString().split('T')[0];
      const nextMonth = new Date(today);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      validTo = nextMonth.toISOString().split('T')[0];
    }

    setVersionChangeData({
      pol: freight.pol,
      pod: freight.pod,
      rate: freight.rate,
      localCharge: freight.localCharge || 0,
      carrier: freight.carrier,
      note: freight.note,
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

    // Validate all required fields
    if (!versionChangeData.pol || !versionChangeData.pod || !versionChangeData.rate || !versionChangeData.validFrom || !versionChangeData.validTo) {
      setValidationError('❌ 모든 필수 항목을 입력해주세요.');
      return;
    }

    // Validate version continuity
    const error = validateVersionContinuity(
      versionChangeData.validFrom,
      versionChangeData.validTo,
      originalFreightId,
      seaFreights,
      (item) => item.carrier === versionChangeData.carrier && item.pol === versionChangeData.pol && item.pod === versionChangeData.pod
    );

    if (error) {
      setValidationError(error);
      return;
    }

    // Update freight - only pass changed fields to trigger version increment
    updateSeaFreight(originalFreightId, {
      rate: versionChangeData.rate,
      localCharge: versionChangeData.localCharge,
      carrier: versionChangeData.carrier,
      note: versionChangeData.note,
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
    if (confirm('이 운임 정보를 삭제하시겠습니까?')) {
      deleteSeaFreight(id);
    }
  };

  const handleClearFilters = () => {
    setSearchFilters({
      pol: FILTER_ALL_VALUE,
      pod: FILTER_ALL_VALUE,
      carrier: FILTER_ALL_VALUE,
      status: FILTER_ALL_VALUE,
    });
  };

  // Get audit logs for sea freight
  const auditLogs = getAuditLogsByType('seaFreight');

  // Check for expired or expiring rates
  const expiredRates = seaFreights.filter(f => getValidityStatus(f.validFrom, f.validTo).status === 'expired');
  const expiringRates = seaFreights.filter(f => getValidityStatus(f.validFrom, f.validTo).status === 'expiring');

  // Helper function to get the display value for carrier select
  const getCarrierSelectValue = (carrier?: string) => {
    if (!carrier) return 'NONE';
    // Check if carrier exists in shipping lines
    const exists = shippingLines.some(line => line.name === carrier);
    return exists ? carrier : 'NONE';
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Ship className="h-6 w-6" />
            해상운임 관리
          </h2>
          <p className="text-gray-600 mt-1">출발포트에서 도착포트까지의 해상 운송 비용</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            운임 추가
          </Button>
        )}
      </div>

      {/* Validity Warnings */}
      {(expiredRates.length > 0 || expiringRates.length > 0) && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {expiredRates.length > 0 && (
              <div className="font-semibold">
                ⚠️ {expiredRates.length}개의 운임이 만료되었습니다.
              </div>
            )}
            {expiringRates.length > 0 && (
              <div className="text-sm mt-1">
                📅 {expiringRates.length}개의 운임이 7일 이내에 만료됩니다.
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">출발포트</Label>
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
            <Label className="text-xs">도착포트</Label>
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
        총 {filteredFreights.length}개의 운임 (전체 {seaFreights.length}개 중)
      </div>

      <div className="border rounded-lg overflow-hidden bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>버전</TableHead>
              <TableHead>출발포트</TableHead>
              <TableHead>도착포트</TableHead>
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
                <TableCell colSpan={isAdmin ? 10 : 9} className="text-center py-8 text-gray-500">
                  검색 결과가 없습니다
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
                    <TableCell className="font-medium">{freight.pol}</TableCell>
                    <TableCell>{freight.pod}</TableCell>
                    <TableCell>${freight.rate}</TableCell>
                    <TableCell>${freight.localCharge || 0}</TableCell>
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

      {/* Audit Log Section */}
      <AuditLogTable 
        logs={auditLogs}
        title="해상운임 버전 기록"
        description="해상운임의 모든 변경 내역이 버전별로 기록됩니다. '버전 변경' 버튼을 클릭하면 플로팅 화면에서 새 버전의 정보를 수정할 수 있습니다. 새로운 버전의 시작일은 이전 버전의 종료일 다음날이며, 종료일은 시작일로부터 1개월 후로 자동 설정됩니다."
      />

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
        setIsAddDialogOpen(open);
        if (!open) {
          setValidationError(null);
          setFormData({ pol: '', pod: '', rate: '', localCharge: '', carrier: '', note: '', validFrom: '', validTo: '' });
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>해상운임 추가</DialogTitle>
            <DialogDescription>새로운 해상운임 정보를 입력하세요.</DialogDescription>
          </DialogHeader>
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>출발포트 *</Label>
                {polPorts.length > 0 ? (
                  <Select value={formData.pol} onValueChange={(value) => {
                    setFormData({ ...formData, pol: value });
                    setValidationError(null);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="출발포트 선택" />
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
                    출발포트를 먼저 등록해주세요. (선사 & 중국 파트너사 탭 → 포트 관리)
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>도착포트 *</Label>
                {podPorts.length > 0 ? (
                  <Select value={formData.pod} onValueChange={(value) => {
                    setFormData({ ...formData, pod: value });
                    setValidationError(null);
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="도착포트 선택" />
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
                    도착포트를 먼저 등록해주세요. (선사 & 중국 파트너사 탭 → 포트 관리)
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>운임 (USD) *</Label>
                <Input
                  type="number"
                  placeholder="운임을 입력하세요"
                  value={formData.rate}
                  onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>L.LOCAL (USD)</Label>
                <Input
                  type="number"
                  placeholder="L.LOCAL을 입력하세요"
                  value={formData.localCharge}
                  onChange={(e) => setFormData({ ...formData, localCharge: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>선사 (선택)</Label>
              {shippingLines.length > 0 ? (
                <Select value={formData.carrier} onValueChange={(value) => {
                  setFormData({ ...formData, carrier: value });
                }}>
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
              {shippingLines.length > 0 && (
                <p className="text-xs text-gray-500">
                  등록된 선사: {shippingLines.map(l => l.name).join(', ')}
                </p>
              )}
              <p className="text-xs text-orange-600">
                💡 선사가 다르면 같은 출발포트/도착포트라도 별도의 버전(v1)으로 시작합니다.
              </p>
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
              <div className="text-xs space-y-1">
                <p className="text-green-600 font-medium">
                  ✅ 유효기간이 자동으로 설정되었습니다.
                </p>
                <p className="text-gray-600">
                  • 시작일: 이전 버전 종료일의 다음날 (첫 버전은 오늘)
                </p>
                <p className="text-gray-600">
                  • 종료일: 시작일로부터 1개월 후
                </p>
                <p className="text-blue-600">
                  📝 필요시 직접 수정할 수 있습니다.
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label>비고 (선택)</Label>
              <Input
                placeholder="비고를 입력하세요"
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddDialogOpen(false);
              setValidationError(null);
              setFormData({ pol: '', pod: '', rate: '', localCharge: '', carrier: '', note: '', validFrom: '', validTo: '' });
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
              {validationError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-semibold">유효성 검증 오류</div>
                    <div className="text-sm mt-1 whitespace-pre-line">{validationError}</div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Version Info */}
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
                  <Label>출발포트</Label>
                  <Input value={versionChangeData.pol} disabled className="bg-gray-50" />
                </div>
                <div className="space-y-2">
                  <Label>도착포트</Label>
                  <Input value={versionChangeData.pod} disabled className="bg-gray-50" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                      setValidationError(null);
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>L.LOCAL (USD)</Label>
                  <Input
                    type="number"
                    value={versionChangeData.localCharge || 0}
                    onChange={(e) => {
                      setVersionChangeData({
                        ...versionChangeData,
                        localCharge: Number(e.target.value)
                      });
                      setValidationError(null);
                    }}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>선사</Label>
                {shippingLines.length > 0 ? (
                  <Select 
                    value={getCarrierSelectValue(versionChangeData.carrier)} 
                    onValueChange={(value) => {
                      setVersionChangeData({
                        ...versionChangeData,
                        carrier: value === 'NONE' ? undefined : value
                      });
                      setValidationError(null);
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
                ) : (
                  <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded border">
                    선사를 먼저 등록해주세요. (선사 & 중국 파트너사 탭 → 선사 관리)
                  </div>
                )}
                {versionChangeData.carrier && !shippingLines.some(line => line.name === versionChangeData.carrier) && (
                  <p className="text-xs text-amber-600">
                    ⚠️ 현재 선사 "{versionChangeData.carrier}"가 선사 목록에 없습니다. 다른 선사를 선택하거나 선사 관리에서 추가해주세요.
                  </p>
                )}
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
                  <p className="text-gray-600 mt-2">
                    💡 필요시 직접 수정할 수 있습니다.
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