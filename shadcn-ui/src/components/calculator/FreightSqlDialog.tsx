import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { AgentCostBreakdown, CostCalculationInput } from '@/types/freight';

interface FreightSqlDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  breakdown: AgentCostBreakdown;
  input: CostCalculationInput;
  historicalDate?: string;
}

export default function FreightSqlDialog({
  open,
  onOpenChange,
  breakdown,
  input,
  historicalDate,
}: FreightSqlDialogProps) {
  const [copied, setCopied] = useState(false);

  const generateSql = (): string => {
    const date = historicalDate || 'CURRENT_DATE';
    const dateCondition = historicalDate 
      ? `'${historicalDate}' BETWEEN valid_from AND valid_to`
      : `CURRENT_DATE BETWEEN valid_from AND valid_to`;

    let sql = `-- ========================================\n`;
    sql += `-- 운임 조회 SQL (${breakdown.agent})\n`;
    sql += `-- 경로: ${input.pol} → ${input.pod} → 목적지\n`;
    sql += `-- 조회 날짜: ${historicalDate || '현재'}\n`;
    sql += `-- ========================================\n\n`;

    // 1. Sea Freight Query
    if (breakdown.isAgentSpecificSeaFreight) {
      sql += `-- 1. 대리점 해상운임 (Agent Sea Freight)\n`;
      sql += `SELECT \n`;
      sql += `  id,\n`;
      sql += `  agent,\n`;
      sql += `  pol,\n`;
      sql += `  pod,\n`;
      sql += `  rate,\n`;
      sql += `  local_charge,\n`;
      sql += `  llocal,\n`;
      sql += `  carrier,\n`;
      sql += `  valid_from,\n`;
      sql += `  valid_to\n`;
      sql += `FROM app_741545ec66_agent_sea_freights\n`;
      sql += `WHERE agent = '${breakdown.railAgent}'\n`;
      sql += `  AND pol = '${input.pol}'\n`;
      sql += `  AND pod = '${input.pod}'\n`;
      sql += `  AND ${dateCondition};\n\n`;
    } else {
      sql += `-- 1. 일반 해상운임 (Sea Freight)\n`;
      sql += `SELECT \n`;
      sql += `  id,\n`;
      sql += `  freight_code,\n`;
      sql += `  pol,\n`;
      sql += `  pod,\n`;
      sql += `  rate,\n`;
      sql += `  local_charge,\n`;
      sql += `  carrier,\n`;
      sql += `  valid_from,\n`;
      sql += `  valid_to\n`;
      sql += `FROM app_741545ec66_sea_freights\n`;
      sql += `WHERE pol = '${input.pol}'\n`;
      sql += `  AND pod = '${input.pod}'\n`;
      sql += `  AND ${dateCondition};\n\n`;
    }

    // 2. DTHC Query
    sql += `-- 2. DTHC (Destination Terminal Handling Charge)\n`;
    sql += `SELECT \n`;
    sql += `  id,\n`;
    sql += `  agent,\n`;
    sql += `  pol,\n`;
    sql += `  pod,\n`;
    sql += `  amount,\n`;
    sql += `  carrier,\n`;
    sql += `  valid_from,\n`;
    sql += `  valid_to\n`;
    sql += `FROM app_741545ec66_dthc\n`;
    sql += `WHERE agent = '${breakdown.railAgent}'\n`;
    sql += `  AND pol = '${input.pol}'\n`;
    sql += `  AND pod = '${input.pod}'\n`;
    sql += `  AND ${dateCondition};\n\n`;

    // 3. Combined or Separate Freight
    if (breakdown.isCombinedFreight) {
      sql += `-- 3. 통합운임 (Combined Freight: 철도+트럭)\n`;
      sql += `SELECT \n`;
      sql += `  id,\n`;
      sql += `  agent,\n`;
      sql += `  pol,\n`;
      sql += `  pod,\n`;
      sql += `  destination_id,\n`;
      sql += `  rate,\n`;
      sql += `  valid_from,\n`;
      sql += `  valid_to\n`;
      sql += `FROM app_741545ec66_combined_freights\n`;
      sql += `WHERE agent = '${breakdown.railAgent}'\n`;
      sql += `  AND pol = '${input.pol}'\n`;
      sql += `  AND pod = '${input.pod}'\n`;
      sql += `  AND destination_id = '${input.destinationId}'\n`;
      sql += `  AND ${dateCondition};\n\n`;
    } else {
      sql += `-- 3a. 철도운임 (Port to Border)\n`;
      sql += `SELECT \n`;
      sql += `  id,\n`;
      sql += `  agent,\n`;
      sql += `  pol,\n`;
      sql += `  pod,\n`;
      sql += `  rate,\n`;
      sql += `  valid_from,\n`;
      sql += `  valid_to\n`;
      sql += `FROM app_741545ec66_port_border_freights\n`;
      sql += `WHERE agent = '${breakdown.railAgent}'\n`;
      sql += `  AND pod = '${input.pod}'\n`;
      sql += `  AND ${dateCondition};\n\n`;

      sql += `-- 3b. 트럭운임 (Border to Destination)\n`;
      sql += `SELECT \n`;
      sql += `  id,\n`;
      sql += `  agent,\n`;
      sql += `  destination_id,\n`;
      sql += `  rate,\n`;
      sql += `  valid_from,\n`;
      sql += `  valid_to\n`;
      sql += `FROM app_741545ec66_border_destination_freights\n`;
      sql += `WHERE agent = '${breakdown.truckAgent}'\n`;
      sql += `  AND destination_id = '${input.destinationId}'\n`;
      sql += `  AND ${dateCondition};\n\n`;
    }

    // 4. Weight Surcharge
    if (breakdown.weightSurcharge > 0) {
      sql += `-- 4. 중량 할증 (Weight Surcharge)\n`;
      sql += `SELECT \n`;
      sql += `  id,\n`;
      sql += `  agent,\n`;
      sql += `  min_weight,\n`;
      sql += `  max_weight,\n`;
      sql += `  surcharge,\n`;
      sql += `  valid_from,\n`;
      sql += `  valid_to\n`;
      sql += `FROM app_741545ec66_weight_surcharge_rules\n`;
      sql += `WHERE agent = '${breakdown.railAgent}'\n`;
      sql += `  AND ${input.weight} BETWEEN min_weight AND max_weight\n`;
      sql += `  AND ${dateCondition};\n\n`;
    }

    // 5. DP Cost
    if (breakdown.dp > 0) {
      sql += `-- 5. DP 비용 (Delivery Point Cost)\n`;
      sql += `SELECT \n`;
      sql += `  id,\n`;
      sql += `  port,\n`;
      sql += `  amount,\n`;
      sql += `  valid_from,\n`;
      sql += `  valid_to\n`;
      sql += `FROM app_741545ec66_dp_costs\n`;
      sql += `WHERE port = '${input.pol}'\n`;
      sql += `  AND ${dateCondition};\n\n`;
    }

    sql += `-- ========================================\n`;
    sql += `-- 총 운임: $${breakdown.total.toFixed(2)}\n`;
    sql += `-- ========================================\n`;

    return sql;
  };

  const handleCopy = async () => {
    const sql = generateSql();
    await navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>운임 조회 SQL</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="flex items-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4" />
                  복사됨
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  복사
                </>
              )}
            </Button>
          </DialogTitle>
          <DialogDescription>
            {breakdown.agent} - {input.pol} → {input.pod} → 목적지
            {historicalDate && ` (${historicalDate} 기준)`}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[60vh] w-full rounded-md border p-4">
          <pre className="text-sm font-mono whitespace-pre-wrap">
            {generateSql()}
          </pre>
        </ScrollArea>

        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <div>
            <strong>운임 구성:</strong>
            {breakdown.isCombinedFreight ? ' 통합운임' : ' 철도+트럭 분리운임'}
          </div>
          <div>
            <strong>총액:</strong> ${breakdown.total.toFixed(2)}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}