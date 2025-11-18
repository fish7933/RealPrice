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
import { Plus, Pencil, Trash2, Anchor, Ship, TrendingUp, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Port } from '@/types/freight';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
    <div className="space-y-6">
      {/* Header Section with Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-white/10 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-32 w-32 rounded-full bg-white/10 blur-3xl"></div>
        <div className="relative flex justify-between items-start">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <Anchor className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-3xl font-bold">포트 관리</h2>
                <p className="text-blue-100 mt-1">선적포트(POL)와 양하포트(POD)를 관리합니다</p>
              </div>
            </div>
          </div>
          <Button 
            onClick={handleAdd}
            className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            <Plus className="h-4 w-4 mr-2" />
            포트 추가
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">총 포트</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">{ports.length}</p>
              </div>
              <div className="p-4 bg-blue-100 rounded-full">
                <Anchor className="h-8 w-8 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br from-indigo-50 to-purple-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">선적포트 (POL)</p>
                <p className="text-3xl font-bold text-indigo-600 mt-2">{polPorts.length}</p>
              </div>
              <div className="p-4 bg-indigo-100 rounded-full">
                <Ship className="h-8 w-8 text-indigo-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg hover:shadow-xl transition-shadow duration-300 bg-gradient-to-br from-purple-50 to-pink-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">양하포트 (POD)</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">{podPorts.length}</p>
              </div>
              <div className="p-4 bg-purple-100 rounded-full">
                <Globe className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Alert */}
      <Alert className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-md">
        <Anchor className="h-4 w-4 text-blue-600" />
        <AlertDescription>
          <strong className="text-blue-700">포트 관리:</strong> POL(Port of Loading)은 화물을 선적하는 출발 항구이며, POD(Port of Discharge)는 화물을 양하하는 도착 항구입니다.
        </AlertDescription>
      </Alert>

      {/* POL Ports */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg shadow-md">
            <Ship className="h-5 w-5 text-white" />
          </div>
          <h4 className="text-xl font-bold text-blue-700">선적포트 (POL) - {polPorts.length}개</h4>
        </div>
        <div className="rounded-2xl overflow-hidden shadow-xl border border-gray-100">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600">
                <TableHead className="text-white font-semibold">포트명</TableHead>
                <TableHead className="text-white font-semibold">국가</TableHead>
                <TableHead className="text-white font-semibold">설명</TableHead>
                <TableHead className="text-right text-white font-semibold">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {polPorts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3 text-gray-400">
                      <Ship className="h-16 w-16 opacity-20" />
                      <p className="text-lg">등록된 선적포트가 없습니다</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                polPorts.map((port, index) => (
                  <TableRow 
                    key={port.id}
                    className={`
                      ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                      hover:bg-blue-50 transition-colors duration-200
                    `}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg shadow-md">
                          <Anchor className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-gray-900">{port.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-600">{port.country}</TableCell>
                    <TableCell className="text-gray-600">{port.description || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(port)}
                          className="hover:bg-blue-100 hover:text-blue-600 transition-all duration-200 hover:scale-110"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(port.id)}
                          className="hover:bg-red-100 hover:text-red-600 transition-all duration-200 hover:scale-110"
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
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg shadow-md">
            <Globe className="h-5 w-5 text-white" />
          </div>
          <h4 className="text-xl font-bold text-purple-700">양하포트 (POD) - {podPorts.length}개</h4>
        </div>
        <div className="rounded-2xl overflow-hidden shadow-xl border border-gray-100">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                <TableHead className="text-white font-semibold">포트명</TableHead>
                <TableHead className="text-white font-semibold">국가</TableHead>
                <TableHead className="text-white font-semibold">설명</TableHead>
                <TableHead className="text-right text-white font-semibold">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {podPorts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3 text-gray-400">
                      <Globe className="h-16 w-16 opacity-20" />
                      <p className="text-lg">등록된 양하포트가 없습니다</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                podPorts.map((port, index) => (
                  <TableRow 
                    key={port.id}
                    className={`
                      ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                      hover:bg-purple-50 transition-colors duration-200
                    `}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-purple-400 to-pink-500 rounded-lg shadow-md">
                          <Anchor className="h-4 w-4 text-white" />
                        </div>
                        <span className="text-gray-900">{port.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-600">{port.country}</TableCell>
                    <TableCell className="text-gray-600">{port.description || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(port)}
                          className="hover:bg-purple-100 hover:text-purple-600 transition-all duration-200 hover:scale-110"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(port.id)}
                          className="hover:bg-red-100 hover:text-red-600 transition-all duration-200 hover:scale-110"
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