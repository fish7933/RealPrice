import { useState } from 'react';
import { useFreight } from '@/contexts/FreightContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ChevronLeft, ChevronRight, Trash2, Eye, CalendarIcon, X } from 'lucide-react';
import { Quotation } from '@/types/freight';
import { useToast } from '@/hooks/use-toast';
import QuotationViewDialog from './QuotationViewDialog';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

const ITEMS_PER_PAGE = 10;

export default function QuotationList() {
  const { quotations, deleteQuotation } = useFreight();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [filterPOL, setFilterPOL] = useState<string>('all');
  const [filterPOD, setFilterPOD] = useState<string>('all');
  const [filterDestination, setFilterDestination] = useState<string>('all');
  const [filterCarrier, setFilterCarrier] = useState<string>('all');
  const [filterRailAgent, setFilterRailAgent] = useState<string>('all');
  const [filterTruckAgent, setFilterTruckAgent] = useState<string>('all');
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Get unique values for filters
  const pols = Array.from(new Set(quotations.map(q => q.pol))).sort();
  const pods = Array.from(new Set(quotations.map(q => q.pod))).sort();
  const destinations = Array.from(new Set(quotations.map(q => q.destinationName))).sort();
  const carriers = Array.from(new Set(quotations.map(q => q.carrier).filter(Boolean))).sort();
  
  // Extract rail and truck agents from breakdown
  const railAgents = Array.from(new Set(quotations.map(q => {
    if (q.breakdown?.railAgent) return q.breakdown.railAgent;
    return null;
  }).filter(Boolean))).sort();
  
  const truckAgents = Array.from(new Set(quotations.map(q => {
    if (q.breakdown?.truckAgent) return q.breakdown.truckAgent;
    return null;
  }).filter(Boolean))).sort();

  // Filter quotations
  const filteredQuotations = quotations.filter(quotation => {
    const matchesPOL = filterPOL === 'all' || quotation.pol === filterPOL;
    const matchesPOD = filterPOD === 'all' || quotation.pod === filterPOD;
    const matchesDestination = filterDestination === 'all' || quotation.destinationName === filterDestination;
    const matchesCarrier = filterCarrier === 'all' || quotation.carrier === filterCarrier;
    const matchesRailAgent = filterRailAgent === 'all' || quotation.breakdown?.railAgent === filterRailAgent;
    const matchesTruckAgent = filterTruckAgent === 'all' || quotation.breakdown?.truckAgent === filterTruckAgent;
    
    // Date range filter
    let matchesDate = true;
    if (dateRange.from || dateRange.to) {
      const quotationDate = new Date(quotation.createdAt);
      quotationDate.setHours(0, 0, 0, 0);
      
      if (dateRange.from && dateRange.to) {
        const from = new Date(dateRange.from);
        from.setHours(0, 0, 0, 0);
        const to = new Date(dateRange.to);
        to.setHours(23, 59, 59, 999);
        matchesDate = quotationDate >= from && quotationDate <= to;
      } else if (dateRange.from) {
        const from = new Date(dateRange.from);
        from.setHours(0, 0, 0, 0);
        matchesDate = quotationDate >= from;
      } else if (dateRange.to) {
        const to = new Date(dateRange.to);
        to.setHours(23, 59, 59, 999);
        matchesDate = quotationDate <= to;
      }
    }
    
    return matchesPOL && matchesPOD && matchesDestination && matchesCarrier && 
           matchesRailAgent && matchesTruckAgent && matchesDate;
  });

  // Pagination
  const totalPages = Math.ceil(filteredQuotations.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedQuotations = filteredQuotations.slice(startIndex, endIndex);

  const handleDelete = async (id: string) => {
    if (!window.confirm('이 견적서를 삭제하시겠습니까?')) return;

    try {
      await deleteQuotation(id);
      setSelectedIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      toast({
        title: '삭제 완료',
        description: '견적서가 삭제되었습니다.',
      });
    } catch (error) {
      toast({
        title: '삭제 실패',
        description: '견적서 삭제에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) {
      toast({
        title: '선택 오류',
        description: '삭제할 견적서를 선택해주세요.',
        variant: 'destructive',
      });
      return;
    }

    if (!window.confirm(`선택한 ${selectedIds.size}개의 견적서를 삭제하시겠습니까?`)) return;

    try {
      const deletePromises = Array.from(selectedIds).map(id => deleteQuotation(id));
      await Promise.all(deletePromises);
      setSelectedIds(new Set());
      toast({
        title: '삭제 완료',
        description: `${deletePromises.length}개의 견적서가 삭제되었습니다.`,
      });
    } catch (error) {
      toast({
        title: '삭제 실패',
        description: '일부 견적서 삭제에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteAll = async () => {
    if (filteredQuotations.length === 0) {
      toast({
        title: '삭제 오류',
        description: '삭제할 견적서가 없습니다.',
        variant: 'destructive',
      });
      return;
    }

    if (!window.confirm(`필터링된 ${filteredQuotations.length}개의 견적서를 모두 삭제하시겠습니까?`)) return;

    try {
      const deletePromises = filteredQuotations.map(q => deleteQuotation(q.id));
      await Promise.all(deletePromises);
      setSelectedIds(new Set());
      toast({
        title: '삭제 완료',
        description: `${deletePromises.length}개의 견적서가 삭제되었습니다.`,
      });
    } catch (error) {
      toast({
        title: '삭제 실패',
        description: '일부 견적서 삭제에 실패했습니다.',
        variant: 'destructive',
      });
    }
  };

  const handleView = (quotation: Quotation) => {
    setSelectedQuotation(quotation);
    setViewDialogOpen(true);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(paginatedQuotations.map(q => q.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  };

  const isAllSelected = paginatedQuotations.length > 0 && 
    paginatedQuotations.every(q => selectedIds.has(q.id));

  // Calendar helper functions
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();
    
    const days: (Date | null)[] = [];
    
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  };

  const isToday = (date: Date) => {
    return isSameDay(date, new Date());
  };

  const isInRange = (date: Date) => {
    if (!dateRange.from && !dateRange.to) return false;
    
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    
    if (dateRange.from && dateRange.to) {
      const from = new Date(dateRange.from);
      from.setHours(0, 0, 0, 0);
      const to = new Date(dateRange.to);
      to.setHours(0, 0, 0, 0);
      return checkDate >= from && checkDate <= to;
    } else if (dateRange.from) {
      return isSameDay(checkDate, dateRange.from);
    } else if (dateRange.to) {
      return isSameDay(checkDate, dateRange.to);
    }
    return false;
  };

  const handleDateClick = (date: Date) => {
    if (!dateRange.from || (dateRange.from && dateRange.to)) {
      setDateRange({ from: date, to: undefined });
    } else {
      if (date < dateRange.from) {
        setDateRange({ from: date, to: dateRange.from });
      } else {
        setDateRange({ from: dateRange.from, to: date });
      }
      setCalendarOpen(false);
      setCurrentPage(1);
    }
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const monthName = currentMonth.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' });
  const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
  const days = getDaysInMonth(currentMonth);

  if (quotations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Filters - Single Row */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Date Range Filter - Compact with Custom Calendar */}
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="justify-start text-left font-normal h-8 text-xs px-3"
            >
              <CalendarIcon className="mr-1.5 h-3.5 w-3.5" />
              {dateRange.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, 'MM/dd', { locale: ko })} - {format(dateRange.to, 'MM/dd', { locale: ko })}
                  </>
                ) : (
                  format(dateRange.from, 'MM/dd', { locale: ko })
                )
              ) : (
                <span>작성일</span>
              )}
              {(dateRange.from || dateRange.to) && (
                <X 
                  className="ml-1.5 h-3 w-3 hover:text-red-600" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setDateRange({ from: undefined, to: undefined });
                    setCurrentPage(1);
                  }}
                />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <div className="bg-white rounded-lg shadow-lg border border-gray-300">
              {/* Custom Compact Calendar */}
              <div className="p-3">
                {/* Month Navigation */}
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={previousMonth}
                    className="h-6 w-6 bg-gray-200 hover:bg-gray-300 rounded transition-all border border-gray-300 flex items-center justify-center"
                  >
                    <ChevronLeft className="h-3.5 w-3.5 text-gray-700" />
                  </button>
                  <h3 className="text-sm font-bold text-gray-900">
                    {monthName}
                  </h3>
                  <button
                    onClick={nextMonth}
                    className="h-6 w-6 bg-gray-200 hover:bg-gray-300 rounded transition-all border border-gray-300 flex items-center justify-center"
                  >
                    <ChevronRight className="h-3.5 w-3.5 text-gray-700" />
                  </button>
                </div>

                {/* Calendar Grid */}
                <div className="w-full">
                  {/* Week Days Header */}
                  <div className="grid grid-cols-7 gap-0.5 mb-1">
                    {weekDays.map((day, index) => (
                      <div
                        key={index}
                        className="h-6 flex items-center justify-center text-gray-700 font-bold text-xs"
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Days Grid */}
                  <div className="grid grid-cols-7 gap-0.5">
                    {days.map((day, index) => {
                      if (!day) {
                        return <div key={index} className="h-6 w-full" />;
                      }

                      const today = new Date();
                      const isFutureDate = day > today;
                      const isInRangeDate = isInRange(day);
                      const isTodayDate = isToday(day);

                      return (
                        <button
                          key={index}
                          onClick={() => handleDateClick(day)}
                          className={`
                            h-6 w-full rounded font-semibold text-xs
                            flex items-center justify-center
                            transition-all duration-200
                            ${isInRangeDate
                              ? 'bg-blue-600 text-white shadow-md scale-105 border border-blue-700'
                              : isTodayDate
                              ? 'bg-orange-100 text-orange-900 border border-orange-400 font-bold'
                              : isFutureDate
                              ? 'text-gray-700 bg-gray-100 hover:bg-gray-200 hover:scale-105 border border-gray-300'
                              : 'text-gray-700 bg-gray-50 hover:bg-gray-100 hover:scale-105 border border-gray-200'
                            }
                          `}
                        >
                          {day.getDate()}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Legend */}
              <div className="px-3 pb-3 space-y-1.5 text-xs">
                <div className="flex items-center gap-1.5 p-1.5 bg-gray-50 rounded border border-gray-200">
                  <div className="w-3.5 h-3.5 rounded bg-gray-50 border border-gray-200 flex-shrink-0"></div>
                  <span className="text-gray-800 font-semibold">선택 가능한 날짜</span>
                </div>
                <div className="flex items-center gap-1.5 p-1.5 bg-gray-50 rounded border border-gray-200">
                  <div className="w-3.5 h-3.5 rounded bg-blue-600 border border-blue-700 flex-shrink-0"></div>
                  <span className="text-gray-800 font-semibold">선택된 날짜</span>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* POL Filter */}
        <Select
          value={filterPOL}
          onValueChange={(value) => {
            setFilterPOL(value);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="h-8 text-xs w-[120px]">
            <SelectValue placeholder="POL" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 POL</SelectItem>
            {pols.map((pol) => (
              <SelectItem key={pol} value={pol}>
                {pol}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* POD Filter */}
        <Select
          value={filterPOD}
          onValueChange={(value) => {
            setFilterPOD(value);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="h-8 text-xs w-[120px]">
            <SelectValue placeholder="POD" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 POD</SelectItem>
            {pods.map((pod) => (
              <SelectItem key={pod} value={pod}>
                {pod}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Destination Filter */}
        <Select
          value={filterDestination}
          onValueChange={(value) => {
            setFilterDestination(value);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="h-8 text-xs w-[140px]">
            <SelectValue placeholder="목적지" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 목적지</SelectItem>
            {destinations.map((dest) => (
              <SelectItem key={dest} value={dest}>
                {dest}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Carrier Filter */}
        <Select
          value={filterCarrier}
          onValueChange={(value) => {
            setFilterCarrier(value);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="h-8 text-xs w-[120px]">
            <SelectValue placeholder="선사" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 선사</SelectItem>
            {carriers.map((carrier) => (
              <SelectItem key={carrier} value={carrier}>
                {carrier}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Rail Agent Filter */}
        <Select
          value={filterRailAgent}
          onValueChange={(value) => {
            setFilterRailAgent(value);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="h-8 text-xs w-[120px]">
            <SelectValue placeholder="철도" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 철도</SelectItem>
            {railAgents.map((agent) => (
              <SelectItem key={agent} value={agent}>
                {agent}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Truck Agent Filter */}
        <Select
          value={filterTruckAgent}
          onValueChange={(value) => {
            setFilterTruckAgent(value);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="h-8 text-xs w-[120px]">
            <SelectValue placeholder="트럭" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 트럭</SelectItem>
            {truckAgents.map((agent) => (
              <SelectItem key={agent} value={agent}>
                {agent}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="text-xs text-gray-600">
          총 {filteredQuotations.length}개의 견적서
          {selectedIds.size > 0 && ` (${selectedIds.size}개 선택됨)`}
        </div>
        <div className="flex gap-2">
          {selectedIds.size > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkDelete}
              className="h-8 text-xs border-red-300 text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              선택 삭제 ({selectedIds.size})
            </Button>
          )}
          {filteredQuotations.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteAll}
              className="h-8 text-xs border-red-300 text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              일괄 삭제
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="h-9 w-12 text-center">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead className="h-9 text-xs font-semibold text-gray-900">작성일</TableHead>
              <TableHead className="h-9 text-xs font-semibold text-gray-900">POL</TableHead>
              <TableHead className="h-9 text-xs font-semibold text-gray-900">POD</TableHead>
              <TableHead className="h-9 text-xs font-semibold text-gray-900">목적지</TableHead>
              <TableHead className="h-9 text-xs font-semibold text-gray-900">선사</TableHead>
              <TableHead className="h-9 text-xs font-semibold text-gray-900">철도</TableHead>
              <TableHead className="h-9 text-xs font-semibold text-gray-900">트럭</TableHead>
              <TableHead className="text-right h-9 text-xs font-semibold text-gray-900">원가</TableHead>
              <TableHead className="text-right h-9 text-xs font-semibold text-gray-900">제시운임</TableHead>
              <TableHead className="text-right h-9 text-xs font-semibold text-gray-900">이윤</TableHead>
              <TableHead className="text-right h-9 text-xs font-semibold text-gray-900">이윤율</TableHead>
              <TableHead className="text-center h-9 text-xs font-semibold text-gray-900">작업</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedQuotations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={13} className="text-center py-6 text-sm text-gray-500">
                  검색 결과가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              paginatedQuotations.map((quotation) => (
                <TableRow key={quotation.id} className="hover:bg-gray-50">
                  <TableCell className="text-center">
                    <Checkbox
                      checked={selectedIds.has(quotation.id)}
                      onCheckedChange={(checked) => handleSelectOne(quotation.id, checked as boolean)}
                    />
                  </TableCell>
                  <TableCell className="py-2 text-xs text-gray-700">
                    {new Date(quotation.createdAt).toLocaleDateString('ko-KR')}
                  </TableCell>
                  <TableCell className="py-2 text-xs text-gray-700">
                    {quotation.pol}
                  </TableCell>
                  <TableCell className="py-2 text-xs text-gray-700">
                    {quotation.pod}
                  </TableCell>
                  <TableCell className="py-2 text-xs text-gray-700 font-medium">
                    {quotation.destinationName}
                  </TableCell>
                  <TableCell className="py-2 text-xs text-gray-700">
                    {quotation.carrier || '-'}
                  </TableCell>
                  <TableCell className="py-2 text-xs text-gray-700">
                    {quotation.breakdown?.railAgent || '-'}
                  </TableCell>
                  <TableCell className="py-2 text-xs text-gray-700">
                    {quotation.breakdown?.truckAgent || '-'}
                  </TableCell>
                  <TableCell className="text-right py-2 text-xs text-gray-700">
                    ${quotation.costTotal.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right py-2 text-xs text-gray-700 font-medium">
                    ${quotation.sellingPrice.toLocaleString()}
                  </TableCell>
                  <TableCell className={`text-right py-2 text-xs font-medium ${quotation.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${quotation.profit.toLocaleString()}
                  </TableCell>
                  <TableCell className={`text-right py-2 text-xs font-medium ${quotation.profitRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {quotation.profitRate.toFixed(2)}%
                  </TableCell>
                  <TableCell className="text-center py-2">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleView(quotation)}
                        className="h-7 w-7 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(quotation.id)}
                        className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-600">
            {startIndex + 1}-{Math.min(endIndex, filteredQuotations.length)} / {filteredQuotations.length}
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="h-7 w-7 p-0 border-gray-300"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                // Show first page, last page, current page, and pages around current
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <Button
                      key={page}
                      variant={page === currentPage ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handlePageChange(page)}
                      className={`h-7 w-7 p-0 text-xs ${page === currentPage ? 'bg-blue-600 hover:bg-blue-700' : 'border-gray-300'}`}
                    >
                      {page}
                    </Button>
                  );
                } else if (page === currentPage - 2 || page === currentPage + 2) {
                  return <span key={page} className="px-1 text-xs">...</span>;
                }
                return null;
              })}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="h-7 w-7 p-0 border-gray-300"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* View Dialog */}
      {selectedQuotation && (
        <QuotationViewDialog
          open={viewDialogOpen}
          onOpenChange={setViewDialogOpen}
          quotation={selectedQuotation}
        />
      )}
    </div>
  );
}