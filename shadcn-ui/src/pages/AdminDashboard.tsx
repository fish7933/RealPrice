import { useState, useEffect } from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Ship, Train, Truck, Navigation, Star, FileText, Weight, Package, Merge, Anchor, Users, Database, MapPin } from 'lucide-react';
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
        {/* Gray Header */}
        <div className="relative overflow-hidden rounded-xl bg-gray-800 p-4 shadow-xl">
          <div className="absolute inset-0 bg-grid-white/5"></div>
          <div className="relative">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white/10 backdrop-blur-sm rounded-lg">
                <Database className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-white">
                관리자 대시보드
              </h1>
            </div>
            <p className="text-gray-300 text-sm ml-9">운임 데이터 관리 및 설정</p>
          </div>
        </div>

        {/* Management Tabs */}
        <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm">
          <CardContent className="pt-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-12 gap-3 mb-6 bg-transparent p-0 h-auto">
                <TabsTrigger 
                  value="agents" 
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-400 transition-all data-[state=active]:bg-gray-700 data-[state=active]:text-white data-[state=active]:border-gray-700 data-[state=active]:shadow-lg data-[state=active]:scale-105"
                >
                  <Users className="h-6 w-6" />
                  <span className="text-xs font-semibold text-center leading-tight">선사&중국<br/>파트너사</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="ports" 
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-400 transition-all data-[state=active]:bg-gray-700 data-[state=active]:text-white data-[state=active]:border-gray-700 data-[state=active]:shadow-lg data-[state=active]:scale-105"
                >
                  <Anchor className="h-6 w-6" />
                  <span className="text-xs font-semibold text-center">포트</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="destinations" 
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-400 transition-all data-[state=active]:bg-gray-700 data-[state=active]:text-white data-[state=active]:border-gray-700 data-[state=active]:shadow-lg data-[state=active]:scale-105"
                >
                  <MapPin className="h-6 w-6" />
                  <span className="text-xs font-semibold text-center">최종목적지</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="sea-freight" 
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-400 transition-all data-[state=active]:bg-gray-700 data-[state=active]:text-white data-[state=active]:border-gray-700 data-[state=active]:shadow-lg data-[state=active]:scale-105"
                >
                  <Ship className="h-6 w-6" />
                  <span className="text-xs font-semibold text-center">해상운임</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="agent-sea-freight" 
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-400 transition-all data-[state=active]:bg-gray-700 data-[state=active]:text-white data-[state=active]:border-gray-700 data-[state=active]:shadow-lg data-[state=active]:scale-105"
                >
                  <Star className="h-6 w-6" />
                  <span className="text-xs font-semibold text-center leading-tight">대리점<br/>해상운임</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="dthc" 
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-400 transition-all data-[state=active]:bg-gray-700 data-[state=active]:text-white data-[state=active]:border-gray-700 data-[state=active]:shadow-lg data-[state=active]:scale-105"
                >
                  <FileText className="h-6 w-6" />
                  <span className="text-xs font-semibold text-center">D/O</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="combined-freight" 
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-400 transition-all data-[state=active]:bg-gray-700 data-[state=active]:text-white data-[state=active]:border-gray-700 data-[state=active]:shadow-lg data-[state=active]:scale-105"
                >
                  <Merge className="h-6 w-6" />
                  <span className="text-xs font-semibold text-center leading-tight">철도+트럭<br/>통합운임</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="port-border" 
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-400 transition-all data-[state=active]:bg-gray-700 data-[state=active]:text-white data-[state=active]:border-gray-700 data-[state=active]:shadow-lg data-[state=active]:scale-105"
                >
                  <Train className="h-6 w-6" />
                  <span className="text-xs font-semibold text-center">철도운임</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="border-destination" 
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-400 transition-all data-[state=active]:bg-gray-700 data-[state=active]:text-white data-[state=active]:border-gray-700 data-[state=active]:shadow-lg data-[state=active]:scale-105"
                >
                  <Truck className="h-6 w-6" />
                  <span className="text-xs font-semibold text-center">트럭운임</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="weight-surcharge" 
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-400 transition-all data-[state=active]:bg-gray-700 data-[state=active]:text-white data-[state=active]:border-gray-700 data-[state=active]:shadow-lg data-[state=active]:scale-105"
                >
                  <Weight className="h-6 w-6" />
                  <span className="text-xs font-semibold text-center">중량할증</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="dp-costs" 
                  className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-400 transition-all data-[state=active]:bg-gray-700 data-[state=active]:text-white data-[state=active]:border-gray-700 data-[state=active]:shadow-lg data-[state=active]:scale-105"
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