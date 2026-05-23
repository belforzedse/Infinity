import { parseAsInteger, parseAsString } from "nuqs";

export const plpQueryParsers = {
  available: parseAsString,
  minPrice: parseAsString,
  maxPrice: parseAsString,
  size: parseAsString,
  material: parseAsString,
  season: parseAsString,
  gender: parseAsString,
  usage: parseAsString,
  sort: parseAsString,
  hasDiscount: parseAsString,
  page: parseAsInteger.withDefault(1),
} as const;

export const plpQueryOptions = {
  shallow: false,
  history: "replace" as const,
} as const;
