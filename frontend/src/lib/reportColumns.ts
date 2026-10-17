export interface ReportColumnDescriptor {
  key: string;
  label: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * The current API returns `columns` as string names, while older/front-end-shaped
 * responses may send `{ key, label }` objects. Normalize both at the UI boundary
 * without changing the API contract or dropping live report data.
 */
export function normalizeReportColumns(columns: unknown, rows: unknown): ReportColumnDescriptor[] {
  const normalized = (Array.isArray(columns) ? columns : []).flatMap((column): ReportColumnDescriptor[] => {
    if (typeof column === 'string' && column.trim()) {
      return [{ key: column, label: column }];
    }

    if (!isRecord(column)) return [];
    const key = typeof column.key === 'string' ? column.key.trim() : '';
    if (!key) return [];
    const label = typeof column.label === 'string' && column.label.trim() ? column.label.trim() : key;
    return [{ key, label }];
  });

  if (normalized.length) return normalized;

  const firstRow = Array.isArray(rows) ? rows.find(isRecord) : undefined;
  return firstRow ? Object.keys(firstRow).map((key) => ({ key, label: key })) : [];
}

export function normalizeReportRows(rows: unknown): Record<string, unknown>[] {
  return Array.isArray(rows) ? rows.filter(isRecord) : [];
}
