export type SizeGuideRow = {
  size?: string;
  [key: string]: any;
};

export interface NormalizedSizeGuideData {
  rows: SizeGuideRow[];
  headers: string[];
}

export type SizeGuideMatrix = Array<Array<string | number | null | undefined>>;

const HEADER_SIZE_VALUES = ["size", "سایز"];
const DEFAULT_SIZE_HEADER = "سایز";
const sanitizeCell = (value: unknown) =>
  typeof value === "number" ? String(value) : typeof value === "string" ? value.trim() : "";

const getUniqueHeaderTitle = (title: string, used: Set<string>) => {
  const baseTitle = title.trim().length > 0 ? title.trim() : "ستون";
  let uniqueTitle = baseTitle;
  let suffix = 2;

  while (used.has(uniqueTitle)) {
    uniqueTitle = `${baseTitle} (${suffix++})`;
  }

  used.add(uniqueTitle);
  return uniqueTitle;
};

const normalizeMatrixData = (matrix: SizeGuideMatrix): NormalizedSizeGuideData => {
  if (matrix.length === 0 || !Array.isArray(matrix[0])) {
    return { rows: [], headers: [] };
  }

  const headerRow = matrix[0];
  const usedHeaders = new Set<string>();

  const headerEntries = headerRow.map((cell, index) => {
    const fallback = `ستون ${index + 1}`;
    const headerTitle = sanitizeCell(cell) || fallback;
    const uniqueTitle = getUniqueHeaderTitle(headerTitle, usedHeaders) || fallback;
    return {
      index,
      title: uniqueTitle,
      rawTitle: sanitizeCell(cell).toLowerCase(),
    };
  });

  const sizeEntry =
    headerEntries.find((entry) => HEADER_SIZE_VALUES.includes(entry.rawTitle)) ||
    headerEntries[0];

  const measurementEntries = headerEntries.filter((entry) => entry.index !== sizeEntry.index);
  const headers = measurementEntries.map((entry) => entry.title);

  const rows = matrix.slice(1).map((row) => {
    const normalizedRow: SizeGuideRow = {
      size: sanitizeCell(row[sizeEntry.index]),
    };

    measurementEntries.forEach((entry) => {
      normalizedRow[entry.title] = sanitizeCell(row[entry.index]);
    });

    return normalizedRow;
  });

  return { rows, headers };
};

const normalizeObjectRows = (helperData: SizeGuideRow[]): NormalizedSizeGuideData => {
  const measurementKeys = new Set<string>();
  helperData.forEach((row) => {
    Object.keys(row || {}).forEach((key) => {
      if (key !== "size") {
        measurementKeys.add(key);
      }
    });
  });

  const headers = Array.from(measurementKeys);
  const rows = helperData.map((row) => {
    const normalizedRow: SizeGuideRow = {
      size: row.size ?? row[DEFAULT_SIZE_HEADER] ?? "",
    };
    headers.forEach((header) => {
      normalizedRow[header] = row[header] ?? "";
    });
    return normalizedRow;
  });

  return { rows, headers };
};

const coerceHelperPayload = (
  helperData?: SizeGuideRow[] | SizeGuideMatrix | string | null,
): SizeGuideRow[] | SizeGuideMatrix | null => {
  if (typeof helperData === "string") {
    try {
      const parsed = JSON.parse(helperData);
      return Array.isArray(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
  return Array.isArray(helperData) ? helperData : null;
};

export const normalizeSizeGuideData = (
  rawHelperData?: SizeGuideRow[] | SizeGuideMatrix | string | null,
): NormalizedSizeGuideData => {
  const helperData = coerceHelperPayload(rawHelperData);
  if (!helperData || helperData.length === 0) {
    return { rows: [], headers: [] };
  }

  if (Array.isArray(helperData[0])) {
    return normalizeMatrixData(helperData as SizeGuideMatrix);
  }

  return normalizeObjectRows(helperData as SizeGuideRow[]);
};

export const serializeSizeGuideMatrix = (
  rows: SizeGuideRow[],
  columns?: { key: string; title: string }[],
): SizeGuideMatrix => {
  if (!Array.isArray(rows) || rows.length === 0) {
    return [];
  }

  const measurementColumns =
    columns && columns.length > 0
      ? columns
      : Array.from(
          rows.reduce((set, row) => {
            Object.keys(row || {}).forEach((key) => {
              if (key !== "size") {
                set.add(key);
              }
            });
            return set;
          }, new Set<string>()),
        ).map((key) => ({ key, title: key }));

  const headerRow = [DEFAULT_SIZE_HEADER, ...measurementColumns.map((col) => col.title || col.key)];
  const matrix: SizeGuideMatrix = [headerRow];

  rows.forEach((row) => {
    const sizeValue = row.size ?? row[DEFAULT_SIZE_HEADER] ?? "";
    const record = [
      sanitizeCell(sizeValue),
      ...measurementColumns.map((col) => sanitizeCell(row[col.key])),
    ];
    matrix.push(record);
  });

  return matrix;
};
