import { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Ship, Train, Truck, Navigation, Star, FileText, Weight, Package, Merge, Anchor, Users, Database, MapPin, Sparkles } from 'lucide-react';
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

const ADMIN_TAB_STORAGE_KEY = 'admin-dashboard-active-tab';

export default function AdminDashboard() {
  // Load the last active tab from localStorage, default to "agents"
  const [activeTab, setActiveTab] = useState<string>(() => {
    const savedTab = localStorage.getItem(ADMIN_TAB_STORAGE_KEY);
    return savedTab || 'agents';
  });

  // Save the active tab to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(ADMIN_TAB_STORAGE_KEY, activeTab);
  }, [activeTab]);

  return (
    <Layout>
      <div className="space-y-6">
        {/* Beautiful Header with Gradient */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 p-8 shadow-xl">
          <div className="absolute inset-0 bg-grid-white/10"></div>
          <div className="relative">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
                <Database className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold text-white flex items-center gap-2">
                관리자 대시보드
                <Sparkles className="h-6 w-6 text-yellow-300 animate-pulse" />
              </h1>
            </div>
            <p className="text-blue-50 text-lg ml-16">운임 데이터 관리 및 설정</p>
          </div>
        </div>

        {/* Management Tabs with Beautiful Design */}
        <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-blue-50 via-cyan-50 to-teal-50 border-b-2 border-gradient-to-r from-blue-200 to-cyan-200">
            <CardTitle className="flex items-center gap-3 text-2xl">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg">
                <Database className="h-6 w-6 text-white" />
              </div>
              <span className="bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent font-bold">
                데이터 관리
              </span>
            </CardTitle>
            <CardDescription className="text-base text-gray-600 font-medium ml-14">
              각 항목별 데이터를 관리합니다
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5 lg:grid-cols-12 mb-6 bg-gradient-to-r from-blue-50 to-cyan-50 p-2 rounded-xl">
                <TabsTrigger 
                  value="agents" 
                  className="flex items-center gap-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-cyan-600 data-[state=active]:text-white transition-all hover:scale-105"
                >
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">선사&중국 파트너사</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="ports" 
                  className="flex items-center gap-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-600 data-[state=active]:to-teal-600 data-[state=active]:text-white transition-all hover:scale-105"
                >
                  <Anchor className="h-4 w-4" />
                  <span className="hidden sm:inline">포트</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="destinations" 
                  className="flex items-center gap-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-600 data-[state=active]:to-green-600 data-[state=active]:text-white transition-all hover:scale-105"
                >
                  <MapPin className="h-4 w-4" />
                  <span className="hidden sm:inline">최종목적지</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="sea-freight" 
                  className="flex items-center gap-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white transition-all hover:scale-105"
                >
                  <Ship className="h-4 w-4" />
                  <span className="hidden sm:inline">해상운임</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="agent-sea-freight" 
                  className="flex items-center gap-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all hover:scale-105"
                >
                  <Star className="h-4 w-4" />
                  <span className="hidden sm:inline">대리점 해상운임</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="dthc" 
                  className="flex items-center gap-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-red-600 data-[state=active]:text-white transition-all hover:scale-105"
                >
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">D/O</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="combined-freight" 
                  className="flex items-center gap-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-teal-600 data-[state=active]:text-white transition-all hover:scale-105"
                >
                  <Merge className="h-4 w-4" />
                  <span className="hidden sm:inline">철도+트럭 통합운임</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="port-border" 
                  className="flex items-center gap-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-purple-600 data-[state=active]:text-white transition-all hover:scale-105"
                >
                  <Train className="h-4 w-4" />
                  <span className="hidden sm:inline">철도운임</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="border-destination" 
                  className="flex items-center gap-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-600 data-[state=active]:to-orange-600 data-[state=active]:text-white transition-all hover:scale-105"
                >
                  <Truck className="h-4 w-4" />
                  <span className="hidden sm:inline">트럭운임</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="weight-surcharge" 
                  className="flex items-center gap-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-rose-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all hover:scale-105"
                >
                  <Weight className="h-4 w-4" />
                  <span className="hidden sm:inline">중량할증</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="dp-costs" 
                  className="flex items-center gap-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-sky-600 data-[state=active]:to-blue-600 data-[state=active]:text-white transition-all hover:scale-105"
                >
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