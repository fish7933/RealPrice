import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Ship, Train, Truck, Navigation, Star, FileText, Weight, Package, Merge, Anchor, Users, Database } from 'lucide-react';
import RailAgentTable from '@/components/agents/RailAgentTable';
import TruckAgentTable from '@/components/agents/TruckAgentTable';
import ShippingLineTable from '@/components/agents/ShippingLineTable';
import DestinationTable from '@/components/freight/DestinationTable';
import PortTable from '@/components/freight/PortTable';
import SeaFreightTable from '@/components/freight/SeaFreightTable';
import AgentSeaFreightTable from '@/components/freight/AgentSeaFreightTable';
import DTHCTable from '@/components/freight/DTHCTable';
import CombinedFreightTable from '@/components/freight/CombinedFreightTable';
import PortBorderTable from '@/components/freight/PortBorderTable';
import BorderDestinationTable from '@/components/freight/BorderDestinationTable';
import WeightSurchargeTable from '@/components/freight/WeightSurchargeTable';
import DPCostTable from '@/components/freight/DPCostTable';

export default function AdminDashboard() {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">관리자 대시보드</h1>
          <p className="text-gray-600 mt-2">운임 데이터 관리 및 설정</p>
        </div>

        {/* Management Tabs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Database className="h-5 w-5" />데이터 관리</CardTitle>
            <CardDescription>각 항목별 데이터를 관리합니다</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="agents" className="w-full">
              <TabsList className="grid w-full grid-cols-5 lg:grid-cols-12 mb-4">
                <TabsTrigger value="agents" className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">선사 & 중국 파트너사</span>
                </TabsTrigger>
                <TabsTrigger value="ports" className="flex items-center gap-1">
                  <Anchor className="h-4 w-4" />
                  <span className="hidden sm:inline">포트</span>
                </TabsTrigger>
                <TabsTrigger value="destinations" className="flex items-center gap-1">
                  <Navigation className="h-4 w-4" />
                  <span className="hidden sm:inline">최종목적지</span>
                </TabsTrigger>
                <TabsTrigger value="sea-freight" className="flex items-center gap-1">
                  <Ship className="h-4 w-4" />
                  <span className="hidden sm:inline">해상운임</span>
                </TabsTrigger>
                <TabsTrigger value="agent-sea-freight" className="flex items-center gap-1">
                  <Star className="h-4 w-4" />
                  <span className="hidden sm:inline">대리점 해상운임</span>
                </TabsTrigger>
                <TabsTrigger value="dthc" className="flex items-center gap-1">
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">D/O</span>
                </TabsTrigger>
                <TabsTrigger value="combined-freight" className="flex items-center gap-1">
                  <Merge className="h-4 w-4" />
                  <span className="hidden sm:inline">철도+트럭 통합운임</span>
                </TabsTrigger>
                <TabsTrigger value="port-border" className="flex items-center gap-1">
                  <Train className="h-4 w-4" />
                  <span className="hidden sm:inline">철도운임</span>
                </TabsTrigger>
                <TabsTrigger value="border-destination" className="flex items-center gap-1">
                  <Truck className="h-4 w-4" />
                  <span className="hidden sm:inline">트럭운임</span>
                </TabsTrigger>
                <TabsTrigger value="weight-surcharge" className="flex items-center gap-1">
                  <Weight className="h-4 w-4" />
                  <span className="hidden sm:inline">중량할증</span>
                </TabsTrigger>
                <TabsTrigger value="dp-costs" className="flex items-center gap-1">
                  <Package className="h-4 w-4" />
                  <span className="hidden sm:inline">DP</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="agents">
                <div className="space-y-6">
                  <ShippingLineTable />
                  <RailAgentTable />
                  <TruckAgentTable />
                </div>
              </TabsContent>

              <TabsContent value="ports">
                <PortTable />
              </TabsContent>

              <TabsContent value="destinations">
                <DestinationTable />
              </TabsContent>

              <TabsContent value="sea-freight">
                <SeaFreightTable />
              </TabsContent>

              <TabsContent value="agent-sea-freight">
                <AgentSeaFreightTable />
              </TabsContent>

              <TabsContent value="dthc">
                <DTHCTable />
              </TabsContent>

              <TabsContent value="combined-freight">
                <CombinedFreightTable />
              </TabsContent>

              <TabsContent value="port-border">
                <PortBorderTable />
              </TabsContent>

              <TabsContent value="border-destination">
                <BorderDestinationTable />
              </TabsContent>

              <TabsContent value="weight-surcharge">
                <WeightSurchargeTable />
              </TabsContent>

              <TabsContent value="dp-costs">
                <DPCostTable />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}