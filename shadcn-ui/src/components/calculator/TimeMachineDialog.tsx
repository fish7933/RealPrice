import { useState, useEffect } from 'react';
import { useFreight } from '@/contexts/FreightContext';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
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
import { Clock, Calendar as CalendarIcon, TrendingUp, AlertCircle, Sparkles } from 'lucide-react';
import { ko } from 'date-fns/locale';

interface TimeMachineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectDate: (date: string) => void;
  currentDate?: string;
}

export default function TimeMachineDialog({ open, onOpenChange, onSelectDate, currentDate }: TimeMachineDialogProps) {
  const { getAvailableHistoricalDates, auditLogs } = useFreight();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    currentDate ? new Date(currentDate + 'T00:00:00') : undefined
  );
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [dateChanges, setDateChanges] = useState<typeof auditLogs>([]);

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
      
      const changes = auditLogs.filter(log => {
        const logDate = log.timestamp.split('T')[0];
        return logDate === dateStr;
      });
      setDateChanges(changes);
    } else {
      setDateChanges([]);
    }
  }, [selectedDate, auditLogs]);

  const handleDateSelect = (date: Date | undefined) => {
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

  const isDateAvailable = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    return availableDates.includes(dateStr);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
        <DialogHeader className="space-y-3 pb-4 border-b border-blue-200">
          <DialogTitle className="flex items-center gap-3 text-2xl">
            <div className="relative">
              <Clock className="h-7 w-7 text-blue-600" />
              <Sparkles className="h-4 w-4 text-purple-500 absolute -top-1 -right-1 animate-pulse" />
            </div>
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-bold">
              타임머신
            </span>
          </DialogTitle>
          <DialogDescription className="text-base text-gray-700">
            과거의 운임 데이터로 시간을 되돌려 원가를 계산해보세요
            {availableDates.length === 0 && (
              <span className="flex items-center gap-2 mt-3 text-amber-700 bg-amber-50 px-4 py-2 rounded-lg border border-amber-200">
                <AlertCircle className="h-4 w-4" />
                아직 운임 변경 기록이 없습니다. 운임을 수정하면 자동으로 기록됩니다.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-4">
          {/* Calendar Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-gray-700 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
              <CalendarIcon className="h-5 w-5 text-blue-600" />
              날짜 선택
            </div>
            <div className="relative overflow-hidden rounded-xl bg-white shadow-lg border border-gray-200">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/50 pointer-events-none"></div>
              <div className="relative p-6">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  locale={ko}
                  disabled={(date) => {
                    const today = new Date();
                    today.setHours(23, 59, 59, 999);
                    return date > today || !isDateAvailable(date);
                  }}
                  modifiers={{
                    available: (date) => isDateAvailable(date),
                  }}
                  modifiersClassNames={{
                    available: 'bg-gradient-to-br from-blue-500 to-purple-500 text-white font-bold hover:from-blue-600 hover:to-purple-600 rounded-lg shadow-md transform hover:scale-105 transition-all',
                  }}
                  className="rounded-lg"
                  classNames={{
                    months: "space-y-4",
                    month: "space-y-4",
                    caption: "flex justify-center pt-1 relative items-center text-lg font-bold text-gray-800",
                    caption_label: "text-lg font-bold",
                    nav: "space-x-1 flex items-center",
                    nav_button: "h-9 w-9 bg-white hover:bg-blue-100 rounded-lg transition-colors border border-gray-200",
                    table: "w-full border-collapse space-y-1",
                    head_row: "flex",
                    head_cell: "text-gray-600 rounded-md w-12 font-semibold text-sm",
                    row: "flex w-full mt-2",
                    cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-transparent",
                    day: "h-12 w-12 p-0 font-medium rounded-lg hover:bg-blue-100 transition-all aria-selected:opacity-100",
                    day_selected: "bg-gradient-to-br from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 focus:from-blue-600 focus:to-purple-600",
                    day_today: "bg-blue-50 text-blue-900 font-bold border-2 border-blue-400",
                    day_outside: "text-gray-400 opacity-50",
                    day_disabled: "text-gray-300 opacity-30 cursor-not-allowed",
                    day_hidden: "invisible",
                  }}
                />
                <div className="mt-6 space-y-3 text-sm">
                  <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 shadow-md"></div>
                    <span className="text-gray-700 font-medium">운임 변경이 있었던 날짜</span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="w-6 h-6 rounded-lg bg-gray-200"></div>
                    <span className="text-gray-600">변경 기록이 없는 날짜</span>
                  </div>
                </div>
              </div>
            </div>

            {selectedDate && (
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 p-6 shadow-lg text-white">
                <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                <div className="relative space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                      <CalendarIcon className="h-5 w-5" />
                    </div>
                    <span className="font-bold text-lg">선택된 날짜</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {selectedDate.toLocaleDateString('ko-KR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      weekday: 'long',
                    })}
                  </p>
                  <p className="text-sm text-blue-100 flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    이 날짜의 운임 데이터로 원가를 계산합니다
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Changes Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-gray-700 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              {selectedDate ? '선택된 날짜의 운임 변경 내역' : '날짜를 선택하세요'}
            </div>
            
            {selectedDate ? (
              dateChanges.length > 0 ? (
                <div className="rounded-xl overflow-hidden bg-white shadow-lg border border-gray-200">
                  <div className="max-h-[450px] overflow-y-auto">
                    <Table>
                      <TableHeader className="bg-gradient-to-r from-blue-50 to-purple-50 sticky top-0">
                        <TableRow className="border-b-2 border-blue-200">
                          <TableHead className="font-bold text-gray-700">시간</TableHead>
                          <TableHead className="font-bold text-gray-700">운임 종류</TableHead>
                          <TableHead className="font-bold text-gray-700">작업</TableHead>
                          <TableHead className="font-bold text-gray-700">변경자</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dateChanges.map((log, index) => {
                          const action = getActionLabel(log.action);
                          return (
                            <TableRow 
                              key={log.id}
                              className={`hover:bg-blue-50/50 transition-colors ${
                                index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                              }`}
                            >
                              <TableCell className="font-mono text-xs font-semibold text-gray-600">
                                {formatTime(log.timestamp)}
                              </TableCell>
                              <TableCell>
                                <span className="text-sm font-semibold text-gray-800">
                                  {getEntityTypeLabel(log.entityType)}
                                </span>
                              </TableCell>
                              <TableCell>
                                <Badge className={`${action.color} font-semibold shadow-sm`}>
                                  {action.label}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-sm font-medium text-gray-700">
                                {log.changedByName}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-t-2 border-blue-200 text-sm font-semibold text-gray-700">
                    총 <span className="text-blue-600">{dateChanges.length}</span>건의 변경 사항
                  </div>
                </div>
              ) : (
                <div className="rounded-xl bg-white shadow-lg border border-gray-200 p-12 text-center">
                  <div className="inline-flex p-4 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full mb-4">
                    <Clock className="h-12 w-12 text-blue-600" />
                  </div>
                  <p className="text-gray-700 font-semibold text-lg mb-2">이 날짜에는 운임 변경 기록이 없습니다</p>
                  <p className="text-sm text-gray-500">다른 날짜를 선택해보세요</p>
                </div>
              )
            ) : (
              <div className="rounded-xl bg-white shadow-lg border border-gray-200 p-12 text-center">
                <div className="inline-flex p-4 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full mb-4">
                  <CalendarIcon className="h-12 w-12 text-purple-600" />
                </div>
                <p className="text-gray-700 font-semibold text-lg mb-2">왼쪽 달력에서 날짜를 선택하세요</p>
                <p className="text-sm text-gray-500">해당 날짜의 운임 변경 내역을 확인할 수 있습니다</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center pt-4 border-t-2 border-blue-200 bg-white/50 backdrop-blur-sm rounded-lg px-4 py-3">
          <div className="text-sm font-semibold text-gray-700">
            {availableDates.length > 0 && (
              <span className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                총 <span className="text-blue-600 font-bold">{availableDates.length}</span>일의 운임 변경 기록
              </span>
            )}
          </div>
          <div className="flex gap-3">
            {currentDate && (
              <Button 
                variant="outline" 
                onClick={handleClearDate}
                className="border-2 border-gray-300 hover:border-blue-400 hover:bg-blue-50 font-semibold transition-all"
              >
                현재 운임으로 돌아가기
              </Button>
            )}
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 font-semibold transition-all"
            >
              취소
            </Button>
            <Button 
              onClick={handleConfirm} 
              disabled={!selectedDate}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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