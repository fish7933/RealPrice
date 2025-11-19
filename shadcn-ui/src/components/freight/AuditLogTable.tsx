import { useState, useMemo } from 'react';
import { FreightAuditLog } from '@/types/freight';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { History, Plus, Edit, Trash2, Trash, Eye, ChevronLeft, ChevronRight, ShieldAlert, Download, GitCompare } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/contexts/AuthContext';
import { useFreight } from '@/contexts/FreightContext';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { exportAuditLogsToExcel } from '@/utils/auditLogExport';

interface AuditLogTableProps {
  logs: FreightAuditLog[];
  title?: string;
  description?: string;
}

interface GroupedLog {
  version: number;
  agent: string;
  pol?: string;
  action: FreightAuditLog['action'];
  timestamp: string;
  changedByName: string;
  changedByUsername: string;
  logs: FreightAuditLog[];
  entityType: string;
}

const ITEMS_PER_PAGE = 10;

export default function AuditLogTable({ logs, title = '운임 변경 기록', description = '운임 정보의 모든 변경 내역이 자동으로 기록됩니다' }: AuditLogTableProps) {
  const { user } = useAuth();
  const { deleteAuditLog, clearAuditLogs, destinations } = useFreight();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [compareDialogOpen, setCompareDialogOpen] = useState(false);
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [selectedGroupedLog, setSelectedGroupedLog] = useState<GroupedLog | null>(null);
  const [selectedVersions, setSelectedVersions] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);

  const isSuperAdmin = user?.role === 'superadmin';

  const needsGrouping = logs.length > 0 && 
    (logs[0].entityType === 'portBorderFreight' || logs[0].entityType === 'borderDestinationFreight');

  const hasAgentField = logs.length > 0 && logs.some(log => log.entitySnapshot.agent);
  const hasPolField = logs.length > 0 && logs.some(log => log.entitySnapshot.pol);

  const getDestinationName = (destinationId: string | undefined): string => {
    if (!destinationId) return '';
    const destination = destinations.find(d => d.id === destinationId);
    return destination ? destination.name : destinationId;
  };

  const groupedLogs = useMemo(() => {
    if (!needsGrouping) {
      return logs.map(log => ({
        version: log.version || 0,
        agent: log.entitySnapshot.agent || '',
        pol: log.entitySnapshot.pol || undefined,
        action: log.action,
        timestamp: log.timestamp,
        changedByName: log.changedByName,
        changedByUsername: log.changedByUsername,
        logs: [log],
        entityType: log.entityType,
      }));
    }

    const grouped = new Map<string, GroupedLog>();

    logs.forEach(log => {
      const agent = log.entitySnapshot.agent || '';
      const pol = log.entitySnapshot.pol || '';
      const version = log.version || 0;
      const key = `${version}-${agent}-${pol}`;

      if (!grouped.has(key)) {
        grouped.set(key, {
          version,
          agent,
          pol: pol || undefined,
          action: log.action,
          timestamp: log.timestamp,
          changedByName: log.changedByName,
          changedByUsername: log.changedByUsername,
          logs: [log],
          entityType: log.entityType,
        });
      } else {
        grouped.get(key)!.logs.push(log);
      }
    });

    return Array.from(grouped.values()).sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [logs, needsGrouping]);

  const totalPages = Math.ceil(groupedLogs.length / ITEMS_PER_PAGE);
  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return groupedLogs.slice(startIndex, endIndex);
  }, [groupedLogs, currentPage]);

  const getActionBadge = (action: FreightAuditLog['action']) => {
    switch (action) {
      case 'create':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100"><Plus className="h-3 w-3 mr-1" />생성</Badge>;
      case 'update':
        return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100"><Edit className="h-3 w-3 mr-1" />수정</Badge>;
      case 'delete':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100"><Trash2 className="h-3 w-3 mr-1" />삭제</Badge>;
    }
  };

  const formatValue = (value: string | number | boolean | undefined): string => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getFreightItemDescription = (log: FreightAuditLog): string => {
    const snapshot = log.entitySnapshot;
    
    switch (log.entityType) {
      case 'seaFreight':
        return `${snapshot.pol || ''} → ${snapshot.pod || ''} ${snapshot.carrier ? `(${snapshot.carrier})` : ''}`;
      case 'agentSeaFreight':
        return `[${snapshot.agent || ''}] ${snapshot.pol || ''} → ${snapshot.pod || ''} ${snapshot.carrier ? `(${snapshot.carrier})` : ''}`;
      case 'dthc':
        return `[${snapshot.agent || ''}] ${snapshot.pol || ''} → ${snapshot.pod || ''} ${snapshot.carrier ? `(${snapshot.carrier})` : ''}`;
      case 'dpCost':
        return `${snapshot.port || ''}항`;
      case 'combinedFreight':
        return `[${snapshot.agent || ''}] ${snapshot.pod || ''} → ${getDestinationName(snapshot.destinationId as string)}`;
      case 'portBorderFreight':
        return `${snapshot.pod || ''} → 국경`;
      case 'borderDestinationFreight':
        return `국경 → ${getDestinationName(snapshot.destinationId as string)}`;
      case 'weightSurcharge':
        return `[${snapshot.agent || ''}] ${snapshot.minWeight || ''}-${snapshot.maxWeight || ''}kg`;
      default:
        return '';
    }
  };

  const getFieldLabel = (field: string): string => {
    const labels: Record<string, string> = {
      pol: '출발항',
      pod: '도착항',
      rate: '운임',
      carrier: '선사',
      note: '비고',
      agent: '대리점',
      amount: '금액',
      port: '항구',
      destination: '목적지',
      destinationId: '목적지',
      qingdao: '청도',
      tianjin: '천진',
      lianyungang: '연운',
      dandong: '다강',
      minWeight: '최소중량',
      maxWeight: '최대중량',
      surcharge: '할증',
      description: '설명',
      validFrom: '시작일',
      validTo: '종료일',
      localCharge: 'L.LOCAL',
    };
    return labels[field] || field;
  };

  const formatFieldValue = (field: string, value: string | number | boolean | undefined): string => {
    if (field === 'destinationId' && typeof value === 'string') {
      return getDestinationName(value);
    }
    return formatValue(value);
  };

  const handleViewLog = (groupedLog: GroupedLog) => {
    setSelectedGroupedLog(groupedLog);
    setViewDialogOpen(true);
  };

  const handleDeleteLog = (logId: string) => {
    if (!isSuperAdmin) {
      return;
    }
    setSelectedLogId(logId);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteLog = () => {
    if (selectedLogId && isSuperAdmin) {
      deleteAuditLog(selectedLogId);
      setSelectedLogId(null);
    }
    setDeleteDialogOpen(false);
  };

  const handleClearAll = () => {
    if (!isSuperAdmin) {
      return;
    }
    setClearDialogOpen(true);
  };

  const confirmClearAll = () => {
    if (!isSuperAdmin) {
      setClearDialogOpen(false);
      return;
    }
    const entityType = logs.length > 0 ? logs[0].entityType : undefined;
    clearAuditLogs(entityType);
    setClearDialogOpen(false);
  };

  const handleVersionSelect = (versionKey: string, checked: boolean) => {
    const newSelected = new Set(selectedVersions);
    if (checked) {
      if (newSelected.size >= 2) {
        return;
      }
      newSelected.add(versionKey);
    } else {
      newSelected.delete(versionKey);
    }
    setSelectedVersions(newSelected);
  };

  const handleCompareVersions = () => {
    if (selectedVersions.size !== 2) return;
    setCompareDialogOpen(true);
  };

  const getSelectedVersionsForComparison = (): [GroupedLog, GroupedLog] | null => {
    if (selectedVersions.size !== 2) return null;
    const versionKeys = Array.from(selectedVersions);
    const version1 = groupedLogs.find(log => 
      `${log.version}-${log.agent}-${log.pol || ''}` === versionKeys[0]
    );
    const version2 = groupedLogs.find(log => 
      `${log.version}-${log.agent}-${log.pol || ''}` === versionKeys[1]
    );
    if (!version1 || !version2) return null;
    return new Date(version1.timestamp) < new Date(version2.timestamp) 
      ? [version1, version2] 
      : [version2, version1];
  };

  const handleExportToExcel = () => {
    const entityTypeName = logs.length > 0 ? getEntityTypeName(logs[0].entityType) : '운임';
    exportAuditLogsToExcel(groupedLogs, entityTypeName, getDestinationName);
  };

  const getEntityTypeName = (entityType: string): string => {
    const typeNames: Record<string, string> = {
      seaFreight: '해상운임',
      agentSeaFreight: '대리점 해상운임',
      dthc: 'DTHC',
      dpCost: 'DP Cost',
      combinedFreight: '복합운임',
      portBorderFreight: '철도운임',
      borderDestinationFreight: '국경-목적지 운임',
      weightSurcharge: '중량할증',
    };
    return typeNames[entityType] || entityType;
  };

  if (logs.length === 0) {
    return (
      <Card className="mt-6">
        <CardHeader className="p-4">
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4" />
            {title}
          </CardTitle>
          <CardDescription className="text-xs">{description}</CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <div className="text-center text-gray-500 py-6 text-sm">
            변경 기록이 없습니다
          </div>
        </CardContent>
      </Card>
    );
  }

  const selectedVersionsForComparison = getSelectedVersionsForComparison();

  return (
    <>
      <Card className="mt-6">
        <CardHeader className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <History className="h-4 w-4" />
                {title} ({groupedLogs.length}건)
              </CardTitle>
              <CardDescription className="text-xs">{description}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {selectedVersions.size === 2 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCompareVersions}
                  className="h-7 text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-300"
                >
                  <GitCompare className="h-3 w-3 mr-1" />
                  버전 비교
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportToExcel}
                className="h-7 text-xs bg-green-50 hover:bg-green-100 text-green-700 border-green-300"
              >
                <Download className="h-3 w-3 mr-1" />
                Excel
              </Button>
              {isSuperAdmin && logs.length > 0 && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleClearAll}
                  className="h-7 text-xs"
                >
                  <Trash className="h-3 w-3 mr-1" />
                  전체 삭제
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          {!isSuperAdmin && (
            <Alert className="bg-amber-50 border-amber-200 py-2">
              <ShieldAlert className="h-3 w-3 text-amber-600" />
              <AlertDescription className="text-amber-800 text-xs">
                <span className="font-semibold">🔒 버전 기록 보호</span> - 삭제 권한은 슈퍼 관리자만 보유합니다.
              </AlertDescription>
            </Alert>
          )}

          {selectedVersions.size > 0 && (
            <Alert className="bg-purple-50 border-purple-200 py-2">
              <GitCompare className="h-3 w-3 text-purple-600" />
              <AlertDescription className="text-purple-800 text-xs">
                <span className="font-semibold">
                  {selectedVersions.size === 1 ? '1개 버전 선택됨' : '2개 버전 선택됨'}
                </span>
                {' - '}
                {selectedVersions.size === 1 
                  ? '비교할 버전을 하나 더 선택하세요' 
                  : '선택한 버전을 비교하려면 "버전 비교" 버튼을 클릭하세요'}
              </AlertDescription>
            </Alert>
          )}

          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="h-8 w-[40px] text-xs">선택</TableHead>
                  <TableHead className="h-8 text-xs whitespace-nowrap">변경일시</TableHead>
                  {hasAgentField && <TableHead className="h-8 text-xs whitespace-nowrap">대리점</TableHead>}
                  {hasPolField && <TableHead className="h-8 text-xs whitespace-nowrap">POL</TableHead>}
                  <TableHead className="h-8 text-xs whitespace-nowrap">작업</TableHead>
                  <TableHead className="h-8 text-xs whitespace-nowrap">변경자</TableHead>
                  <TableHead className="h-8 text-xs text-right whitespace-nowrap">상세</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLogs.map((groupedLog, index) => {
                  const versionKey = `${groupedLog.version}-${groupedLog.agent}-${groupedLog.pol || ''}`;
                  const isSelected = selectedVersions.has(versionKey);
                  
                  return (
                    <TableRow key={`${groupedLog.version}-${groupedLog.agent}-${groupedLog.pol}-${index}`} className="hover:bg-gray-50">
                      <TableCell className="py-2">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleVersionSelect(versionKey, checked as boolean)}
                          disabled={!isSelected && selectedVersions.size >= 2}
                        />
                      </TableCell>
                      <TableCell className="py-2 text-xs whitespace-nowrap">
                        {formatTimestamp(groupedLog.timestamp)}
                      </TableCell>
                      {hasAgentField && (
                        <TableCell className="py-2 text-xs font-medium whitespace-nowrap">{groupedLog.agent || '-'}</TableCell>
                      )}
                      {hasPolField && (
                        <TableCell className="py-2 text-xs font-medium text-blue-700 whitespace-nowrap">{groupedLog.pol || '-'}</TableCell>
                      )}
                      <TableCell className="py-2">{getActionBadge(groupedLog.action)}</TableCell>
                      <TableCell className="py-2 text-xs whitespace-nowrap">
                        <div className="font-medium">{groupedLog.changedByName}</div>
                        <div className="text-gray-500">@{groupedLog.changedByUsername}</div>
                      </TableCell>
                      <TableCell className="py-2 text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewLog(groupedLog)}
                            className="h-6 px-2 text-xs"
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            보기
                          </Button>
                          {isSuperAdmin && !needsGrouping && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteLog(groupedLog.logs[0].id)}
                              className="h-6 w-6 p-0"
                            >
                              <Trash2 className="h-3 w-3 text-red-600" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-3 border-t text-xs">
              <div className="text-gray-600">
                {groupedLogs.length}개 중 {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, groupedLogs.length)}개
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
        </CardContent>
      </Card>

      {/* View Log Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              변경 상세 정보
            </DialogTitle>
            <DialogDescription>
              운임 변경 기록의 상세 내용을 확인할 수 있습니다
            </DialogDescription>
          </DialogHeader>
          {selectedGroupedLog && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <div className="text-sm text-gray-600 mb-1">변경일시</div>
                  <div className="font-medium">{formatTimestamp(selectedGroupedLog.timestamp)}</div>
                </div>
                {hasAgentField && (
                  <div>
                    <div className="text-sm text-gray-600 mb-1">대리점</div>
                    <div className="font-medium text-base">{selectedGroupedLog.agent || '-'}</div>
                  </div>
                )}
                {hasPolField && selectedGroupedLog.pol && (
                  <div>
                    <div className="text-sm text-gray-600 mb-1">선적포트 (POL)</div>
                    <div className="font-medium text-base text-blue-700">{selectedGroupedLog.pol}</div>
                  </div>
                )}
                <div>
                  <div className="text-sm text-gray-600 mb-1">작업 유형</div>
                  <div>{getActionBadge(selectedGroupedLog.action)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600 mb-1">변경자</div>
                  <div>
                    <div className="font-medium">{selectedGroupedLog.changedByName}</div>
                    <div className="text-sm text-gray-500">@{selectedGroupedLog.changedByUsername}</div>
                  </div>
                </div>
              </div>

              {needsGrouping && selectedGroupedLog.logs.length > 0 && (
                (() => {
                  const firstLog = selectedGroupedLog.logs[0];
                  const validFromChange = firstLog.changes.find(c => c.field === 'validFrom');
                  const validToChange = firstLog.changes.find(c => c.field === 'validTo');
                  
                  if (validFromChange || validToChange) {
                    return (
                      <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                        <div className="text-sm text-purple-700 font-medium mb-3">유효기간</div>
                        <div className="space-y-2">
                          {validFromChange && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-700 w-20">시작일:</span>
                              {selectedGroupedLog.action === 'create' ? (
                                <span className="text-green-600 font-medium">
                                  {formatValue(validFromChange.newValue)}
                                </span>
                              ) : (
                                <>
                                  <span className="text-red-600 line-through">
                                    {formatValue(validFromChange.oldValue)}
                                  </span>
                                  <span className="text-gray-500">→</span>
                                  <span className="text-green-600 font-medium">
                                    {formatValue(validFromChange.newValue)}
                                  </span>
                                </>
                              )}
                            </div>
                          )}
                          {validToChange && (
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-700 w-20">종료일:</span>
                              {selectedGroupedLog.action === 'create' ? (
                                <span className="text-green-600 font-medium">
                                  {formatValue(validToChange.newValue)}
                                </span>
                              ) : (
                                <>
                                  <span className="text-red-600 line-through">
                                    {formatValue(validToChange.oldValue)}
                                  </span>
                                  <span className="text-gray-500">→</span>
                                  <span className="text-green-600 font-medium">
                                    {formatValue(validToChange.newValue)}
                                  </span>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()
              )}

              <div>
                <div className="text-sm font-semibold text-gray-700 mb-3">
                  운임 항목
                </div>
                {selectedGroupedLog.action === 'delete' ? (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    항목이 삭제되었습니다
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedGroupedLog.logs.map((log, logIdx) => {
                      const relevantChanges = needsGrouping 
                        ? log.changes.filter(c => c.field !== 'validFrom' && c.field !== 'validTo' && c.field !== 'version')
                        : log.changes.filter(c => c.field !== 'version');

                      if (relevantChanges.length === 0 && needsGrouping) return null;

                      return (
                        <div key={logIdx} className="p-4 border rounded-lg bg-white">
                          <div className="font-medium text-blue-700 mb-3">
                            {getFreightItemDescription(log)}
                          </div>
                          <div className="space-y-2">
                            {relevantChanges.map((change, idx) => (
                              <div key={idx} className="flex items-start gap-2">
                                <span className="text-sm font-medium text-gray-700 min-w-[80px]">
                                  {getFieldLabel(change.field)}:
                                </span>
                                {selectedGroupedLog.action === 'create' ? (
                                  <span className="text-green-600 font-medium">
                                    {formatFieldValue(change.field, change.newValue)}
                                  </span>
                                ) : (
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-red-600 line-through">
                                      {formatFieldValue(change.field, change.oldValue)}
                                    </span>
                                    <span className="text-gray-500">→</span>
                                    <span className="text-green-600 font-medium">
                                      {formatFieldValue(change.field, change.newValue)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {selectedGroupedLog.logs[0].note && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="text-sm text-yellow-800 font-medium mb-1">메모</div>
                  <div className="text-yellow-900">{selectedGroupedLog.logs[0].note}</div>
                </div>
              )}

              {!needsGrouping && selectedGroupedLog.logs.length === 1 && (
                <div>
                  <div className="text-sm font-semibold text-gray-700 mb-3">전체 스냅샷</div>
                  <div className="p-4 bg-gray-50 border rounded-lg">
                    <pre className="text-xs overflow-x-auto">
                      {JSON.stringify(selectedGroupedLog.logs[0].entitySnapshot, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Version Comparison Dialog */}
      <Dialog open={compareDialogOpen} onOpenChange={setCompareDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitCompare className="h-5 w-5" />
              버전 비교
            </DialogTitle>
            <DialogDescription>
              선택한 두 버전의 차이를 확인할 수 있습니다
            </DialogDescription>
          </DialogHeader>
          {selectedVersionsForComparison && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-sm text-blue-700 font-medium mb-2">이전 버전</div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {getActionBadge(selectedVersionsForComparison[0].action)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatTimestamp(selectedVersionsForComparison[0].timestamp)}
                    </div>
                    <div className="text-sm">
                      {selectedVersionsForComparison[0].changedByName} (@{selectedVersionsForComparison[0].changedByUsername})
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-sm text-green-700 font-medium mb-2">이후 버전</div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {getActionBadge(selectedVersionsForComparison[1].action)}
                    </div>
                    <div className="text-sm text-gray-600">
                      {formatTimestamp(selectedVersionsForComparison[1].timestamp)}
                    </div>
                    <div className="text-sm">
                      {selectedVersionsForComparison[1].changedByName} (@{selectedVersionsForComparison[1].changedByUsername})
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="text-sm font-semibold text-gray-700 mb-3">변경 사항</div>
                <div className="space-y-2">
                  {(() => {
                    const version1Snapshot = selectedVersionsForComparison[0].logs[0].entitySnapshot;
                    const version2Snapshot = selectedVersionsForComparison[1].logs[0].entitySnapshot;
                    
                    const allFields = new Set([
                      ...Object.keys(version1Snapshot),
                      ...Object.keys(version2Snapshot)
                    ]);

                    const relevantFields = Array.from(allFields).filter(
                      field => !['id', 'createdAt', 'updatedAt', 'version'].includes(field)
                    );

                    return relevantFields.map(field => {
                      const value1 = version1Snapshot[field];
                      const value2 = version2Snapshot[field];
                      const hasChanged = JSON.stringify(value1) !== JSON.stringify(value2);

                      return (
                        <div 
                          key={field} 
                          className={`p-3 rounded-lg border ${
                            hasChanged 
                              ? 'bg-yellow-50 border-yellow-200' 
                              : 'bg-gray-50 border-gray-200'
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            <span className="text-sm font-medium text-gray-700 min-w-[100px]">
                              {getFieldLabel(field)}:
                            </span>
                            <div className="flex-1 grid grid-cols-2 gap-4">
                              <div className={hasChanged ? 'text-red-600' : 'text-gray-600'}>
                                {formatFieldValue(field, value1)}
                              </div>
                              <div className={hasChanged ? 'text-green-600 font-medium' : 'text-gray-600'}>
                                {formatFieldValue(field, value2)}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Single Log Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>변경 기록 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              이 변경 기록을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
              <br />
              <span className="text-amber-600 font-semibold mt-2 block">
                ⚠️ 버전 기록은 데이터 추적성을 위한 귀중한 자료입니다.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteLog} className="bg-red-600 hover:bg-red-700">
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear All Logs Dialog */}
      <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>전체 기록 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              이 테이블의 모든 변경 기록({logs.length}건)을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
              <br />
              <span className="text-red-600 font-semibold mt-2 block">
                🚨 경고: 모든 버전 기록이 영구적으로 삭제됩니다. 데이터 추적이 불가능해집니다.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={confirmClearAll} className="bg-red-600 hover:bg-red-700">
              전체 삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}