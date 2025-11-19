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
import { Trash2, Plus, AlertTriangle, Search, X, ChevronLeft, ChevronRight, Ship, Edit } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import AuditLogTable from './AuditLogTable';
import { ValidityPeriodInput } from '@/components/ui/validity-period-input';
import { 
  getValidityStatus, 
  formatValidityDate, 
  checkOverlapWarning,
} from '@/utils/validityHelper';
import { Badge } from '@/components/ui/badge';

const ITEMS_PER_PAGE = 10;
const FILTER_ALL_VALUE = '__all__';

export default function SeaFreightTable() {
  const { user } = useAuth();
  const { seaFreights, addSeaFreight, updateSeaFreight, deleteSeaFreight, getAuditLogsByType, shippingLines, ports } = useFreight();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingFreight, setEditingFreight] = useState<SeaFreight | null>(null);
  const [validationWarning, setValidationWarning] = useState<string | null>(null);
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
    status: FILTER_ALL_VALUE,
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

  // Filter and sort sea freights by createdAt descending (most recent first)
  const filteredFreights = useMemo(() => {
    return seaFreights
      .filter((freight) => {
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
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [seaFreights, searchFilters]);

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
    if (!formData.pol || !formData.pod || !formData.rate || !formData.validFrom || !formData.validTo) {
      setValidationWarning('❌ 모든 필수 항목을 입력해주세요.');
      return;
    }

    const warning = checkOverlapWarning(
      formData.validFrom,
      formData.validTo,
      '',
      seaFreights,
      (item) => item.carrier === (formData.carrier || undefined) && item.pol === formData.pol && item.pod === formData.pod
    );

    if (warning) {
      setValidationWarning(warning);
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
    setValidationWarning(null);
    setIsAddDialogOpen(false);
  };

  const handleAddIgnoreWarning = () => {
    if (!formData.pol || !formData.pod || !formData.rate || !formData.validFrom || !formData.validTo) return;

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
    setValidationWarning(null);
    setIsAddDialogOpen(false);
  };

  const handleEditClick = (freight: SeaFreight) => {
    setEditingFreight(freight);
    setFormData({
      pol: freight.pol,
      pod: freight.pod,
      rate: freight.rate.toString(),
      localCharge: (freight.localCharge || 0).toString(),
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

    updateSeaFreight(editingFreight.id, {
      rate: Number(formData.rate),
      localCharge: Number(formData.localCharge || 0),
      carrier: formData.carrier || undefined,
      note: formData.note || undefined,
      validFrom: formData.validFrom,
      validTo: formData.validTo,
    });

    setIsEditDialogOpen(false);
    setEditingFreight(null);
    setFormData({ pol: '', pod: '', rate: '', localCharge: '', carrier: '', note: '', validFrom: '', validTo: '' });
    setValidationWarning(null);
  };

  const handleEditCancel = () => {
    setIsEditDialogOpen(false);
    setEditingFreight(null);
    setFormData({ pol: '', pod: '', rate: '', localCharge: '', carrier: '', note: '', validFrom: '', validTo: '' });
    setValidationWarning(null);
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

  const auditLogs = getAuditLogsByType('seaFreight');
  const expiredRates = seaFreights.filter(f => getValidityStatus(f.validFrom, f.validTo).status === 'expired');
  const expiringRates = seaFreights.filter(f => getValidityStatus(f.validFrom, f.validTo).status === 'expiring');

  const getCarrierSelectValue = (carrier?: string) => {
    if (!carrier) return 'NONE';
    const exists = shippingLines.some(line => line.name === carrier);
    return exists ? carrier : 'NONE';
  };

  return (
    <div className="space-y-4">
      {/* Header Section - Compact */}
      <div className="relative overflow-hidden rounded-lg bg-gray-700 p-3 text-white shadow-lg">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10 blur-2xl"></div>
        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-24 w-24 rounded-full bg-white/10 blur-2xl"></div>
        <div className="relative flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-white/20 backdrop-blur-sm rounded-lg">
              <Ship className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold">해상운임</h2>
              <p className="text-xs text-gray-300">선적포트 → 양하포트</p>
            </div>
          </div>
          {isAdmin && (
            <Button 
              onClick={() => setIsAddDialogOpen(true)}
              size="sm"
              className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border border-white/50 h-7 text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              추가
            </Button>
          )}
        </div>
      </div>

      {/* Validity Warnings - Compact */}
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
      <div className="p-3 bg-gray-600 rounded-lg border border-blue-100 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-1 bg-blue-100 rounded">
            <Search className="h-3 w-3 text-blue-600" />
          </div>
          <span className="text-xs font-semibold text-gray-800">검색 필터</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-gray-700">POL</Label>
            <Select value={searchFilters.pol} onValueChange={(value) => setSearchFilters(prev => ({ ...prev, pol: value }))}>
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
            <Label className="text-xs font-semibold text-gray-700">POD</Label>
            <Select value={searchFilters.pod} onValueChange={(value) => setSearchFilters(prev => ({ ...prev, pod: value }))}>
              <SelectTrigger className="h-8 text-xs bg-white">
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
            <Label className="text-xs font-semibold text-gray-700">선사</Label>
            <Select value={searchFilters.carrier} onValueChange={(value) => setSearchFilters(prev => ({ ...prev, carrier: value }))}>
              <SelectTrigger className="h-8 text-xs bg-white">
                <SelectValue placeholder="전체" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={FILTER_ALL_VALUE}>전체</SelectItem>
                {filterOptions.carriers.map((carrier) => (
                  <SelectItem key={carrier} value={carrier}>{carrier}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-gray-700">상태</Label>
            <Select value={searchFilters.status} onValueChange={(value) => setSearchFilters(prev => ({ ...prev, status: value }))}>
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
        총 {filteredFreights.length}개 (전체 {seaFreights.length}개 중)
      </div>

      {/* Table - Compact */}
      <div className="rounded-lg overflow-hidden shadow-sm border">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-600">
              <TableHead className="h-9 text-xs text-white font-bold whitespace-nowrap">POL</TableHead>
              <TableHead className="h-9 text-xs text-white font-bold whitespace-nowrap">POD</TableHead>
              <TableHead className="h-9 text-xs text-white font-bold whitespace-nowrap">운임</TableHead>
              <TableHead className="h-9 text-xs text-white font-bold whitespace-nowrap">L.LOCAL</TableHead>
              <TableHead className="h-9 text-xs text-white font-bold whitespace-nowrap">선사</TableHead>
              <TableHead className="h-9 text-xs text-white font-bold whitespace-nowrap">유효기간</TableHead>
              <TableHead className="h-9 text-xs text-white font-bold whitespace-nowrap">상태</TableHead>
              <TableHead className="h-9 text-xs text-white font-bold whitespace-nowrap">비고</TableHead>
              {isAdmin && <TableHead className="h-9 text-xs text-right text-white font-bold whitespace-nowrap">작업</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedFreights.length === 0 ? (
              <TableRow>
                <TableCell colSpan={isAdmin ? 9 : 8} className="text-center py-6">
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <Ship className="h-12 w-12 opacity-20" />
                    <p className="text-sm">검색 결과가 없습니다</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedFreights.map((freight) => {
                const validityStatus = getValidityStatus(freight.validFrom, freight.validTo);
                
                return (
                  <TableRow key={freight.id} className="hover:bg-gray-50">
                    <TableCell className="py-2 text-xs font-medium whitespace-nowrap">{freight.pol}</TableCell>
                    <TableCell className="py-2 text-xs whitespace-nowrap">{freight.pod}</TableCell>
                    <TableCell className="py-2 text-xs font-semibold text-blue-600 whitespace-nowrap">${freight.rate}</TableCell>
                    <TableCell className="py-2 text-xs whitespace-nowrap">${freight.localCharge || 0}</TableCell>
                    <TableCell className="py-2 text-xs whitespace-nowrap">{freight.carrier || '-'}</TableCell>
                    <TableCell className="py-2 text-xs whitespace-nowrap">
                      {formatValidityDate(freight.validFrom)} ~ {formatValidityDate(freight.validTo)}
                    </TableCell>
                    <TableCell className="py-2 whitespace-nowrap">
                      <Badge variant={validityStatus.variant} className="text-xs px-1.5 py-0">
                        {validityStatus.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-2 text-xs whitespace-nowrap">{freight.note || '-'}</TableCell>
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
                            className="h-6 w-6 p-0 hover:bg-gray-50 hover:text-red-700"
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

      {/* Audit Log Section */}
      <AuditLogTable 
        logs={auditLogs}
        title="해상운임 변경 기록"
        description="해상운임의 모든 변경 내역이 기록됩니다."
      />

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
        setIsAddDialogOpen(open);
        if (!open) {
          setValidationWarning(null);
          setFormData({ pol: '', pod: '', rate: '', localCharge: '', carrier: '', note: '', validFrom: '', validTo: '' });
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <div className="p-2 bg-gray-600 rounded-lg">
                <Ship className="h-5 w-5 text-white" />
              </div>
              해상운임 추가
            </DialogTitle>
            <DialogDescription>새로운 해상운임 정보를 입력하세요.</DialogDescription>
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">선적포트 (POL) *</Label>
                {polPorts.length > 0 ? (
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
                ) : (
                  <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded border">
                    선적포트를 먼저 등록해주세요. (선사 & 중국 파트너사 탭 → 포트 관리)
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">양하포트 (POD) *</Label>
                {podPorts.length > 0 ? (
                  <Select value={formData.pod} onValueChange={(value) => {
                    setFormData({ ...formData, pod: value });
                    setValidationWarning(null);
                  }}>
                    <SelectTrigger className="border-gray-300 focus:border-blue-500">
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
                    양하포트를 먼저 등록해주세요. (선사 & 중국 파트너사 탭 → 포트 관리)
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">운임 (USD) *</Label>
                <Input
                  type="number"
                  placeholder="운임을 입력하세요"
                  value={formData.rate}
                  onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">L.LOCAL (USD)</Label>
                <Input
                  type="number"
                  placeholder="L.LOCAL을 입력하세요"
                  value={formData.localCharge}
                  onChange={(e) => setFormData({ ...formData, localCharge: e.target.value })}
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">선사 (선택)</Label>
              {shippingLines.length > 0 ? (
                <Select value={formData.carrier} onValueChange={(value) => {
                  setFormData({ ...formData, carrier: value });
                }}>
                  <SelectTrigger className="border-gray-300 focus:border-blue-500">
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
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">비고 (선택)</Label>
              <Input
                placeholder="비고를 입력하세요"
                value={formData.note}
                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsAddDialogOpen(false);
                setValidationWarning(null);
                setFormData({ pol: '', pod: '', rate: '', localCharge: '', carrier: '', note: '', validFrom: '', validTo: '' });
              }}
              className="hover:bg-gray-100"
            >
              취소
            </Button>
            <Button 
              onClick={handleAdd}
              className="bg-gray-600 hover:bg-gray-800 text-white shadow-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              추가
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={handleEditCancel}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <div className="p-2 bg-gray-600 rounded-lg">
                <Edit className="h-5 w-5 text-white" />
              </div>
              해상운임 수정
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
                  <Label className="text-sm font-semibold text-gray-700">선적포트 (POL)</Label>
                  <Input value={formData.pol} disabled className="bg-gray-50" />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">양하포트 (POD)</Label>
                  <Input value={formData.pod} disabled className="bg-gray-50" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">운임 (USD) *</Label>
                  <Input
                    type="number"
                    value={formData.rate}
                    onChange={(e) => {
                      setFormData({ ...formData, rate: e.target.value });
                      setValidationWarning(null);
                    }}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">L.LOCAL (USD)</Label>
                  <Input
                    type="number"
                    value={formData.localCharge}
                    onChange={(e) => {
                      setFormData({ ...formData, localCharge: e.target.value });
                      setValidationWarning(null);
                    }}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">선사</Label>
                {shippingLines.length > 0 ? (
                  <Select 
                    value={getCarrierSelectValue(formData.carrier)} 
                    onValueChange={(value) => {
                      setFormData({
                        ...formData,
                        carrier: value === 'NONE' ? '' : value
                      });
                      setValidationWarning(null);
                    }}
                  >
                    <SelectTrigger className="border-gray-300 focus:border-blue-500">
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
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">유효기간 *</Label>
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
                <Label className="text-sm font-semibold text-gray-700">비고</Label>
                <Input
                  placeholder="비고를 입력하세요"
                  value={formData.note}
                  onChange={(e) => {
                    setFormData({
                      ...formData,
                      note: e.target.value
                    });
                  }}
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
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
              className="bg-gray-600 hover:bg-gray-800 text-white shadow-lg"
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