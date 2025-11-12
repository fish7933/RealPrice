import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import RailAgentTable from '@/components/agents/RailAgentTable';
import TruckAgentTable from '@/components/agents/TruckAgentTable';
import { Train, Truck } from 'lucide-react';

export default function Agents() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">운송사 관리</h1>
        <p className="text-gray-600 mt-2">철도 및 트럭 운송사를 관리합니다</p>
      </div>

      <Tabs defaultValue="rail" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="rail" className="flex items-center gap-2">
            <Train className="h-4 w-4" />
            철도 운송사
          </TabsTrigger>
          <TabsTrigger value="truck" className="flex items-center gap-2">
            <Truck className="h-4 w-4" />
            트럭 운송사
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rail">
          <RailAgentTable />
        </TabsContent>

        <TabsContent value="truck">
          <TruckAgentTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}