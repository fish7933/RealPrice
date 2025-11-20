import { useState } from 'react';
import { useFreight } from '@/contexts/FreightContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { FileText, Search, ChevronLeft, ChevronRight, Trash2, Eye } from 'lucide-react';
import { Quotation } from '@/types/freight';
import { useToast } from '@/hooks/use-toast';
import QuotationViewDialog from './QuotationViewDialog';

const ITEMS_PER_PAGE = 5;

export default function QuotationList() {
  const { quotations, deleteQuotation } = useFreight();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDestination, setFilterDestination] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  // Get unique destinations for filter
  const destinations = Array.from(new Set(quotations.map(q => q.destinationName))).sort();

  // Filter quotations
  const filteredQuotations = quotations.filter(quotation => {
    const matchesSearch = 
      quotation.destinationName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quotation.pol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quotation.pod.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (quotation.carrier && quotation.carrier.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesDestination = filterDestination === 'all' || quotation.destinationName === filterDestination;
    
    return matchesSearch && matchesDestination;
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

  const handleView = (quotation: Quotation) => {
    setSelectedQuotation(quotation);
    setViewDialogOpen(true);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (quotations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Filters - Compact */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="목적지, 출발항, 도착항, 선사로 검색..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10 h-9 text-sm"
          />
        </div>
        <Select
          value={filterDestination}
          onValueChange={(value) => {
            setFilterDestination(value);
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-full sm:w-[180px] h-9 text-sm">
            <SelectValue placeholder="목적지 필터" />
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
      </div>

      {/* Results Summary - Compact */}
      <div className="text-xs text-gray-600">
        총 {filteredQuotations.length}개의 견적서
        {totalPages > 1 && ` (페이지 ${currentPage}/${totalPages})`}
      </div>

      {/* Table - Compact */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="h-9 text-xs font-semibold text-gray-900">작성일</TableHead>
              <TableHead className="h-9 text-xs font-semibold text-gray-900">경로</TableHead>
              <TableHead className="h-9 text-xs font-semibold text-gray-900">선사</TableHead>
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
                <TableCell colSpan={8} className="text-center py-6 text-sm text-gray-500">
                  {searchTerm || filterDestination !== 'all' 
                    ? '검색 결과가 없습니다.' 
                    : '저장된 견적서가 없습니다.'}
                </TableCell>
              </TableRow>
            ) : (
              paginatedQuotations.map((quotation) => (
                <TableRow key={quotation.id} className="hover:bg-gray-50">
                  <TableCell className="py-2 text-xs text-gray-700">
                    {new Date(quotation.createdAt).toLocaleDateString('ko-KR')}
                  </TableCell>
                  <TableCell className="py-2 text-xs text-gray-700">
                    <div className="font-medium">{quotation.destinationName}</div>
                    <div className="text-[10px] text-gray-500">
                      {quotation.pol} → {quotation.pod}
                    </div>
                  </TableCell>
                  <TableCell className="py-2 text-xs text-gray-700">
                    {quotation.carrier || '-'}
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

      {/* Pagination - Compact */}
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