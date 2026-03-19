/**
 * Format currency values
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
  }).format(value);
}

/**
 * Format percentages
 */
export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(2)}%`;
}

/**
 * Format dates
 */
export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

/**
 * Parse CSV data
 */
export function parseCSV(content: string): string[][] {
  const lines = content.split('\n').filter(line => line.trim());
  return lines.map(line => line.split(',').map(cell => cell.trim()));
}

/**
 * Validate transaction data structure
 */
export interface TransactionRow {
  date: string;
  description: string;
  amount: number;
  category: string;
}

export function validateTransactionData(row: string[], headers: string[]): TransactionRow | null {
  const dateIdx = headers.findIndex(h => h.toLowerCase().includes('date'));
  const descIdx = headers.findIndex(h => h.toLowerCase().includes('description') || h.toLowerCase().includes('desc'));
  const amountIdx = headers.findIndex(h => h.toLowerCase().includes('amount'));
  const categoryIdx = headers.findIndex(h => h.toLowerCase().includes('category'));

  if (dateIdx === -1 || amountIdx === -1) {
    return null;
  }

  const amount = parseFloat(row[amountIdx]);
  if (isNaN(amount)) {
    return null;
  }

  return {
    date: row[dateIdx],
    description: row[descIdx] ? row[descIdx] : '',
    amount,
    category: row[categoryIdx] ? row[categoryIdx] : 'Other',
  };
}

/**
 * Calculate basic statistics
 */
export interface Statistics {
  total: number;
  average: number;
  min: number;
  max: number;
  count: number;
}

export function calculateStats(amounts: number[]): Statistics {
  if (amounts.length === 0) {
    return { total: 0, average: 0, min: 0, max: 0, count: 0 };
  }

  return {
    total: amounts.reduce((a, b) => a + b, 0),
    average: amounts.reduce((a, b) => a + b, 0) / amounts.length,
    min: Math.min(...amounts),
    max: Math.max(...amounts),
    count: amounts.length,
  };
}

/**
 * Slugify text for URLs
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
