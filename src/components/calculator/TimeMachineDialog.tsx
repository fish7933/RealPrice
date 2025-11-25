import { useState, useEffect } from 'react';
import { useFreight } from '@/contexts/FreightContext';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Clock, Calendar as CalendarIcon, TrendingUp, AlertCircle, Sparkles, Heart, Star, ChevronLeft, ChevronRight } from 'lucide-react';

interface TimeMachineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectDate: (date: string) => void;
  currentDate?: string;
}

export default function TimeMachineDialog({ open, onOpenChange, onSelectDate, currentDate }: TimeMachineDialogProps) {
  const { getAvailableHistoricalDates, freightAuditLogs } = useFreight();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    currentDate ? new Date(currentDate + 'T00:00:00') : undefined
  );
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [dateChanges, setDateChanges] = useState<typeof freightAuditLogs>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    const dates = getAvailableHistoricalDates();
    setAvailableDates(dates);
  }, [getAvailableHistoricalDates]);

  useEffect(() => {
    if (selectedDate) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      const changes = freightAuditLogs.filter(log => {
        const logDate = log.timestamp.split('T')[0];
        return logDate === dateStr;
      });
      setDateChanges(changes);
    } else {
      setDateChanges([]);
    }
  }, [selectedDate, freightAuditLogs]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const handleConfirm = () => {
    if (selectedDate) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      onSelectDate(dateStr);
      onOpenChange(false);
    }
  };

  const handleClearDate = () => {
    setSelectedDate(undefined);
    onSelectDate('');
    onOpenChange(false);
  };

  const getEntityTypeLabel = (type: string): string => {
    const labels: Record<string, string> = {
      seaFreight: '해상운임',
      agentSeaFreight: '대리점별 해상운임',
      dthc: 'D/O(DTHC)',
      dpCost: 'DP 비용',
      combinedFreight: '통합운임',
      portBorderFreight: '철도운임',
      borderDestinationFreight: '트럭운임',
      weightSurcharge: '중량할증',
    };
    return labels[type] || type;
  };

  const getActionLabel = (action: string): { label: string; color: string } => {
    const actions: Record<string, { label: string; color: string }> = {
      create: { label: '생성', color: 'bg-green-100 text-green-700' },
      update: { label: '수정', color: 'bg-blue-100 text-blue-700' },
      delete: { label: '삭제', color: 'bg-red-100 text-red-700' },
    };
    return actions[action] || { label: action, color: 'bg-gray-100 text-gray-700' };
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const hasChangesOnDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    return availableDates.includes(dateStr);
  };

  const isSameDay = (date1: Date, date2: Date) => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  };

  const isToday = (date: Date) => {
    return isSameDay(date, new Date());
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();
    
    const days: (Date | null)[] = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-gray-50 to-gray-100">
        <DialogHeader className="space-y-3 pb-4 border-b-2 border-gray-300">
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className="relative">
              <div className="absolute inset-0 bg-blue-400 rounded-full blur-md opacity-30"></div>
              <Clock className="h-7 w-7 text-blue-600 relative" />
            </div>
            <span className="text-gray-900 font-bold">
              타임머신
            </span>
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-700">
            과거 또는 미래의 특정 날짜로 이동해서 그 날짜에 유효한 운임으로 원가를 계산해보세요
            <span className="block mt-2 text-gray-800 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200 text-xs font-medium">
              💡 <strong>모든 날짜</strong>를 선택할 수 있습니다. 선택한 날짜의 <strong>유효기간(validFrom ~ validTo)</strong> 내에 있는 운임으로 계산됩니다.
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-4">
          {/* Calendar Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-gray-900 bg-gray-200 px-4 py-2 rounded-lg shadow-sm border border-gray-300">
              <CalendarIcon className="h-5 w-5 text-blue-600" />
              날짜 선택
            </div>
            <div className="relative overflow-hidden rounded-xl bg-white shadow-lg border border-gray-300">
              
              {/* Custom Calendar */}
              <div className="relative p-5">
                {/* Month Navigation */}
                <div className="flex items-center justify-between mb-5">
                  <button
                    onClick={previousMonth}
                    className="h-9 w-9 bg-gray-200 hover:bg-gray-300 rounded-lg transition-all duration-200 border border-gray-300 shadow-sm hover:shadow-md flex items-center justify-center"
                  >
                    <ChevronLeft className="h-5 w-5 text-gray-700" />
                  </button>
                  <h3 className="text-lg font-bold text-gray-900">
                    {monthName}
                  </h3>
                  <button
                    onClick={nextMonth}
                    className="h-9 w-9 bg-gray-200 hover:bg-gray-300 rounded-lg transition-all duration-200 border border-gray-300 shadow-sm hover:shadow-md flex items-center justify-center"
                  >
                    <ChevronRight className="h-5 w-5 text-gray-700" />
                  </button>
                </div>

                {/* Calendar Grid */}
                <div className="w-full">
                  {/* Week Days Header */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {weekDays.map((day, index) => (
                      <div
                        key={index}
                        className="h-10 flex items-center justify-center text-gray-700 font-bold text-sm"
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Days Grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {days.map((day, index) => {
                      if (!day) {
                        return <div key={index} className="h-10 w-full" />;
                      }

                      const today = new Date();
                      const isFutureDate = day > today;
                      const isSelected = selectedDate && isSameDay(day, selectedDate);
                      const isTodayDate = isToday(day);
                      const hasChanges = hasChangesOnDate(day);

                      return (
                        <button
                          key={index}
                          onClick={() => handleDateSelect(day)}
                          className={`
                            h-10 w-full rounded-lg font-semibold text-sm
                            flex items-center justify-center
                            transition-all duration-200
                            ${isSelected
                              ? 'bg-blue-600 text-white shadow-lg scale-105 border-2 border-blue-700'
                              : isTodayDate
                              ? 'bg-orange-100 text-orange-900 border-2 border-orange-400 shadow-md font-bold'
                              : hasChanges
                              ? 'bg-blue-100 text-blue-900 hover:bg-blue-200 shadow-sm hover:scale-105 border border-blue-300'
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

              <div className="px-5 pb-5 space-y-2 text-xs">
                <div className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="w-5 h-5 rounded-lg bg-blue-100 border border-blue-300 shadow-sm flex-shrink-0"></div>
                  <span className="text-gray-800 font-semibold">운임 변경이 있었던 날짜 (참고용)</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="w-5 h-5 rounded-lg bg-gray-50 border border-gray-200 flex-shrink-0"></div>
                  <span className="text-gray-800 font-semibold">선택 가능한 과거 날짜</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="w-5 h-5 rounded-lg bg-gray-100 border border-gray-300 flex-shrink-0"></div>
                  <span className="text-gray-800 font-semibold">선택 가능한 미래 날짜</span>
                </div>
              </div>
            </div>

            {selectedDate && (
              <div className="relative overflow-hidden rounded-xl bg-blue-50 p-4 shadow-lg text-gray-900 border-2 border-blue-300">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-100 rounded-lg shadow-sm">
                      <CalendarIcon className="h-5 w-5 text-blue-600" />
                    </div>
                    <span className="font-bold text-base text-gray-900">선택된 날짜</span>
                  </div>
                  <p className="text-xl font-bold text-gray-900">
                    {selectedDate.toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      weekday: 'long',
                    })}
                  </p>
                  <p className="text-xs text-gray-700 flex items-center gap-2 font-medium">
                    이 날짜에 유효한 운임(validFrom ~ validTo)으로 계산합니다
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Changes Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-gray-900 bg-gray-200 px-4 py-2 rounded-lg shadow-sm border border-gray-300">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              {selectedDate ? '선택된 날짜의 운임 변경 내역' : '날짜를 선택하세요'}
            </div>
            
            {selectedDate ? (
              dateChanges.length > 0 ? (
                <div className="rounded-xl overflow-hidden bg-white shadow-lg border border-gray-300">
                  <div className="max-h-[350px] overflow-y-auto">
                    <Table>
                      <TableHeader className="bg-gray-200 sticky top-0">
                        <TableRow className="border-b-2 border-gray-300">
                          <TableHead className="font-bold text-gray-900 text-sm py-3">시간</TableHead>
                          <TableHead className="font-bold text-gray-900 text-sm py-3">운임 종류</TableHead>
                          <TableHead className="font-bold text-gray-900 text-sm py-3">작업</TableHead>
                          <TableHead className="font-bold text-gray-900 text-sm py-3">변경자</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dateChanges.map((log, index) => {
                          const action = getActionLabel(log.action);
                          return (
                            <TableRow 
                              key={log.id}
                              className={`hover:bg-blue-50 transition-colors ${
                                index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                              }`}
                            >
                              <TableCell className="font-mono text-sm font-semibold text-gray-700 py-3">
                                {formatTime(log.timestamp)}
                              </TableCell>
                              <TableCell className="py-3">
                                <span className="text-sm font-semibold text-gray-900">
                                  {getEntityTypeLabel(log.entityType)}
                                </span>
                              </TableCell>
                              <TableCell className="py-3">
                                <Badge className={`${action.color} font-semibold shadow-sm text-xs rounded-lg`}>
                                  {action.label}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm font-medium text-gray-800 py-3">
                                {log.username}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="p-3 bg-gray-100 border-t-2 border-gray-300 text-sm font-semibold text-gray-800">
                    총 <span className="text-blue-600 font-bold">{dateChanges.length}</span>건의 변경 사항
                  </div>
                </div>
              ) : (
                <div className="rounded-xl bg-white shadow-lg border border-gray-300 p-8 text-center">
                  <div className="inline-flex p-3 bg-gray-100 rounded-full mb-3 shadow-sm">
                    <Clock className="h-8 w-8 text-blue-600" />
                  </div>
                  <p className="text-gray-900 font-bold text-base mb-1">이 날짜에는 운임 변경 기록이 없습니다</p>
                  <p className="text-sm text-gray-700 font-medium">하지만 이 날짜에 유효한 운임으로 계산할 수 있습니다</p>
                </div>
              )
            ) : (
              <div className="rounded-xl bg-white shadow-lg border border-gray-300 p-8 text-center">
                <div className="inline-flex p-3 bg-gray-100 rounded-full mb-3 shadow-sm">
                  <CalendarIcon className="h-8 w-8 text-blue-600" />
                </div>
                <p className="text-gray-900 font-bold text-base mb-1">왼쪽 달력에서 날짜를 선택하세요</p>
                <p className="text-sm text-gray-700 font-medium">해당 날짜의 운임 변경 내역을 확인할 수 있습니다</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t-2 border-gray-300 bg-gray-100 rounded-lg px-4 py-3 shadow-sm">
          <div className="text-sm font-semibold text-gray-800">
            {availableDates.length > 0 && (
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full shadow-sm"></div>
                총 <span className="text-blue-600 font-bold">{availableDates.length}</span>일의 운임 변경 기록
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {currentDate && (
              <Button 
                variant="outline" 
                onClick={handleClearDate}
                className="border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-100 text-gray-900 font-semibold transition-all text-sm h-9 rounded-lg shadow-sm hover:shadow-md"
              >
                현재 운임으로 돌아가기
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-100 text-gray-900 font-semibold transition-all text-sm h-9 rounded-lg shadow-sm hover:shadow-md"
            >
              취소
            </Button>
            <Button 
              onClick={handleConfirm} 
              disabled={!selectedDate}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm h-9 rounded-lg"
            >
              <Clock className="h-4 w-4 mr-2" />
              이 날짜로 계산하기
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}