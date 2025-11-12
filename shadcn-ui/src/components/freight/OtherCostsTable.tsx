import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useFreight } from '@/contexts/FreightContext';
import { OtherCost } from '@/types/freight';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash2, Plus, DollarSign, Package, FileText } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InlineEditCell } from '@/components/ui/inline-edit-cell';

export default function OtherCostsTable() {
  const { user } = useAuth();
  const { 
    otherCosts, 
    addOtherCost, 
    updateOtherCost, 
    deleteOtherCost,
    ports,
  } = useFreight();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    category: '',
    port: '',
    amount: '',
    description: '',
  });
  
  const [isDP, setIsDP] = useState(false);

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  
  // Get POL ports from the ports list
  const polPorts = ports.filter(p => p.type === 'POL');

  // Group costs by category
  const dpCosts = otherCosts.filter((c) => c.category === 'DP');
  const otherCostsByCategory = otherCosts
    .filter((c) => c.category !== 'DP')
    .reduce((acc, cost) => {
      if (!acc[cost.category]) {
        acc[cost.category] = [];
      }
      acc[cost.category].push(cost);
      return acc;
    }, {} as Record<string, OtherCost[]>);

  const handleAdd = () => {
    if (!formData.category || !formData.amount) return;
    if (formData.category === 'DP' && !formData.port) return;

    addOtherCost({
      category: formData.category,
      port: formData.category === 'DP' ? formData.port : undefined,
      amount: Number(formData.amount),
      description: formData.description || undefined,
    });

    setFormData({ category: '', port: '', amount: '', description: '' });
    setIsDP(false);
    setIsAddDialogOpen(false);
  };

  const handleUpdateField = (id: string, field: 'amount' | 'description', value: string | number) => {
    const cost = otherCosts.find(c => c.id === id);
    if (cost) {
      updateOtherCost(id, {
        ...cost,
        [field]: field === 'amount' ? Number(value) : value || undefined,
      });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('이 비용 항목을 삭제하시겠습니까?')) {
      deleteOtherCost(id);
    }
  };

  const handleCategoryChange = (value: string) => {
    setFormData({ ...formData, category: value, port: '' });
    setIsDP(value === 'DP');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">기타비용 관리</h2>
          <p className="text-gray-600 mt-1">DP (Disposal Container) 및 기타 비용 항목 설정</p>
        </div>
      </div>

      <Alert>
        <FileText className="h-4 w-4" />
        <AlertDescription>
          <strong>DP (Disposal Container):</strong> 운송한 컨테이너를 고객이 수령하여 재산권이 넘어가는 경우 운임에 포함되는 비용입니다. 부산과 인천의 금액이 다를 수 있습니다.
          <br />
          <span className="text-sm text-gray-600 mt-1 block">
            기타 비용 항목(통관비용, 보험료, 검사비, 창고료 등)을 자유롭게 추가할 수 있습니다.
          </span>
          <br />
          <span className="text-sm text-amber-700 mt-2 block font-semibold">
            ⚠️ D/O(DTHC)는 "대리점별 해상운임" 페이지에서 관리됩니다.
          </span>
        </AlertDescription>
      </Alert>

      {/* DP Costs */}
      <div className="border rounded-lg overflow-hidden bg-white">
        <div className="bg-blue-50 px-4 py-3 border-b flex justify-between items-center">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Package className="h-5 w-5" />
            DP (Disposal Container)
          </h3>
          {isAdmin && (
            <Button size="sm" onClick={() => {
              setIsDP(true);
              setFormData({ ...formData, category: 'DP' });
              setIsAddDialogOpen(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              추가
            </Button>
          )}
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>항구</TableHead>
              <TableHead>금액 (USD)</TableHead>
              <TableHead>설명</TableHead>
              {isAdmin && <TableHead className="text-right">작업</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {dpCosts.length > 0 ? (
              dpCosts.map((cost) => (
                <TableRow key={cost.id}>
                  <TableCell className="font-medium">{cost.port}</TableCell>
                  <TableCell>
                    <InlineEditCell
                      value={cost.amount}
                      onSave={(value) => handleUpdateField(cost.id, 'amount', value)}
                      type="number"
                      prefix="$"
                      isAdmin={isAdmin}
                    />
                  </TableCell>
                  <TableCell>
                    {cost.description ? (
                      <InlineEditCell
                        value={cost.description}
                        onSave={(value) => handleUpdateField(cost.id, 'description', value)}
                        type="text"
                        isAdmin={isAdmin}
                      />
                    ) : (
                      isAdmin ? (
                        <span
                          onClick={() => handleUpdateField(cost.id, 'description', '설명')}
                          className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded text-gray-400"
                          title="클릭하여 추가"
                        >
                          -
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )
                    )}
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(cost.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={isAdmin ? 4 : 3} className="text-center text-gray-500">
                  설정된 DP 비용이 없습니다
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Other Cost Categories */}
      {Object.entries(otherCostsByCategory).map(([category, costs]) => (
        <div key={category} className="border rounded-lg overflow-hidden bg-white">
          <div className="bg-gray-50 px-4 py-3 border-b">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              {category}
            </h3>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>금액 (USD)</TableHead>
                <TableHead>설명</TableHead>
                {isAdmin && <TableHead className="text-right">작업</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {costs.map((cost) => (
                <TableRow key={cost.id}>
                  <TableCell>
                    <InlineEditCell
                      value={cost.amount}
                      onSave={(value) => handleUpdateField(cost.id, 'amount', value)}
                      type="number"
                      prefix="$"
                      isAdmin={isAdmin}
                    />
                  </TableCell>
                  <TableCell>
                    {cost.description ? (
                      <InlineEditCell
                        value={cost.description}
                        onSave={(value) => handleUpdateField(cost.id, 'description', value)}
                        type="text"
                        isAdmin={isAdmin}
                      />
                    ) : (
                      isAdmin ? (
                        <span
                          onClick={() => handleUpdateField(cost.id, 'description', '설명')}
                          className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded text-gray-400"
                          title="클릭하여 추가"
                        >
                          -
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )
                    )}
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(cost.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ))}

      {Object.keys(otherCostsByCategory).length === 0 && (
        <div className="border rounded-lg bg-white p-8 text-center text-gray-500">
          <DollarSign className="h-12 w-12 mx-auto mb-3 text-gray-400" />
          <p>추가된 기타 비용 항목이 없습니다</p>
          <p className="text-sm mt-1">통관비용, 보험료, 검사비 등의 항목을 추가해보세요</p>
          {isAdmin && (
            <Button className="mt-4" onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              비용 추가
            </Button>
          )}
        </div>
      )}

      {/* Add Other Cost Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>기타비용 추가</DialogTitle>
            <DialogDescription>새로운 비용 항목을 입력하세요.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>카테고리</Label>
              <div className="flex gap-2">
                <Select value={isDP ? 'DP' : 'custom'} onValueChange={(value) => {
                  if (value === 'DP') {
                    handleCategoryChange('DP');
                  } else {
                    setIsDP(false);
                    setFormData({ ...formData, category: '', port: '' });
                  }
                }}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DP">DP</SelectItem>
                    <SelectItem value="custom">기타 항목</SelectItem>
                  </SelectContent>
                </Select>
                {!isDP && (
                  <Input
                    placeholder="카테고리 이름 (예: 통관비용, 보험료)"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="flex-1"
                  />
                )}
              </div>
              <p className="text-xs text-gray-500">
                {isDP ? 'DP는 항구별로 설정됩니다' : '새로운 카테고리 이름을 입력하세요'}
              </p>
            </div>
            {isDP && (
              <div className="space-y-2">
                <Label>항구</Label>
                {polPorts.length > 0 ? (
                  <Select value={formData.port} onValueChange={(value) => setFormData({ ...formData, port: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="항구 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {polPorts.map((port) => (
                        <SelectItem key={port.id} value={port.name}>
                          {port.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="text-sm text-gray-500 p-3 bg-gray-50 rounded border">
                    출발항(POL)을 먼저 등록해주세요. (운송사 탭 → 포트 관리)
                  </div>
                )}
              </div>
            )}
            <div className="space-y-2">
              <Label>금액 (USD)</Label>
              <Input
                type="number"
                placeholder="예: 150"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>설명 (선택)</Label>
              <Textarea
                placeholder="비용에 대한 설명을 입력하세요"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsAddDialogOpen(false);
              setFormData({ category: '', port: '', amount: '', description: '' });
              setIsDP(false);
            }}>
              취소
            </Button>
            <Button onClick={handleAdd}>추가</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}