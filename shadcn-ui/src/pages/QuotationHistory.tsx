import { useState, useEffect } from 'react';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Search, ChevronLeft, ChevronRight, Trash2, Eye, X } from 'lucide-react';
import { Quotation } from '@/types/freight';
import { useToast } from '@/hooks/use-toast';
import QuotationViewDialog from '@/components/calculator/QuotationViewDialog';

const ITEMS_PER_PAGE = 10;

export default function QuotationHistory() {
  const { quotations, deleteQuotation, loadQuotations } = useFreight();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDestination, setFilterDestination] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);

  useEffect(() => {
    loadQuotations();
  }, []);

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

  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterDestination('all');
    setCurrentPage(1);
  };

  const hasActiveFilters = searchTerm !== '' || filterDestination !== 'all';

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <FileText className="h-6 w-6 text-gray-700" />
            <div>
              <CardTitle className="text-gray-900">견적서 히스토리</CardTitle>
              <CardDescription className="text-gray-600">
                저장된 견적서를 조회하고 관리합니다
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="목적지, 출발항, 도착항, 선사로 검색..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10"
              />
            </div>
            <Select
              value={filterDestination}
              onValueChange={(value) => {
                setFilterDestination(value);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
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
            {hasActiveFilters && (
              <Button
                variant="outline"
                onClick={handleResetFilters}
                className="w-full sm:w-auto border-gray-300 hover:bg-gray-50"
              >
                <X className="h-4 w-4 mr-2" />
                필터 초기화
              </Button>
            )}
          </div>

          {/* Results Summary */}
          <div className="mb-4 text-sm text-gray-600">
            총 {filteredQuotations.length}개의 견적서 (페이지 {currentPage}/{totalPages})
          </div>

          {/* Table */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-gray-900 font-semibold">작성일</TableHead>
                  <TableHead className="text-gray-900 font-semibold">경로</TableHead>
                  <TableHead className="text-gray-900 font-semibold">선사</TableHead>
                  <TableHead className="text-right text-gray-900 font-semibold">원가</TableHead>
                  <TableHead className="text-right text-gray-900 font-semibold">제시운임</TableHead>
                  <TableHead className="text-right text-gray-900 font-semibold">이윤</TableHead>
                  <TableHead className="text-right text-gray-900 font-semibold">이윤율</TableHead>
                  <TableHead className="text-center text-gray-900 font-semibold">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedQuotations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      {searchTerm || filterDestination !== 'all' 
                        ? '검색 결과가 없습니다.' 
                        : '저장된 견적서가 없습니다.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedQuotations.map((quotation) => (
                    <TableRow key={quotation.id} className="hover:bg-gray-50">
                      <TableCell className="text-gray-700">
                        {new Date(quotation.createdAt).toLocaleDateString('ko-KR')}
                      </TableCell>
                      <TableCell className="text-gray-700">
                        <div className="font-medium">{quotation.destinationName}</div>
                        <div className="text-xs text-gray-500">
                          {quotation.pol} → {quotation.pod}
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-700">
                        {quotation.carrier || '-'}
                      </TableCell>
                      <TableCell className="text-right text-gray-700">
                        ${quotation.costTotal.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right text-gray-700 font-medium">
                        ${quotation.sellingPrice.toLocaleString()}
                      </TableCell>
                      <TableCell className={`text-right font-medium ${quotation.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${quotation.profit.toLocaleString()}
                      </TableCell>
                      <TableCell className={`text-right font-medium ${quotation.profitRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {quotation.profitRate.toFixed(2)}%
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleView(quotation)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(quotation.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
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
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-600">
                {startIndex + 1}-{Math.min(endIndex, filteredQuotations.length)} / {filteredQuotations.length}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="border-gray-300"
                >
                  <ChevronLeft className="h-4 w-4" />
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
                          className={page === currentPage ? 'bg-blue-600 hover:bg-blue-700' : 'border-gray-300'}
                        >
                          {page}
                        </Button>
                      );
                    } else if (page === currentPage - 2 || page === currentPage + 2) {
                      return <span key={page} className="px-2">...</span>;
                    }
                    return null;
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="border-gray-300"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

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