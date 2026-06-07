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

const toNumber = (value: unknown): number => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
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

      const results = await strapi.entityService.findMany("api::product.product", {
        filters: { id: { $in: ids } },
        fields: [...PRODUCT_CARD_FIELDS] as any,
        populate: PRODUCT_CARD_POPULATE as any,
        limit: ids.length,
      });

      const orderedResults = [...results].sort((a: any, b: any) => {
        const aIndex = order.get(Number(a?.id)) ?? Number.MAX_SAFE_INTEGER;
        const bIndex = order.get(Number(b?.id)) ?? Number.MAX_SAFE_INTEGER;
        return aIndex - bIndex;
      });

      return { data: this.serializeProductCards(orderedResults), meta: { pagination } };
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
