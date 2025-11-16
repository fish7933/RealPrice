import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFreight } from '@/contexts/FreightContext';
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
import { Plus, Pencil, Trash2, Ship } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShippingLine } from '@/types/freight';

export default function ShippingLineTable() {
  const { user } = useAuth();
  const { shippingLines, addShippingLine, updateShippingLine, deleteShippingLine } = useFreight();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingLine, setEditingLine] = useState<ShippingLine | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
  });

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  const handleAdd = async () => {
    if (!formData.name.trim()) return;

    await addShippingLine({
      name: formData.name.trim(),
      code: formData.code.trim() || undefined,
      description: formData.description.trim() || undefined,
    });
    
    setFormData({ name: '', code: '', description: '' });
    setIsAddDialogOpen(false);
  };

  const handleEdit = (line: ShippingLine) => {
    setEditingLine(line);
    setFormData({
      name: line.name,
      code: line.code || '',
      description: line.description || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingLine || !formData.name.trim()) return;

    await updateShippingLine(editingLine.id, {
      name: formData.name.trim(),
      code: formData.code.trim() || undefined,
      description: formData.description.trim() || undefined,
    });
    
    setFormData({ name: '', code: '', description: '' });
    setIsEditDialogOpen(false);
    setEditingLine(null);
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`"${name}" 선사를 삭제하시겠습니까?`)) {
      await deleteShippingLine(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Ship className="h-5 w-5" />
            선사 관리
          </h3>
          <p className="text-gray-600 mt-1 text-sm">해상운송을 담당하는 선사를 관리합니다</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            선사 추가
          </Button>
        )}
      </div>

      <Alert>
        <Ship className="h-4 w-4" />
        <AlertDescription>
          <strong>선사:</strong> 한국 항구에서 중국 항구까지 해상운송을 담당하는 선박회사입니다.
          <br />
          <span className="text-sm text-gray-600 mt-1 block">
            여기서 관리하는 선사 정보는 해상운임 추가 시 선택할 수 있습니다.
          </span>
        </AlertDescription>
      </Alert>

      <div className="border rounded-lg overflow-hidden bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>선사명</TableHead>
              <TableHead>코드</TableHead>
              <TableHead>설명</TableHead>
              <TableHead>등록일</TableHead>
              {isAdmin && <TableHead className="text-right">작업</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {shippingLines.length > 0 ? (
              shippingLines.map((line) => (
                <TableRow key={line.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Ship className="h-4 w-4 text-cyan-600" />
                      {line.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-mono">
                      {line.code || '-'}
                    </span>
                  </TableCell>
                  <TableCell>{line.description || '-'}</TableCell>
                  <TableCell>{new Date(line.createdAt).toLocaleDateString('ko-KR')}</TableCell>
                  {isAdmin && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(line)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(line.id, line.name)}
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
                <TableCell colSpan={isAdmin ? 5 : 4} className="text-center text-gray-500">
                  등록된 선사가 없습니다
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
            <DialogTitle>선사 추가</DialogTitle>
            <DialogDescription>새로운 선사 정보를 입력하세요.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>선사명 *</Label>
              <Input
                placeholder="예: KMTC, SINOKOR, 흥아"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>코드</Label>
              <Input
                placeholder="예: KMTC, SKR, HAL"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>설명</Label>
              <Textarea
                placeholder="선사에 대한 설명을 입력하세요"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleAdd} disabled={!formData.name.trim()}>
              추가
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>선사 수정</DialogTitle>
            <DialogDescription>선사 정보를 수정하세요.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>선사명 *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>코드</Label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>설명</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleUpdate} disabled={!formData.name.trim()}>
              수정
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}