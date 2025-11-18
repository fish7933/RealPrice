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
              <TabsList className="grid w-full grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-12 gap-3 mb-6 bg-transparent p-0 h-auto">
                <TabsTrigger 
                  value="agents" 
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-gray-200 bg-white hover:bg-gradient-to-br hover:from-blue-50 hover:to-cyan-50 hover:border-blue-300 transition-all data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white data-[state=active]:border-blue-500 data-[state=active]:shadow-lg data-[state=active]:scale-105"
                >
                  <Users className="h-6 w-6" />
                  <span className="text-xs font-semibold text-center leading-tight">선사&중국<br/>파트너사</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="ports" 
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-gray-200 bg-white hover:bg-gradient-to-br hover:from-cyan-50 hover:to-teal-50 hover:border-cyan-300 transition-all data-[state=active]:bg-gradient-to-br data-[state=active]:from-cyan-500 data-[state=active]:to-teal-500 data-[state=active]:text-white data-[state=active]:border-cyan-500 data-[state=active]:shadow-lg data-[state=active]:scale-105"
                >
                  <Anchor className="h-6 w-6" />
                  <span className="text-xs font-semibold text-center">포트</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="destinations" 
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-gray-200 bg-white hover:bg-gradient-to-br hover:from-teal-50 hover:to-green-50 hover:border-teal-300 transition-all data-[state=active]:bg-gradient-to-br data-[state=active]:from-teal-500 data-[state=active]:to-green-500 data-[state=active]:text-white data-[state=active]:border-teal-500 data-[state=active]:shadow-lg data-[state=active]:scale-105"
                >
                  <MapPin className="h-6 w-6" />
                  <span className="text-xs font-semibold text-center">최종목적지</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="sea-freight" 
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-gray-200 bg-white hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 hover:border-blue-300 transition-all data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:border-blue-500 data-[state=active]:shadow-lg data-[state=active]:scale-105"
                >
                  <Ship className="h-6 w-6" />
                  <span className="text-xs font-semibold text-center">해상운임</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="agent-sea-freight" 
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-gray-200 bg-white hover:bg-gradient-to-br hover:from-purple-50 hover:to-pink-50 hover:border-purple-300 transition-all data-[state=active]:bg-gradient-to-br data-[state=active]:from-purple-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:border-purple-500 data-[state=active]:shadow-lg data-[state=active]:scale-105"
                >
                  <Star className="h-6 w-6" />
                  <span className="text-xs font-semibold text-center leading-tight">대리점<br/>해상운임</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="dthc" 
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-gray-200 bg-white hover:bg-gradient-to-br hover:from-orange-50 hover:to-red-50 hover:border-orange-300 transition-all data-[state=active]:bg-gradient-to-br data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:border-orange-500 data-[state=active]:shadow-lg data-[state=active]:scale-105"
                >
                  <FileText className="h-6 w-6" />
                  <span className="text-xs font-semibold text-center">D/O</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="combined-freight" 
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-gray-200 bg-white hover:bg-gradient-to-br hover:from-emerald-50 hover:to-teal-50 hover:border-emerald-300 transition-all data-[state=active]:bg-gradient-to-br data-[state=active]:from-emerald-500 data-[state=active]:to-teal-500 data-[state=active]:text-white data-[state=active]:border-emerald-500 data-[state=active]:shadow-lg data-[state=active]:scale-105"
                >
                  <Merge className="h-6 w-6" />
                  <span className="text-xs font-semibold text-center leading-tight">철도+트럭<br/>통합운임</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="port-border" 
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-gray-200 bg-white hover:bg-gradient-to-br hover:from-violet-50 hover:to-purple-50 hover:border-violet-300 transition-all data-[state=active]:bg-gradient-to-br data-[state=active]:from-violet-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:border-violet-500 data-[state=active]:shadow-lg data-[state=active]:scale-105"
                >
                  <Train className="h-6 w-6" />
                  <span className="text-xs font-semibold text-center">철도운임</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="border-destination" 
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-gray-200 bg-white hover:bg-gradient-to-br hover:from-amber-50 hover:to-orange-50 hover:border-amber-300 transition-all data-[state=active]:bg-gradient-to-br data-[state=active]:from-amber-500 data-[state=active]:to-orange-500 data-[state=active]:text-white data-[state=active]:border-amber-500 data-[state=active]:shadow-lg data-[state=active]:scale-105"
                >
                  <Truck className="h-6 w-6" />
                  <span className="text-xs font-semibold text-center">트럭운임</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="weight-surcharge" 
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-gray-200 bg-white hover:bg-gradient-to-br hover:from-rose-50 hover:to-pink-50 hover:border-rose-300 transition-all data-[state=active]:bg-gradient-to-br data-[state=active]:from-rose-500 data-[state=active]:to-pink-500 data-[state=active]:text-white data-[state=active]:border-rose-500 data-[state=active]:shadow-lg data-[state=active]:scale-105"
                >
                  <Weight className="h-6 w-6" />
                  <span className="text-xs font-semibold text-center">중량할증</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="dp-costs" 
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-gray-200 bg-white hover:bg-gradient-to-br hover:from-sky-50 hover:to-blue-50 hover:border-sky-300 transition-all data-[state=active]:bg-gradient-to-br data-[state=active]:from-sky-500 data-[state=active]:to-blue-500 data-[state=active]:text-white data-[state=active]:border-sky-500 data-[state=active]:shadow-lg data-[state=active]:scale-105"
                >
                  <Package className="h-6 w-6" />
                  <span className="text-xs font-semibold text-center">DP</span>
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