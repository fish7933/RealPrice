import { useState } from 'react';
import { useFreight } from '@/contexts/FreightContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Plus, Pencil, Trash2, Anchor, Ship, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Port } from '@/types/freight';

type PortType = 'POL' | 'POD';

export default function PortTable() {
  const { toast } = useToast();
  const { ports, addPort, updatePort, deletePort } = useFreight();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPort, setEditingPort] = useState<Port | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'POL' as PortType,
    country: '',
    description: '',
  });

  const handleAdd = () => {
    setEditingPort(null);
    setFormData({ name: '', type: 'POL', country: '', description: '' });
    setDialogOpen(true);
  };

  const handleEdit = (port: Port) => {
    setEditingPort(port);
    setFormData({
      name: port.name,
      type: port.type,
      country: port.country,
      description: port.description || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    await deletePort(id);
    toast({
      title: '삭제 완료',
      description: '포트가 삭제되었습니다.',
    });
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.country) {
      toast({
        title: '입력 오류',
        description: '포트명과 국가를 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }

    if (editingPort) {
      await updatePort(editingPort.id, formData);
      toast({
        title: '수정 완료',
        description: '포트 정보가 수정되었습니다.',
      });
    } else {
      await addPort(formData);
      toast({
        title: '추가 완료',
        description: '새 포트가 추가되었습니다.',
      });
    }

    setDialogOpen(false);
  };

  const polPorts = ports.filter(p => p.type === 'POL');
  const podPorts = ports.filter(p => p.type === 'POD');

  return (
    <div className="space-y-4">
      {/* Header Section - Compact Design */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-3 text-white shadow-lg">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10 blur-2xl"></div>
        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-24 w-24 rounded-full bg-white/10 blur-2xl"></div>
        <div className="relative flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-white/20 backdrop-blur-sm rounded-lg">
              <Anchor className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-lg font-bold">포트 관리</h2>
              <p className="text-xs text-blue-100">선적포트(POL)와 양하포트(POD)를 관리합니다</p>
            </div>
          </div>
          <Button 
            onClick={handleAdd}
            size="sm"
            className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border border-white/50 h-7 text-xs"
          >
            <Plus className="h-3 w-3 mr-1" />
            추가
          </Button>
        </div>
      </div>

      {/* POL Ports */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg shadow-sm">
            <Ship className="h-4 w-4 text-white" />
          </div>
          <h4 className="text-base font-bold text-blue-700">선적포트 (POL) - {polPorts.length}개</h4>
        </div>
        <div className="rounded-lg overflow-hidden shadow-sm border">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-blue-500 to-indigo-500">
                <TableHead className="h-9 text-xs text-white font-bold whitespace-nowrap">포트명</TableHead>
                <TableHead className="h-9 text-xs text-white font-bold whitespace-nowrap">국가</TableHead>
                <TableHead className="h-9 text-xs text-white font-bold whitespace-nowrap">설명</TableHead>
                <TableHead className="h-9 text-xs text-right text-white font-bold whitespace-nowrap">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {polPorts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <Ship className="h-12 w-12 opacity-20" />
                      <p className="text-sm">등록된 선적포트가 없습니다</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                polPorts.map((port) => (
                  <TableRow key={port.id} className="hover:bg-blue-50">
                    <TableCell className="py-2 text-xs font-medium whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg shadow-sm">
                          <Anchor className="h-3 w-3 text-white" />
                        </div>
                        <span className="text-gray-900">{port.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-2 text-xs text-gray-600 whitespace-nowrap">{port.country}</TableCell>
                    <TableCell className="py-2 text-xs text-gray-600 whitespace-nowrap">{port.description || '-'}</TableCell>
                    <TableCell className="py-2 text-right whitespace-nowrap">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(port)}
                          className="h-6 px-2 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-300"
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(port.id)}
                          className="h-6 w-6 p-0 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* POD Ports */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg shadow-sm">
            <Globe className="h-4 w-4 text-white" />
          </div>
          <h4 className="text-base font-bold text-purple-700">양하포트 (POD) - {podPorts.length}개</h4>
        </div>
        <div className="rounded-lg overflow-hidden shadow-sm border">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-purple-500 to-pink-500">
                <TableHead className="h-9 text-xs text-white font-bold whitespace-nowrap">포트명</TableHead>
                <TableHead className="h-9 text-xs text-white font-bold whitespace-nowrap">국가</TableHead>
                <TableHead className="h-9 text-xs text-white font-bold whitespace-nowrap">설명</TableHead>
                <TableHead className="h-9 text-xs text-right text-white font-bold whitespace-nowrap">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {podPorts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12">
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <Globe className="h-12 w-12 opacity-20" />
                      <p className="text-sm">등록된 양하포트가 없습니다</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                podPorts.map((port) => (
                  <TableRow key={port.id} className="hover:bg-purple-50">
                    <TableCell className="py-2 text-xs font-medium whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg shadow-sm">
                          <Anchor className="h-3 w-3 text-white" />
                        </div>
                        <span className="text-gray-900">{port.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-2 text-xs text-gray-600 whitespace-nowrap">{port.country}</TableCell>
                    <TableCell className="py-2 text-xs text-gray-600 whitespace-nowrap">{port.description || '-'}</TableCell>
                    <TableCell className="py-2 text-right whitespace-nowrap">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(port)}
                          className="h-6 px-2 text-xs bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-300"
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(port.id)}
                          className="h-6 w-6 p-0 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <div className="p-2 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg">
                <Anchor className="h-5 w-5 text-white" />
              </div>
              {editingPort ? '포트 수정' : '포트 추가'}
            </DialogTitle>
            <DialogDescription>포트 정보를 입력하세요</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">포트명 *</Label>
              <Input
                placeholder="예: 부산, 청도"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">포트 유형 *</Label>
              <select
                className="w-full h-10 px-3 border border-gray-300 rounded-md focus:border-blue-500 focus:ring-blue-500"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as PortType })}
              >
                <option value="POL">선적포트 (POL)</option>
                <option value="POD">양하포트 (POD)</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">국가 *</Label>
              <Input
                placeholder="예: 한국, 중국"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">설명</Label>
              <Input
                placeholder="예: 부산항, 칭다오항"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDialogOpen(false)}
              className="hover:bg-gray-100"
            >
              취소
            </Button>
            <Button 
              onClick={handleSubmit}
              className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg"
            >
              {editingPort ? <><Pencil className="h-4 w-4 mr-2" />수정</> : <><Plus className="h-4 w-4 mr-2" />추가</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}