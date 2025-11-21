import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Ship, Train, Truck, Weight, Package, Star, FileText, DollarSign, 
  Info, ArrowUp, ArrowDown, Merge, TrendingDown, AlertTriangle, 
  FileSpreadsheet, Sparkles, Trophy, Zap, Plus, Hash, Calculator,
  AlertCircle, Database, MapPin
} from 'lucide-react';
import { CostCalculationResult, AgentCostBreakdown, CostCalculationInput } from '@/types/freight';
import { ExcludedCosts, CellExclusions, SortConfig } from './types';
import { DebugLLocal } from './DebugLLocal';

interface CostResultTableProps {
  result: CostCalculationResult | null;
  allFreightsResult: CostCalculationResult | null;
  input: CostCalculationInput;
  activeTab: 'filtered' | 'all';
  setActiveTab: (tab: 'filtered' | 'all') => void;
  excludedCosts: ExcludedCosts;
  cellExclusions: CellExclusions;
  sortConfig: SortConfig;
  onToggleCostExclusion: (costType: string) => void;
  onToggleCellExclusion: (agentIndex: number, costType: string) => void;
  onSort: (key: 'agent' | 'rail' | 'truck' | 'total') => void;
  onCreateQuotation: (breakdown: AgentCostBreakdown, mergedExcludedCosts: ExcludedCosts) => void;
  getDestinationName: (destinationId: string) => string;
}

export default function CostResultTable({
  result,
  allFreightsResult,
  input,
  activeTab,
  setActiveTab,
  excludedCosts,
  cellExclusions,
  sortConfig,
  onToggleCostExclusion,
  onToggleCellExclusion,
  onSort,
  onCreateQuotation,
  getDestinationName,
}: CostResultTableProps) {
  const isCellExcluded = (agentIndex: number, costType: string): boolean => {
    return cellExclusions[agentIndex]?.[costType] || false;
  };

  const calculateAdjustedTotal = (breakdown: AgentCostBreakdown, agentIndex: number) => {
    let total = 0;
    
    const isSeaFreightExcluded = excludedCosts.seaFreight || isCellExcluded(agentIndex, 'seaFreight');
    const isLocalChargeExcluded = excludedCosts.localCharge || isCellExcluded(agentIndex, 'localCharge');
    const isDthcExcluded = excludedCosts.dthc || isCellExcluded(agentIndex, 'dthc');
    const isPortBorderExcluded = excludedCosts.portBorder || isCellExcluded(agentIndex, 'portBorder');
    const isBorderDestinationExcluded = excludedCosts.borderDestination || isCellExcluded(agentIndex, 'borderDestination');
    const isCombinedFreightExcluded = excludedCosts.combinedFreight || isCellExcluded(agentIndex, 'combinedFreight');
    const isWeightSurchargeExcluded = excludedCosts.weightSurcharge || isCellExcluded(agentIndex, 'weightSurcharge');
    const isDpExcluded = excludedCosts.dp || isCellExcluded(agentIndex, 'dp');
    const isDomesticTransportExcluded = excludedCosts.domesticTransport || isCellExcluded(agentIndex, 'domesticTransport');
    
    if (!isSeaFreightExcluded) total += breakdown.seaFreight;
    if (!isLocalChargeExcluded && breakdown.localCharge && !breakdown.isAgentSpecificSeaFreight) {
      total += breakdown.localCharge;
    }
    if (!isDthcExcluded) total += breakdown.dthc;
    
    if (breakdown.isCombinedFreight) {
      if (!isCombinedFreightExcluded) total += breakdown.combinedFreight;
    } else {
      if (!isPortBorderExcluded) total += breakdown.portBorder;
      if (!isBorderDestinationExcluded) total += breakdown.borderDestination;
    }
    
    if (!isWeightSurchargeExcluded) total += breakdown.weightSurcharge;
    if (!isDpExcluded) total += breakdown.dp;
    if (!isDomesticTransportExcluded) total += breakdown.domesticTransport;
    
    if (breakdown.otherCosts && Array.isArray(breakdown.otherCosts)) {
      breakdown.otherCosts.forEach((item, index) => {
        const isOtherExcluded = excludedCosts[`other_${index}`] || isCellExcluded(agentIndex, `other_${index}`);
        if (!isOtherExcluded) {
          total += item.amount;
        }
      });
    }
    
    if (breakdown.isAgentSpecificSeaFreight && !isLocalChargeExcluded && breakdown.llocal) {
      total += breakdown.llocal;
    }
    
    return total;
  };

  const getSortedBreakdown = (breakdown: AgentCostBreakdown[]) => {
    const sortedBreakdown = [...breakdown];
    
    if (sortConfig.key === 'agent') {
      sortedBreakdown.sort((a, b) => {
        const comparison = a.agent.localeCompare(b.agent, 'ko');
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    } else if (sortConfig.key === 'rail') {
      sortedBreakdown.sort((a, b) => {
        const comparison = a.railAgent.localeCompare(b.railAgent, 'ko');
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    } else if (sortConfig.key === 'truck') {
      sortedBreakdown.sort((a, b) => {
        const comparison = a.truckAgent.localeCompare(b.truckAgent, 'ko');
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    } else if (sortConfig.key === 'total') {
      sortedBreakdown.sort((a, b) => {
        const indexA = breakdown.indexOf(a);
        const indexB = breakdown.indexOf(b);
        const totalA = calculateAdjustedTotal(a, indexA);
        const totalB = calculateAdjustedTotal(b, indexB);
        const comparison = totalA - totalB;
        return sortConfig.direction === 'asc' ? comparison : -comparison;
      });
    }
    
    return sortedBreakdown;
  };

  const getLowestCostAgent = (breakdown: AgentCostBreakdown[]) => {
    if (breakdown.length === 0) return { agent: '', cost: 0, index: -1, code: '' };
    
    let lowestIndex = 0;
    let lowestCost = calculateAdjustedTotal(breakdown[0], 0);

    breakdown.forEach((b, index) => {
      const adjustedTotal = calculateAdjustedTotal(b, index);
      if (adjustedTotal < lowestCost) {
        lowestCost = adjustedTotal;
        lowestIndex = index;
      }
    });

    const lowestBreakdown = breakdown[lowestIndex];
    const railCode = lowestBreakdown.railAgentCode || lowestBreakdown.railAgent.substring(0, 2).toUpperCase();
    const truckCode = lowestBreakdown.truckAgentCode || lowestBreakdown.truckAgent.substring(0, 2).toUpperCase();
    const freightType = lowestBreakdown.isCombinedFreight ? 'C' : 'S';
    const carrierCode = lowestBreakdown.seaFreightCarrierCode || (lowestBreakdown.seaFreightCarrier ? lowestBreakdown.seaFreightCarrier.substring(0, 2).toUpperCase() : 'XX');
    const seqNum = String(lowestIndex + 1).padStart(3, '0');
    const code = `${carrierCode}-${railCode}${truckCode}-${freightType}${seqNum}`;

    return { agent: lowestBreakdown.agent, cost: lowestCost, index: lowestIndex, code };
  };

  const generateCombinationCode = (breakdown: AgentCostBreakdown, index: number): string => {
    const railCode = breakdown.railAgentCode || breakdown.railAgent.substring(0, 2).toUpperCase();
    const truckCode = breakdown.truckAgentCode || breakdown.truckAgent.substring(0, 2).toUpperCase();
    const freightType = breakdown.isCombinedFreight ? 'C' : 'S';
    const carrierCode = breakdown.seaFreightCarrierCode || (breakdown.seaFreightCarrier ? breakdown.seaFreightCarrier.substring(0, 2).toUpperCase() : 'XX');
    const seqNum = String(index + 1).padStart(3, '0');
    
    return `${carrierCode}-${railCode}${truckCode}-${freightType}${seqNum}`;
  };

  const isExpired = (breakdown: AgentCostBreakdown, field: string) => {
    return breakdown.expiredRateDetails?.includes(field) || false;
  };

  // ✅ NEW: Create merged excludedCosts that includes cell-level exclusions for a specific breakdown
  const getMergedExcludedCosts = (agentIndex: number): ExcludedCosts => {
    const merged: ExcludedCosts = { ...excludedCosts };
    
    // Merge cell-level exclusions for this specific agent
    const cellExclusionsForAgent = cellExclusions[agentIndex] || {};
    Object.keys(cellExclusionsForAgent).forEach(key => {
      if (cellExclusionsForAgent[key]) {
        merged[key] = true;
      }
    });
    
    return merged;
  };

  const renderResultTable = (resultData: CostCalculationResult, showDpColumn: boolean = false) => {
    const lowestCostInfo = getLowestCostAgent(resultData.breakdown);
    const otherCostItems = resultData.breakdown.length > 0 && resultData.breakdown[0].otherCosts ? resultData.breakdown[0].otherCosts : [];
    const sortedBreakdown = getSortedBreakdown(resultData.breakdown);

    return (
      <>
        <DebugLLocal breakdown={resultData.breakdown} />

        {resultData.breakdown.some(b => b.hasExpiredRates) && (
          <Alert variant="destructive" className="border-red-300 bg-red-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-900">
              <strong>⚠️ 만료된 운임 포함:</strong> 일부 조합에 만료된 운임이 포함되어 있습니다. 
              빨간색 굵은 글씨와 경고 아이콘으로 표시된 항목을 확인하세요.
            </AlertDescription>
          </Alert>
        )}

        {resultData.breakdown.length === 0 && (
          <div className="relative overflow-hidden rounded-xl border-2 border-amber-400 bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 shadow-lg">
            {/* Decorative background pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-0 left-0 w-32 h-32 bg-amber-500 rounded-full -translate-x-16 -translate-y-16"></div>
              <div className="absolute bottom-0 right-0 w-40 h-40 bg-orange-500 rounded-full translate-x-20 translate-y-20"></div>
            </div>

            <div className="relative p-6 space-y-5">
              {/* Header Section */}
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-md">
                  <AlertCircle className="h-8 w-8 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-amber-900 mb-1">
                    운임 조합을 찾을 수 없습니다
                  </h3>
                  <p className="text-amber-800 text-sm">
                    선택하신 경로에 대한 운임 데이터가 등록되어 있지 않습니다.
                  </p>
                </div>
              </div>

              {/* Route Information Card */}
              <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-amber-200 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="h-5 w-5 text-amber-600" />
                  <span className="font-bold text-amber-900">조회 경로 정보</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-700 font-semibold">출발항:</span>
                    <span className="text-amber-900 font-bold">{input.pol}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-amber-700 font-semibold">중국항:</span>
                    <span className="text-amber-900 font-bold">{input.pod}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-amber-700 font-semibold">최종목적지:</span>
                    <span className="text-amber-900 font-bold">{getDestinationName(input.destinationId)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-amber-700 font-semibold">운송 조건:</span>
                    <span className="text-amber-900 font-bold">
                      {input.includeDP ? 'DP 포함 (철도+트럭 분리)' : 'DP 미포함 (철도+트럭 통합)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Missing Freight Details */}
              {resultData.missingFreights && resultData.missingFreights.length > 0 && (
                <div className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-amber-200 shadow-sm">
                  <div className="flex items-center gap-2 mb-3">
                    <Database className="h-5 w-5 text-amber-600" />
                    <span className="font-bold text-amber-900">누락된 운임 데이터</span>
                  </div>
                  <div className="space-y-3">
                    {resultData.missingFreights.map((missing, index) => {
                      const getFreightIcon = (type: string) => {
                        switch(type) {
                          case 'seaFreight': return <Ship className="h-5 w-5 text-cyan-600" />;
                          case 'railFreight': return <Train className="h-5 w-5 text-blue-600" />;
                          case 'truckFreight': return <Truck className="h-5 w-5 text-green-600" />;
                          case 'combinedFreight': return <Merge className="h-5 w-5 text-purple-600" />;
                          default: return <AlertCircle className="h-5 w-5 text-amber-600" />;
                        }
                      };

                      const getFreightLabel = (type: string) => {
                        switch(type) {
                          case 'seaFreight': return '해상운임';
                          case 'railFreight': return '철도운임';
                          case 'truckFreight': return '트럭운임';
                          case 'combinedFreight': return '통합운임';
                          default: return '운임';
                        }
                      };

                      const getFreightBgColor = (type: string) => {
                        switch(type) {
                          case 'seaFreight': return 'bg-cyan-50 border-cyan-200';
                          case 'railFreight': return 'bg-blue-50 border-blue-200';
                          case 'truckFreight': return 'bg-green-50 border-green-200';
                          case 'combinedFreight': return 'bg-purple-50 border-purple-200';
                          default: return 'bg-gray-50 border-gray-200';
                        }
                      };

                      return (
                        <div 
                          key={index} 
                          className={`flex items-start gap-3 p-3 rounded-lg border ${getFreightBgColor(missing.type)}`}
                        >
                          <div className="flex-shrink-0 mt-0.5">
                            {getFreightIcon(missing.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-gray-900 mb-1">
                              {getFreightLabel(missing.type)}
                            </div>
                            <div className="text-sm text-gray-700 break-words">
                              {missing.message}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Action Required Section */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border-2 border-blue-300 shadow-sm">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <Info className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-blue-900 mb-2">다음 단계</h4>
                    <div className="space-y-1.5 text-sm text-blue-800">
                      <p>• 관리자 대시보드에서 누락된 운임 데이터를 등록해주세요</p>
                      <p>• 등록 후 다시 조회하시면 운임 조합이 표시됩니다</p>
                      <p>• 운임 등록에 대한 문의사항은 시스템 관리자에게 연락하세요</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {resultData.breakdown.length > 0 && (
          <>
            <div className="border border-gray-300 rounded-lg overflow-hidden shadow-sm bg-white">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="text-sm bg-gray-100 border-b-2 border-gray-300">
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-200 transition-colors whitespace-nowrap w-32 p-3 font-bold text-gray-900"
                        onClick={() => onSort('agent')}
                      >
                        <div className="flex items-center gap-1.5">
                          <Hash className="h-4 w-4" />
                          <span>조합 코드</span>
                          {sortConfig.key === 'agent' && (
                            sortConfig.direction === 'asc' ? 
                              <ArrowUp className="h-3.5 w-3.5" /> : 
                              <ArrowDown className="h-3.5 w-3.5" />
                          )}
                        </div>
                      </TableHead>
                      {showDpColumn && (
                        <TableHead className="text-center whitespace-nowrap w-24 p-3 font-bold text-gray-900">
                          <div className="flex flex-col items-center gap-1">
                            <Package className="h-4 w-4" />
                            <span className="text-xs">유형</span>
                          </div>
                        </TableHead>
                      )}
                      <TableHead className="text-center whitespace-nowrap w-16 p-3 font-bold text-gray-900">
                        <div className="flex flex-col items-center gap-1">
                          <Ship className="h-4 w-4" />
                          <span className="text-xs">선사</span>
                        </div>
                      </TableHead>
                      <TableHead 
                        className="text-center cursor-pointer hover:bg-gray-200 transition-colors whitespace-nowrap w-16 p-3 font-bold text-gray-900"
                        onClick={() => onSort('rail')}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex items-center gap-1">
                            <Train className="h-4 w-4" />
                            {sortConfig.key === 'rail' && (
                              sortConfig.direction === 'asc' ? 
                                <ArrowUp className="h-3 w-3" /> : 
                                <ArrowDown className="h-3 w-3" />
                            )}
                          </div>
                          <span className="text-xs">철도</span>
                        </div>
                      </TableHead>
                      <TableHead 
                        className="text-center cursor-pointer hover:bg-gray-200 transition-colors whitespace-nowrap w-16 p-3 font-bold text-gray-900"
                        onClick={() => onSort('truck')}
                      >
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex items-center gap-1">
                            <Truck className="h-4 w-4" />
                            {sortConfig.key === 'truck' && (
                              sortConfig.direction === 'asc' ? 
                                <ArrowUp className="h-3 w-3" /> : 
                                <ArrowDown className="h-3 w-3" />
                            )}
                          </div>
                          <span className="text-xs">트럭</span>
                        </div>
                      </TableHead>
                      <TableHead 
                        className={`text-center cursor-pointer hover:bg-gray-200 transition-colors whitespace-nowrap w-20 p-3 font-bold text-gray-900 ${excludedCosts.seaFreight ? 'bg-gray-200 line-through opacity-50' : ''}`}
                        onClick={() => onToggleCostExclusion('seaFreight')}
                        title="클릭하여 전체 제외/포함"
                      >
                        <div className="flex flex-col items-center gap-1">
                          <Ship className="h-4 w-4" />
                          <span className="text-xs">해상</span>
                        </div>
                      </TableHead>
                      <TableHead 
                        className={`text-center cursor-pointer hover:bg-gray-200 transition-colors whitespace-nowrap w-20 p-3 font-bold text-gray-900 ${excludedCosts.localCharge ? 'bg-gray-200 line-through opacity-50' : ''}`}
                        onClick={() => onToggleCostExclusion('localCharge')}
                        title="클릭하여 전체 제외/포함"
                      >
                        <div className="flex flex-col items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          <span className="text-xs">LOCAL</span>
                        </div>
                      </TableHead>
                      <TableHead 
                        className={`text-center cursor-pointer hover:bg-gray-200 transition-colors whitespace-nowrap w-16 p-3 font-bold text-gray-900 ${excludedCosts.dthc ? 'bg-gray-200 line-through opacity-50' : ''}`}
                        onClick={() => onToggleCostExclusion('dthc')}
                        title="클릭하여 전체 제외/포함"
                      >
                        <div className="flex flex-col items-center gap-1">
                          <FileText className="h-4 w-4" />
                          <span className="text-xs">D/O</span>
                        </div>
                      </TableHead>
                      <TableHead 
                        className={`text-center cursor-pointer hover:bg-gray-200 transition-colors whitespace-nowrap w-20 p-3 font-bold text-gray-900 ${excludedCosts.portBorder ? 'bg-gray-200 line-through opacity-50' : ''}`}
                        onClick={() => onToggleCostExclusion('portBorder')}
                        title="클릭하여 전체 제외/포함"
                      >
                        <div className="flex flex-col items-center gap-1">
                          <Train className="h-4 w-4" />
                          <span className="text-xs">철도</span>
                        </div>
                      </TableHead>
                      <TableHead 
                        className={`text-center cursor-pointer hover:bg-gray-200 transition-colors whitespace-nowrap w-20 p-3 font-bold text-gray-900 ${excludedCosts.borderDestination ? 'bg-gray-200 line-through opacity-50' : ''}`}
                        onClick={() => onToggleCostExclusion('borderDestination')}
                        title="클릭하여 전체 제외/포함"
                      >
                        <div className="flex flex-col items-center gap-1">
                          <Truck className="h-4 w-4" />
                          <span className="text-xs">트럭</span>
                        </div>
                      </TableHead>
                      <TableHead 
                        className={`text-center cursor-pointer hover:bg-gray-200 transition-colors whitespace-nowrap w-20 p-3 font-bold text-gray-900 ${excludedCosts.combinedFreight ? 'bg-gray-200 line-through opacity-50' : ''}`}
                        onClick={() => onToggleCostExclusion('combinedFreight')}
                        title="클릭하여 전체 제외/포함"
                      >
                        <div className="flex flex-col items-center gap-1">
                          <Merge className="h-4 w-4" />
                          <span className="text-xs">통합</span>
                        </div>
                      </TableHead>
                      <TableHead 
                        className={`text-center cursor-pointer hover:bg-gray-200 transition-colors whitespace-nowrap w-16 p-3 font-bold text-gray-900 ${excludedCosts.weightSurcharge ? 'bg-gray-200 line-through opacity-50' : ''}`}
                        onClick={() => onToggleCostExclusion('weightSurcharge')}
                        title="클릭하여 전체 제외/포함"
                      >
                        <div className="flex flex-col items-center gap-1">
                          <Weight className="h-4 w-4" />
                          <span className="text-xs">할증</span>
                        </div>
                      </TableHead>
                      <TableHead 
                        className={`text-center cursor-pointer hover:bg-gray-200 transition-colors whitespace-nowrap w-16 p-3 font-bold text-gray-900 ${excludedCosts.dp ? 'bg-gray-200 line-through opacity-50' : ''}`}
                        onClick={() => onToggleCostExclusion('dp')}
                        title="클릭하여 전체 제외/포함"
                      >
                        <div className="flex flex-col items-center gap-1">
                          <Package className="h-4 w-4" />
                          <span className="text-xs">DP</span>
                        </div>
                      </TableHead>
                      <TableHead 
                        className={`text-center cursor-pointer hover:bg-gray-200 transition-colors whitespace-nowrap w-20 p-3 font-bold text-gray-900 ${excludedCosts.domesticTransport ? 'bg-gray-200 line-through opacity-50' : ''}`}
                        onClick={() => onToggleCostExclusion('domesticTransport')}
                        title="클릭하여 전체 제외/포함"
                      >
                        <div className="flex flex-col items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          <span className="text-xs">국내</span>
                        </div>
                      </TableHead>
                      {otherCostItems.map((item, index) => (
                        <TableHead 
                          key={index}
                          className={`text-center cursor-pointer hover:bg-gray-200 transition-colors whitespace-nowrap w-20 p-3 font-bold text-gray-900 ${excludedCosts[`other_${index}`] ? 'bg-gray-200 line-through opacity-50' : ''}`}
                          onClick={() => onToggleCostExclusion(`other_${index}`)}
                          title="클릭하여 전체 제외/포함"
                        >
                          <div className="flex flex-col items-center gap-1">
                            <Plus className="h-4 w-4" />
                            <span className="text-xs">{item.category || `기타${index + 1}`}</span>
                          </div>
                        </TableHead>
                      ))}
                      <TableHead 
                        className="text-right font-bold cursor-pointer hover:bg-gray-200 transition-colors whitespace-nowrap w-24 p-3 text-gray-900"
                        onClick={() => onSort('total')}
                      >
                        <div className="flex items-center justify-end gap-1.5">
                          <Calculator className="h-4 w-4" />
                          <span>총액</span>
                          {sortConfig.key === 'total' && (
                            sortConfig.direction === 'asc' ? 
                              <ArrowUp className="h-3.5 w-3.5" /> : 
                              <ArrowDown className="h-3.5 w-3.5" />
                          )}
                        </div>
                      </TableHead>
                      <TableHead className="text-center whitespace-nowrap w-16 p-3 text-sm font-bold text-gray-900">
                        <div className="flex flex-col items-center gap-1">
                          <FileSpreadsheet className="h-4 w-4" />
                          <span className="text-xs">작업</span>
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedBreakdown.map((breakdown, index) => {
                      const originalIndex = resultData.breakdown.indexOf(breakdown);
                      const adjustedTotal = calculateAdjustedTotal(breakdown, originalIndex);
                      const isLowest = originalIndex === lowestCostInfo.index;
                      
                      return (
                        <TableRow
                          key={index}
                          className={`text-sm transition-colors ${
                            isLowest 
                              ? 'bg-blue-50 border-l-4 border-blue-600 font-semibold' 
                              : index % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                        >
                          <TableCell className="whitespace-nowrap p-3">
                            <div className="flex items-center gap-2">
                              {isLowest && (
                                <Trophy className="h-4 w-4 text-blue-600" />
                              )}
                              <span className={`font-mono text-xs font-bold ${isLowest ? 'text-blue-900' : 'text-gray-700'}`}>
                                {generateCombinationCode(breakdown, originalIndex)}
                              </span>
                              {isLowest && (
                                <span className="flex items-center gap-1 text-[10px] bg-blue-600 text-white px-2 py-1 rounded-full whitespace-nowrap font-bold shadow-sm">
                                  BEST
                                </span>
                              )}
                            </div>
                          </TableCell>
                          {showDpColumn && (
                            <TableCell className="text-center whitespace-nowrap p-3">
                              {breakdown.isCombinedFreight ? (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-semibold">
                                  <Merge className="h-3 w-3" />
                                  통합
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                                  <Package className="h-3 w-3" />
                                  DP
                                </span>
                              )}
                            </TableCell>
                          )}
                          <TableCell className="text-center whitespace-nowrap p-3">
                            <span className="inline-flex items-center justify-center gap-1 px-2 py-1 bg-cyan-100 text-cyan-700 rounded text-xs font-semibold w-16">
                              {breakdown.seaFreightCarrierCode || breakdown.seaFreightCarrier?.substring(0, 3) || 'N/A'}
                            </span>
                          </TableCell>
                          <TableCell className="text-center whitespace-nowrap p-3">
                            <span className="inline-flex items-center justify-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold w-16">
                              {breakdown.railAgentCode || breakdown.railAgent.substring(0, 3)}
                            </span>
                          </TableCell>
                          <TableCell className="text-center whitespace-nowrap p-3">
                            <span className="inline-flex items-center justify-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-semibold w-16">
                              {breakdown.truckAgentCode || breakdown.truckAgent.substring(0, 3)}
                            </span>
                          </TableCell>
                          <TableCell 
                            className={`text-right cursor-pointer hover:bg-gray-200 transition-colors whitespace-nowrap p-3 ${
                              excludedCosts.seaFreight || isCellExcluded(originalIndex, 'seaFreight') 
                                ? 'text-gray-500 line-through bg-gray-100' 
                                : 'text-gray-900'
                            }`}
                            onClick={() => onToggleCellExclusion(originalIndex, 'seaFreight')}
                            title="클릭하여 이 조합만 제외/포함"
                          >
                            <div className="flex items-center justify-end gap-1">
                              {excludedCosts.seaFreight || isCellExcluded(originalIndex, 'seaFreight') ? (
                                '$0'
                              ) : breakdown.seaFreight === 0 ? (
                                <span>$0</span>
                              ) : (
                                <>
                                  <span className={isExpired(breakdown, '해상운임') ? 'text-red-600 font-bold' : ''}>
                                    ${breakdown.seaFreight}
                                  </span>
                                  {isExpired(breakdown, '해상운임') && (
                                    <AlertTriangle className="h-3 w-3 text-red-600" title="만료된 운임" />
                                  )}
                                </>
                              )}
                              {breakdown.isAgentSpecificSeaFreight && !excludedCosts.seaFreight && !isCellExcluded(originalIndex, 'seaFreight') && !isExpired(breakdown, '해상운임') && (
                                <Star className="h-3 w-3 text-amber-600" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell 
                            className={`text-right cursor-pointer hover:bg-gray-200 transition-colors whitespace-nowrap p-3 ${
                              excludedCosts.localCharge || isCellExcluded(originalIndex, 'localCharge')
                                ? 'text-gray-500 line-through bg-gray-100' 
                                : 'text-gray-900'
                            }`}
                            onClick={() => onToggleCellExclusion(originalIndex, 'localCharge')}
                            title="클릭하여 이 조합만 제외/포함"
                          >
                            <div className="flex items-center justify-end gap-1">
                              {excludedCosts.localCharge || isCellExcluded(originalIndex, 'localCharge') ? (
                                <span>$0</span>
                              ) : breakdown.isAgentSpecificSeaFreight ? (
                                <>
                                  <span className={isExpired(breakdown, 'L.LOCAL') ? 'text-red-600 font-bold' : ''}>
                                    ${breakdown.llocal || 0}
                                  </span>
                                  {isExpired(breakdown, 'L.LOCAL') && (
                                    <AlertTriangle className="h-3 w-3 text-red-600" title="만료된 운임" />
                                  )}
                                </>
                              ) : (
                                <span>${breakdown.localCharge || 0}</span>
                              )}
                              {breakdown.isAgentSpecificSeaFreight && !excludedCosts.localCharge && !isCellExcluded(originalIndex, 'localCharge') && (breakdown.llocal || 0) !== 0 && !isExpired(breakdown, 'L.LOCAL') && (
                                <Star className="h-3 w-3 text-amber-600" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell 
                            className={`text-right cursor-pointer hover:bg-gray-200 transition-colors whitespace-nowrap p-3 ${
                              excludedCosts.dthc || isCellExcluded(originalIndex, 'dthc')
                                ? 'text-gray-500 line-through bg-gray-100' 
                                : 'text-gray-900'
                            }`}
                            onClick={() => onToggleCellExclusion(originalIndex, 'dthc')}
                            title="클릭하여 이 조합만 제외/포함"
                          >
                            <div className="flex items-center justify-end gap-1">
                              <span className={isExpired(breakdown, 'DTHC') ? 'text-red-600 font-bold' : ''}>
                                ${excludedCosts.dthc || isCellExcluded(originalIndex, 'dthc') ? 0 : breakdown.dthc}
                              </span>
                              {isExpired(breakdown, 'DTHC') && !excludedCosts.dthc && !isCellExcluded(originalIndex, 'dthc') && (
                                <AlertTriangle className="h-3 w-3 text-red-600" title="만료된 운임" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell 
                            className={`text-right whitespace-nowrap p-3 ${
                              breakdown.isCombinedFreight 
                                ? 'text-gray-500' 
                                : `cursor-pointer hover:bg-gray-200 transition-colors ${
                                    excludedCosts.portBorder || isCellExcluded(originalIndex, 'portBorder')
                                      ? 'text-gray-500 line-through bg-gray-100' 
                                      : 'text-gray-900'
                                  }`
                            }`}
                            onClick={() => !breakdown.isCombinedFreight && onToggleCellExclusion(originalIndex, 'portBorder')}
                            title={!breakdown.isCombinedFreight ? "클릭하여 이 조합만 제외/포함" : ""}
                          >
                            {breakdown.isCombinedFreight ? (
                              <span className="text-gray-500">-</span>
                            ) : (
                              <div className="flex items-center justify-end gap-1">
                                <span className={isExpired(breakdown, '철도운임') ? 'text-red-600 font-bold' : ''}>
                                  ${excludedCosts.portBorder || isCellExcluded(originalIndex, 'portBorder') ? 0 : breakdown.portBorder}
                                </span>
                                {isExpired(breakdown, '철도운임') && !excludedCosts.portBorder && !isCellExcluded(originalIndex, 'portBorder') && (
                                  <AlertTriangle className="h-3 w-3 text-red-600" title="만료된 운임" />
                                )}
                              </div>
                            )}
                          </TableCell>
                          <TableCell 
                            className={`text-right whitespace-nowrap p-3 ${
                              breakdown.isCombinedFreight 
                                ? 'text-gray-500' 
                                : `cursor-pointer hover:bg-gray-200 transition-colors ${
                                    excludedCosts.borderDestination || isCellExcluded(originalIndex, 'borderDestination')
                                      ? 'text-gray-500 line-through bg-gray-100' 
                                      : 'text-gray-900'
                                  }`
                            }`}
                            onClick={() => !breakdown.isCombinedFreight && onToggleCellExclusion(originalIndex, 'borderDestination')}
                            title={!breakdown.isCombinedFreight ? "클릭하여 이 조합만 제외/포함" : ""}
                          >
                            {breakdown.isCombinedFreight ? (
                              <span className="text-gray-500">-</span>
                            ) : (
                              <div className="flex items-center justify-end gap-1">
                                <span className={isExpired(breakdown, '트럭운임') ? 'text-red-600 font-bold' : ''}>
                                  ${excludedCosts.borderDestination || isCellExcluded(originalIndex, 'borderDestination') ? 0 : breakdown.borderDestination}
                                </span>
                                {isExpired(breakdown, '트럭운임') && !excludedCosts.borderDestination && !isCellExcluded(originalIndex, 'borderDestination') && (
                                  <AlertTriangle className="h-3 w-3 text-red-600" title="만료된 운임" />
                                )}
                              </div>
                            )}
                          </TableCell>
                          <TableCell 
                            className={`text-right whitespace-nowrap p-3 ${
                              !breakdown.isCombinedFreight 
                                ? 'text-gray-500' 
                                : `cursor-pointer hover:bg-gray-200 transition-colors ${
                                    excludedCosts.combinedFreight || isCellExcluded(originalIndex, 'combinedFreight')
                                      ? 'text-gray-500 line-through bg-gray-100' 
                                      : 'text-gray-900'
                                  }`
                            }`}
                            onClick={() => breakdown.isCombinedFreight && onToggleCellExclusion(originalIndex, 'combinedFreight')}
                            title={breakdown.isCombinedFreight ? "클릭하여 이 조합만 제외/포함" : ""}
                          >
                            {breakdown.isCombinedFreight ? (
                              breakdown.combinedFreight === 0 ? (
                                <span className="text-amber-600 text-xs font-semibold">없음</span>
                              ) : (
                                <div className="flex items-center justify-end gap-1">
                                  <span className={isExpired(breakdown, '통합운임') ? 'text-red-600 font-bold' : ''}>
                                    ${excludedCosts.combinedFreight || isCellExcluded(originalIndex, 'combinedFreight') ? 0 : breakdown.combinedFreight}
                                  </span>
                                  {isExpired(breakdown, '통합운임') && !excludedCosts.combinedFreight && !isCellExcluded(originalIndex, 'combinedFreight') && (
                                    <AlertTriangle className="h-3 w-3 text-red-600" title="만료된 운임" />
                                  )}
                                  <Merge className="h-3 w-3 text-purple-600" />
                                </div>
                              )
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </TableCell>
                          <TableCell 
                            className={`text-right cursor-pointer hover:bg-gray-200 transition-colors whitespace-nowrap p-3 ${
                              excludedCosts.weightSurcharge || isCellExcluded(originalIndex, 'weightSurcharge')
                                ? 'text-gray-500 line-through bg-gray-100' 
                                : 'text-gray-900'
                            }`}
                            onClick={() => onToggleCellExclusion(originalIndex, 'weightSurcharge')}
                            title="클릭하여 이 조합만 제외/포함"
                          >
                            <div className="flex items-center justify-end gap-1">
                              <span className={isExpired(breakdown, '중량할증') ? 'text-red-600 font-bold' : ''}>
                                ${excludedCosts.weightSurcharge || isCellExcluded(originalIndex, 'weightSurcharge') ? 0 : breakdown.weightSurcharge}
                              </span>
                              {isExpired(breakdown, '중량할증') && !excludedCosts.weightSurcharge && !isCellExcluded(originalIndex, 'weightSurcharge') && (
                                <AlertTriangle className="h-3 w-3 text-red-600" title="만료된 운임" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell 
                            className={`text-right cursor-pointer hover:bg-gray-200 transition-colors whitespace-nowrap p-3 ${
                              excludedCosts.dp || isCellExcluded(originalIndex, 'dp')
                                ? 'text-gray-500 line-through bg-gray-100' 
                                : 'text-gray-900'
                            }`}
                            onClick={() => onToggleCellExclusion(originalIndex, 'dp')}
                            title="클릭하여 이 조합만 제외/포함"
                          >
                            <div className="flex items-center justify-end gap-1">
                              <span className={isExpired(breakdown, 'DP') ? 'text-red-600 font-bold' : ''}>
                                ${excludedCosts.dp || isCellExcluded(originalIndex, 'dp') ? 0 : breakdown.dp}
                              </span>
                              {isExpired(breakdown, 'DP') && !excludedCosts.dp && !isCellExcluded(originalIndex, 'dp') && (
                                <AlertTriangle className="h-3 w-3 text-red-600" title="만료된 운임" />
                              )}
                            </div>
                          </TableCell>
                          <TableCell 
                            className={`text-right cursor-pointer hover:bg-gray-200 transition-colors whitespace-nowrap p-3 ${
                              excludedCosts.domesticTransport || isCellExcluded(originalIndex, 'domesticTransport')
                                ? 'text-gray-500 line-through bg-gray-100' 
                                : 'text-gray-900'
                            }`}
                            onClick={() => onToggleCellExclusion(originalIndex, 'domesticTransport')}
                            title="클릭하여 이 조합만 제외/포함"
                          >
                            ${excludedCosts.domesticTransport || isCellExcluded(originalIndex, 'domesticTransport') ? 0 : breakdown.domesticTransport}
                          </TableCell>
                          {breakdown.otherCosts && breakdown.otherCosts.map((item, idx) => (
                            <TableCell 
                              key={idx}
                              className={`text-right cursor-pointer hover:bg-gray-200 transition-colors whitespace-nowrap p-3 ${
                                excludedCosts[`other_${idx}`] || isCellExcluded(originalIndex, `other_${idx}`)
                                  ? 'text-gray-500 line-through bg-gray-100' 
                                  : 'text-gray-900'
                              }`}
                              onClick={() => onToggleCellExclusion(originalIndex, `other_${idx}`)}
                              title="클릭하여 이 조합만 제외/포함"
                            >
                              ${excludedCosts[`other_${idx}`] || isCellExcluded(originalIndex, `other_${idx}`) ? 0 : item.amount}
                            </TableCell>
                          ))}
                          <TableCell className="text-right font-bold whitespace-nowrap p-3">
                            {isLowest ? (
                              <span className="text-lg font-extrabold text-blue-600">
                                ${adjustedTotal.toLocaleString()}
                              </span>
                            ) : (
                              <span className={`text-gray-900 ${adjustedTotal < 0 ? "text-red-600 font-bold" : ""}`}>
                                ${adjustedTotal.toLocaleString()}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-center whitespace-nowrap p-2">
                            <div className="flex items-center justify-center">
                              {isLowest ? (
                                <Button
                                  size="sm"
                                  onClick={() => onCreateQuotation(breakdown, getMergedExcludedCosts(originalIndex))}
                                  className="h-8 w-8 p-0 bg-blue-600 hover:bg-blue-700 text-white border-2 border-blue-700 shadow-sm hover:shadow-md transition-all duration-200"
                                  title="견적서 생성"
                                >
                                  <FileSpreadsheet className="h-4 w-4" />
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => onCreateQuotation(breakdown, getMergedExcludedCosts(originalIndex))}
                                  className="h-8 w-8 p-0 hover:bg-gray-100 transition-colors"
                                  title="견적서 생성"
                                >
                                  <FileSpreadsheet className="h-4 w-4 text-gray-600" />
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
            </div>

            {/* Lowest Cost Info */}
            <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-300 shadow-sm space-y-2">
              <div className="flex items-center gap-2">
                <Trophy className="h-6 w-6 text-blue-600" />
                <p className="text-blue-900 font-bold text-lg">
                  최저가 조합
                </p>
              </div>
              <div className="pl-8 space-y-1.5">
                <p className="text-blue-900 font-semibold">
                  조합 코드: <span className="font-mono text-base font-bold">{lowestCostInfo.code}</span>
                </p>
                <p className="text-blue-900 font-semibold">
                  업체명: <span className="text-base">{lowestCostInfo.agent}</span>
                </p>
                <p className="text-blue-900 font-bold text-lg flex items-center gap-2">
                  최저 총액: 
                  <span className="text-2xl text-blue-600">
                    ${lowestCostInfo.cost.toLocaleString()}
                  </span>
                </p>
              </div>
            </div>

            {/* Descriptions */}
            <div className="space-y-3">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-300">
                <div className="flex items-center gap-2 text-sm text-gray-900 mb-2 font-bold">
                  <Info className="h-4 w-4" />
                  <span>비용 항목 제외 기능:</span>
                </div>
                <div className="text-sm text-gray-700 space-y-1">
                  <div>• <strong>헤더 클릭:</strong> 해당 컬럼의 모든 값을 0으로 계산</div>
                  <div>• <strong>셀 클릭:</strong> 해당 조합의 특정 비용만 0으로 계산</div>
                  <div>• 제외된 항목은 회색으로 표시되며, 다시 클릭하면 포함됩니다</div>
                  <div>• "조합 코드", "선사", "철도", "트럭" 또는 "총액" 헤더를 클릭하면 해당 기준으로 정렬</div>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-300 space-y-1.5 text-sm text-gray-700">
                <p className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-amber-600" />
                  <span>별표는 특별 해상운임 또는 L.LOCAL 적용</span>
                </p>
                <p className="flex items-center gap-2">
                  <Merge className="h-4 w-4 text-purple-600" />
                  <span>철도+트럭 통합운임 적용</span>
                </p>
                {showDpColumn && (
                  <p className="flex items-center gap-2 text-blue-700 font-semibold">
                    <Info className="h-4 w-4" />
                    <span>DP 포함 조합은 실제 DP 값 표시, 통합운임은 DP=0</span>
                  </p>
                )}
                {resultData.breakdown.some(b => b.hasExpiredRates) && (
                  <p className="flex items-center gap-2 text-red-600 font-semibold">
                    <AlertTriangle className="h-4 w-4" />
                    <span>빨간색 굵은 글씨와 경고 아이콘은 만료된 운임</span>
                  </p>
                )}
                {(Object.values(excludedCosts).some(v => v) || Object.keys(cellExclusions).length > 0) && (
                  <p className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-blue-600" />
                    <span>일부 비용 항목이 제외되어 계산됨</span>
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </>
    );
  };

  // Always show the tabs structure, even without results
  return (
    <>
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'filtered' | 'all')}>
        <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-lg">
          <TabsTrigger 
            value="filtered" 
            disabled={!result}
            className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm font-semibold"
          >
            필터링된 결과 {result && `(${result.breakdown.length}개)`}
          </TabsTrigger>
          <TabsTrigger 
            value="all" 
            disabled={!allFreightsResult}
            className="data-[state=active]:bg-white data-[state=active]:text-gray-900 data-[state=active]:shadow-sm font-semibold"
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              모든 운임 {allFreightsResult && `(${allFreightsResult.breakdown.length}개)`}
            </div>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="filtered" className="space-y-4 mt-4">
          {result ? (
            <>
              <Alert className="bg-blue-50 border-blue-300">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-900 font-semibold">
                  {input.includeDP 
                    ? '✅ DP 포함: 철도+트럭 분리 운임만 표시됩니다'
                    : '✅ DP 미포함: 철도+트럭 통합 운임만 표시됩니다'
                  }
                </AlertDescription>
              </Alert>
              {renderResultTable(result, false)}
            </>
          ) : (
            <div className="text-center py-12 text-gray-700">
              <Calculator className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p className="font-semibold">계산하기 버튼을 눌러 운임을 조회하세요</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="all" className="space-y-4 mt-4">
          {allFreightsResult ? (
            <>
              <Alert className="bg-purple-50 border-purple-300">
                <Sparkles className="h-4 w-4 text-purple-600" />
                <AlertDescription className="text-purple-900 font-semibold">
                  <strong>✨ 제약 없이 보기:</strong> DP 필터를 무시하고 모든 운임 조합(철도+트럭 통합 운임 + 분리 운임)을 표시합니다. "운임 유형" 컬럼에서 각 조합이 철도+트럭 통합운임인지 DP 포함 분리운임인지 확인할 수 있으며, DP 컬럼에서 실제 DP 값을 확인할 수 있습니다.
                </AlertDescription>
              </Alert>
              {renderResultTable(allFreightsResult, true)}
            </>
          ) : (
            <div className="text-center py-12 text-gray-700">
              <Sparkles className="h-12 w-12 mx-auto mb-3 text-gray-400" />
              <p className="font-semibold">먼저 필터링된 결과를 조회한 후 이 탭을 사용하세요</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </>
  );
}