import { useState } from 'react';
import { FreightRoute } from '@/types/freight';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface AddRouteFormProps {
  onAddRoute: (route: Omit<FreightRoute, 'id' | 'createdAt'>) => void;
}

export default function AddRouteForm({ onAddRoute }: AddRouteFormProps) {
  const [formData, setFormData] = useState({
    pol: '',
    pod: '',
    oceanFreight: '',
    shippingCompany: '',
    additionalInfo: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.pol || !formData.pod || !formData.oceanFreight || !formData.shippingCompany) {
      toast.error('필수 항목을 모두 입력해주세요');
      return;
    }

    onAddRoute({
      pol: formData.pol,
      pod: formData.pod,
      oceanFreight: Number(formData.oceanFreight),
      shippingCompany: formData.shippingCompany,
      additionalInfo: formData.additionalInfo || undefined,
    });

    setFormData({
      pol: '',
      pod: '',
      oceanFreight: '',
      shippingCompany: '',
      additionalInfo: '',
    });

    toast.success('새 운임 경로가 추가되었습니다');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>새 운임 경로 추가</CardTitle>
        <CardDescription>새로운 운임 정보를 입력하세요</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pol">POL (선적항) *</Label>
              <Input
                id="pol"
                placeholder="예: 부산"
                value={formData.pol}
                onChange={(e) => setFormData({ ...formData, pol: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pod">POD (양하항) *</Label>
              <Input
                id="pod"
                placeholder="예: 청도"
                value={formData.pod}
                onChange={(e) => setFormData({ ...formData, pod: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="oceanFreight">O/F (운임) *</Label>
              <Input
                id="oceanFreight"
                type="number"
                placeholder="예: 420"
                value={formData.oceanFreight}
                onChange={(e) => setFormData({ ...formData, oceanFreight: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shippingCompany">선사 *</Label>
              <Input
                id="shippingCompany"
                placeholder="예: 흥아"
                value={formData.shippingCompany}
                onChange={(e) => setFormData({ ...formData, shippingCompany: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="additionalInfo">비고</Label>
            <Input
              id="additionalInfo"
              placeholder="추가 정보 (선택사항)"
              value={formData.additionalInfo}
              onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
            />
          </div>

          <Button type="submit" className="w-full">
            운임 경로 추가
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}