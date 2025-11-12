import { differenceInDays, parseISO, format, addDays, addMonths } from 'date-fns';

export type ValidityStatus = 'active' | 'expiring' | 'expired' | 'future';

export interface ValidityStatusInfo {
  status: ValidityStatus;
  label: string;
  variant: 'default' | 'warning' | 'destructive';
  daysUntilExpiry?: number;
}

/**
 * Check if a rate is valid on a specific date
 */
export function isRateValid(validFrom: string, validTo: string, date?: string): boolean {
  if (!validFrom || !validTo) return true; // If no validity period, consider it valid
  
  const checkDate = date ? parseISO(date) : new Date();
  const fromDate = parseISO(validFrom);
  const toDate = parseISO(validTo);
  
  return checkDate >= fromDate && checkDate <= toDate;
}

/**
 * Get validity status of a rate
 * - 과거: "만료" (빨간색)
 * - 미래: "확인" (빨간색)
 * - 오늘 포함: "유효" (파란색)
 */
export function getValidityStatus(validFrom: string, validTo: string): ValidityStatusInfo {
  // Handle missing validity period data
  if (!validFrom || !validTo) {
    return {
      status: 'active',
      label: '유효기간 미설정',
      variant: 'default',
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison
  
  const fromDate = parseISO(validFrom);
  fromDate.setHours(0, 0, 0, 0);
  
  const toDate = parseISO(validTo);
  toDate.setHours(0, 0, 0, 0);

  // Check if validity period is in the future (hasn't started yet)
  if (fromDate > today) {
    const daysUntilStart = differenceInDays(fromDate, today);
    return {
      status: 'future',
      label: '확인',
      variant: 'destructive',
      daysUntilExpiry: daysUntilStart,
    };
  }

  // Check if validity period has expired (ended in the past)
  if (toDate < today) {
    const daysUntilExpiry = differenceInDays(toDate, today);
    return {
      status: 'expired',
      label: '만료',
      variant: 'destructive',
      daysUntilExpiry,
    };
  }

  // Validity period includes today - it's active
  const daysUntilExpiry = differenceInDays(toDate, today);
  return {
    status: 'active',
    label: '유효',
    variant: 'default',
    daysUntilExpiry,
  };
}

/**
 * Format validity date for display
 */
export function formatValidityDate(date: string): string {
  if (!date) return '-';
  
  try {
    return format(parseISO(date), 'yyyy-MM-dd');
  } catch {
    return date;
  }
}

/**
 * Validate basic validity period rules:
 * 1. End date cannot be before start date
 * 2. Both dates must be provided
 */
export function validateValidityPeriod(validFrom: string, validTo: string): string | null {
  if (!validFrom || !validTo) {
    return '❌ 시작일과 종료일을 모두 입력해주세요.';
  }

  const fromDate = parseISO(validFrom);
  const toDate = parseISO(validTo);

  if (toDate < fromDate) {
    return '❌ 종료일은 시작일보다 빠를 수 없습니다.';
  }

  return null;
}

/**
 * Check if two date ranges overlap
 */
export function doPeriodsOverlap(
  start1: string,
  end1: string,
  start2: string,
  end2: string
): boolean {
  if (!start1 || !end1 || !start2 || !end2) return false;
  
  const s1 = parseISO(start1);
  const e1 = parseISO(end1);
  const s2 = parseISO(start2);
  const e2 = parseISO(end2);

  // Two periods overlap if one starts before the other ends
  return s1 <= e2 && s2 <= e1;
}

/**
 * Get the expected start date for a new version based on the latest version's end date
 */
export function getExpectedStartDate<T extends { id: string; validFrom: string; validTo: string; version?: number }>(
  currentId: string,
  allItems: T[],
  filterCondition: (item: T) => boolean
): { expectedStartDate: string | null; latestVersion: T | null } {
  // Filter items that match the condition (same carrier + route)
  const relevantItems = allItems.filter(filterCondition);
  
  // Exclude current item if editing
  const otherItems = relevantItems.filter(item => item.id !== currentId);
  
  if (otherItems.length === 0) {
    // First version, no expected start date
    return { expectedStartDate: null, latestVersion: null };
  }

  // Sort by version descending to find the latest version
  const sortedItems = [...otherItems].sort((a, b) => (b.version || 0) - (a.version || 0));
  const latestVersion = sortedItems[0];

  if (!latestVersion.validTo) {
    return { expectedStartDate: null, latestVersion };
  }

  // Calculate expected start date (day after previous version's end date)
  const previousEndDate = parseISO(latestVersion.validTo);
  const expectedStartDate = addDays(previousEndDate, 1);

  return { 
    expectedStartDate: format(expectedStartDate, 'yyyy-MM-dd'),
    latestVersion 
  };
}

/**
 * Auto-populate validity period dates:
 * - Start date: day after latest version's end date
 * - End date: 1 month after start date
 */
export function autoPopulateValidityDates<T extends { id: string; validFrom: string; validTo: string; version?: number }>(
  currentId: string,
  allItems: T[],
  filterCondition: (item: T) => boolean
): { validFrom: string; validTo: string } {
  const { expectedStartDate } = getExpectedStartDate(currentId, allItems, filterCondition);

  if (!expectedStartDate) {
    // First version, use today as start date
    const today = new Date();
    const startDate = format(today, 'yyyy-MM-dd');
    const endDate = format(addMonths(today, 1), 'yyyy-MM-dd');
    return { validFrom: startDate, validTo: endDate };
  }

  // Use expected start date and add 1 month for end date
  const startDate = parseISO(expectedStartDate);
  const endDate = format(addMonths(startDate, 1), 'yyyy-MM-dd');

  return { validFrom: expectedStartDate, validTo: endDate };
}

/**
 * Validate version continuity:
 * New version's start date must be the day after the previous version's end date
 * New version's dates must be strictly after the previous version's dates
 */
export function validateVersionContinuity<T extends { id: string; validFrom: string; validTo: string; version?: number }>(
  validFrom: string,
  validTo: string,
  currentId: string,
  allItems: T[],
  filterCondition: (item: T) => boolean
): string | null {
  if (!validFrom || !validTo) {
    return '❌ 시작일과 종료일을 모두 입력해주세요.';
  }

  // Basic validation first
  const basicError = validateValidityPeriod(validFrom, validTo);
  if (basicError) return basicError;

  const { expectedStartDate, latestVersion } = getExpectedStartDate(currentId, allItems, filterCondition);

  if (!expectedStartDate || !latestVersion) {
    // First version, no continuity check needed
    return null;
  }

  const newStartDate = parseISO(validFrom);
  const newEndDate = parseISO(validTo);
  const prevStartDate = parseISO(latestVersion.validFrom);
  const prevEndDate = parseISO(latestVersion.validTo);

  // Check if new version's start date is on or before previous version's start date
  if (newStartDate <= prevStartDate) {
    return `❌ 새로운 버전의 시작일은 이전 버전의 시작일보다 이후여야 합니다.\n\n` +
      `이전 버전 (v${latestVersion.version || 1}): ${formatValidityDate(latestVersion.validFrom)} ~ ${formatValidityDate(latestVersion.validTo)}\n` +
      `입력한 유효기간: ${formatValidityDate(validFrom)} ~ ${formatValidityDate(validTo)}\n\n` +
      `💡 새로운 버전의 시작일(${formatValidityDate(validFrom)})이 이전 버전의 시작일(${formatValidityDate(latestVersion.validFrom)})과 같거나 이전입니다.`;
  }

  // Check if new version's end date is on or before previous version's end date
  if (newEndDate <= prevEndDate) {
    return `❌ 새로운 버전의 종료일은 이전 버전의 종료일보다 이후여야 합니다.\n\n` +
      `이전 버전 (v${latestVersion.version || 1}): ${formatValidityDate(latestVersion.validFrom)} ~ ${formatValidityDate(latestVersion.validTo)}\n` +
      `입력한 유효기간: ${formatValidityDate(validFrom)} ~ ${formatValidityDate(validTo)}\n\n` +
      `💡 새로운 버전의 종료일(${formatValidityDate(validTo)})이 이전 버전의 종료일(${formatValidityDate(latestVersion.validTo)})과 같거나 이전입니다.`;
  }

  // Check if start date matches expected date (day after previous version's end date)
  if (validFrom !== expectedStartDate) {
    return `❌ 새로운 버전의 시작일은 이전 버전의 종료일 다음날이어야 합니다.\n\n` +
      `이전 버전 (v${latestVersion.version || 1}): ${formatValidityDate(latestVersion.validFrom)} ~ ${formatValidityDate(latestVersion.validTo)}\n` +
      `예상 시작일: ${expectedStartDate}\n` +
      `입력한 시작일: ${formatValidityDate(validFrom)}\n\n` +
      `💡 유효기간은 연속되어야 하며 빈 기간이나 중복이 없어야 합니다.`;
  }

  return null;
}

/**
 * Check for overlapping validity periods and return WARNING message (not blocking)
 * Used for agent-specific freight where overlaps may cause cost calculation issues
 */
export function checkOverlapWarning<T extends { id: string; validFrom: string; validTo: string }>(
  validFrom: string,
  validTo: string,
  currentId: string,
  allItems: T[],
  filterCondition: (item: T) => boolean
): string | null {
  if (!validFrom || !validTo) return null;

  // Basic validation first
  const basicError = validateValidityPeriod(validFrom, validTo);
  if (basicError) return basicError;
  
  // Filter items that match the condition (same agent + route)
  const relevantItems = allItems.filter(filterCondition);

  // Check for overlaps with other items (excluding the current one being edited)
  for (const item of relevantItems) {
    if (item.id === currentId) continue;
    if (!item.validFrom || !item.validTo) continue;

    if (doPeriodsOverlap(validFrom, validTo, item.validFrom, item.validTo)) {
      return `⚠️ 경고: 동일한 대리점의 동일한 경로에 이미 운임이 존재합니다.\n\n기존 운임 유효기간: ${formatValidityDate(item.validFrom)} ~ ${formatValidityDate(item.validTo)}\n입력한 유효기간: ${formatValidityDate(validFrom)} ~ ${formatValidityDate(validTo)}\n\n💡 유효기간이 중복되면 원가 계산 시 어떤 운임을 사용할지 모호해질 수 있습니다. 계속 진행하시겠습니까?`;
    }
  }

  return null;
}

/**
 * Validate that a new validity period doesn't overlap with existing ones (BLOCKING ERROR)
 * For backward compatibility with other tables that haven't been updated yet
 * @deprecated Use checkOverlapWarning for agent-specific tables or validateVersionContinuity for version-managed tables
 */
export function validateNoOverlap<T extends { id: string; validFrom: string; validTo: string }>(
  validFrom: string,
  validTo: string,
  currentId: string,
  allItems: T[],
  filterCondition: (item: T) => boolean
): string | null {
  if (!validFrom || !validTo) return null;

  // Basic validation first
  const basicError = validateValidityPeriod(validFrom, validTo);
  if (basicError) return basicError;
  
  // Filter items that match the condition
  const relevantItems = allItems.filter(filterCondition);

  // Check for overlaps with other items (excluding the current one being edited)
  for (const item of relevantItems) {
    if (item.id === currentId) continue;
    if (!item.validFrom || !item.validTo) continue;

    if (doPeriodsOverlap(validFrom, validTo, item.validFrom, item.validTo)) {
      return `❌ 유효기간이 기존 운임과 중복됩니다.\n\n기존 운임 유효기간: ${formatValidityDate(item.validFrom)} ~ ${formatValidityDate(item.validTo)}\n입력한 유효기간: ${formatValidityDate(validFrom)} ~ ${formatValidityDate(validTo)}\n\n💡 유효기간은 하루라도 겹치면 안 됩니다. 기존 운임과 겹치지 않는 날짜를 입력해주세요.`;
    }
  }

  return null;
}

/**
 * Validate that a new validity period doesn't overlap with existing ones (BLOCKING ERROR)
 * Only checks overlap when rate has changed (for version management)
 * @deprecated Use validateVersionContinuity instead
 */
export function validateNoOverlapWhenRateChanged<T extends { id: string; rate?: number; validFrom: string; validTo: string }>(
  validFrom: string,
  validTo: string,
  currentId: string,
  newRate: number,
  allItems: T[],
  filterCondition: (item: T) => boolean
): string | null {
  if (!validFrom || !validTo) return null;

  // Basic validation first
  const basicError = validateValidityPeriod(validFrom, validTo);
  if (basicError) return basicError;
  
  // Filter items that match the condition (same route for general freight)
  const relevantItems = allItems.filter(filterCondition);

  // Check for overlaps with other items (excluding the current one being edited)
  for (const item of relevantItems) {
    if (item.id === currentId) continue;
    if (!item.validFrom || !item.validTo) continue;

    // Only check overlap if the rate is different (new version)
    if (item.rate !== undefined && item.rate !== newRate) {
      if (doPeriodsOverlap(validFrom, validTo, item.validFrom, item.validTo)) {
        return `❌ 유효기간이 기존 운임과 중복됩니다.\n\n기존 운임: $${item.rate} (${formatValidityDate(item.validFrom)} ~ ${formatValidityDate(item.validTo)})\n새로운 운임: $${newRate} (${formatValidityDate(validFrom)} ~ ${formatValidityDate(validTo)})\n\n💡 운임이 다른 경우 유효기간은 하루라도 겹치면 안 됩니다.`;
      }
    }
  }

  return null;
}

/**
 * Check if rate values have changed (for version management)
 */
export function hasRateChanged(
  oldRate: Record<string, unknown>,
  newRate: Record<string, unknown>,
  rateFields: string[]
): boolean {
  return rateFields.some(field => {
    const oldValue = oldRate[field];
    const newValue = newRate[field];
    return JSON.stringify(oldValue) !== JSON.stringify(newValue);
  });
}

/**
 * Check if validity period has changed
 */
export function hasValidityPeriodChanged(
  oldValidFrom: string,
  oldValidTo: string,
  newValidFrom: string,
  newValidTo: string
): boolean {
  return oldValidFrom !== newValidFrom || oldValidTo !== newValidTo;
}