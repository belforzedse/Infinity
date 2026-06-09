/**
 * product service
 */

import { factories } from "@strapi/strapi";
import {
  findOrderedProductIds,
  FindProductCardsParams,
  PRODUCT_CARD_FIELDS,
  PRODUCT_CARD_POPULATE,
} from "./product-card-query";

const CARD_COLOR_CODE_LIMIT = 8;
const HOMEPAGE_CARD_LIMIT = 20;
const HOMEPAGE_GIF_PROMO_LIMIT = 4;
const HOMEPAGE_BATCH_LIMIT = 36;

const HOMEPAGE_SECTION_IDS = [
  "newest",
  "favorites",
  "discounted",
  "gifPromoSlot1",
  "gifPromoSlot2",
  "custom",
  "weeklyPicks",
  "everyoneFollows",
] as const;

const PRODUCT_BOOST_KEYWORDS: readonly string[] = [
  "G",
  "G0020",
  "W0069",
  "W0043",
  "W0039",
  "W0096",
  "W002",
  "W0042",
  "W0018",
  "W0036",
  "W009",
  "W0010",
  "W0035",
  "G0015",
  "G0018",
  "W0030",
  "G004",
  "G005",
  "G006",
  "G003",
  "G007",
  "W0022",
  "W0029",
  "G0017",
  "W0025",
  "W0014",
  "W0033",
  "G0023",
  "G0024",
  "G0013",
  "W0012",
  "W0027",
  "W008",
  "W0024",
  "W0031",
  "W004",
  "W0015",
  "G002",
  "W0076",
  "W0087",
  "W0089",
  "G009",
  "G0011",
  "G0019",
  "G0030",
  "G0021",
  "G008",
  "G0022",
  "G0035",
  "G0031",
  "G0036",
  "W007",
  "G001",
  "W0058",
  "G0014",
  "G0029",
  "G0039",
  "G0038",
  "W005",
  "W0032",
  "W0038",
  "W0080",
  "G0028",
  "G00101",
  "G0098",
  "G0096",
];

type HomepageSectionId = (typeof HOMEPAGE_SECTION_IDS)[number];
type HomepageAssignment = {
  mode: "manual" | "category";
  productIds: number[];
  categorySlug: string;
};

const toNumber = (value: unknown): number => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const normalizeIds = (value: unknown): number[] => {
  if (!Array.isArray(value)) return [];
  const seen = new Set<number>();
  const ids: number[] = [];
  for (const item of value) {
    const id = Number(item);
    if (!Number.isFinite(id) || id <= 0 || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  return ids;
};

const normalizeAssignment = (value: unknown): HomepageAssignment => {
  const input = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const mode = input.mode === "category" ? "category" : "manual";
  return {
    mode,
    productIds: normalizeIds(input.productIds),
    categorySlug: typeof input.categorySlug === "string" ? input.categorySlug.trim() : "",
  };
};

const uniqueOrderedIds = (groups: Array<number[] | undefined>): number[] => {
  const seen = new Set<number>();
  const ids: number[] = [];
  for (const group of groups) {
    for (const id of group || []) {
      if (seen.has(id)) continue;
      seen.add(id);
      ids.push(id);
    }
  }
  return ids;
};

const baseHomepageProductFilters = () => ({
  Status: { $eq: "Active" },
  removedAt: { $null: true },
  product_variations: {
    Price: { $gte: 1 },
    product_stock: { Count: { $gt: 0 } },
  },
});

const buildHomepageTitleFilter = () => {
  return {
    $or: PRODUCT_BOOST_KEYWORDS.map((keyword) => ({
      Title: { $containsi: keyword },
    })),
  };
};

const relationData = (relation: any): any => {
  if (!relation) return null;
  if (Array.isArray(relation)) return relation;
  if (Object.prototype.hasOwnProperty.call(relation, "data")) return relation.data;
  return relation;
};

const relationArray = (relation: any): any[] => {
  const data = relationData(relation);
  if (!data) return [];
  return Array.isArray(data) ? data : [data];
};

const attrsOf = (entity: any): any => entity?.attributes || entity || {};

const getProductVariations = (product: any): any[] => {
  const attrs = attrsOf(product);
  return relationArray(attrs.product_variations || product?.product_variations);
};

const getStockCount = (variation: any): number => {
  const attrs = attrsOf(variation);
  const stock = relationData(attrs.product_stock);
  return toNumber(attrsOf(stock).Count);
};

const getGeneralDiscountAmount = (variation: any): number => {
  const attrs = attrsOf(variation);
  const discounts = relationArray(attrs.general_discounts);
  for (const discount of discounts) {
    const amount = toNumber(attrsOf(discount).Amount);
    if (amount > 0) return amount;
  }
  return 0;
};

const getVariationPricing = (variation: any) => {
  const attrs = attrsOf(variation);
  const price = toNumber(attrs.Price);
  const explicitDiscountPrice = toNumber(attrs.DiscountPrice);
  const generalDiscount = getGeneralDiscountAmount(variation);

  if (price <= 0) {
    return { price: 0, discountPrice: undefined, discount: undefined, finalPrice: 0 };
  }

  if (generalDiscount > 0) {
    const finalPrice = Math.max(0, Math.round(price * (1 - generalDiscount / 100)));
    return {
      price,
      discountPrice: finalPrice < price ? finalPrice : undefined,
      discount: finalPrice < price ? generalDiscount : undefined,
      finalPrice: finalPrice || price,
    };
  }

  if (explicitDiscountPrice > 0 && explicitDiscountPrice < price) {
    return {
      price,
      discountPrice: explicitDiscountPrice,
      discount: Math.round(((price - explicitDiscountPrice) / price) * 100),
      finalPrice: explicitDiscountPrice,
    };
  }

  return { price, discountPrice: undefined, discount: undefined, finalPrice: price };
};

const isPurchasableVariation = (variation: any): boolean => {
  const attrs = attrsOf(variation);
  return attrs.IsPublished === true && toNumber(attrs.Price) > 0 && getStockCount(variation) > 0;
};

const isPublishedPricedVariation = (variation: any): boolean => {
  const attrs = attrsOf(variation);
  return attrs.IsPublished === true && toNumber(attrs.Price) > 0;
};

const pickDisplayVariation = (variations: any[]) => {
  const purchasable = variations.filter(isPurchasableVariation);
  const candidates = purchasable.length > 0 ? purchasable : variations.filter(isPublishedPricedVariation);

  let selected: any | null = null;
  let selectedFinalPrice = Infinity;

  for (const variation of candidates) {
    const pricing = getVariationPricing(variation);
    const finalPrice = pricing.finalPrice || pricing.price;
    if (finalPrice > 0 && finalPrice < selectedFinalPrice) {
      selected = variation;
      selectedFinalPrice = finalPrice;
    }
  }

  return selected;
};

const getCoverImageAttributes = (product: any) => {
  const attrs = attrsOf(product);
  const cover = relationData(attrs.CoverImage);
  const coverAttrs = attrsOf(cover);
  if (!coverAttrs || Object.keys(coverAttrs).length === 0) return undefined;

  return {
    url: coverAttrs.url,
    alternativeText: coverAttrs.alternativeText,
    width: coverAttrs.width,
    height: coverAttrs.height,
    formats: coverAttrs.formats,
    mime: coverAttrs.mime,
  };
};

const getCategoryAttributes = (product: any) => {
  const attrs = attrsOf(product);
  const category = relationData(attrs.product_main_category);
  const categoryAttrs = attrsOf(category);
  if (!categoryAttrs || Object.keys(categoryAttrs).length === 0) return undefined;

  return {
    Title: categoryAttrs.Title,
    Slug: categoryAttrs.Slug,
  };
};

const productHasDiscount = (product: any): boolean => {
  const attrs = product?.attributes ?? product;
  const price = toNumber(attrs?.Price);
  const discountPrice = toNumber(attrs?.DiscountPrice);
  const discount = toNumber(attrs?.Discount);
  return discount > 0 || (price > 0 && discountPrice > 0 && discountPrice < price);
};

const productTitleMatchesKeywords = (product: any): boolean => {
  const attrs = product?.attributes ?? product;
  const title = String(attrs?.Title || "").toLowerCase();
  if (!title) return false;
  return PRODUCT_BOOST_KEYWORDS.some((keyword) => title.includes(keyword.toLowerCase()));
};

const sectionPayload = (
  id: HomepageSectionId,
  products: any[],
  limit: number,
  source: "manual" | "category" | "algorithm" | "disabled",
) => ({
  id,
  products,
  count: products.length,
  limit,
  source,
});

export default factories.createCoreService(
  "api::product.product",
  ({ strapi }) => ({
    /**
     * Check if a product has at least one published variation
     */
    hasPublishedStockedVariation(product: any): boolean {
      return getProductVariations(product).some(isPurchasableVariation);
    },

    serializeProductCard(product: any) {
      const attrs = attrsOf(product);
      const variations = getProductVariations(product);
      const displayVariation = pickDisplayVariation(variations);

      if (!displayVariation) return null;

      const pricing = getVariationPricing(displayVariation);
      const colors = new Map<number | string, string>();
      let inventoryCount = 0;

      for (const variation of variations) {
        const variationAttrs = attrsOf(variation);
        if (variationAttrs.IsPublished === true) {
          const color = relationData(variationAttrs.product_variation_color);
          const colorAttrs = attrsOf(color);
          const colorId = color?.id ?? colorAttrs.id ?? colorAttrs.ColorCode;
          const colorCode = colorAttrs.ColorCode;
          if (colorId !== undefined && colorCode) {
            colors.set(colorId, colorCode);
          }
        }

        if (isPurchasableVariation(variation)) {
          inventoryCount += getStockCount(variation);
        }
      }

      const isAvailable = inventoryCount > 0;
      const coverImage = getCoverImageAttributes(product);
      const category = getCategoryAttributes(product);
      const colorCodes = Array.from(colors.values());

      return {
        id: product?.id,
        attributes: {
          Title: attrs.Title,
          Slug: attrs.Slug,
          SeenCount: attrs.SeenCount ?? 0,
          AverageRating: attrs.AverageRating ?? null,
          RatingCount: attrs.RatingCount ?? null,
          Price: pricing.price,
          DiscountPrice: pricing.discountPrice,
          Discount: pricing.discount,
          IsAvailable: isAvailable,
          InventoryCount: inventoryCount,
          ColorsCount: colorCodes.length,
          ColorCodes: colorCodes.slice(0, CARD_COLOR_CODE_LIMIT),
          CoverImage: coverImage,
          product_main_category: category,
        },
      };
    },

    serializeProductCards(products: any[]): any[] {
      if (!Array.isArray(products)) return [];
      return products
        .map((product) => this.serializeProductCard(product))
        .filter((product: any) => product && product.id);
    },

    async findProductCardEntitiesByIds(ids: number[], filters: Record<string, unknown> = {}) {
      if (!Array.isArray(ids) || ids.length === 0) return [];
      const uniqueIds = uniqueOrderedIds([ids]);

      return strapi.entityService.findMany("api::product.product", {
        filters: {
          id: { $in: uniqueIds },
          ...filters,
        },
        fields: [...PRODUCT_CARD_FIELDS] as any,
        populate: PRODUCT_CARD_POPULATE as any,
        limit: uniqueIds.length,
      });
    },

    async findHomepageSectionIdsForAssignment(
      assignment: HomepageAssignment,
      limit: number,
    ): Promise<{ ids: number[]; source: "manual" | "category" | "disabled" }> {
      if (assignment.mode === "manual") {
        return { ids: assignment.productIds.slice(0, limit), source: "manual" };
      }

      if (!assignment.categorySlug) {
        return { ids: [], source: "disabled" };
      }

      const { ids } = await findOrderedProductIds(strapi, {
        filters: {
          ...baseHomepageProductFilters(),
          product_main_category: { Slug: { $eq: assignment.categorySlug } },
        },
        sort: ["createdAt:desc"],
        pagination: { limit, withCount: false },
      });

      return { ids, source: "category" };
    },

    /**
     * Card listing with stock-aware ordering (in-stock products first), computed
     * at the SQL level via findOrderedProductIds. The secondary sort (e.g.
     * createdAt:desc, Price) is preserved within each stock group. Products are
     * fetched by id then re-ordered to match the SQL-computed order.
     */
    async findProductCards(params: FindProductCardsParams = {}) {
      const { ids, pagination } = await findOrderedProductIds(strapi, params);
      const order = new Map<number, number>(ids.map((id: number, index: number) => [id, index]));

      if (ids.length === 0) {
        return { data: [], meta: { pagination } };
      }

      const results = await this.findProductCardEntitiesByIds(ids);

      const orderedResults = [...results].sort((a: any, b: any) => {
        const aIndex = order.get(Number(a?.id)) ?? Number.MAX_SAFE_INTEGER;
        const bIndex = order.get(Number(b?.id)) ?? Number.MAX_SAFE_INTEGER;
        return aIndex - bIndex;
      });

      return { data: this.serializeProductCards(orderedResults), meta: { pagination } };
    },

    async findHomepageSections() {
      const settingsEntity = await strapi.db.query("api::settings.settings").findOne();
      const settings = attrsOf(settingsEntity);

      const newestManualIds = normalizeIds(settings.homeNewestProductIds);
      const discountedManualIds = normalizeIds(settings.homeDiscountedProductIds);
      const gifPromoSlot1Assignment = normalizeAssignment(settings.homeGifPromoSlot1Assignment);
      const gifPromoSlot2Assignment = normalizeAssignment(settings.homeGifPromoSlot2Assignment);
      const customAssignment = normalizeAssignment(settings.homeCustomSectionAssignment);
      const weeklyPicksAssignment = normalizeAssignment({
        mode: "manual",
        productIds: settings.homeWeeklyPicksProductIds,
      });
      const everyoneFollowsAssignment = normalizeAssignment({
        mode: "manual",
        productIds: settings.homeEveryoneFollowsProductIds,
      });

      const batchPromise = findOrderedProductIds(strapi, {
        filters: baseHomepageProductFilters(),
        pagination: { limit: HOMEPAGE_BATCH_LIMIT, withCount: false },
      });
      const newestPromise =
        newestManualIds.length > 0
          ? Promise.resolve({ ids: newestManualIds.slice(0, HOMEPAGE_CARD_LIMIT), source: "manual" as const })
          : findOrderedProductIds(strapi, {
              filters: {
                ...baseHomepageProductFilters(),
                ...buildHomepageTitleFilter(),
              },
              sort: ["createdAt:desc"],
              pagination: { limit: HOMEPAGE_CARD_LIMIT, withCount: false },
            }).then(({ ids }) => ({ ids, source: "algorithm" as const }));
      const discountedPromise =
        discountedManualIds.length > 0
          ? Promise.resolve({
              ids: discountedManualIds.slice(0, HOMEPAGE_CARD_LIMIT),
              source: "manual" as const,
            })
          : Promise.resolve({ ids: [] as number[], source: "algorithm" as const });
      const gifPromoSlot1Promise =
        settings.homeGifPromoEnabled && String(settings.homeGifPromoSlot1Image || "").trim()
          ? this.findHomepageSectionIdsForAssignment(gifPromoSlot1Assignment, HOMEPAGE_GIF_PROMO_LIMIT)
          : Promise.resolve({ ids: [] as number[], source: "disabled" as const });
      const gifPromoSlot2Promise =
        settings.homeGifPromoEnabled && String(settings.homeGifPromoSlot2Image || "").trim()
          ? this.findHomepageSectionIdsForAssignment(gifPromoSlot2Assignment, HOMEPAGE_GIF_PROMO_LIMIT)
          : Promise.resolve({ ids: [] as number[], source: "disabled" as const });
      const customPromise =
        settings.homeCustomSectionEnabled
          ? this.findHomepageSectionIdsForAssignment(customAssignment, HOMEPAGE_CARD_LIMIT)
          : Promise.resolve({ ids: [] as number[], source: "disabled" as const });
      const weeklyPicksPromise =
        settings.homeWeeklyPicksEnabled
          ? this.findHomepageSectionIdsForAssignment(weeklyPicksAssignment, HOMEPAGE_CARD_LIMIT)
          : Promise.resolve({ ids: [] as number[], source: "disabled" as const });
      const everyoneFollowsPromise =
        settings.homeEveryoneFollowsEnabled
          ? this.findHomepageSectionIdsForAssignment(everyoneFollowsAssignment, HOMEPAGE_CARD_LIMIT)
          : Promise.resolve({ ids: [] as number[], source: "disabled" as const });

      const [
        batch,
        newest,
        discountedManual,
        gifPromoSlot1,
        gifPromoSlot2,
        custom,
        weeklyPicks,
        everyoneFollows,
      ] = await Promise.all([
        batchPromise,
        newestPromise,
        discountedPromise,
        gifPromoSlot1Promise,
        gifPromoSlot2Promise,
        customPromise,
        weeklyPicksPromise,
        everyoneFollowsPromise,
      ]);

      const allIds = uniqueOrderedIds([
        batch.ids,
        newest.ids,
        discountedManual.ids,
        gifPromoSlot1.ids,
        gifPromoSlot2.ids,
        custom.ids,
        weeklyPicks.ids,
        everyoneFollows.ids,
      ]);
      const entities = await this.findProductCardEntitiesByIds(allIds, baseHomepageProductFilters());
      const cards = this.serializeProductCards(entities);
      const cardsById = new Map(cards.map((card: any) => [Number(card.id), card]));
      const byIds = (ids: number[], limit: number, requireAvailable = false) =>
        ids
          .map((id) => cardsById.get(Number(id)))
          .filter((card: any) => card && (!requireAvailable || card?.attributes?.IsAvailable === true))
          .slice(0, limit);

      const batchCards = byIds(batch.ids, HOMEPAGE_BATCH_LIMIT, true);
      const discounted =
        discountedManual.source === "manual"
          ? byIds(discountedManual.ids, HOMEPAGE_CARD_LIMIT, true)
          : [...batchCards]
              .filter(productHasDiscount)
              .sort((a: any, b: any) => {
                const aMatch = productTitleMatchesKeywords(a);
                const bMatch = productTitleMatchesKeywords(b);
                if (aMatch && !bMatch) return -1;
                if (!aMatch && bMatch) return 1;
                return 0;
              })
              .slice(0, HOMEPAGE_CARD_LIMIT);

      const favorites = [...batchCards]
        .sort((a: any, b: any) => {
          const attrsA = a?.attributes;
          const attrsB = b?.attributes;
          const ratingA = toNumber(attrsA?.AverageRating);
          const ratingB = toNumber(attrsB?.AverageRating);
          return ratingB - ratingA;
        })
        .slice(0, HOMEPAGE_CARD_LIMIT);

      return {
        data: {
          sections: [
            sectionPayload(
              "newest",
              byIds(newest.ids, HOMEPAGE_CARD_LIMIT, true),
              HOMEPAGE_CARD_LIMIT,
              newest.source,
            ),
            sectionPayload("favorites", favorites, HOMEPAGE_CARD_LIMIT, "algorithm"),
            sectionPayload(
              "discounted",
              discounted,
              HOMEPAGE_CARD_LIMIT,
              discountedManual.source === "manual" ? "manual" : "algorithm",
            ),
            sectionPayload(
              "gifPromoSlot1",
              byIds(gifPromoSlot1.ids, HOMEPAGE_GIF_PROMO_LIMIT, gifPromoSlot1.source === "manual"),
              HOMEPAGE_GIF_PROMO_LIMIT,
              gifPromoSlot1.source,
            ),
            sectionPayload(
              "gifPromoSlot2",
              byIds(gifPromoSlot2.ids, HOMEPAGE_GIF_PROMO_LIMIT, gifPromoSlot2.source === "manual"),
              HOMEPAGE_GIF_PROMO_LIMIT,
              gifPromoSlot2.source,
            ),
            sectionPayload(
              "custom",
              byIds(custom.ids, HOMEPAGE_CARD_LIMIT, custom.source === "manual"),
              HOMEPAGE_CARD_LIMIT,
              custom.source,
            ),
            sectionPayload(
              "weeklyPicks",
              byIds(weeklyPicks.ids, HOMEPAGE_CARD_LIMIT, true),
              HOMEPAGE_CARD_LIMIT,
              weeklyPicks.source,
            ),
            sectionPayload(
              "everyoneFollows",
              byIds(everyoneFollows.ids, HOMEPAGE_CARD_LIMIT, true),
              HOMEPAGE_CARD_LIMIT,
              everyoneFollows.source,
            ),
          ],
        },
        meta: {
          sectionOrder: HOMEPAGE_SECTION_IDS,
          generatedAt: new Date().toISOString(),
        },
      };
    },

    /**
     * Search for products based on a query string
     * @param {string} query - The search query
     * @param {Object} params - Additional query parameters including isAdmin flag
     * @returns {Object} The search results and pagination
     */
    async search(query, params: { page?: number; pageSize?: number; isAdmin?: boolean; view?: string } = {}) {
      const { page = 1, pageSize = 10, isAdmin = false, view } = params;
      const start = (page - 1) * pageSize;
      const limit = parseInt(pageSize.toString());
      const compactView = view === "card" || view === "suggestion";

      // Create a search filter for product name, description, etc.
      // Exclude trashed products (removedAt should be null)
      // Only include Active products for non-admin users (exclude draft/InActive products)
      const filterConditions: any[] = [
        {
          $or: [
            { Title: { $containsi: query } },
            { Description: { $containsi: query } },
          ],
        },
        { removedAt: { $null: true } },
      ];

      // Only filter by Active status for non-admin users
      // Admins can see all products including drafts
      if (!isAdmin) {
        filterConditions.push({ Status: "Active" });
      }

      const filters: any = {
        $and: filterConditions,
      };

      // Find products matching the search query with pagination
      // Include Slug field for SEO-friendly URLs
      const [results, total] = await Promise.all([
        strapi.entityService.findMany("api::product.product", {
          filters,
          fields: compactView
            ? ["id", "Title", "Slug", "Status", "SeenCount", "AverageRating", "RatingCount"]
            : ["id", "Title", "Slug", "Description", "Status", "AverageRating", "RatingCount", "createdAt", "updatedAt"],
          populate: {
            CoverImage: compactView
              ? { fields: ["url", "alternativeText", "formats", "mime", "width", "height"] }
              : true,
            product_main_category: compactView ? { fields: ["Title", "Slug"] } : true,
            ...(compactView ? {} : { product_tags: true }),
            product_variations: {
              fields: ["IsPublished", "Price", "DiscountPrice", "SKU"],
              populate: {
                product_variation_color: true,
                ...(compactView ? {} : {
                  product_variation_size: true,
                  product_variation_model: true,
                }),
                product_stock: true,
                general_discounts: true,
              },
            },
          },
          sort: { createdAt: "desc" },
          limit,
          offset: start,
        }),
        strapi.db.query("api::product.product").count({ where: filters }),
      ]);

      const filteredResults = compactView
        ? results
        : results.filter((p: any) =>
            this.hasPublishedStockedVariation(
              p?.attributes ? { product_variations: p.attributes.product_variations?.data } : p,
            ),
          );

      return {
        results: compactView ? this.serializeProductCards(filteredResults) : filteredResults,
        pagination: {
          page: parseInt(page.toString()),
          pageSize: limit,
          pageCount: Math.ceil(total / limit),
          total,
        },
      };
    },
  })
);
