import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useFreight } from '@/contexts/FreightContext';
import { Calculator, History, TrendingDown, Package, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

export default function UserDashboard() {
  const { calculationHistory, destinations } = useFreight();

  // Get recent calculations (last 5)
  const recentCalculations = calculationHistory
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const stats = [
    {
      title: '총 계산 횟수',
      value: calculationHistory.length,
      icon: Calculator,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
    },
    {
      title: '최근 계산',
      value: calculationHistory.length > 0 ? format(new Date(calculationHistory[0].createdAt), 'MM/dd', { locale: ko }) : '-',
      icon: History,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Gray Header */}
        <div className="relative overflow-hidden rounded-xl bg-gray-800 p-4 shadow-xl">
          <div className="absolute inset-0 bg-grid-white/5"></div>
          <div className="relative">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white/10 backdrop-blur-sm rounded-lg">
                <Search className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">
                운임 조회
              </h1>
            </div>
            <p className="text-gray-300 text-sm ml-9">운임 계산 및 이력 조회</p>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link to="/calculator">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-gray-200">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-gray-100">
                    <Calculator className="h-6 w-6 text-gray-700" />
                  </div>
                  <div>
                    <CardTitle>원가 계산기</CardTitle>
                    <CardDescription>새로운 운임 계산하기</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>

          <Link to="/calculator?tab=history">
            <Card className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-gray-200">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-gray-100">
                    <History className="h-6 w-6 text-gray-700" />
                  </div>
                  <div>
                    <CardTitle>계산 이력</CardTitle>
                    <CardDescription>과거 조회 결과 조회</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>
        </div>

        {/* Recent Calculations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              최근 계산 이력
            </CardTitle>
            <CardDescription>최근 5개의 운임 조회 결과</CardDescription>
          </CardHeader>
          <CardContent>
            {recentCalculations.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>아직 계산 이력이 없습니다.</p>
                <p className="text-sm mt-1">원가 계산기를 사용해보세요.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentCalculations.map((calc) => {
                  const destination = destinations.find(d => d.id === calc.result.input.destinationId);
                  return (
                    <Link key={calc.id} to={`/calculator?history=${calc.id}`}>
                      <Card className="hover:bg-gray-50 transition-colors cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-semibold">
                                  {calc.result.input.pol} → {calc.result.input.pod} → {destination?.name || calc.destinationName}
                                </span>
                                <span className="text-xs px-2 py-0.5 bg-gray-100 rounded">
                                  {calc.result.input.weight}kg
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-sm text-gray-600">
                                <span className="flex items-center gap-1">
                                  <TrendingDown className="h-4 w-4 text-gray-600" />
                                  최저가: {calc.result.lowestCostAgent}
                                </span>
                                <span className="font-semibold text-gray-900">
                                  ${calc.result.lowestCost.toLocaleString()}
                                </span>
                              </div>
                            </div>
                            <div className="text-right text-sm text-gray-500">
                              {format(new Date(calc.createdAt), 'yyyy.MM.dd HH:mm', { locale: ko })}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Usage Guide */}
        <Card>
          <CardHeader>
            <CardTitle>사용 안내</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-gray-100 mt-0.5">
                <Calculator className="h-4 w-4 text-gray-700" />
              </div>
              <div>
                <h4 className="font-semibold mb-1">원가 계산기</h4>
                <p className="text-sm text-gray-600">
                  출발항, 도착항, 최종목적지, 중량을 입력하여 대리점별 운임을 비교할 수 있습니다.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-gray-100 mt-0.5">
                <History className="h-4 w-4 text-gray-700" />
              </div>
              <div>
                <h4 className="font-semibold mb-1">계산 이력</h4>
                <p className="text-sm text-gray-600">
                  과거에 계산한 운임 결과를 조회하고 상세 내역을 확인할 수 있습니다.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}