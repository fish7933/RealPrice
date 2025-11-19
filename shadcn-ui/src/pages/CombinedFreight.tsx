import { useState } from 'react';
import Layout from '@/components/layout/Layout';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { CombinedFreight as CombinedFreightType } from '@/types/freight';

export default function CombinedFreight() {
  const {
    combinedFreights,
    addCombinedFreight,
    updateCombinedFreight,
    deleteCombinedFreight,
    railAgents,
    destinations,
    ports,
  } = useFreight();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingFreight, setEditingFreight] = useState<CombinedFreightType | null>(null);

  const [formData, setFormData] = useState({
    agent: '',
    pod: '',
    destinationId: '',
    rate: '',
    description: '',
  });

  // Get POD ports from the ports list
  const podPorts = ports.filter(p => p.type === 'POD');

  const resetForm = () => {
    setFormData({
      agent: '',
      pod: '',
      destinationId: '',
      rate: '',
      description: '',
    });
  };

  const handleAdd = () => {
    if (!formData.agent || !formData.pod || !formData.destinationId || !formData.rate) {
      alert('대리점, 중국항, 목적지, 운임을 모두 입력해주세요.');
      return;
    }

    addCombinedFreight({
      agent: formData.agent,
      pod: formData.pod,
      destinationId: formData.destinationId,
      rate: parseFloat(formData.rate),
      description: formData.description,
    });

    resetForm();
    setIsAddDialogOpen(false);
  };

  const handleEdit = (freight: CombinedFreightType) => {
    setEditingFreight(freight);
    setFormData({
      agent: freight.agent,
      pod: freight.pod,
      destinationId: freight.destinationId,
      rate: freight.rate.toString(),
      description: freight.description || '',
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!editingFreight) return;

    if (!formData.agent || !formData.pod || !formData.destinationId || !formData.rate) {
      alert('대리점, 중국항, 목적지, 운임을 모두 입력해주세요.');
      return;
    }

    updateCombinedFreight(editingFreight.id, {
      agent: formData.agent,
      pod: formData.pod,
      destinationId: formData.destinationId,
      rate: parseFloat(formData.rate),
      description: formData.description,
    });

    resetForm();
    setIsEditDialogOpen(false);
    setEditingFreight(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('정말 삭제하시겠습니까?')) {
      deleteCombinedFreight(id);
    }
  };

  const getDestinationName = (destinationId: string) => {
    const destination = destinations.find((d) => d.id === destinationId);
    return destination ? destination.name : destinationId;
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">통합 운임 관리</h1>
            <p className="text-gray-700 mt-2">
              대리점별 중국항 → 최종목적지 통합 운임을 관리합니다. 통합 운임이 설정되면 철도+트럭 분리 운임 대신 사용됩니다.
            </p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="mr-2 h-4 w-4" />
                통합 운임 추가
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>통합 운임 추가</DialogTitle>
                <DialogDescription>
                  새로운 통합 운임을 추가합니다. 중국항에서 최종목적지까지의 일괄 운임입니다.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="agent">대리점 *</Label>
                  <Select value={formData.agent} onValueChange={(value) => setFormData({ ...formData, agent: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="대리점 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {railAgents.map((agent) => (
                        <SelectItem key={agent.id} value={agent.name}>
                          {agent.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="pod">중국항 (POD) *</Label>
                  {podPorts.length > 0 ? (
                    <Select value={formData.pod} onValueChange={(value) => setFormData({ ...formData, pod: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="중국항 선택" />
                      </SelectTrigger>
                      <SelectContent>
                        {podPorts.map((port) => (
                          <SelectItem key={port.id} value={port.name}>
                            {port.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="text-sm text-gray-800 p-3 bg-gray-50 rounded border">
                      도착항(POD)을 먼저 등록해주세요. (운송사 탭 → 포트 관리)
                    </div>
                  )}
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="destination">최종목적지 *</Label>
                  <Select
                    value={formData.destinationId}
                    onValueChange={(value) => setFormData({ ...formData, destinationId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="목적지 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {destinations.map((dest) => (
                        <SelectItem key={dest.id} value={dest.id}>
                          {dest.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="rate">통합 운임 (USD) *</Label>
                  <Input
                    id="rate"
                    type="number"
                    step="0.01"
                    placeholder="예: 4550"
                    value={formData.rate}
                    onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">설명</Label>
                  <Input
                    id="description"
                    placeholder="예: 청도→OSH 통합 운임"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  취소
                </Button>
                <Button onClick={handleAdd}>추가</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>대리점</TableHead>
                <TableHead>중국항</TableHead>
                <TableHead>최종목적지</TableHead>
                <TableHead className="text-right">통합 운임 (USD)</TableHead>
                <TableHead>설명</TableHead>
                <TableHead className="text-right">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {combinedFreights.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-700">
                    등록된 통합 운임이 없습니다.
                  </TableCell>
                </TableRow>
              ) : (
                combinedFreights.map((freight) => (
                  <TableRow key={freight.id}>
                    <TableCell className="font-medium">{freight.agent}</TableCell>
                    <TableCell>{freight.pod}</TableCell>
                    <TableCell>{getDestinationName(freight.destinationId)}</TableCell>
                    <TableCell className="text-right font-mono">${freight.rate.toFixed(2)}</TableCell>
                    <TableCell className="text-gray-700">{freight.description || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(freight)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(freight.id)}>
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

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>통합 운임 수정</DialogTitle>
              <DialogDescription>통합 운임 정보를 수정합니다.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-agent">대리점 *</Label>
                <Select value={formData.agent} onValueChange={(value) => setFormData({ ...formData, agent: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="대리점 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {railAgents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.name}>
                        {agent.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-pod">중국항 (POD) *</Label>
                {podPorts.length > 0 ? (
                  <Select value={formData.pod} onValueChange={(value) => setFormData({ ...formData, pod: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="중국항 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {podPorts.map((port) => (
                        <SelectItem key={port.id} value={port.name}>
                          {port.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="text-sm text-gray-800 p-3 bg-gray-50 rounded border">
                    도착항(POD)을 먼저 등록해주세요. (운송사 탭 → 포트 관리)
                  </div>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-destination">최종목적지 *</Label>
                <Select
                  value={formData.destinationId}
                  onValueChange={(value) => setFormData({ ...formData, destinationId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="목적지 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    {destinations.map((dest) => (
                      <SelectItem key={dest.id} value={dest.id}>
                        {dest.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-rate">통합 운임 (USD) *</Label>
                <Input
                  id="edit-rate"
                  type="number"
                  step="0.01"
                  placeholder="예: 4550"
                  value={formData.rate}
                  onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">설명</Label>
                <Input
                  id="edit-description"
                  placeholder="예: 청도→OSH 통합 운임"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditDialogOpen(false);
                  setEditingFreight(null);
                  resetForm();
                }}
              >
                취소
              </Button>
              <Button onClick={handleUpdate}>수정</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}