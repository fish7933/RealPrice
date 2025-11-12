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
import { Plus, Pencil, Trash2, Anchor } from 'lucide-react';
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
      description: '항구가 삭제되었습니다.',
    });
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.country) {
      toast({
        title: '입력 오류',
        description: '항구명과 국가를 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }

    if (editingPort) {
      await updatePort(editingPort.id, formData);
      toast({
        title: '수정 완료',
        description: '항구 정보가 수정되었습니다.',
      });
    } else {
      await addPort(formData);
      toast({
        title: '추가 완료',
        description: '새 항구가 추가되었습니다.',
      });
    }

    setDialogOpen(false);
  };

  const polPorts = ports.filter(p => p.type === 'POL');
  const podPorts = ports.filter(p => p.type === 'POD');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Anchor className="h-5 w-5" />
            항구 관리
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            출발항(POL)과 도착항(POD)을 관리합니다
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="h-4 w-4 mr-2" />
          항구 추가
        </Button>
      </div>

      {/* POL Ports */}
      <div>
        <h4 className="text-md font-semibold mb-3 text-blue-700">출발항 (POL) - {polPorts.length}개</h4>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>항구명</TableHead>
                <TableHead>국가</TableHead>
                <TableHead>설명</TableHead>
                <TableHead className="text-right">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {polPorts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-gray-500">
                    등록된 출발항이 없습니다
                  </TableCell>
                </TableRow>
              ) : (
                polPorts.map((port) => (
                  <TableRow key={port.id}>
                    <TableCell className="font-medium">{port.name}</TableCell>
                    <TableCell>{port.country}</TableCell>
                    <TableCell className="text-gray-600">{port.description || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(port)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(port.id)}
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
      </div>

      {/* POD Ports */}
      <div>
        <h4 className="text-md font-semibold mb-3 text-green-700">도착항 (POD) - {podPorts.length}개</h4>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>항구명</TableHead>
                <TableHead>국가</TableHead>
                <TableHead>설명</TableHead>
                <TableHead className="text-right">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {podPorts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-gray-500">
                    등록된 도착항이 없습니다
                  </TableCell>
                </TableRow>
              ) : (
                podPorts.map((port) => (
                  <TableRow key={port.id}>
                    <TableCell className="font-medium">{port.name}</TableCell>
                    <TableCell>{port.country}</TableCell>
                    <TableCell className="text-gray-600">{port.description || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(port)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(port.id)}
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
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPort ? '항구 수정' : '항구 추가'}
            </DialogTitle>
            <DialogDescription>
              항구 정보를 입력하세요
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>항구명 *</Label>
              <Input
                placeholder="예: 부산, 청도"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>항구 유형 *</Label>
              <select
                className="w-full h-10 px-3 border rounded-md"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as PortType })}
              >
                <option value="POL">출발항 (POL)</option>
                <option value="POD">도착항 (POD)</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>국가 *</Label>
              <Input
                placeholder="예: 한국, 중국"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>설명</Label>
              <Input
                placeholder="예: 부산항, 칭다오항"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleSubmit}>
              {editingPort ? '수정' : '추가'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}