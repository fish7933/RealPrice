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
import { Pencil, Trash2, Plus, MapPin } from 'lucide-react';

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
    <div className="space-y-4">
      {/* Header Section - Compact Design */}
      <div className="relative overflow-hidden rounded-lg bg-gray-100 p-3 text-gray-900 shadow-lg">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10 blur-2xl"></div>
        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-24 w-24 rounded-full bg-white/10 blur-2xl"></div>
        <div className="relative flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-gray-200/80 backdrop-blur-sm rounded-lg">
              <MapPin className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold">최종목적지 관리</h2>
              <p className="text-xs text-gray-600">운송의 최종 도착지를 관리합니다</p>
            </div>
          </div>
          {isAdmin && (
            <Button 
              onClick={() => setIsAddDialogOpen(true)}
              size="sm"
              className="bg-gray-200/80 backdrop-blur-sm hover:bg-gray-300/80 text-gray-900 border border-gray-400 h-7 text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              추가
            </Button>
          )}
        </div>
      </div>

      {/* Table with Modern Design */}
      <div className="rounded-lg overflow-hidden shadow-md border-2 border-gray-300">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-200">
              <TableHead className="h-10 text-sm text-gray-900 font-extrabold whitespace-nowrap">최종목적지</TableHead>
              <TableHead className="h-10 text-sm text-gray-900 font-extrabold whitespace-nowrap">설명</TableHead>
              <TableHead className="h-10 text-sm text-gray-900 font-extrabold whitespace-nowrap">생성일</TableHead>
              {isAdmin && <TableHead className="h-9 text-xs text-right text-gray-900 font-bold whitespace-nowrap">작업</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {destinations.length > 0 ? (
              destinations.map((destination) => (
                <TableRow key={destination.id} className="hover:bg-blue-50 transition-colors duration-150">
                  <TableCell className="py-3 text-sm font-medium whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-gray-100 rounded-lg shadow-sm">
                        <MapPin className="h-3 w-3 text-gray-900" />
                      </div>
                      <span className="text-gray-900">{destination.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3 text-sm text-gray-600 whitespace-nowrap">{destination.description || '-'}</TableCell>
                  <TableCell className="py-3 text-sm text-gray-800 whitespace-nowrap">
                    {new Date(destination.createdAt).toLocaleDateString('ko-KR')}
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="py-2 text-right whitespace-nowrap">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(destination)}
                          className="h-6 px-2 text-xs bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-300"
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(destination.id)}
                          className="h-6 w-6 p-0 hover:bg-blue-50 transition-colors duration-150 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={isAdmin ? 4 : 3} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2 text-gray-700">
                    <MapPin className="h-12 w-12 opacity-20" />
                    <p className="text-sm">등록된 목적지가 없습니다</p>
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
              <div className="p-2 bg-gray-200 rounded-lg">
                <MapPin className="h-5 w-5 text-gray-900" />
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
              <p className="text-xs text-gray-800">대문자로 자동 변환됩니다</p>
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
              className="bg-gray-600 hover:bg-gray-200 text-gray-900 shadow-lg"
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
              <div className="p-2 bg-gray-200 rounded-lg">
                <Pencil className="h-5 w-5 text-gray-900" />
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
              <p className="text-xs text-gray-800">대문자로 자동 변환됩니다</p>
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
              className="bg-gray-600 hover:bg-gray-200 text-gray-900 shadow-lg"
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