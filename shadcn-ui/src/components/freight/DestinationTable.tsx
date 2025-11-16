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
import { Pencil, Trash2, Plus, MapPin, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <MapPin className="h-6 w-6" />
            최종목적지 관리
          </h2>
          <p className="text-gray-600 mt-1">운송의 최종 도착지를 관리합니다</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            목적지 추가
          </Button>
        )}
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>최종목적지:</strong> KASHGAR 국경에서 최종 도착지까지의 운송 목적지입니다.
          <br />
          <span className="text-sm text-gray-600 mt-1 block">
            목적지를 추가하면 "국경목적지운임" 페이지에서 각 트럭 대리점별 운임을 설정할 수 있습니다.
          </span>
        </AlertDescription>
      </Alert>

      <div className="border rounded-lg overflow-hidden bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>최종목적지</TableHead>
              <TableHead>설명</TableHead>
              <TableHead>생성일</TableHead>
              {isAdmin && <TableHead className="text-right">작업</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {destinations.length > 0 ? (
              destinations.map((destination) => (
                <TableRow key={destination.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-blue-600" />
                      {destination.name}
                    </div>
                  </TableCell>
                  <TableCell>{destination.description || '-'}</TableCell>
                  <TableCell>{new Date(destination.createdAt).toLocaleDateString('ko-KR')}</TableCell>
                  {isAdmin && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(destination)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(destination.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={isAdmin ? 4 : 3} className="text-center text-gray-500">
                  등록된 목적지가 없습니다
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>최종목적지 추가</DialogTitle>
            <DialogDescription>새로운 최종 도착지를 입력하세요.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>최종목적지 *</Label>
              <Input
                placeholder="예: TASHKENT, ALMATY"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <p className="text-xs text-gray-500">대문자로 자동 변환됩니다</p>
            </div>
            <div className="space-y-2">
              <Label>설명 (선택)</Label>
              <Textarea
                placeholder="목적지에 대한 설명을 입력하세요 (예: 타슈켄트, 우즈베키스탄 수도)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddDialogOpen(false);
              setFormData({ name: '', description: '' });
            }}>
              취소
            </Button>
            <Button onClick={handleAdd}>추가</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>최종목적지 수정</DialogTitle>
            <DialogDescription>목적지 정보를 수정하세요.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>최종목적지 *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <p className="text-xs text-gray-500">대문자로 자동 변환됩니다</p>
            </div>
            <div className="space-y-2">
              <Label>설명 (선택)</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsEditDialogOpen(false);
              setFormData({ name: '', description: '' });
              setEditingDestination(null);
            }}>
              취소
            </Button>
            <Button onClick={handleUpdate}>수정</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}