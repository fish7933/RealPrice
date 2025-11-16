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

  const isAdmin = user?.role === 'admin';

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
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Train className="h-5 w-5" />
            철도 대리점 관리
          </h3>
          <p className="text-gray-600 mt-1 text-sm">철도 운송을 담당하는 대리점을 관리합니다</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            대리점 추가
          </Button>
        )}
      </div>

      <Alert>
        <Train className="h-4 w-4" />
        <AlertDescription>
          <strong>철도 대리점:</strong> 중국 항구에서 KASHGAR 국경까지 철도 운송을 담당하는 대리점입니다.
          <br />
          <span className="text-sm text-gray-600 mt-1 block">
            대리점을 삭제하면 해당 대리점과 관련된 모든 운임 데이터(대리점별 해상운임, 포트국경운임)가 함께 삭제됩니다.
          </span>
        </AlertDescription>
      </Alert>

      <div className="border rounded-lg overflow-hidden bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>대리점명</TableHead>
              <TableHead>설명</TableHead>
              <TableHead>등록일</TableHead>
              {isAdmin && <TableHead className="text-right">작업</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {railAgents.length > 0 ? (
              railAgents.map((agent) => (
                <TableRow key={agent.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Train className="h-4 w-4 text-blue-600" />
                      {agent.name}
                    </div>
                  </TableCell>
                  <TableCell>{agent.description || '-'}</TableCell>
                  <TableCell>{new Date(agent.createdAt).toLocaleDateString('ko-KR')}</TableCell>
                  {isAdmin && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(agent)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(agent.id, agent.name)}
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
                  등록된 철도 대리점이 없습니다
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
            <DialogTitle>철도 대리점 추가</DialogTitle>
            <DialogDescription>새로운 철도 대리점 정보를 입력하세요.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>대리점명 *</Label>
              <Input
                placeholder="예: 하버링크, WJ, LB"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>설명</Label>
              <Textarea
                placeholder="대리점에 대한 설명을 입력하세요"
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
            <DialogTitle>철도 대리점 수정</DialogTitle>
            <DialogDescription>대리점 정보를 수정하세요.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>대리점명 *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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