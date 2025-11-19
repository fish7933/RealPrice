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
import { Plus, Pencil, Trash2, Ship, Anchor, TrendingUp } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShippingLine } from '@/types/freight';
import { Card, CardContent } from '@/components/ui/card';

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
    <div className="space-y-4">
      {/* Header Section - Compact Design matching SeaFreightTable */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-600 p-3 text-white shadow-lg">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10 blur-2xl"></div>
        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-24 w-24 rounded-full bg-white/10 blur-2xl"></div>
        <div className="relative flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-white/20 backdrop-blur-sm rounded-lg">
              <Ship className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold">선사 관리</h2>
              <p className="text-xs text-cyan-100">해상운송을 담당하는 선사를 관리합니다</p>
            </div>
          </div>
          {isAdmin && (
            <Button 
              onClick={() => setIsAddDialogOpen(true)}
              size="sm"
              className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border border-white/50 h-7 text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              추가
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards - Compact */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="border-none shadow-sm bg-gradient-to-br from-cyan-50 to-blue-50">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">총 선사</p>
                <p className="text-2xl font-bold text-cyan-600 mt-1">{shippingLines.length}</p>
              </div>
              <div className="p-2 bg-cyan-100 rounded-lg">
                <Ship className="h-5 w-5 text-cyan-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">코드 등록</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {shippingLines.filter(l => l.code).length}
                </p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Anchor className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-gradient-to-br from-indigo-50 to-purple-50">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-600">활성 상태</p>
                <p className="text-2xl font-bold text-indigo-600 mt-1">100%</p>
              </div>
              <div className="p-2 bg-indigo-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Alert - Compact */}
      <Alert className="border-cyan-200 bg-gradient-to-r from-cyan-50 to-blue-50 shadow-sm py-2">
        <Ship className="h-4 w-4 text-cyan-600" />
        <AlertDescription className="text-sm">
          <strong className="text-cyan-700">선사:</strong> 한국 항구에서 중국 항구까지 해상운송을 담당하는 선박회사입니다.
          <span className="text-xs text-gray-600 mt-1 block">
            💡 여기서 관리하는 선사 정보는 해상운임 추가 시 선택할 수 있습니다.
          </span>
        </AlertDescription>
      </Alert>

      {/* Table with Modern Design */}
      <div className="rounded-lg overflow-hidden shadow-sm border">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-cyan-500 to-blue-500">
              <TableHead className="h-9 text-xs text-white font-bold whitespace-nowrap">선사명</TableHead>
              <TableHead className="h-9 text-xs text-white font-bold whitespace-nowrap">코드</TableHead>
              <TableHead className="h-9 text-xs text-white font-bold whitespace-nowrap">설명</TableHead>
              <TableHead className="h-9 text-xs text-white font-bold whitespace-nowrap">등록일</TableHead>
              {isAdmin && <TableHead className="h-9 text-xs text-right text-white font-bold whitespace-nowrap">작업</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {shippingLines.length > 0 ? (
              shippingLines.map((line) => (
                <TableRow key={line.id} className="hover:bg-cyan-50">
                  <TableCell className="py-2 text-xs font-medium whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg shadow-sm">
                        <Ship className="h-3 w-3 text-white" />
                      </div>
                      <span className="text-gray-900">{line.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-2 text-xs whitespace-nowrap">
                    <span className="inline-flex items-center px-2 py-0.5 bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 rounded-full text-xs font-semibold shadow-sm">
                      {line.code || '-'}
                    </span>
                  </TableCell>
                  <TableCell className="py-2 text-xs text-gray-600 whitespace-nowrap">{line.description || '-'}</TableCell>
                  <TableCell className="py-2 text-xs text-gray-500 whitespace-nowrap">
                    {new Date(line.createdAt).toLocaleDateString('ko-KR')}
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="py-2 text-right whitespace-nowrap">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(line)}
                          className="h-6 px-2 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300"
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(line.id, line.name)}
                          className="h-6 w-6 p-0 hover:bg-red-50 hover:text-red-700"
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
                <TableCell colSpan={isAdmin ? 5 : 4} className="text-center py-12">
                  <div className="flex flex-col items-center gap-3 text-gray-400">
                    <Ship className="h-12 w-12 opacity-20" />
                    <p className="text-sm">등록된 선사가 없습니다</p>
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
              <div className="p-2 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg">
                <Ship className="h-5 w-5 text-white" />
              </div>
              선사 추가
            </DialogTitle>
            <DialogDescription>새로운 선사 정보를 입력하세요.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">선사명 *</Label>
              <Input
                placeholder="예: KMTC, SINOKOR, 흥아"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="border-gray-300 focus:border-cyan-500 focus:ring-cyan-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">코드</Label>
              <Input
                placeholder="예: KMTC, SKR, HAL"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="border-gray-300 focus:border-cyan-500 focus:ring-cyan-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">설명</Label>
              <Textarea
                placeholder="선사에 대한 설명을 입력하세요"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="border-gray-300 focus:border-cyan-500 focus:ring-cyan-500 min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsAddDialogOpen(false)}
              className="hover:bg-gray-100"
            >
              취소
            </Button>
            <Button 
              onClick={handleAdd} 
              disabled={!formData.name.trim()}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg"
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
              <div className="p-2 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg">
                <Pencil className="h-5 w-5 text-white" />
              </div>
              선사 수정
            </DialogTitle>
            <DialogDescription>선사 정보를 수정하세요.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">선사명 *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">코드</Label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">설명</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsEditDialogOpen(false)}
              className="hover:bg-gray-100"
            >
              취소
            </Button>
            <Button 
              onClick={handleUpdate} 
              disabled={!formData.name.trim()}
              className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg"
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