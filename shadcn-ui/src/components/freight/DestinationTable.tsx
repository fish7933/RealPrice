import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFreight } from '@/contexts/FreightContext';
import { Destination } from '@/types/freight';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Pencil, Trash2, Plus, MapPin, AlertCircle, TrendingUp, Navigation } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';

export default function DestinationTable() {
  const { user } = useAuth();
  const { destinations, addDestination, updateDestination, deleteDestination } = useFreight();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingDestination, setEditingDestination] = useState<Destination | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  const handleAdd = () => {
    if (!formData.name) return;

    addDestination({
      name: formData.name.toUpperCase(),
      description: formData.description || undefined,
    });

    setFormData({ name: '', description: '' });
    setIsAddDialogOpen(false);
  };

  const handleEdit = (destination: Destination) => {
    setEditingDestination(destination);
    setFormData({
      name: destination.name,
      description: destination.description || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!editingDestination || !formData.name) return;

    updateDestination(editingDestination.id, {
      name: formData.name.toUpperCase(),
      description: formData.description || undefined,
    });

    setFormData({ name: '', description: '' });
    setIsEditDialogOpen(false);
    setEditingDestination(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('이 목적지를 삭제하시겠습니까? 관련된 모든 운임 데이터도 함께 삭제됩니다.')) {
      deleteDestination(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section with Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-white/10 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-32 w-32 rounded-full bg-white/10 blur-3xl"></div>
        <div className="relative flex justify-between items-start">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <MapPin className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-3xl font-bold">최종목적지 관리</h2>
                <p className="text-orange-100 mt-1">운송의 최종 도착지를 관리합니다</p>
              </div>
            </div>
          </div>
          {isAdmin && (
            <Button 
              onClick={() => setIsAddDialogOpen(true)}
              className="bg-white text-orange-600 hover:bg-orange-50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <Plus className="h-4 w-4 mr-2" />
              목적지 추가
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br from-orange-50 to-red-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">총 목적지</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">{destinations.length}</p>
              </div>
              <div className="p-4 bg-orange-100 rounded-full">
                <MapPin className="h-8 w-8 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br from-red-50 to-pink-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">활성 상태</p>
                <p className="text-3xl font-bold text-red-600 mt-2">100%</p>
              </div>
              <div className="p-4 bg-red-100 rounded-full">
                <TrendingUp className="h-8 w-8 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br from-pink-50 to-rose-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">운송 구간</p>
                <p className="text-3xl font-bold text-pink-600 mt-2">국경→도착</p>
              </div>
              <div className="p-4 bg-pink-100 rounded-full">
                <Navigation className="h-8 w-8 text-pink-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Alert */}
      <Alert className="border-orange-200 bg-gradient-to-r from-orange-50 to-red-50 shadow-md">
        <AlertCircle className="h-4 w-4 text-orange-600" />
        <AlertDescription>
          <strong className="text-orange-700">최종목적지:</strong> KASHGAR 국경에서 최종 도착지까지의 운송 목적지입니다.
          <br />
          <span className="text-sm text-gray-600 mt-1 block">
            💡 목적지를 추가하면 "국경목적지운임" 페이지에서 각 트럭 대리점별 운임을 설정할 수 있습니다.
          </span>
        </AlertDescription>
      </Alert>

      {/* Table with Modern Design */}
      <div className="rounded-2xl overflow-hidden shadow-xl border border-gray-100">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
              <TableHead className="text-white font-semibold">최종목적지</TableHead>
              <TableHead className="text-white font-semibold">설명</TableHead>
              <TableHead className="text-white font-semibold">생성일</TableHead>
              {isAdmin && <TableHead className="text-right text-white font-semibold">작업</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {destinations.length > 0 ? (
              destinations.map((destination, index) => (
                <TableRow 
                  key={destination.id}
                  className={`
                    ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                    hover:bg-orange-50 transition-colors duration-200
                  `}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg shadow-md">
                        <MapPin className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-gray-900">{destination.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-600">{destination.description || '-'}</TableCell>
                  <TableCell className="text-gray-500 text-sm">
                    {new Date(destination.createdAt).toLocaleDateString('ko-KR')}
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(destination)}
                          className="hover:bg-orange-100 hover:text-orange-600 transition-all duration-200 hover:scale-110"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(destination.id)}
                          className="hover:bg-red-100 hover:text-red-600 transition-all duration-200 hover:scale-110"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={isAdmin ? 4 : 3} className="text-center py-12">
                  <div className="flex flex-col items-center gap-3 text-gray-400">
                    <MapPin className="h-16 w-16 opacity-20" />
                    <p className="text-lg">등록된 목적지가 없습니다</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <div className="p-2 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg">
                <MapPin className="h-5 w-5 text-white" />
              </div>
              최종목적지 추가
            </DialogTitle>
            <DialogDescription>새로운 최종 도착지를 입력하세요.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">최종목적지 *</Label>
              <Input
                placeholder="예: TASHKENT, ALMATY"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
              />
              <p className="text-xs text-gray-500">대문자로 자동 변환됩니다</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">설명 (선택)</Label>
              <Textarea
                placeholder="목적지에 대한 설명을 입력하세요 (예: 타슈켄트, 우즈베키스탄 수도)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="border-gray-300 focus:border-orange-500 focus:ring-orange-500 min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsAddDialogOpen(false);
                setFormData({ name: '', description: '' });
              }}
              className="hover:bg-gray-100"
            >
              취소
            </Button>
            <Button 
              onClick={handleAdd}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg"
            >
              <Plus className="h-4 w-4 mr-2" />
              추가
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <div className="p-2 bg-gradient-to-br from-red-400 to-pink-500 rounded-lg">
                <Pencil className="h-5 w-5 text-white" />
              </div>
              최종목적지 수정
            </DialogTitle>
            <DialogDescription>목적지 정보를 수정하세요.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">최종목적지 *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="border-gray-300 focus:border-red-500 focus:ring-red-500"
              />
              <p className="text-xs text-gray-500">대문자로 자동 변환됩니다</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">설명 (선택)</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="border-gray-300 focus:border-red-500 focus:ring-red-500 min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsEditDialogOpen(false);
                setFormData({ name: '', description: '' });
                setEditingDestination(null);
              }}
              className="hover:bg-gray-100"
            >
              취소
            </Button>
            <Button 
              onClick={handleUpdate}
              className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white shadow-lg"
            >
              <Pencil className="h-4 w-4 mr-2" />
              수정
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}