import { PRODUCT_STOCK_POPULATE_FIELDS } from "../../cart/services/lib/stock";
import {
  buildProductAvailabilityExistsSql,
  buildProductDisplayPriceSql,
  getProductAvailabilityJoinContext,
} from "../../../utils/productAvailability";

export const PRODUCT_CARD_FIELDS = [
  "id",
  "Title",
  "Slug",
  "Status",
  "ProductType",
  "IsSimpleProduct",
  "SeenCount",
  "AverageRating",
  "RatingCount",
  "createdAt",
] as const;

export const PRODUCT_CARD_POPULATE = {
  CoverImage: {
    fields: ["url", "alternativeText", "formats", "mime", "width", "height"],
  },
  product_main_category: {
    fields: ["Title", "Slug"],
  },
  product_variations: {
    fields: ["IsPublished", "Price", "DiscountPrice", "SKU"],
    populate: {
      product_stock: {
        fields: [...PRODUCT_STOCK_POPULATE_FIELDS],
      },
      product_variation_color: {
        fields: ["Title", "ColorCode"],
      },
      general_discounts: {
        fields: ["Amount"],
      },
    },
  },
} as const;

export type FindProductCardsParams = {
  filters?: Record<string, unknown>;
  sort?: unknown;
  availability?: unknown;
  pagination?: {
    page?: number | string;
    pageSize?: number | string;
    limit?: number | string;
    start?: number | string;
    withCount?: boolean | string | number;
  };
};

export type OrderedProductIdQueryParams = FindProductCardsParams & {
  q?: string;
  isAdmin?: boolean;
};

export function parseQuerySortKey(sort: unknown): string | undefined {
  if (typeof sort === "string") {
    return sort;
  }
  if (Array.isArray(sort) && typeof sort[0] === "string") {
    return sort[0];
  }
  return undefined;
}

export function parseFindProductCardsPagination(pagination: FindProductCardsParams["pagination"] = {}) {
  const limit = Math.min(
    100,
    Math.max(1, parseInt(String(pagination.limit ?? pagination.pageSize ?? 25), 10)),
  );
  const page = Math.max(1, parseInt(String(pagination.page ?? 1), 10));
  const start =
    pagination.start !== undefined
      ? Math.max(0, parseInt(String(pagination.start), 10))
      : (page - 1) * limit;
  const withCount =
    pagination.withCount === false ||
    pagination.withCount === "false" ||
    pagination.withCount === 0 ||
    pagination.withCount === "0"
      ? false
      : true;

  return { limit, page, start, withCount };
}

export function parseEntityServiceSortKey(
  sortKey: string | undefined,
): Array<Record<string, "asc" | "desc">> {
  const normalized = sortKey?.trim() || "createdAt:desc";
  const [field, direction] = normalized.split(":");
  if (!field) {
    return [{ createdAt: "desc" }];
  }

  return [{ [field]: direction === "asc" ? "asc" : "desc" }];
}

const PRODUCT_COLUMN_MAP: Record<string, string> = {
  id: "id",
  Title: "title",
  Slug: "slug",
  Status: "status",
  ProductType: "product_type",
  IsSimpleProduct: "is_simple_product",
  SeenCount: "seen_count",
  AverageRating: "average_rating",
  RatingCount: "rating_count",
  createdAt: "created_at",
  updatedAt: "updated_at",
  removedAt: "removed_at",
  LastEditedByAdminAt: "last_edited_by_admin_at",
};

const CATEGORY_COLUMN_MAP: Record<string, string> = {
  id: "id",
  Title: "title",
  Slug: "slug",
};

const VARIATION_COLUMN_MAP: Record<string, string> = {
  id: "id",
  IsPublished: "is_published",
  Price: "price",
  DiscountPrice: "discount_price",
  SKU: "sku",
};

const STOCK_COLUMN_MAP: Record<string, string> = {
  Count: "count",
  reservedCount: "reserved_count",
  ReservedCount: "reserved_count",
};

const toArray = (value: unknown): unknown[] => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.includes(",")) {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }
  return [value];
};

const parseBooleanString = (value: unknown): boolean | undefined => {
  if (value === true || value === "true" || value === 1 || value === "1") return true;
  if (value === false || value === "false" || value === 0 || value === "0") return false;
  return undefined;
};

const addScalarCondition = (
  query: any,
  qualifiedColumn: string,
  condition: unknown,
) => {
  if (condition && typeof condition === "object" && !Array.isArray(condition)) {
    for (const [operator, value] of Object.entries(condition as Record<string, unknown>)) {
      switch (operator) {
        case "$eq":
          query.where(qualifiedColumn, value);
          break;
        case "$ne":
          query.whereNot(qualifiedColumn, value);
          break;
        case "$in":
          query.whereIn(qualifiedColumn, toArray(value));
          break;
        case "$notIn":
          query.whereNotIn(qualifiedColumn, toArray(value));
          break;
        case "$gt":
          query.where(qualifiedColumn, ">", value);
          break;
        case "$gte":
          query.where(qualifiedColumn, ">=", value);
          break;
        case "$lt":
          query.where(qualifiedColumn, "<", value);
          break;
        case "$lte":
          query.where(qualifiedColumn, "<=", value);
          break;
        case "$containsi":
          query.whereRaw("LOWER(??) LIKE LOWER(?)", [qualifiedColumn, `%${String(value)}%`]);
          break;
        case "$contains":
          query.where(qualifiedColumn, "like", `%${String(value)}%`);
          break;
        case "$null": {
          const isNull = parseBooleanString(value);
          if (isNull === false) query.whereNotNull(qualifiedColumn);
          else query.whereNull(qualifiedColumn);
          break;
        }
        default:
          break;
      }
    }
    return;
  }

  query.where(qualifiedColumn, condition);
};

const applyCategoryFilter = (
  knex: any,
  query: any,
  relation: "product_main_category" | "product_other_categories",
  filter: Record<string, unknown>,
) => {
  const linkTable =
    relation === "product_main_category"
      ? "products_product_main_category_links"
      : "products_product_other_categories_links";

  query.whereExists(function categoryExists(this: any) {
    this.select(knex.raw("1"))
      .from(`${linkTable} as pc_link`)
      .innerJoin("product_categories as pc", "pc.id", "pc_link.product_category_id")
      .whereRaw("pc_link.product_id = p.id");

    for (const [field, condition] of Object.entries(filter)) {
      const column = CATEGORY_COLUMN_MAP[field];
      if (column) addScalarCondition(this, `pc.${column}`, condition);
    }
  });
};

const applyVariationFilter = (
  knex: any,
  query: any,
  strapi: any,
  filter: Record<string, unknown>,
) => {
  const ctx = getProductAvailabilityJoinContext(strapi);

  query.whereExists(function variationExists(this: any) {
    this.select(knex.raw("1"))
      .from("product_variations as pv")
      .innerJoin(
        `${ctx.productVariationProductLinkTable} as pv_product_link`,
        `pv_product_link.${ctx.productVariationProductJoinColumn}`,
        "pv.id",
      )
      .whereRaw(`pv_product_link.${ctx.productVariationProductInverseColumn} = p.id`);

    const stockFilter = filter.product_stock;
    if (stockFilter && typeof stockFilter === "object") {
      this.innerJoin(
        `${ctx.productVariationStockLinkTable} as pv_stock_link`,
        `pv_stock_link.${ctx.productVariationStockJoinColumn}`,
        "pv.id",
      ).innerJoin(
        "product_stocks as ps",
        "ps.id",
        `pv_stock_link.${ctx.productVariationStockInverseColumn}`,
      );
    }

    for (const [field, condition] of Object.entries(filter)) {
      if (field === "product_stock") {
        const stockConditions = condition as Record<string, unknown>;
        for (const [stockField, stockCondition] of Object.entries(stockConditions)) {
          const column = STOCK_COLUMN_MAP[stockField];
          if (column) addScalarCondition(this, `ps.${column}`, stockCondition);
        }
        continue;
      }

      const column = VARIATION_COLUMN_MAP[field];
      if (column) addScalarCondition(this, `pv.${column}`, condition);
    }
  });
};

const applyProductFilters = (
  knex: any,
  query: any,
  strapi: any,
  filters: Record<string, unknown> | undefined,
) => {
  if (!filters || Object.keys(filters).length === 0) return;

  const applyFilterObject = (builder: any, filterObject: Record<string, unknown>) => {
    for (const [field, condition] of Object.entries(filterObject)) {
      if (field === "$and" && Array.isArray(condition)) {
        builder.where(function andGroup(this: any) {
          for (const item of condition) {
            if (item && typeof item === "object") {
              this.where(function nestedAnd(this: any) {
                applyFilterObject(this, item as Record<string, unknown>);
              });
            }
          }
        });
        continue;
      }

      if (field === "$or" && Array.isArray(condition)) {
        builder.where(function orGroup(this: any) {
          for (const item of condition) {
            if (item && typeof item === "object") {
              this.orWhere(function nestedOr(this: any) {
                applyFilterObject(this, item as Record<string, unknown>);
              });
            }
          }
        });
        continue;
      }

      if (field === "product_variations" && condition && typeof condition === "object") {
        applyVariationFilter(knex, builder, strapi, condition as Record<string, unknown>);
        continue;
      }

      if (
        (field === "product_main_category" || field === "product_other_categories") &&
        condition &&
        typeof condition === "object"
      ) {
        applyCategoryFilter(
          knex,
          builder,
          field,
          condition as Record<string, unknown>,
        );
        continue;
      }

      const column = PRODUCT_COLUMN_MAP[field];
      if (column) {
        addScalarCondition(builder, `p.${column}`, condition);
      }
    }
  };

  applyFilterObject(query, filters);
};

const applyAvailabilityOnlyFilter = (knex: any, query: any, strapi: any, availability: unknown) => {
  if (availability !== "in-stock" && availability !== "available" && availability !== true) return;
  const ctx = getProductAvailabilityJoinContext(strapi);
  query.whereRaw(buildProductAvailabilityExistsSql(knex, ctx, "p").toQuery());
};

const applySearchFilter = (query: any, q: unknown) => {
  if (typeof q !== "string" || q.trim() === "") return;
  const term = `%${q.trim()}%`;
  query.where(function searchGroup(this: any) {
    this.whereRaw("LOWER(??) LIKE LOWER(?)", ["p.title", term]).orWhereRaw(
      "LOWER(??) LIKE LOWER(?)",
      ["p.description", term],
    );
  });
};

const applyAvailabilityAwareOrder = (
  knex: any,
  query: any,
  strapi: any,
  sortKey: string | undefined,
) => {
  const ctx = getProductAvailabilityJoinContext(strapi);
  const availabilitySql = buildProductAvailabilityExistsSql(knex, ctx, "p");
  query.orderByRaw(`${availabilitySql.toQuery()} DESC`);

  const normalized = sortKey?.trim() || "createdAt:desc";
  const [rawField, rawDirection] = normalized.split(":");
  const direction = rawDirection === "asc" ? "asc" : "desc";

  if (rawField === "Price" || rawField === "price") {
    const priceSql = buildProductDisplayPriceSql(knex, ctx, "p");
    query.orderByRaw(`${priceSql.toQuery()} ${direction.toUpperCase()} NULLS LAST`);
  } else if (rawField === "LastEditedByAdminAt") {
    // Dedicated "last edited by admin" sort: products never edited by an admin have a NULL
    // timestamp and must sort last, falling back to creation order.
    query.orderByRaw(`p.last_edited_by_admin_at ${direction.toUpperCase()} NULLS LAST`);
    query.orderBy("p.created_at", "desc");
  } else {
    const column = PRODUCT_COLUMN_MAP[rawField || "createdAt"] || PRODUCT_COLUMN_MAP.createdAt;
    query.orderBy(`p.${column}`, direction);
  }

  query.orderBy("p.id", "asc");
};

export async function findOrderedProductIds(strapi: any, params: OrderedProductIdQueryParams = {}) {
  const knex = strapi.db.connection;
  const { limit, page, start, withCount } = parseFindProductCardsPagination(params.pagination);
  const filters = params.filters || {};
  const sortKey = parseQuerySortKey(params.sort);

  const buildBaseQuery = () => {
    const query = knex("products as p").whereNull("p.removed_at");
    applyProductFilters(knex, query, strapi, filters);
    applySearchFilter(query, params.q);
    applyAvailabilityOnlyFilter(knex, query, strapi, params.availability);
    return query;
  };

  const idQuery = buildBaseQuery().select("p.id");
  applyAvailabilityAwareOrder(knex, idQuery, strapi, sortKey);
  idQuery.limit(limit).offset(start);

  const countQuery = buildBaseQuery().countDistinct({ total: "p.id" }).first();
  const [rows, totalRow] = await Promise.all([
    idQuery,
    withCount ? countQuery : Promise.resolve(undefined),
  ]);

  const ids = (rows || []).map((row: any) => Number(row.id)).filter(Number.isFinite);
  const rawTotal = totalRow ? Number((totalRow as any).total) : undefined;

  return {
    ids,
    pagination: {
      page,
      pageSize: limit,
      ...(withCount && rawTotal !== undefined
        ? {
            pageCount: Math.ceil(rawTotal / limit) || 1,
            total: rawTotal,
          }
        : {}),
    },
  };
}
