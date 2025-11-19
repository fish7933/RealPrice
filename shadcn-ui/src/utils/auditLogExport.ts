import * as XLSX from 'xlsx-js-style';
import { FreightAuditLog } from '@/types/freight';

interface CellStyle {
  font?: {
    bold?: boolean;
    sz?: number;
    color?: { rgb: string };
    underline?: boolean;
  };
  fill?: {
    fgColor: { rgb: string };
  };
  alignment?: {
    horizontal?: string;
    vertical?: string;
  };
  border?: {
    top: { style: string; color: { rgb: string } };
    bottom: { style: string; color: { rgb: string } };
    left: { style: string; color: { rgb: string } };
    right: { style: string; color: { rgb: string } };
  };
}

interface GroupedLog {
  version: number;
  agent: string;
  pol?: string;
  action: FreightAuditLog['action'];
  timestamp: string;
  changedByName: string;
  changedByUsername: string;
  logs: FreightAuditLog[];
  entityType: string;
}

const getEntityTypeName = (entityType: string): string => {
  const typeNames: Record<string, string> = {
    seaFreight: '해상운임',
    agentSeaFreight: '대리점 해상운임',
    dthc: 'DTHC',
    dpCost: 'DP Cost',
    combinedFreight: '복합운임',
    portBorderFreight: '철도운임',
    borderDestinationFreight: '국경-목적지 운임',
    weightSurcharge: '중량할증',
  };
  return typeNames[entityType] || entityType;
};

const getActionName = (action: FreightAuditLog['action']): string => {
  const actionNames: Record<string, string> = {
    create: '생성',
    update: '수정',
    delete: '삭제',
  };
  return actionNames[action] || action;
};

const getFieldLabel = (field: string): string => {
  const labels: Record<string, string> = {
    pol: '출발항',
    pod: '도착항',
    rate: '운임',
    carrier: '선사',
    note: '비고',
    agent: '대리점',
    amount: '금액',
    port: '항구',
    destination: '목적지',
    destinationId: '목적지',
    minWeight: '최소중량',
    maxWeight: '최대중량',
    surcharge: '할증',
    description: '설명',
    validFrom: '시작일',
    validTo: '종료일',
    version: '버전',
    localCharge: 'L.LOCAL',
  };
  return labels[field] || field;
};

const formatValue = (value: string | number | boolean | undefined): string => {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const formatTimestamp = (timestamp: string): string => {
  const date = new Date(timestamp);
  return date.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

export const exportAuditLogsToExcel = (
  groupedLogs: GroupedLog[],
  entityTypeName: string,
  getDestinationName: (id: string | undefined) => string
) => {
  // Create workbook
  const wb = XLSX.utils.book_new();

  // Prepare data for Excel
  const wsData: any[][] = [];

  // Title row
  wsData.push([`${entityTypeName} 버전 기록`]);
  wsData.push([`생성일: ${new Date().toLocaleDateString('ko-KR')} | 총 ${groupedLogs.length}건`]);
  wsData.push([]); // Empty row

  // Determine if we need agent and POL columns
  const hasAgentField = groupedLogs.some(log => log.agent);
  const hasPolField = groupedLogs.some(log => log.pol);

  // Header row
  const headers = ['버전', '버전일시', '작업', '변경자'];
  if (hasAgentField) headers.splice(2, 0, '대리점');
  if (hasPolField) headers.splice(hasAgentField ? 3 : 2, 0, '선적포트');
  headers.push('변경 내역');
  wsData.push(headers);

  // Data rows
  groupedLogs.forEach(groupedLog => {
    const changes = groupedLog.logs.flatMap(log => 
      log.changes.map(change => {
        const fieldLabel = getFieldLabel(change.field);
        if (groupedLog.action === 'create') {
          return `${fieldLabel}: ${formatValue(change.newValue)}`;
        } else if (groupedLog.action === 'delete') {
          return `${fieldLabel}: ${formatValue(change.oldValue)} (삭제됨)`;
        } else {
          return `${fieldLabel}: ${formatValue(change.oldValue)} → ${formatValue(change.newValue)}`;
        }
      })
    ).join('\n');

    const row: any[] = [
      `v${groupedLog.version}`,
      formatTimestamp(groupedLog.timestamp),
      getActionName(groupedLog.action),
      `${groupedLog.changedByName} (@${groupedLog.changedByUsername})`,
    ];

    if (hasAgentField) row.splice(2, 0, groupedLog.agent || '-');
    if (hasPolField) row.splice(hasAgentField ? 3 : 2, 0, groupedLog.pol || '-');
    row.push(changes);

    wsData.push(row);
  });

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Calculate the number of columns
  const numCols = headers.length;

  // Set column widths
  const colWidths = [
    { wch: 10 },  // 버전
    { wch: 20 },  // 버전일시
    ...(hasAgentField ? [{ wch: 15 }] : []),  // 대리점
    ...(hasPolField ? [{ wch: 15 }] : []),    // 선적포트
    { wch: 12 },  // 작업
    { wch: 20 },  // 변경자
    { wch: 50 },  // 변경 내역
  ];
  ws['!cols'] = colWidths;

  // Merge cells for title row (row 0)
  if (!ws['!merges']) ws['!merges'] = [];
  ws['!merges'].push({
    s: { r: 0, c: 0 },
    e: { r: 0, c: numCols - 1 }
  });

  // Merge cells for date row (row 1)
  ws['!merges'].push({
    s: { r: 1, c: 0 },
    e: { r: 1, c: numCols - 1 }
  });

  // Define border style
  const borderStyle = {
    top: { style: 'thin', color: { rgb: '000000' } },
    bottom: { style: 'thin', color: { rgb: '000000' } },
    left: { style: 'thin', color: { rgb: '000000' } },
    right: { style: 'thin', color: { rgb: '000000' } }
  };

  // Style for title row (row 0)
  const titleCell = ws['A1'];
  if (titleCell) {
    titleCell.s = {
      font: { 
        bold: true, 
        sz: 14,
        underline: true
      },
      alignment: { 
        horizontal: 'center', 
        vertical: 'center' 
      }
    };
  }

  // Style for date row (row 1)
  const dateCell = ws['A2'];
  if (dateCell) {
    dateCell.s = {
      font: { 
        sz: 10
      },
      alignment: { 
        horizontal: 'center', 
        vertical: 'center' 
      }
    };
  }

  // Apply styles to header row (row 3)
  const headerRowIndex = 3;
  for (let col = 0; col < numCols; col++) {
    const cellRef = XLSX.utils.encode_cell({ r: headerRowIndex, c: col });
    if (ws[cellRef]) {
      ws[cellRef].s = {
        font: { 
          bold: true, 
          sz: 10,
          color: { rgb: 'FFFFFF' }
        },
        fill: { 
          fgColor: { rgb: '404040' }
        },
        alignment: { 
          horizontal: 'center', 
          vertical: 'center' 
        },
        border: borderStyle
      };
    }
  }

  // Apply styles to data rows (starting from row 4)
  for (let row = headerRowIndex + 1; row < wsData.length; row++) {
    for (let col = 0; col < numCols; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
      if (ws[cellRef]) {
        const cellStyle: CellStyle = {
          font: { sz: 10 },
          alignment: { 
            horizontal: col === numCols - 1 ? 'left' : 'center',  // Left align for changes column
            vertical: 'top'  // Top align for multi-line content
          },
          border: borderStyle
        };

        // Color code based on action type (작업 column)
        const actionColIndex = hasAgentField && hasPolField ? 4 : hasAgentField || hasPolField ? 3 : 2;
        if (col === actionColIndex) {
          const action = wsData[row][col];
          if (action === '생성') {
            cellStyle.fill = { fgColor: { rgb: 'D1FAE5' } };  // Green
            cellStyle.font = { sz: 10, color: { rgb: '065F46' }, bold: true };
          } else if (action === '수정') {
            cellStyle.fill = { fgColor: { rgb: 'DBEAFE' } };  // Blue
            cellStyle.font = { sz: 10, color: { rgb: '1E40AF' }, bold: true };
          } else if (action === '삭제') {
            cellStyle.fill = { fgColor: { rgb: 'FEE2E2' } };  // Red
            cellStyle.font = { sz: 10, color: { rgb: 'DC2626' }, bold: true };
          }
        }

        ws[cellRef].s = cellStyle;
      }
    }
  }

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, '버전 기록');

  // Generate filename
  const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const filename = `${entityTypeName}_버전기록_${dateStr}.xlsx`;

  // Write file with cellStyles option
  XLSX.writeFile(wb, filename, { cellStyles: true });
};