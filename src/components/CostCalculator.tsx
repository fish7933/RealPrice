import { useState } from 'react';
import { FreightRoute } from '@/types/freight';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calculator } from 'lucide-react';

interface CostCalculatorProps {
  routes: FreightRoute[];
}

export default function CostCalculator({ routes }: CostCalculatorProps) {
  const [selectedRouteId, setSelectedRouteId] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('1');
  const [calculatedCost, setCalculatedCost] = useState<number | null>(null);

  const handleCalculate = () => {
    const route = routes.find((r) => r.id === selectedRouteId);
    if (route && quantity) {
      const total = route.oceanFreight * Number(quantity);
      setCalculatedCost(total);
    }
  };

  const selectedRoute = routes.find((r) => r.id === selectedRouteId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          운임 원가 계산기
        </CardTitle>
        <CardDescription>경로를 선택하고 수량을 입력하여 총 운임을 계산하세요</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="route">운임 경로 선택</Label>
          <Select value={selectedRouteId} onValueChange={setSelectedRouteId}>
            <SelectTrigger id="route">
              <SelectValue placeholder="경로를 선택하세요" />
            </SelectTrigger>
            <SelectContent>
              {routes.map((route) => (
                <SelectItem key={route.id} value={route.id}>
                  {route.pol} → {route.pod} (${route.oceanFreight}) - {route.shippingCompany}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedRoute && (
          <Alert>
            <AlertDescription>
              <div className="space-y-1">
                <p>
                  <strong>선택된 경로:</strong> {selectedRoute.pol} → {selectedRoute.pod}
                </p>
                <p>
                  <strong>단가:</strong> ${selectedRoute.oceanFreight}
                </p>
                <p>
                  <strong>선사:</strong> {selectedRoute.shippingCompany}
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="quantity">수량 (컨테이너)</Label>
          <Input
            id="quantity"
            type="number"
            min="1"
            placeholder="수량을 입력하세요"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
        </div>

        <Button onClick={handleCalculate} disabled={!selectedRouteId || !quantity} className="w-full">
          총 운임 계산
        </Button>

        {calculatedCost !== null && (
          <Alert className="bg-primary/10 border-primary">
            <AlertDescription>
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">총 운임 비용</p>
                <p className="text-3xl font-bold text-primary">${calculatedCost.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">
                  (${selectedRoute?.oceanFreight} × {quantity} 컨테이너)
                </p>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}