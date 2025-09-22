import type { ProductCardProps } from "@/components/Product/Card";

export type DiscountSource = "general" | "listed";

export interface DiscountComputationResult {
  basePrice: number;
  finalPrice: number;
  discountAmount: number;
  discountPercent?: number;
  discountSource?: DiscountSource;
  generalDiscountId?: number;
}

type NumberLike = string | number | null | undefined;

type GeneralDiscountLike = {
  id?: number;
  attributes?: Record<string, unknown>;
} | null;

type VariationLike = {
  Price?: NumberLike;
  DiscountPrice?: NumberLike;
  general_discounts?: {
    data?: GeneralDiscountLike[] | GeneralDiscountLike;
  } | GeneralDiscountLike[] | GeneralDiscountLike;
  general_discount?: {
    data?: GeneralDiscountLike[] | GeneralDiscountLike;
  } | GeneralDiscountLike[] | GeneralDiscountLike;
  [key: string]: unknown;
};

const isValidDate = (value: unknown): value is Date => {
  return value instanceof Date && !Number.isNaN(value.getTime());
};

const parseDate = (value: unknown): Date | undefined => {
  if (!value) return undefined;
  if (value instanceof Date) return isValidDate(value) ? value : undefined;
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    return isValidDate(parsed) ? parsed : undefined;
  }
  return undefined;
};

export const parseNumber = (value: NumberLike): number | undefined => {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value === "string") {
    const cleaned = value.replace(/,/g, "").trim();
    if (!cleaned) return undefined;
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

const ensureArray = <T>(value: T | T[] | null | undefined): T[] => {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean) as T[];
  return [value];
};

const collectDiscountNodes = (variation: VariationLike): GeneralDiscountLike[] => {
  const groups = [variation.general_discounts, variation.general_discount];
  const nodes: GeneralDiscountLike[] = [];

  for (const group of groups) {
    if (!group) continue;
    if (Array.isArray(group)) {
      nodes.push(...group.filter(Boolean));
      continue;
    }

    const data = (group as any).data;
    if (Array.isArray(data)) {
      nodes.push(...data.filter(Boolean));
    } else if (data) {
      nodes.push(data);
    } else {
      nodes.push(group as GeneralDiscountLike);
    }
  }

  return nodes;
};

const normalizeBoolean = (value: unknown): boolean | undefined => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value.toLowerCase() === "true") return true;
    if (value.toLowerCase() === "false") return false;
  }
  if (typeof value === "number") {
    if (value === 1) return true;
    if (value === 0) return false;
  }
  return undefined;
};

interface GeneralDiscountEvaluation {
  discountAmount: number;
  discountPercent: number;
  discountSource: DiscountSource;
  generalDiscountId?: number;
}

const evaluateGeneralDiscount = (
  node: GeneralDiscountLike,
  basePrice: number,
  now: Date,
): GeneralDiscountEvaluation | null => {
  if (!node?.attributes || basePrice <= 0) return null;

  const attrs = node.attributes;
  const id = typeof node.id === "number" ? node.id : undefined;

  const rawIsActive = attrs.IsActive ?? attrs.isActive ?? attrs.active;
  const isActive = normalizeBoolean(rawIsActive);
  if (isActive === false) return null;

  const start = parseDate((attrs as any).StartDate ?? (attrs as any).startDate);
  const end = parseDate((attrs as any).EndDate ?? (attrs as any).endDate);

  if (start && start > now) return null;
  if (end && end < now) return null;

  const minimumAmount = parseNumber((attrs as any).MinimumAmount ?? (attrs as any).minimumAmount);
  if (minimumAmount !== undefined && basePrice < minimumAmount) return null;

  const type = ((attrs as any).Type ?? (attrs as any).type ?? "Discount").toString();
  const amountValue = parseNumber((attrs as any).Amount ?? (attrs as any).amount);
  if (!amountValue || amountValue <= 0) return null;

  const limitAmount = parseNumber((attrs as any).LimitAmount ?? (attrs as any).limitAmount ?? (attrs as any).MaxAmount ?? (attrs as any).maxAmount);

  let discountAmount = 0;
  let discountPercent = 0;

  if (type === "Discount" || normalizeBoolean((attrs as any).IsPercentage) === true) {
    discountAmount = (basePrice * amountValue) / 100;
    if (limitAmount !== undefined && limitAmount > 0 && discountAmount > limitAmount) {
      discountAmount = limitAmount;
    }
    discountAmount = Math.min(discountAmount, basePrice);
    discountPercent = basePrice > 0 ? Math.round((discountAmount / basePrice) * 100) : 0;
  } else {
    discountAmount = Math.min(amountValue, basePrice);
    discountPercent = basePrice > 0 ? Math.round((discountAmount / basePrice) * 100) : 0;
  }

  if (!(discountAmount > 0)) return null;

  return {
    discountAmount,
    discountPercent,
    discountSource: "general",
    generalDiscountId: id,
  };
};

const evaluateListedDiscountPrice = (
  variation: VariationLike,
  basePrice: number,
): GeneralDiscountEvaluation | null => {
  const discountPrice = parseNumber(variation.DiscountPrice);
  if (discountPrice === undefined || discountPrice <= 0 || discountPrice >= basePrice) {
    return null;
  }

  const discountAmount = basePrice - discountPrice;
  const discountPercent = basePrice > 0 ? Math.round((discountAmount / basePrice) * 100) : 0;
  if (!(discountAmount > 0)) return null;

  return {
    discountAmount,
    discountPercent,
    discountSource: "listed",
  };
};

export const computeDiscountForVariation = (
  variation: VariationLike,
  options: { now?: Date } = {},
): DiscountComputationResult | null => {
  const basePrice = parseNumber(variation?.Price);
  if (!basePrice || basePrice <= 0) {
    return null;
  }

  const now = options.now ?? new Date();
  const candidates: GeneralDiscountEvaluation[] = [];

  for (const node of collectDiscountNodes(variation)) {
    const evaluation = evaluateGeneralDiscount(node, basePrice, now);
    if (evaluation) {
      candidates.push(evaluation);
    }
  }

  const listed = evaluateListedDiscountPrice(variation, basePrice);
  if (listed) {
    candidates.push(listed);
  }

  if (candidates.length === 0) {
    return {
      basePrice,
      finalPrice: basePrice,
      discountAmount: 0,
    };
  }

  const best = candidates.reduce((prev, current) => {
    if (!prev) return current;
    if (current.discountAmount > prev.discountAmount) return current;
    return prev;
  });

  const finalPrice = Math.max(0, basePrice - best.discountAmount);

  return {
    basePrice,
    finalPrice,
    discountAmount: best.discountAmount,
    discountPercent: best.discountPercent > 0 ? best.discountPercent : undefined,
    discountSource: best.discountSource,
    generalDiscountId: best.generalDiscountId,
  };
};

export const hasActiveDiscount = (variation: VariationLike, now: Date = new Date()): boolean => {
  const result = computeDiscountForVariation(variation, { now });
  return !!result && result.discountAmount > 0 && result.finalPrice < result.basePrice;
};

export const applyDiscountToProductCard = (
  product: ProductCardProps,
  discount: DiscountComputationResult | null,
): ProductCardProps => {
  if (!discount || discount.discountAmount <= 0 || discount.finalPrice >= discount.basePrice) {
    const { discount: _prevDiscount, discountPrice: _prevDiscountPrice, ...rest } = product;
    return rest;
  }

  const discountPrice = Math.round(discount.finalPrice);
  const discountPercent = discount.discountPercent ?? Math.round((discount.discountAmount / discount.basePrice) * 100);

  return {
    ...product,
    discount: discountPercent,
    discountPrice,
  };
};
