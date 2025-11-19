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
  destinationName: string;
}

export default function FreightSqlDialog({
  open,
  onOpenChange,
  breakdown,
  input,
  destinationName,
}: FreightSqlDialogProps) {
  const [copied, setCopied] = useState(false);

  const generateSql = (): string => {
    // ✅ FIXED: Use input.historicalDate or current date
    const targetDate = (input.historicalDate && input.historicalDate.trim() !== '')
      ? input.historicalDate 
      : new Date().toISOString().split('T')[0];
    
    const dateCondition = `'${targetDate}' BETWEEN valid_from AND valid_to`;

    let sql = `-- ========================================\n`;
    sql += `-- 운임 조합 상세 조회 SQL\n`;
    sql += `-- ========================================\n`;
    sql += `-- 대리점: ${breakdown.agent}\n`;
    sql += `-- 경로: ${input.pol} → ${input.pod} → ${destinationName}\n`;
    sql += `-- 중량: ${input.weight} kg\n`;
    sql += `-- 운임 유형: ${breakdown.isCombinedFreight ? '통합운임' : '분리운임 (철도+트럭)'}\n`;
    sql += `-- 조회 날짜: ${targetDate}\n`;
    sql += `-- ========================================\n\n`;

    // 1. Sea Freight
    sql += `-- ========================================\n`;
    sql += `-- 1. 해상운임 조회\n`;
    sql += `-- ========================================\n`;
    sql += `-- 금액: $${breakdown.seaFreight}\n`;
    sql += `-- 선사: ${breakdown.seaFreightCarrier || 'N/A'}\n\n`;
    
    if (breakdown.agent === 'General') {
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
      sql += `FROM app_51335ed80f_sea_freights\n`;
      sql += `WHERE pol = '${input.pol}'\n`;
      sql += `  AND pod = '${input.pod}'\n`;
      if (breakdown.seaFreightCarrier) {
        sql += `  AND carrier = '${breakdown.seaFreightCarrier}'\n`;
      }
      sql += `  AND ${dateCondition};\n\n`;
    } else {
      sql += `-- 참고: agent_sea_freights 테이블은 local_charge 대신 llocal 컬럼 사용\n`;
      sql += `SELECT \n`;
      sql += `  id,\n`;
      sql += `  agent,\n`;
      sql += `  pol,\n`;
      sql += `  pod,\n`;
      sql += `  rate,\n`;
      sql += `  llocal,\n`;
      sql += `  carrier,\n`;
      sql += `  valid_from,\n`;
      sql += `  valid_to\n`;
      sql += `FROM app_51335ed80f_agent_sea_freights\n`;
      sql += `WHERE agent = '${breakdown.agent}'\n`;
      sql += `  AND pol = '${input.pol}'\n`;
      sql += `  AND pod = '${input.pod}'\n`;
      if (breakdown.seaFreightCarrier) {
        sql += `  AND carrier = '${breakdown.seaFreightCarrier}'\n`;
      }
      sql += `  AND ${dateCondition};\n\n`;
    }

    // 2. Local Charge
    if (breakdown.localCharge && breakdown.localCharge > 0) {
      sql += `-- ========================================\n`;
      sql += `-- 2. LOCAL 차지 조회\n`;
      sql += `-- ========================================\n`;
      sql += `-- 금액: $${breakdown.localCharge}\n`;
      sql += `-- 참고: 해상운임 테이블의 local_charge (일반) 또는 llocal (대리점) 컬럼에서 조회\n\n`;
    }

    // 3. DTHC
    sql += `-- ========================================\n`;
    sql += `-- 3. DTHC 조회\n`;
    sql += `-- ========================================\n`;
    sql += `-- 금액: $${breakdown.dthc}\n\n`;
    sql += `SELECT \n`;
    sql += `  id,\n`;
    sql += `  agent,\n`;
    sql += `  pol,\n`;
    sql += `  pod,\n`;
    sql += `  amount,\n`;
    sql += `  carrier,\n`;
    sql += `  valid_from,\n`;
    sql += `  valid_to\n`;
    sql += `FROM app_51335ed80f_dthc\n`;
    sql += `WHERE agent = '${breakdown.agent}'\n`;
    sql += `  AND pol = '${input.pol}'\n`;
    sql += `  AND pod = '${input.pod}'\n`;
    if (breakdown.seaFreightCarrier) {
      sql += `  AND carrier = '${breakdown.seaFreightCarrier}'\n`;
    }
    sql += `  AND ${dateCondition};\n\n`;

    // 4. Combined or Separate Freight
    if (breakdown.isCombinedFreight) {
      sql += `-- ========================================\n`;
      sql += `-- 4. 통합운임 조회 (철도+트럭 통합)\n`;
      sql += `-- ========================================\n`;
      sql += `-- 금액: $${breakdown.combinedFreight}\n\n`;
      sql += `SELECT \n`;
      sql += `  id,\n`;
      sql += `  agent,\n`;
      sql += `  pol,\n`;
      sql += `  pod,\n`;
      sql += `  destination_id,\n`;
      sql += `  rate,\n`;
      sql += `  valid_from,\n`;
      sql += `  valid_to\n`;
      sql += `FROM app_51335ed80f_combined_freights\n`;
      sql += `WHERE agent = '${breakdown.agent}'\n`;
      sql += `  AND pol = '${input.pol}'\n`;
      sql += `  AND pod = '${input.pod}'\n`;
      sql += `  AND destination_id = '${input.destinationId}'\n`;
      sql += `  AND ${dateCondition};\n\n`;
    } else {
      sql += `-- ========================================\n`;
      sql += `-- 4-1. 철도운임 조회 (Port to Border)\n`;
      sql += `-- ========================================\n`;
      sql += `-- 금액: $${breakdown.portBorder}\n\n`;
      sql += `SELECT \n`;
      sql += `  id,\n`;
      sql += `  agent,\n`;
      sql += `  pol,\n`;
      sql += `  pod,\n`;
      sql += `  rate,\n`;
      sql += `  valid_from,\n`;
      sql += `  valid_to\n`;
      sql += `FROM app_51335ed80f_port_border_freights\n`;
      sql += `WHERE agent = '${breakdown.agent}'\n`;
      sql += `  AND pod = '${input.pod}'\n`;
      sql += `  AND ${dateCondition};\n\n`;

      sql += `-- ========================================\n`;
      sql += `-- 4-2. 트럭운임 조회 (Border to Destination)\n`;
      sql += `-- ========================================\n`;
      sql += `-- 금액: $${breakdown.borderDestination}\n\n`;
      sql += `SELECT \n`;
      sql += `  id,\n`;
      sql += `  agent,\n`;
      sql += `  destination_id,\n`;
      sql += `  rate,\n`;
      sql += `  valid_from,\n`;
      sql += `  valid_to\n`;
      sql += `FROM app_51335ed80f_border_destination_freights\n`;
      sql += `WHERE agent = '${breakdown.agent}'\n`;
      sql += `  AND destination_id = '${input.destinationId}'\n`;
      sql += `  AND ${dateCondition};\n\n`;
    }

    // 5. Weight Surcharge
    if (breakdown.weightSurcharge > 0) {
      sql += `-- ========================================\n`;
      sql += `-- 5. 중량 할증 조회\n`;
      sql += `-- ========================================\n`;
      sql += `-- 금액: $${breakdown.weightSurcharge}\n\n`;
      sql += `SELECT \n`;
      sql += `  id,\n`;
      sql += `  agent,\n`;
      sql += `  min_weight,\n`;
      sql += `  max_weight,\n`;
      sql += `  surcharge,\n`;
      sql += `  valid_from,\n`;
      sql += `  valid_to\n`;
      sql += `FROM app_51335ed80f_weight_surcharge_rules\n`;
      sql += `WHERE agent = '${breakdown.agent}'\n`;
      sql += `  AND ${input.weight} BETWEEN min_weight AND max_weight\n`;
      sql += `  AND ${dateCondition};\n\n`;
    }

    // 6. DP Cost
    if (breakdown.dp > 0) {
      sql += `-- ========================================\n`;
      sql += `-- 6. DP 비용 조회\n`;
      sql += `-- ========================================\n`;
      sql += `-- 금액: $${breakdown.dp}\n\n`;
      sql += `SELECT \n`;
      sql += `  id,\n`;
      sql += `  port,\n`;
      sql += `  amount,\n`;
      sql += `  valid_from,\n`;
      sql += `  valid_to\n`;
      sql += `FROM app_51335ed80f_dp_costs\n`;
      sql += `WHERE port = '${input.pol}'\n`;
      sql += `  AND ${dateCondition};\n\n`;
    }

    // Summary
    sql += `-- ========================================\n`;
    sql += `-- 총액 계산\n`;
    sql += `-- ========================================\n`;
    sql += `-- 해상운임: $${breakdown.seaFreight}\n`;
    if (breakdown.localCharge && breakdown.localCharge > 0) {
      sql += `-- LOCAL: $${breakdown.localCharge}\n`;
    }
    sql += `-- DTHC: $${breakdown.dthc}\n`;
    if (breakdown.isCombinedFreight) {
      sql += `-- 통합운임: $${breakdown.combinedFreight}\n`;
    } else {
      sql += `-- 철도운임: $${breakdown.portBorder}\n`;
      sql += `-- 트럭운임: $${breakdown.borderDestination}\n`;
    }
    if (breakdown.weightSurcharge > 0) {
      sql += `-- 중량할증: $${breakdown.weightSurcharge}\n`;
    }
    if (breakdown.dp > 0) {
      sql += `-- DP: $${breakdown.dp}\n`;
    }
    
    let total = breakdown.seaFreight + 
                (breakdown.localCharge || 0) + 
                breakdown.dthc + 
                breakdown.weightSurcharge + 
                breakdown.dp;
    
    if (breakdown.isCombinedFreight) {
      total += breakdown.combinedFreight;
    } else {
      total += breakdown.portBorder + breakdown.borderDestination;
    }
    
    sql += `-- ========================================\n`;
    sql += `-- 총액: $${total.toFixed(2)}\n`;
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
            <span>운임 조합 SQL 상세</span>
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
            선택한 운임 조합의 상세 조회 SQL입니다.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[60vh] w-full rounded-md border p-4">
          <pre className="text-sm font-mono whitespace-pre-wrap">
            {generateSql()}
          </pre>
        </ScrollArea>

        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <div>
            <strong>대리점:</strong> {breakdown.agent}
          </div>
          <div>
            <strong>경로:</strong> {input.pol} → {input.pod} → {destinationName}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}