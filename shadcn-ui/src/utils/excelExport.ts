import * as XLSX from 'xlsx-js-style';
import { AgentCostBreakdown, CostCalculationInput } from '@/types/freight';
import type { ExcludedCosts } from '@/components/calculator/CostCalculatorWithTabs';

export interface ExcelExportData {
  breakdown: AgentCostBreakdown;
  input: CostCalculationInput;
  destinationName: string;
  costTotal: number;
  sellingPrice: number;
  profit: number;
  profitRate: number;
  createdByUsername: string;
  createdAt: string;
  excludedCosts: ExcludedCosts;
  carrier?: string;
  note?: string;
}

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
  numFmt?: string;
}

export const exportQuotationToExcel = (data: ExcelExportData) => {
  // Create workbook
  const wb = XLSX.utils.book_new();

  // Build route title
  const routeTitle = `${data.input.pol}-${data.input.pod}-${data.destinationName}`;

  // Format date for display
  const quotationDate = new Date(data.createdAt).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });

  // Build header row dynamically based on excluded costs
  const headers: string[] = ['조합', 'CARRIER', 'CNTR SIZE'];
  
  if (!data.excludedCosts.seaFreight) {
    headers.push(`${data.input.pol}-${data.input.pod}`);
  }
  
  if (!data.excludedCosts.dthc) {
    headers.push('D/O FEE');
  }
  
  if (data.breakdown.isCombinedFreight) {
    if (!data.excludedCosts.combinedFreight) {
      headers.push(`${data.input.pod}-${data.destinationName}`);
    }
  } else {
    if (!data.excludedCosts.portBorder) {
      headers.push(`${data.input.pod}-국경`);
    }
    if (!data.excludedCosts.borderDestination) {
      headers.push(`국경-${data.destinationName}`);
    }
  }
  
  if (!data.excludedCosts.weightSurcharge && data.breakdown.weightSurcharge > 0) {
    headers.push('중량할증');
  }
  
  if (!data.excludedCosts.dp && data.breakdown.dp > 0) {
    headers.push('DP');
  }
  
  if (!data.excludedCosts.domesticTransport && data.breakdown.domesticTransport > 0) {
    headers.push('국내운송');
  }
  
  // Add other cost items with proper category names
  data.breakdown.otherCosts.forEach((item, index) => {
    if (!data.excludedCosts[`other_${index}`]) {
      headers.push(item.category || '기타 비용');
    }
  });
  
  headers.push('TOTAL', 'SELLING', 'PROFIT');

  // Build data row
  const dataRow: (string | number)[] = [
    data.breakdown.agent,
    data.carrier || '',
    "40'HQ"
  ];
  
  if (!data.excludedCosts.seaFreight) {
    dataRow.push(data.breakdown.seaFreight);
  }
  
  if (!data.excludedCosts.dthc) {
    dataRow.push(data.breakdown.dthc);
  }
  
  if (data.breakdown.isCombinedFreight) {
    if (!data.excludedCosts.combinedFreight) {
      dataRow.push(data.breakdown.combinedFreight);
    }
  } else {
    if (!data.excludedCosts.portBorder) {
      dataRow.push(data.breakdown.portBorder);
    }
    if (!data.excludedCosts.borderDestination) {
      dataRow.push(data.breakdown.borderDestination);
    }
  }
  
  if (!data.excludedCosts.weightSurcharge && data.breakdown.weightSurcharge > 0) {
    dataRow.push(data.breakdown.weightSurcharge);
  }
  
  if (!data.excludedCosts.dp && data.breakdown.dp > 0) {
    dataRow.push(data.breakdown.dp);
  }
  
  if (!data.excludedCosts.domesticTransport && data.breakdown.domesticTransport > 0) {
    dataRow.push(data.breakdown.domesticTransport);
  }
  
  // Add other cost items
  data.breakdown.otherCosts.forEach((item, index) => {
    if (!data.excludedCosts[`other_${index}`]) {
      dataRow.push(item.amount);
    }
  });
  
  dataRow.push(data.costTotal, data.sellingPrice, data.profit);

  // Create worksheet data with title and date rows
  const wsData = [
    ['운임 견적서'],  // Title row
    [`${routeTitle} | 작성자: ${data.createdByUsername} | 작성일: ${quotationDate}`],  // Date and author row
    headers,
    dataRow
  ];

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Calculate the number of columns
  const numCols = headers.length;

  // Set column widths
  const colWidths = Array(numCols).fill({ wch: 15 });
  ws['!cols'] = colWidths;

  // Merge cells for title row (row 0)
  if (!ws['!merges']) ws['!merges'] = [];
  ws['!merges'].push({
    s: { r: 0, c: 0 },
    e: { r: 0, c: numCols - 1 }
  });

  // Merge cells for date/author row (row 1)
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

  // Style for date/author row (row 1)
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

  // Apply styles to header row (row 2) - all headers with gray background
  for (let col = 0; col < numCols; col++) {
    const cellRef = XLSX.utils.encode_cell({ r: 2, c: col });
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

  // Apply styles to data row (row 3)
  for (let col = 0; col < numCols; col++) {
    const cellRef = XLSX.utils.encode_cell({ r: 3, c: col });
    if (ws[cellRef]) {
      const header = headers[col];
      
      // Base style for all data cells
      const cellStyle: CellStyle = {
        font: { sz: 10 },
        alignment: { 
          horizontal: 'center', 
          vertical: 'center' 
        },
        border: borderStyle
      };

      // Apply USD currency format to numeric columns (skip first 3 text columns)
      if (col >= 3) {
        cellStyle.numFmt = '"$"#,##0';
      }

      // Special styling for PROFIT column (red if negative)
      if (header === 'PROFIT' && data.profit < 0) {
        cellStyle.font = {
          sz: 10,
          color: { rgb: 'DC2626' }, // Red-600
          bold: true
        };
      }

      ws[cellRef].s = cellStyle;
    }
  }

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, '운임 견적서');

  // Generate filename with timestamp and creator name
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
  const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '');
  const filename = `운임견적서_${data.destinationName}_${data.createdByUsername}_${dateStr}_${timeStr}.xlsx`;

  // Write file with cellStyles option
  XLSX.writeFile(wb, filename, { cellStyles: true });
};

// Function to copy quotation data to clipboard as tab-separated values
export const copyQuotationToClipboard = async (data: ExcelExportData): Promise<boolean> => {
  try {
    const routeTitle = `${data.input.pol}-${data.input.pod}-${data.destinationName}`;
    const quotationDate = new Date(data.createdAt).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });

    // Build header row
    const headers: string[] = ['조합', 'CARRIER', 'CNTR SIZE'];
    
    if (!data.excludedCosts.seaFreight) {
      headers.push(`${data.input.pol}-${data.input.pod}`);
    }
    
    if (!data.excludedCosts.dthc) {
      headers.push('D/O FEE');
    }
    
    if (data.breakdown.isCombinedFreight) {
      if (!data.excludedCosts.combinedFreight) {
        headers.push(`${data.input.pod}-${data.destinationName}`);
      }
    } else {
      if (!data.excludedCosts.portBorder) {
        headers.push(`${data.input.pod}-국경`);
      }
      if (!data.excludedCosts.borderDestination) {
        headers.push(`국경-${data.destinationName}`);
      }
    }
    
    if (!data.excludedCosts.weightSurcharge && data.breakdown.weightSurcharge > 0) {
      headers.push('중량할증');
    }
    
    if (!data.excludedCosts.dp && data.breakdown.dp > 0) {
      headers.push('DP');
    }
    
    if (!data.excludedCosts.domesticTransport && data.breakdown.domesticTransport > 0) {
      headers.push('국내운송');
    }
    
    data.breakdown.otherCosts.forEach((item, index) => {
      if (!data.excludedCosts[`other_${index}`]) {
        headers.push(item.category || '기타 비용');
      }
    });
    
    headers.push('TOTAL', 'SELLING', 'PROFIT');

    // Build data row
    const dataRow: (string | number)[] = [
      data.breakdown.agent,
      data.carrier || '',
      "40'HQ"
    ];
    
    if (!data.excludedCosts.seaFreight) {
      dataRow.push(data.breakdown.seaFreight);
    }
    
    if (!data.excludedCosts.dthc) {
      dataRow.push(data.breakdown.dthc);
    }
    
    if (data.breakdown.isCombinedFreight) {
      if (!data.excludedCosts.combinedFreight) {
        dataRow.push(data.breakdown.combinedFreight);
      }
    } else {
      if (!data.excludedCosts.portBorder) {
        dataRow.push(data.breakdown.portBorder);
      }
      if (!data.excludedCosts.borderDestination) {
        dataRow.push(data.breakdown.borderDestination);
      }
    }
    
    if (!data.excludedCosts.weightSurcharge && data.breakdown.weightSurcharge > 0) {
      dataRow.push(data.breakdown.weightSurcharge);
    }
    
    if (!data.excludedCosts.dp && data.breakdown.dp > 0) {
      dataRow.push(data.breakdown.dp);
    }
    
    if (!data.excludedCosts.domesticTransport && data.breakdown.domesticTransport > 0) {
      dataRow.push(data.breakdown.domesticTransport);
    }
    
    data.breakdown.otherCosts.forEach((item, index) => {
      if (!data.excludedCosts[`other_${index}`]) {
        dataRow.push(item.amount);
      }
    });
    
    dataRow.push(data.costTotal, data.sellingPrice, data.profit);

    // Create clipboard text with tab-separated values
    const clipboardText = [
      '운임 견적서',
      `${routeTitle} | 작성자: ${data.createdByUsername} | 작성일: ${quotationDate}`,
      headers.join('\t'),
      dataRow.join('\t')
    ].join('\n');

    await navigator.clipboard.writeText(clipboardText);
    return true;
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
};

interface QuotationData {
  breakdown: AgentCostBreakdown;
  input: CostCalculationInput;
  costTotal: number;
  sellingPrice: number;
  profit: number;
  profitRate: number;
  createdByUsername: string;
  createdAt: string;
}

export const exportQuotation = (
  quotation: QuotationData, 
  destinationName: string, 
  excludedCosts: ExcludedCosts,
  carrier?: string
) => {
  const data: ExcelExportData = {
    breakdown: quotation.breakdown,
    input: quotation.input,
    destinationName,
    costTotal: quotation.costTotal,
    sellingPrice: quotation.sellingPrice,
    profit: quotation.profit,
    profitRate: quotation.profitRate,
    createdByUsername: quotation.createdByUsername,
    createdAt: quotation.createdAt,
    excludedCosts,
    carrier,
  };

  exportQuotationToExcel(data);
};