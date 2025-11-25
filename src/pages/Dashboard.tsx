import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFreight } from '@/contexts/FreightContext';
import { Ship, Anchor, MapPin, Calculator, Train, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import RailAgentTable from '@/components/agents/RailAgentTable';
import TruckAgentTable from '@/components/agents/TruckAgentTable';

export default function Dashboard() {
  const { seaFreights, portBorderFreights, borderDestinationFreights, railAgents, truckAgents } = useFreight();

  const stats = [
    {
      title: '해상운임',
      value: seaFreights.length,
      description: '등록된 해상운임 경로',
      icon: Ship,
      link: '/sea-freight',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: '포트국경운임',
      value: portBorderFreights.length,
      description: '등록된 대리점',
      icon: Anchor,
      link: '/port-border',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: '국경목적지운임',
      value: borderDestinationFreights.length,
      description: '등록된 대리점',
      icon: MapPin,
      link: '/border-destination',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: '원가 계산',
      value: '계산기',
      description: '대리점별 운임 비교',
      icon: Calculator,
      link: '/calculator',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <Layout>
      <div className="space-y-6">
        <div className="py-1">
          <h1 className="text-xl font-bold">대시보드</h1>
          <p className="text-xs text-gray-600 mt-0.5">중앙아시아 컨테이너 운임 시스템</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Link key={stat.title} to={stat.link}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                    <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                      <Icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="text-xs text-gray-600 mt-1">{stat.description}</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Agent Management Section */}
        <Card>
          <CardHeader>
            <CardTitle>운송사</CardTitle>
            <CardDescription>철도 및 트럭 운송사 관리</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="rail" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="rail" className="flex items-center gap-2">
                  <Train className="h-4 w-4" />
                  철도 운송사 ({railAgents.length})
                </TabsTrigger>
                <TabsTrigger value="truck" className="flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  트럭 운송사 ({truckAgents.length})
                </TabsTrigger>
              </TabsList>
              <TabsContent value="rail">
                <RailAgentTable />
              </TabsContent>
              <TabsContent value="truck">
                <TruckAgentTable />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>시스템 소개</CardTitle>
            <CardDescription>중앙아시아 컨테이너 운임 계산 및 비교</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">주요 기능</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-0.5">•</span>
                  <span><strong>해상운임:</strong> 부산/인천 → 청도/천진/연운/다강 경로 관리</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-0.5">•</span>
                  <span><strong>포트국경운임:</strong> 중국항 → KASHGAR 구간 대리점별 운임 관리</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-0.5">•</span>
                  <span><strong>국경목적지운임:</strong> KASHGAR → 최종목적지 구간 대리점별 운임 관리</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-orange-600 mt-0.5">•</span>
                  <span><strong>원가 계산기:</strong> 전체 경로 대리점별 총 운임 자동 계산 및 최저가 비교</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">사용 권한</h3>
              <ul className="space-y-1 text-sm text-gray-700">
                <li className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">관리자</span>
                  <span>모든 데이터 조회, 추가, 수정, 삭제 가능</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">조회 전용</span>
                  <span>데이터 조회 및 원가 계산만 가능</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}