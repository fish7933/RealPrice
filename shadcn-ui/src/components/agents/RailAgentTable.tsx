import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFreight } from '@/contexts/FreightContext';
import { RailAgent } from '@/types/freight';
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
import { Pencil, Trash2, Plus, Train } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function RailAgentTable() {
  const { user } = useAuth();
  const { railAgents, addRailAgent, updateRailAgent, deleteRailAgent } = useFreight();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<RailAgent | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';

  const handleAdd = () => {
    if (!formData.name.trim()) return;

    addRailAgent({
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
    });

    setFormData({ name: '', description: '' });
    setIsAddDialogOpen(false);
  };

  const handleEdit = (agent: RailAgent) => {
    setEditingAgent(agent);
    setFormData({
      name: agent.name,
      description: agent.description || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!editingAgent || !formData.name.trim()) return;

    updateRailAgent(editingAgent.id, {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
    });

    setFormData({ name: '', description: '' });
    setIsEditDialogOpen(false);
    setEditingAgent(null);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`"${name}" 철도 대리점을 삭제하시겠습니까?\n\n관련된 모든 데이터(대리점별 해상운임, 포트국경운임)도 함께 삭제됩니다.`)) {
      deleteRailAgent(id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Section with Gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 p-8 text-white shadow-2xl">
        <div className="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-white/10 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-32 w-32 rounded-full bg-white/10 blur-3xl"></div>
        <div className="relative flex justify-between items-start">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <Train className="h-8 w-8" />
              </div>
              <div>
                <h3 className="text-3xl font-bold">철도 대리점 관리</h3>
                <p className="text-blue-100 mt-1">철도 운송을 담당하는 대리점을 관리합니다</p>
              </div>
            </div>
          </div>
          {isAdmin && (
            <Button 
              onClick={() => setIsAddDialogOpen(true)}
              className="bg-white text-blue-600 hover:bg-blue-50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <Plus className="h-4 w-4 mr-2" />
              대리점 추가
            </Button>
          )}
        </div>
      </div>

      {/* Info Alert */}
      <Alert className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 shadow-md">
        <Train className="h-4 w-4 text-blue-600" />
        <AlertDescription>
          <strong className="text-blue-700">철도 대리점:</strong> 중국 항구에서 KASHGAR 국경까지 철도 운송을 담당하는 대리점입니다.
          <br />
          <span className="text-sm text-gray-600 mt-1 block">
            ⚠️ 대리점을 삭제하면 해당 대리점과 관련된 모든 운임 데이터(대리점별 해상운임, 포트국경운임)가 함께 삭제됩니다.
          </span>
        </AlertDescription>
      </Alert>

      {/* Table with Modern Design */}
      <div className="rounded-2xl overflow-hidden shadow-xl border border-gray-100">
        <Table>
          <TableHeader>
            <TableRow className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600">
              <TableHead className="text-white font-semibold">대리점명</TableHead>
              <TableHead className="text-white font-semibold">설명</TableHead>
              <TableHead className="text-white font-semibold">등록일</TableHead>
              {isAdmin && <TableHead className="text-right text-white font-semibold">작업</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {railAgents.length > 0 ? (
              railAgents.map((agent, index) => (
                <TableRow 
                  key={agent.id}
                  className={`
                    ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                    hover:bg-blue-50 transition-colors duration-200
                  `}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg shadow-md">
                        <Train className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-gray-900">{agent.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-600">{agent.description || '-'}</TableCell>
                  <TableCell className="text-gray-500 text-sm">
                    {new Date(agent.createdAt).toLocaleDateString('ko-KR')}
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(agent)}
                          className="hover:bg-blue-100 hover:text-blue-600 transition-all duration-200 hover:scale-110"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(agent.id, agent.name)}
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
                    <Train className="h-16 w-16 opacity-20" />
                    <p className="text-lg">등록된 철도 대리점이 없습니다</p>
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
              <div className="p-2 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-lg">
                <Train className="h-5 w-5 text-white" />
              </div>
              철도 대리점 추가
            </DialogTitle>
            <DialogDescription>새로운 철도 대리점 정보를 입력하세요.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">대리점명 *</Label>
              <Input
                placeholder="예: 하버링크, WJ, LB"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">설명</Label>
              <Textarea
                placeholder="대리점에 대한 설명을 입력하세요"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 min-h-[100px]"
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
              className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white shadow-lg"
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
              <div className="p-2 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-lg">
                <Pencil className="h-5 w-5 text-white" />
              </div>
              철도 대리점 수정
            </DialogTitle>
            <DialogDescription>대리점 정보를 수정하세요.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">대리점명 *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">설명</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 min-h-[100px]"
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
              className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-lg"
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