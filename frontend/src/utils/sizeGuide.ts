export type SizeGuideRow = {
  size?: string;
  [key: string]: any;
};

export interface NormalizedSizeGuideData {
  rows: SizeGuideRow[];
  headers: string[];
}

const HEADER_SIZE_VALUES = ["size", "سایز"];

const isNumericKey = (key: string) => /^\d+$/.test(key);

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

export const normalizeSizeGuideData = (
  helperData?: SizeGuideRow[] | null,
): NormalizedSizeGuideData => {
  if (!Array.isArray(helperData) || helperData.length === 0) {
    return { rows: [], headers: [] };
  }

  const firstRow = helperData[0] ?? {};
  const measurementKeys = Object.keys(firstRow).filter((key) => key !== "size");

  if (measurementKeys.length === 0) {
    return { rows: helperData, headers: [] };
  }

  const numericKeys = measurementKeys.every(isNumericKey);
  const rawSizeValue = typeof firstRow.size === "string" ? firstRow.size.trim() : "";
  const normalizedSizeValue = rawSizeValue.toLowerCase();
  const hasEmbeddedHeaders =
    numericKeys || HEADER_SIZE_VALUES.includes(normalizedSizeValue) || HEADER_SIZE_VALUES.includes(rawSizeValue);

  if (!hasEmbeddedHeaders) {
    return {
      rows: helperData,
      headers: measurementKeys,
    };
  }

  const usedHeaders = new Set<string>();
  const headers = measurementKeys.map((key, index) => {
    const rawHeader = firstRow[key];
    const fallback = `ستون ${index + 1}`;
    const headerTitle =
      typeof rawHeader === "string" && rawHeader.trim().length > 0 ? rawHeader.trim() : fallback;

    return getUniqueHeaderTitle(headerTitle, usedHeaders);
  });

  const rows = helperData.slice(1).map((row) => {
    const normalizedRow: Record<string, string> = { size: row.size };
    headers.forEach((headerTitle, index) => {
      const sourceKey = measurementKeys[index];
      normalizedRow[headerTitle] = row[sourceKey] ?? "";
    });
    return normalizedRow;
  });

  return { rows, headers };
};
