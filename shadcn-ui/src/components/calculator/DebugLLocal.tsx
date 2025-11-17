import { useEffect } from 'react';
import { AgentCostBreakdown } from '@/types/freight';

interface DebugLLocalProps {
  breakdown: AgentCostBreakdown[];
}

export function DebugLLocal({ breakdown }: DebugLLocalProps) {
  useEffect(() => {
    console.log('🔍 L.LOCAL Debug Information:');
    console.log('Total breakdowns:', breakdown.length);
    
    breakdown.forEach((b, index) => {
      console.log(`\n[${index}] Agent: ${b.agent}`);
      console.log(`  - isAgentSpecificSeaFreight: ${b.isAgentSpecificSeaFreight}`);
      console.log(`  - localCharge: ${b.localCharge}`);
      console.log(`  - seaFreight: ${b.seaFreight}`);
      console.log(`  - seaFreightCarrier: ${b.seaFreightCarrier}`);
      console.log(`  - Should show star: ${b.isAgentSpecificSeaFreight && (b.localCharge || 0) !== 0}`);
    });
  }, [breakdown]);

  return null;
}
