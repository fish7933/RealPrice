/**
 * Format a number with thousand separators
 * @param value - The number to format
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted string with commas
 */
export function formatNumber(value: number | string | undefined | null, decimals: number = 0): string {
  if (value === undefined || value === null || value === '') {
    return '0';
  }
  
  const num = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(num)) {
    return '0';
  }
  
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format currency with thousand separators and $ prefix
 * @param value - The number to format
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted string with $ and commas
 */
export function formatCurrency(value: number | string | undefined | null, decimals: number = 0): string {
  return `$${formatNumber(value, decimals)}`;
}