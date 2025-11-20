import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Clock, TrendingDown, History, Trash2, Search, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { CalculationHistory as CalculationHistoryType } from '@/types/freight';
import { ITEMS_PER_PAGE, FILTER_ALL_VALUE } from './types';

interface CalculationHistoryProps {
  calculationHistory: CalculationHistoryType[] | null;
  onLoadHistory: (history: CalculationHistoryType) => void;
  onDeleteHistory: (id: string) => void;
  canDeleteCalculation: (createdBy: string) => boolean;
  formatDate: (dateString: string) => string;
}

export default function CalculationHistoryComponent({
  calculationHistory,
  onLoadHistory,
  onDeleteHistory,
  canDeleteCalculation,
  formatDate,
}: CalculationHistoryProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchFilters, setSearchFilters] = useState({
    pol: FILTER_ALL_VALUE,
    pod: FILTER_ALL_VALUE,
    destination: FILTER_ALL_VALUE,
    dateFrom: '',
    dateTo: '',
  });
  const [selectedHistoryIds, setSelectedHistoryIds] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [historyToDelete, setHistoryToDelete] = useState<string | null>(null);
  const [batchDeleteDialogOpen, setBatchDeleteDialogOpen] = useState(false);
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);

  // Helper function to check if a date is today
  const isToday = (dateString: string): boolean => {
    const today = new Date();
    const date = new Date(dateString);
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  };

  // Extract unique values from calculation history for filter dropdowns
  const filterOptions = useMemo(() => {
    if (!calculationHistory) return { pols: [], pods: [], destinations: [] };

    const pols = new Set<string>();
    const pods = new Set<string>();
    const destinations = new Set<string>();

    calculationHistory.forEach(history => {
      if (history.result.input.pol) pols.add(history.result.input.pol);
      if (history.result.input.pod) pods.add(history.result.input.pod);
      if (history.destinationName) destinations.add(history.destinationName);
    });

    return {
      pols: Array.from(pols).sort((a, b) => a.localeCompare(b, 'ko')),
      pods: Array.from(pods).sort((a, b) => a.localeCompare(b, 'ko')),
      destinations: Array.from(destinations).sort((a, b) => a.localeCompare(b, 'ko')),
    };
  }, [calculationHistory]);

  // Filter and paginate calculation history
  const filteredHistory = useMemo(() => {
    if (!calculationHistory) return [];

    return calculationHistory.filter((history) => {
      if (searchFilters.pol !== FILTER_ALL_VALUE && history.result.input.pol !== searchFilters.pol) {
        return false;
      }

      if (searchFilters.pod !== FILTER_ALL_VALUE && history.result.input.pod !== searchFilters.pod) {
        return false;
      }

      if (searchFilters.destination !== FILTER_ALL_VALUE && history.destinationName !== searchFilters.destination) {
        return false;
      }

      if (searchFilters.dateFrom || searchFilters.dateTo) {
        const historyDate = new Date(history.createdAt).toISOString().split('T')[0];
        
        if (searchFilters.dateFrom && historyDate < searchFilters.dateFrom) {
          return false;
        }
        
        if (searchFilters.dateTo && historyDate > searchFilters.dateTo) {
          return false;
        }
      }

      return true;
    });
  }, [calculationHistory, searchFilters]);

  const deletableFilteredHistory = useMemo(() => {
    return filteredHistory.filter(history => canDeleteCalculation(history.createdBy));
  }, [filteredHistory, canDeleteCalculation]);

  const totalPages = Math.ceil(filteredHistory.length / ITEMS_PER_PAGE);
  const paginatedHistory = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredHistory.slice(startIndex, endIndex);
  }, [filteredHistory, currentPage]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchFilters]);

  // Clear selections when filters change
  useEffect(() => {
    setSelectedHistoryIds(new Set());
  }, [searchFilters, currentPage]);

  const handleClearFilters = () => {
    setSearchFilters({
      pol: FILTER_ALL_VALUE,
      pod: FILTER_ALL_VALUE,
      destination: FILTER_ALL_VALUE,
      dateFrom: '',
      dateTo: '',
    });
  };

  const handleDateFromChange = (value: string) => {
    setSearchFilters(prev => ({
      ...prev,
      dateFrom: value,
      dateTo: value
    }));
  };

  const confirmDeleteHistory = (id: string) => {
    setHistoryToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteHistoryConfirm = async () => {
    if (historyToDelete) {
      await onDeleteHistory(historyToDelete);
    }
    setDeleteDialogOpen(false);
    setHistoryToDelete(null);
  };

  const toggleHistorySelection = (historyId: string) => {
    setSelectedHistoryIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(historyId)) {
        newSet.delete(historyId);
      } else {
        newSet.add(historyId);
      }
      return newSet;
    });
  };

  const toggleSelectAllOnPage = () => {
    const deletableOnPage = paginatedHistory.filter(h => canDeleteCalculation(h.createdBy));
    const allSelected = deletableOnPage.every(h => selectedHistoryIds.has(h.id));
    
    setSelectedHistoryIds(prev => {
      const newSet = new Set(prev);
      if (allSelected) {
        deletableOnPage.forEach(h => newSet.delete(h.id));
      } else {
        deletableOnPage.forEach(h => newSet.add(h.id));
      }
      return newSet;
    });
  };

  const handleBatchDelete = async () => {
    if (selectedHistoryIds.size === 0) return;

    for (const id of selectedHistoryIds) {
      await onDeleteHistory(id);
    }

    setSelectedHistoryIds(new Set());
    setBatchDeleteDialogOpen(false);
  };

  const handleDeleteAllFiltered = async () => {
    if (deletableFilteredHistory.length === 0) return;

    for (const history of deletableFilteredHistory) {
      await onDeleteHistory(history.id);
    }

    setSelectedHistoryIds(new Set());
    setDeleteAllDialogOpen(false);
  };

  const deletableOnPage = paginatedHistory.filter(h => canDeleteCalculation(h.createdBy));
  const allPageSelected = deletableOnPage.length > 0 && deletableOnPage.every(h => selectedHistoryIds.has(h.id));
  const somePageSelected = deletableOnPage.some(h => selectedHistoryIds.has(h.id)) && !allPageSelected;

  if (!calculationHistory || calculationHistory.length === 0) {
    return null;
  }

  return (
    <>
      <div className="space-y-4">
        <div className="p-4 bg-gray-50 rounded-lg border">
          <div className="flex items-center gap-2 mb-3">
            <Search className="h-4 w-4 text-gray-600" />
            <span className="font-semibold text-sm">검색 필터</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
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
              <Label className="text-xs">하역포트 (POD)</Label>
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
                    <SelectItem key={dest} value={dest}>
                      {dest}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">시작 날짜</Label>
              <Input
                type="date"
                value={searchFilters.dateFrom}
                onChange={(e) => handleDateFromChange(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">종료 날짜</Label>
              <Input
                type="date"
                value={searchFilters.dateTo}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                className="h-9"
              />
            </div>
          </div>
          <div className="mt-3 flex justify-between items-center">
            <div className="flex gap-2">
              {selectedHistoryIds.size > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setBatchDeleteDialogOpen(true)}
                  className="h-8"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  선택 삭제 ({selectedHistoryIds.size}개)
                </Button>
              )}
              {deletableFilteredHistory.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setDeleteAllDialogOpen(true)}
                  className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-3 w-3 mr-1" />
                  필터된 기록 전체 삭제 ({deletableFilteredHistory.length}개)
                </Button>
              )}
            </div>
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

        {filteredHistory.length === 0 ? (
          <div className="text-center py-8 text-gray-800">
            <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>검색 결과가 없습니다</p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              {deletableOnPage.length > 0 && (
                <div className="flex items-center gap-2 p-2 bg-gray-100 rounded">
                  <Checkbox
                    checked={allPageSelected}
                    onCheckedChange={toggleSelectAllOnPage}
                    className={somePageSelected ? 'data-[state=checked]:bg-gray-400' : ''}
                  />
                  <span className="text-sm text-gray-700">
                    현재 페이지 전체 선택 ({deletableOnPage.length}개)
                  </span>
                </div>
              )}
              
              {paginatedHistory.map((history) => {
                const canDelete = canDeleteCalculation(history.createdBy);
                const isSelected = selectedHistoryIds.has(history.id);
                const isHistoricalQuery = history.queryDate && !isToday(history.queryDate);
                
                return (
                  <div
                    key={history.id}
                    className={`flex items-center gap-3 p-4 border rounded-lg transition-colors ${
                      isSelected ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'
                    }`}
                  >
                    {canDelete && (
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleHistorySelection(history.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => onLoadHistory(history)}
                    >
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-semibold">
                          {history.result.input.pol} → {history.result.input.pod} → {history.destinationName}
                        </span>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                          [{history.result.input.weight.toLocaleString()}kg]
                        </span>
                        {history.queryDate && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded flex items-center gap-1">
                            📅 운임: {history.queryDate}
                            {isHistoricalQuery && (
                              <span className="ml-0.5" title="타임머신으로 조회된 특정일 운임">⏰</span>
                            )}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(history.createdAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingDown className="h-3 w-3" />
                          최저가: ${history.result.lowestCost.toLocaleString()} ({history.result.lowestCostAgent})
                        </span>
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                          작성자: {history.createdByUsername}
                        </span>
                      </div>
                    </div>
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          confirmDeleteHistory(history.id);
                        }}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="text-sm text-gray-600">
                  {filteredHistory.length}개 중 {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, filteredHistory.length)}개 표시
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
          </>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>계산 기록 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 이 계산 기록을 삭제하시겠습니까?
              이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>
              취소
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteHistoryConfirm} className="bg-red-600 hover:bg-red-700">
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={batchDeleteDialogOpen} onOpenChange={setBatchDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>선택 기록 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              선택한 {selectedHistoryIds.size}개의 계산 기록을 삭제하시겠습니까?
              이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setBatchDeleteDialogOpen(false)}>
              취소
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleBatchDelete} className="bg-red-600 hover:bg-red-700">
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteAllDialogOpen} onOpenChange={setDeleteAllDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>필터된 기록 전체 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              현재 필터 조건에 해당하는 {deletableFilteredHistory.length}개의 계산 기록을 모두 삭제하시겠습니까?
              이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteAllDialogOpen(false)}>
              취소
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAllFiltered} className="bg-red-600 hover:bg-red-700">
              전체 삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}