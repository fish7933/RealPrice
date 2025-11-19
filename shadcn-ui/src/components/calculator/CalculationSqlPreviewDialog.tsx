import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { CostCalculationInput } from '@/types/freight';

interface CalculationSqlPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  input: CostCalculationInput;
  historicalDate?: string;
  getDestinationName: (destinationId: string) => string;
}

export default function CalculationSqlPreviewDialog({
  open,
  onOpenChange,
  input,
  historicalDate,
  getDestinationName,
}: CalculationSqlPreviewDialogProps) {
  const [copied, setCopied] = useState(false);

  const generateCalculationSql = (): string => {
    const date = historicalDate || 'CURRENT_DATE';
    const dateCondition = historicalDate 
      ? `'${historicalDate}' BETWEEN valid_from AND valid_to`
      : `CURRENT_DATE BETWEEN valid_from AND valid_to`;

    let sql = `-- ========================================\n`;
    sql += `-- 운임 계산 SQL 미리보기\n`;
    sql += `-- ========================================\n`;
    sql += `-- 입력 정보:\n`;
    sql += `--   출발항 (POL): ${input.pol}\n`;
    sql += `--   도착항 (POD): ${input.pod}\n`;
    sql += `--   목적지: ${getDestinationName(input.destinationId)} (${input.destinationId})\n`;
    sql += `--   중량: ${input.weight} kg\n`;
    sql += `--   DP 포함: ${input.includeDP ? '예' : '아니오'}\n`;
    sql += `--   조회 날짜: ${historicalDate || '현재'}\n`;
    sql += `-- ========================================\n\n`;

    // 1. Sea Freight Query
    sql += `-- ========================================\n`;
    sql += `-- 1. 해상운임 조회 (Sea Freight)\n`;
    sql += `-- ========================================\n\n`;

    sql += `-- 1-1. 일반 해상운임\n`;
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
    sql += `  AND ${dateCondition};\n\n`;

    sql += `-- 1-2. 대리점별 해상운임 (모든 대리점)\n`;
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
    sql += `WHERE pol = '${input.pol}'\n`;
    sql += `  AND pod = '${input.pod}'\n`;
    sql += `  AND ${dateCondition};\n\n`;

    // 2. DTHC Query
    sql += `-- ========================================\n`;
    sql += `-- 2. DTHC 조회 (모든 대리점)\n`;
    sql += `-- ========================================\n\n`;
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
    sql += `WHERE pol = '${input.pol}'\n`;
    sql += `  AND pod = '${input.pod}'\n`;
    sql += `  AND ${dateCondition};\n\n`;

    // 3. Combined or Separate Freight
    if (input.includeDP) {
      sql += `-- ========================================\n`;
      sql += `-- 3. 철도+트럭 분리운임 (DP 포함)\n`;
      sql += `-- ========================================\n\n`;

      sql += `-- 3-1. 철도운임 (Port to Border - KASHGAR)\n`;
      sql += `SELECT \n`;
      sql += `  id,\n`;
      sql += `  agent,\n`;
      sql += `  pol,\n`;
      sql += `  pod,\n`;
      sql += `  rate,\n`;
      sql += `  valid_from,\n`;
      sql += `  valid_to\n`;
      sql += `FROM app_51335ed80f_port_border_freights\n`;
      sql += `WHERE pod = '${input.pod}'\n`;
      sql += `  AND ${dateCondition};\n\n`;

      sql += `-- 3-2. 트럭운임 (Border to Destination)\n`;
      sql += `SELECT \n`;
      sql += `  id,\n`;
      sql += `  agent,\n`;
      sql += `  destination_id,\n`;
      sql += `  rate,\n`;
      sql += `  valid_from,\n`;
      sql += `  valid_to\n`;
      sql += `FROM app_51335ed80f_border_destination_freights\n`;
      sql += `WHERE destination_id = '${input.destinationId}'\n`;
      sql += `  AND ${dateCondition};\n\n`;
    } else {
      sql += `-- ========================================\n`;
      sql += `-- 3. 통합운임 (Combined Freight - DP 미포함)\n`;
      sql += `-- ========================================\n\n`;
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
      sql += `WHERE pol = '${input.pol}'\n`;
      sql += `  AND pod = '${input.pod}'\n`;
      sql += `  AND destination_id = '${input.destinationId}'\n`;
      sql += `  AND ${dateCondition};\n\n`;
    }

    // 4. Weight Surcharge
    sql += `-- ========================================\n`;
    sql += `-- 4. 중량 할증 조회 (모든 대리점)\n`;
    sql += `-- ========================================\n\n`;
    sql += `SELECT \n`;
    sql += `  id,\n`;
    sql += `  agent,\n`;
    sql += `  min_weight,\n`;
    sql += `  max_weight,\n`;
    sql += `  surcharge,\n`;
    sql += `  valid_from,\n`;
    sql += `  valid_to\n`;
    sql += `FROM app_51335ed80f_weight_surcharge_rules\n`;
    sql += `WHERE ${input.weight} BETWEEN min_weight AND max_weight\n`;
    sql += `  AND ${dateCondition};\n\n`;

    // 5. DP Cost
    if (input.includeDP) {
      sql += `-- ========================================\n`;
      sql += `-- 5. DP 비용 조회\n`;
      sql += `-- ========================================\n\n`;
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

    // 6. Domestic Transport
    sql += `-- ========================================\n`;
    sql += `-- 6. 국내운송비 조회\n`;
    sql += `-- ========================================\n\n`;
    sql += `SELECT \n`;
    sql += `  id,\n`;
    sql += `  port,\n`;
    sql += `  amount,\n`;
    sql += `  valid_from,\n`;
    sql += `  valid_to\n`;
    sql += `FROM app_51335ed80f_domestic_transport\n`;
    sql += `WHERE port = '${input.pol}'\n`;
    sql += `  AND ${dateCondition};\n\n`;

    // 7. Other Costs
    sql += `-- ========================================\n`;
    sql += `-- 7. 기타 비용 조회\n`;
    sql += `-- ========================================\n\n`;
    sql += `SELECT \n`;
    sql += `  id,\n`;
    sql += `  category,\n`;
    sql += `  amount,\n`;
    sql += `  valid_from,\n`;
    sql += `  valid_to\n`;
    sql += `FROM app_51335ed80f_other_costs\n`;
    sql += `WHERE ${dateCondition};\n\n`;

    sql += `-- ========================================\n`;
    sql += `-- 계산 로직\n`;
    sql += `-- ========================================\n`;
    sql += `-- 1. 위의 쿼리 결과들을 조합하여 모든 가능한 운임 조합 생성\n`;
    sql += `-- 2. 각 조합별로 총 운임 계산:\n`;
    sql += `--    총액 = 해상운임 + LOCAL + DTHC + (통합운임 OR 철도+트럭) + 중량할증 + DP + 국내운송비 + 기타비용\n`;
    sql += `-- 3. 유효기간이 만료된 운임이 있는 경우 경고 표시\n`;
    sql += `-- 4. 최저가 조합 선택\n`;
    sql += `-- ========================================\n`;

    return sql;
  };

  const handleCopy = async () => {
    const sql = generateCalculationSql();
    await navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>운임 계산 SQL 미리보기</span>
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
            "계산하기" 버튼 클릭 시 실행될 SQL 쿼리들입니다.
            {historicalDate && ` (${historicalDate} 기준)`}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[60vh] w-full rounded-md border p-4">
          <pre className="text-sm font-mono whitespace-pre-wrap">
            {generateCalculationSql()}
          </pre>
        </ScrollArea>

        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <div>
            <strong>경로:</strong> {input.pol} → {input.pod} → {getDestinationName(input.destinationId)}
          </div>
          <div>
            <strong>중량:</strong> {input.weight} kg | <strong>DP:</strong> {input.includeDP ? '포함' : '미포함'}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}