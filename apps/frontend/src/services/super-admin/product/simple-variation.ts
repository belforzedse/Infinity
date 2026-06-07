import { apiClient } from "@/services";

/**
 * Simple products are modeled as a product with a single, attribute-less
 * (synthetic) published variation that carries SKU/Price/DiscountPrice/Stock.
 * This keeps the storefront, cart, checkout, order and payment flows identical
 * for simple and variable products (a simple product is "a variable product
 * with one invisible variation").
 *
 * This helper creates/updates that single variation and its stock, and ensures
 * no other variation stays published for a simple product.
 */

const MAX_STOCK = 1000;

type SimpleProductInput = {
  ProductType: "Variable" | "Simple";
  IsSimpleProduct?: boolean;
  SimpleVariationId?: number;
  SimpleStockId?: number;
  SimpleSKU?: string;
  SimplePrice?: number;
  SimpleDiscountPrice?: number | null;
  SimpleStock?: number;
  SimpleIsPublished?: boolean;
};

const readResponseId = (response: any): number | undefined =>
  response?.data?.id ?? response?.id ?? response?.data?.data?.id;

const normalizeStock = (value: unknown): number => {
  const parsed = Number(value ?? 0);
  if (!Number.isFinite(parsed)) return 0;
  return Math.min(Math.max(Math.floor(parsed), 0), MAX_STOCK);
};

const normalizePrice = (value: unknown): number => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? Math.max(parsed, 0) : 0;
};

const buildSimpleSku = (productId: number, sku?: string): string => {
  const trimmed = sku?.trim();
  return trimmed || `INFINITY-${productId}`;
};

export const syncSimpleProductVariation = async (
  productId: number,
  product: SimpleProductInput,
) => {
  if (product.ProductType !== "Simple" && product.IsSimpleProduct !== true) return;

  const variationPayload = {
    product: productId,
    SKU: buildSimpleSku(productId, product.SimpleSKU),
    Price: normalizePrice(product.SimplePrice),
    DiscountPrice:
      product.SimpleDiscountPrice === undefined || product.SimpleDiscountPrice === null
        ? null
        : normalizePrice(product.SimpleDiscountPrice),
    IsPublished: product.SimpleIsPublished !== false,
  };

  let variationId = product.SimpleVariationId;

  if (variationId) {
    await apiClient.put(`/product-variations/${variationId}`, {
      data: variationPayload,
    });
  } else {
    const variationResponse = await apiClient.post("/product-variations", {
      data: variationPayload,
    });
    variationId = readResponseId(variationResponse);
  }

  if (!variationId) {
    throw new Error("Could not resolve simple product variation id");
  }

  const stockPayload = {
    Count: normalizeStock(product.SimpleStock),
    product_variation: variationId,
  };

  if (product.SimpleStockId) {
    await apiClient.put(`/product-stocks/${product.SimpleStockId}`, {
      data: stockPayload,
    });
  } else {
    await apiClient.post("/product-stocks", {
      data: stockPayload,
    });
  }

  const variationsResponse = await apiClient.get<any>(
    `/product-variations?filters[product][id][$eq]=${productId}&pagination[pageSize]=1000`,
    { cache: "no-store" },
  );
  const variations = Array.isArray(variationsResponse?.data) ? variationsResponse.data : [];

  await Promise.all(
    variations
      .filter((variation: any) => variation.id !== variationId)
      .map((variation: any) =>
        apiClient.put(`/product-variations/${variation.id}`, {
          data: { IsPublished: false },
        }),
      ),
  );
};
