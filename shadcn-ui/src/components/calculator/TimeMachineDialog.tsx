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
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-gray-100">
        <DialogHeader className="space-y-2 pb-3 border-b-2 border-pink-200">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="relative">
              <div className="absolute inset-0 bg-gray-600 rounded-full blur-md opacity-50 animate-pulse"></div>
              <Clock className="h-6 w-6 text-purple-600 relative" />
              <Sparkles className="h-3 w-3 text-pink-500 absolute -top-1 -right-1 animate-bounce" />
            </div>
            <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent font-bold">
              ✨ 타임머신 ✨
            </span>
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-700">
            🌟 과거 또는 미래의 특정 날짜로 이동해서 그 날짜에 유효한 운임으로 원가를 계산해보세요 🌟
            <span className="block mt-2 text-purple-700 bg-gray-600 px-3 py-2 rounded-xl border-2 border-purple-200 text-xs shadow-sm">
              💡 <strong>모든 날짜</strong>를 선택할 수 있습니다. 선택한 날짜의 <strong>유효기간(validFrom ~ validTo)</strong> 내에 있는 운임으로 계산됩니다.
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 py-3">
          {/* Calendar Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-700 bg-gray-600 px-3 py-2 rounded-xl shadow-sm border-2 border-pink-200">
              <CalendarIcon className="h-4 w-4 text-pink-500" />
              📅 날짜 선택
            </div>
            <div className="relative overflow-hidden rounded-2xl bg-white shadow-xl border-2 border-pink-200">
              {/* Decorative elements */}
              <div className="absolute top-2 left-2 z-10">
                <Heart className="h-4 w-4 text-pink-300 animate-pulse" />
              </div>
              <div className="absolute top-2 right-2 z-10">
                <Star className="h-4 w-4 text-yellow-300 animate-pulse" />
              </div>
              <div className="absolute bottom-2 left-2 z-10">
                <Sparkles className="h-4 w-4 text-purple-300 animate-pulse" />
              </div>
              <div className="absolute bottom-2 right-2 z-10">
                <Heart className="h-4 w-4 text-blue-300 animate-pulse" />
              </div>
              
              <div className="absolute inset-0 bg-gradient-to-br from-pink-50/30 via-purple-50/30 to-blue-50/30 pointer-events-none"></div>
              
              {/* Custom Calendar */}
              <div className="relative p-4">
                {/* Month Navigation */}
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={previousMonth}
                    className="h-8 w-8 bg-gray-600 hover:bg-gray-200 rounded-xl transition-all duration-200 border-2 border-pink-200 shadow-sm hover:shadow-md transform hover:scale-105 flex items-center justify-center"
                  >
                    <ChevronLeft className="h-4 w-4 text-purple-600" />
                  </button>
                  <h3 className="text-base font-bold bg-gray-600 bg-clip-text text-transparent">
                    {monthName}
                  </h3>
                  <button
                    onClick={nextMonth}
                    className="h-8 w-8 bg-gray-600 hover:bg-gray-200 rounded-xl transition-all duration-200 border-2 border-pink-200 shadow-sm hover:shadow-md transform hover:scale-105 flex items-center justify-center"
                  >
                    <ChevronRight className="h-4 w-4 text-purple-600" />
                  </button>
                </div>

                {/* Calendar Grid */}
                <div className="w-full">
                  {/* Week Days Header */}
                  <div className="grid grid-cols-7 gap-1 mb-2">
                    {weekDays.map((day, index) => (
                      <div
                        key={index}
                        className="h-10 flex items-center justify-center text-purple-600 font-bold text-xs"
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
                            h-10 w-full rounded-xl font-semibold text-sm
                            flex items-center justify-center
                            transition-all duration-200
                            ${isSelected
                              ? 'bg-gray-100 text-gray-900 shadow-lg scale-105'
                              : isTodayDate
                              ? 'bg-gray-600 text-orange-900 border-2 border-orange-400 shadow-md'
                              : hasChanges
                              ? 'bg-gray-100 text-gray-900 hover:from-pink-500 hover:via-purple-500 hover:to-blue-500 shadow-md hover:scale-110'
                              : isFutureDate
                              ? 'text-purple-600 bg-gray-600 hover:bg-gray-200 hover:scale-105 border border-purple-200'
                              : 'text-gray-700 bg-blue-50 hover:bg-blue-100 hover:scale-105 border border-blue-200'
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

              <div className="px-4 pb-4 space-y-2 text-xs">
                <div className="flex items-center gap-2 p-2 bg-gradient-to-r from-pink-50 via-purple-50 to-blue-50 rounded-xl border-2 border-pink-200 shadow-sm">
                  <div className="w-5 h-5 rounded-xl bg-gray-100 shadow-md flex-shrink-0"></div>
                  <span className="text-gray-700 font-semibold">✨ 운임 변경이 있었던 날짜 (참고용)</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-gray-200 rounded-xl border-2 border-blue-200 shadow-sm">
                  <div className="w-5 h-5 rounded-xl bg-blue-100 border border-blue-200 flex-shrink-0"></div>
                  <span className="text-gray-700 font-semibold">📅 선택 가능한 과거 날짜</span>
                </div>
                <div className="flex items-center gap-2 p-2 bg-gray-200 rounded-xl border-2 border-purple-200 shadow-sm">
                  <div className="w-5 h-5 rounded-xl bg-gray-600 border border-purple-200 flex-shrink-0"></div>
                  <span className="text-gray-700 font-semibold">🚀 선택 가능한 미래 날짜</span>
                </div>
              </div>
            </div>

            {selectedDate && (
              <div className="relative overflow-hidden rounded-2xl bg-gray-100 p-4 shadow-xl text-gray-900 border-2 border-pink-300">
                <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                <div className="absolute top-2 right-2">
                  <Sparkles className="h-5 w-5 text-gray-900/80 animate-spin" style={{ animationDuration: '3s' }} />
                </div>
                <div className="relative space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-gray-200/80 rounded-xl backdrop-blur-sm shadow-lg">
                      <CalendarIcon className="h-4 w-4" />
                    </div>
                    <span className="font-bold text-base">💫 선택된 날짜</span>
                  </div>
                  <p className="text-xl font-bold drop-shadow-lg">
                    {selectedDate.toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      weekday: 'long',
                    })}
                  </p>
                  <p className="text-xs text-gray-600 flex items-center gap-2 font-medium">
                    <Sparkles className="h-3 w-3 animate-pulse" />
                    이 날짜에 유효한 운임(validFrom ~ validTo)으로 계산합니다 ✨
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Changes Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-700 bg-gray-600 px-3 py-2 rounded-xl shadow-sm border-2 border-purple-200">
              <TrendingUp className="h-4 w-4 text-purple-500" />
              📊 {selectedDate ? '선택된 날짜의 운임 변경 내역' : '날짜를 선택하세요'}
            </div>
            
            {selectedDate ? (
              dateChanges.length > 0 ? (
                <div className="rounded-2xl overflow-hidden bg-white shadow-xl border-2 border-purple-200">
                  <div className="max-h-[350px] overflow-y-auto">
                    <Table>
                      <TableHeader className="bg-gray-600 sticky top-0">
                        <TableRow className="border-b-2 border-purple-200">
                          <TableHead className="font-bold text-purple-700 text-xs py-2">⏰ 시간</TableHead>
                          <TableHead className="font-bold text-purple-700 text-xs py-2">📦 운임 종류</TableHead>
                          <TableHead className="font-bold text-purple-700 text-xs py-2">⚡ 작업</TableHead>
                          <TableHead className="font-bold text-purple-700 text-xs py-2">👤 변경자</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dateChanges.map((log, index) => {
                          const action = getActionLabel(log.action);
                          return (
                            <TableRow 
                              key={log.id}
                              className={`hover:bg-gray-50/50 transition-colors ${
                                index % 2 === 0 ? 'bg-white' : 'bg-purple-50/30'
                              }`}
                            >
                              <TableCell className="font-mono text-xs font-semibold text-gray-600 py-2">
                                {formatTime(log.timestamp)}
                              </TableCell>
                              <TableCell className="py-2">
                                <span className="text-xs font-semibold text-gray-800">
                                  {getEntityTypeLabel(log.entityType)}
                                </span>
                              </TableCell>
                              <TableCell className="py-2">
                                <Badge className={`${action.color} font-semibold shadow-sm text-xs rounded-lg`}>
                                  {action.label}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs font-medium text-gray-700 py-2">
                                {log.username}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="p-3 bg-gray-600 border-t-2 border-purple-200 text-xs font-semibold text-gray-700">
                    ✨ 총 <span className="text-purple-600 font-bold">{dateChanges.length}</span>건의 변경 사항
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl bg-white shadow-xl border-2 border-gray-200 p-8 text-center">
                  <div className="inline-flex p-3 bg-gray-600 rounded-full mb-3 shadow-lg">
                    <Clock className="h-8 w-8 text-purple-600" />
                  </div>
                  <p className="text-gray-700 font-bold text-base mb-1">📅 이 날짜에는 운임 변경 기록이 없습니다</p>
                  <p className="text-xs text-gray-800 font-medium">하지만 이 날짜에 유효한 운임으로 계산할 수 있습니다 ✨</p>
                </div>
              )
            ) : (
              <div className="rounded-2xl bg-white shadow-xl border-2 border-gray-200 p-8 text-center">
                <div className="inline-flex p-3 bg-gray-100 rounded-full mb-3 shadow-lg">
                  <CalendarIcon className="h-8 w-8 text-purple-600" />
                </div>
                <p className="text-gray-700 font-bold text-base mb-1">👈 왼쪽 달력에서 날짜를 선택하세요</p>
                <p className="text-xs text-gray-800 font-medium">해당 날짜의 운임 변경 내역을 확인할 수 있습니다 📊</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center pt-3 border-t-2 border-pink-200 bg-gradient-to-r from-pink-50/50 to-purple-50/50 backdrop-blur-sm rounded-xl px-3 py-2 shadow-sm">
          <div className="text-xs font-semibold text-gray-700">
            {availableDates.length > 0 && (
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-600 rounded-full animate-pulse shadow-lg"></div>
                ✨ 총 <span className="text-purple-600 font-bold">{availableDates.length}</span>일의 운임 변경 기록
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {currentDate && (
              <Button 
                variant="outline" 
                onClick={handleClearDate}
                className="border-2 border-pink-300 hover:border-pink-400 hover:bg-gray-50 font-semibold transition-all text-xs h-8 rounded-xl shadow-sm hover:shadow-md"
              >
                🔄 현재 운임으로 돌아가기
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 font-semibold transition-all text-xs h-8 rounded-xl shadow-sm hover:shadow-md"
            >
              ❌ 취소
            </Button>
            <Button 
              onClick={handleConfirm} 
              disabled={!selectedDate}
              className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 hover:from-pink-600 hover:via-purple-600 hover:to-blue-600 text-gray-900 font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-xs h-8 rounded-xl"
            >
              <Clock className="h-3 w-3 mr-1" />
              ✨ 이 날짜로 계산하기
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}