type StockAttributes = {
  Count?: number | string;
  reservedCount?: number | string;
  ReservedCount?: number | string;
};

const normalizeNumber = (value: unknown): number => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "") return 0;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

export const getAvailableStockCountFromStock = (
  stock?: StockAttributes | null,
): number => {
  if (!stock) return 0;
  const count = normalizeNumber(stock.Count);
  const reserved = normalizeNumber(
    stock.reservedCount ?? (stock as { ReservedCount?: number | string }).ReservedCount,
  );
  return Math.max(0, count - reserved);
};

export const getAvailableStockCountFromRelation = (
  productStock?: { data?: { attributes?: StockAttributes } | null } | null,
): number => {
  return getAvailableStockCountFromStock(productStock?.data?.attributes ?? null);
};
