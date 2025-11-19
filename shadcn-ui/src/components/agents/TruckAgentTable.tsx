import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFreight } from '@/contexts/FreightContext';
import { TruckAgent } from '@/types/freight';
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
import { Pencil, Trash2, Plus, Truck } from 'lucide-react';

export default function TruckAgentTable() {
  const { user } = useAuth();
  const { truckAgents, addTruckAgent, updateTruckAgent, deleteTruckAgent } = useFreight();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<TruckAgent | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
  });

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  const handleAdd = () => {
    if (!formData.name.trim() || !formData.code.trim()) return;

    addTruckAgent({
      name: formData.name.trim(),
      code: formData.code.trim().toUpperCase(),
      description: formData.description.trim() || undefined,
    });

    setFormData({ name: '', code: '', description: '' });
    setIsAddDialogOpen(false);
  };

  const handleEdit = (agent: TruckAgent) => {
    setEditingAgent(agent);
    setFormData({
      name: agent.name,
      code: agent.code || '',
      description: agent.description || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!editingAgent || !formData.name.trim() || !formData.code.trim()) return;

    updateTruckAgent(editingAgent.id, {
      name: formData.name.trim(),
      code: formData.code.trim().toUpperCase(),
      description: formData.description.trim() || undefined,
    });

    setFormData({ name: '', code: '', description: '' });
    setIsEditDialogOpen(false);
    setEditingAgent(null);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`"${name}" 트럭 대리점을 삭제하시겠습니까?\n\n관련된 모든 데이터(국경목적지운임, 중량할증)도 함께 삭제됩니다.`)) {
      deleteTruckAgent(id);
    }
  };

  return (
    <div className="space-y-4">
      {/* Compact Header */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 p-3 text-white shadow-lg">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 h-24 w-24 rounded-full bg-white/10 blur-2xl"></div>
        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-24 w-24 rounded-full bg-white/10 blur-2xl"></div>
        <div className="relative flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="p-1 bg-white/20 backdrop-blur-sm rounded-lg">
              <Truck className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-lg font-bold">트럭 대리점 관리</h3>
              <p className="text-xs text-green-100">트럭 운송을 담당하는 대리점을 관리합니다</p>
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

      {/* Table with Compact Design */}
      <div className="rounded-lg overflow-hidden shadow-sm border">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-green-500 to-emerald-500">
              <TableHead className="h-9 text-xs text-white font-bold whitespace-nowrap">대리점명</TableHead>
              <TableHead className="h-9 text-xs text-white font-bold whitespace-nowrap">코드</TableHead>
              <TableHead className="h-9 text-xs text-white font-bold whitespace-nowrap">설명</TableHead>
              <TableHead className="h-9 text-xs text-white font-bold whitespace-nowrap">등록일</TableHead>
              {isAdmin && <TableHead className="h-9 text-xs text-right text-white font-bold whitespace-nowrap">작업</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {truckAgents.length > 0 ? (
              truckAgents.map((agent) => (
                <TableRow key={agent.id} className="hover:bg-green-50">
                  <TableCell className="py-2 text-xs font-medium whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg shadow-sm">
                        <Truck className="h-3 w-3 text-white" />
                      </div>
                      <span className="text-gray-900">{agent.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-2 text-xs whitespace-nowrap">
                    <span className="inline-flex items-center px-2 py-0.5 bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 rounded-full text-xs font-semibold shadow-sm">
                      {agent.code || '-'}
                    </span>
                  </TableCell>
                  <TableCell className="py-2 text-xs text-gray-600 whitespace-nowrap">{agent.description || '-'}</TableCell>
                  <TableCell className="py-2 text-xs text-gray-500 whitespace-nowrap">
                    {new Date(agent.createdAt).toLocaleDateString('ko-KR')}
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="py-2 text-right whitespace-nowrap">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(agent)}
                          className="h-6 px-2 text-xs bg-green-50 hover:bg-green-100 text-green-700 border-green-300"
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(agent.id, agent.name)}
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
                  <div className="flex flex-col items-center gap-2 text-gray-400">
                    <Truck className="h-12 w-12 opacity-20" />
                    <p className="text-sm">등록된 트럭 대리점이 없습니다</p>
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
              <div className="p-2 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg">
                <Truck className="h-5 w-5 text-white" />
              </div>
              트럭 대리점 추가
            </DialogTitle>
            <DialogDescription>새로운 트럭 대리점 정보를 입력하세요.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">대리점명 *</Label>
              <Input
                placeholder="예: COWIN"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="border-gray-300 focus:border-green-500 focus:ring-green-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">코드 * (2-3자)</Label>
              <Input
                placeholder="예: CWN, TRK"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                maxLength={3}
                className="border-gray-300 focus:border-green-500 focus:ring-green-500"
              />
              <p className="text-xs text-gray-500">운임 조회 시 표시될 고유 코드입니다 (2-3자, 자동으로 대문자 변환)</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">설명</Label>
              <Textarea
                placeholder="대리점에 대한 설명을 입력하세요"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="border-gray-300 focus:border-green-500 focus:ring-green-500 min-h-[100px]"
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
              disabled={!formData.name.trim() || !formData.code.trim()}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-lg"
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
              <div className="p-2 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-lg">
                <Pencil className="h-5 w-5 text-white" />
              </div>
              트럭 대리점 수정
            </DialogTitle>
            <DialogDescription>대리점 정보를 수정하세요.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">대리점명 *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">코드 * (2-3자)</Label>
              <Input
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                maxLength={3}
                className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500"
              />
              <p className="text-xs text-gray-500">운임 조회 시 표시될 고유 코드입니다 (2-3자, 자동으로 대문자 변환)</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">설명</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="border-gray-300 focus:border-emerald-500 focus:ring-emerald-500 min-h-[100px]"
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
              disabled={!formData.name.trim() || !formData.code.trim()}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg"
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