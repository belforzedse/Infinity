"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import Action from "./Action";
import Color from "./Color";
import CommentsInfo from "./CommentsInfo";
import FAQItem from "./FAQItem";
import Main from "./Main";
import Model from "./Model";
import Price from "./Price";
import Size from "./Size";
import { findProductVariation, hasStockForVariation } from "@/services/product/product";
import logger from "@/utils/logger";
import type { ProductData } from "@/types/Product";

// Runtime-aware debug logger. It checks NODE_ENV and a runtime flag stored
// in localStorage (`pdp_debug`) or the build-time env `NEXT_PUBLIC_PDP_DEBUG`.
const isDebugActive = () => {
  if (process.env.NODE_ENV === "production") return false;
  try {
    if (typeof window !== "undefined") {
      const ls = localStorage.getItem("pdp_debug");
      if (ls !== null) return ls === "1";
    }
  } catch {
    // ignore localStorage access errors
  }
  return process.env.NEXT_PUBLIC_PDP_DEBUG === "true";
};

const debugLog = (...args: any[]) => {
  if (!isDebugActive()) return;
  const [message, ...meta] = args;
  logger.info(message, meta.length ? { meta } : undefined);
};

type Props = {
  product: {
    title: string;
    description: string;
    cleaningInstructions: string;
    returnPolicy: string;
    price: number;
    discount?: number;
    discountPrice?: number;
    category: string;
  };

  sizes: {
    id: string;
    title: string;
    variations: {
      title: string;
      value: string;
    }[];
  }[];

  colors: {
    id: string;
    title: string;
    colorCode: string;
  }[];

  models?: {
    id: string;
    title: string;
  }[];

  // Minimal typed shape for productData used in this component
  productData?: ProductData | null; // Add productData to be able to call findProductVariation
  productId: string;
};

// Minimal types used by this component (narrowed from Strapi shape)
// Reuse shared types from `src/types/product.ts`

export default function PDPHeroInfo(props: Props) {
  const { product, sizes, colors, models = [], productData, productId } = props;

  // Runtime toggle for debug panel (persisted in localStorage)
  const [isDebugEnabled, setIsDebugEnabled] = useState<boolean>(() => {
    try {
      if (typeof window !== "undefined") {
        const val = localStorage.getItem("pdp_debug");
        if (val !== null) return val === "1";
      }
    } catch {
      // ignore
    }
    return process.env.NEXT_PUBLIC_PDP_DEBUG === "true" && process.env.NODE_ENV !== "production";
  });

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("pdp_debug", isDebugEnabled ? "1" : "0");
      }
    } catch {
      // ignore
    }
  }, [isDebugEnabled]);

  // State for selected variation properties
  const [selectedColor, setSelectedColor] = useState<string>(colors.length > 0 ? colors[0].id : "");
  const [selectedSize, setSelectedSize] = useState<string>(sizes.length > 0 ? sizes[0].id : "");
  const [selectedModel, setSelectedModel] = useState<string>(models.length > 0 ? models[0].id : "");

  // Compute disabled ids for colors, sizes and models based on productData stock
  const { disabledColors, disabledSizes, disabledModels, availableVariations } = useMemo(() => {
    const disabledColors: string[] = [];
    const disabledSizes: string[] = [];
    const disabledModels: string[] = [];

    if (!productData?.attributes?.product_variations?.data) {
      return {
        disabledColors,
        disabledSizes,
        disabledModels,
        availableVariations: [],
      };
    }

    const variations: any[] = productData.attributes.product_variations.data;

    // Helper to mark option id as enabled when any variation containing it has stock
    const colorHasStock: Record<string, boolean> = {};
    const sizeHasStock: Record<string, boolean> = {};
    const modelHasStock: Record<string, boolean> = {};

    const availableVars: any[] = [];
    variations.forEach((variation) => {
      // require published + stock to be considered purchasable
      const published = variation.attributes.IsPublished === true;
      const stockOk = hasStockForVariation(variation, 1);
      const purchasable = published && stockOk;
      if (purchasable) availableVars.push(variation);

      // variation relations may be missing; guard
      const colorRel = variation.attributes.product_variation_color?.data;
      const sizeRel = variation.attributes.product_variation_size?.data;
      const modelRel = variation.attributes.product_variation_model?.data;

      if (colorRel)
        colorHasStock[colorRel.id.toString()] =
          colorHasStock[colorRel.id.toString()] || purchasable;
      if (sizeRel)
        sizeHasStock[sizeRel.id.toString()] = sizeHasStock[sizeRel.id.toString()] || purchasable;
      if (modelRel)
        modelHasStock[modelRel.id.toString()] =
          modelHasStock[modelRel.id.toString()] || purchasable;
    });

    colors.forEach((c) => {
      if (!colorHasStock[c.id]) disabledColors.push(c.id);
    });

    sizes.forEach((s) => {
      if (!sizeHasStock[s.id]) disabledSizes.push(s.id);
    });

    models.forEach((m) => {
      if (!modelHasStock[m.id]) disabledModels.push(m.id);
    });

    return {
      disabledColors,
      disabledSizes,
      disabledModels,
      availableVariations: availableVars,
    };
  }, [productData, colors, sizes, models]);

  // Calculate the current price based on selected variation
  const [currentPrice, setCurrentPrice] = useState(product.price);
  const [currentDiscount, setCurrentDiscount] = useState(product.discount || 0);
  const [currentDiscountPrice, setCurrentDiscountPrice] = useState(product.discountPrice || 0);
  const [currentVariationId, setCurrentVariationId] = useState<string | undefined>(undefined); // Will be set properly in useEffect based on default selections
  // Initialize stock status based on the initial/default variation
  const getInitialStockStatus = () => {
    debugLog("=== INITIAL STOCK STATUS DEBUG ===");
    debugLog("Product data:", productData);
    debugLog("Product variations:", productData?.attributes?.product_variations?.data);

    if (productData?.attributes?.product_variations?.data?.length) {
      debugLog("Number of variations:", productData.attributes.product_variations.data.length);

      // Try to get the default variation (same logic as in Hero component)
      const defaultVariation = productData.attributes.product_variations.data.find(
        (variation: any) => {
          debugLog(
            "Checking variation:",
            variation.id,
            "Published:",
            variation.attributes.IsPublished,
          );

          // Check if the variation is published
          if (!variation.attributes.IsPublished) {
            return false;
          }
          // Check if it has stock data and count > 0
          const stock = variation.attributes.product_stock?.data?.attributes;
          debugLog("Variation stock data:", stock);
          return stock && typeof stock.Count === "number" && stock.Count > 0;
        },
      );

      debugLog("Found default variation with stock:", defaultVariation);

      if (defaultVariation) {
        const stockStatus = hasStockForVariation(defaultVariation as any);
        debugLog("Default variation stock status:", stockStatus);
        return stockStatus;
      }

      // Fallback: check if any published variation exists
      const anyPublished = productData.attributes.product_variations.data.find(
        (variation: any) => variation.attributes.IsPublished === true,
      );

      debugLog("Found any published variation:", anyPublished);

      if (anyPublished) {
        const stockStatus = hasStockForVariation(anyPublished as any);
        debugLog("Any published variation stock status:", stockStatus);
        return stockStatus;
      }
    }

    debugLog("No variations found - returning false");
    debugLog("=== END INITIAL STOCK STATUS DEBUG ===");
    return false;
  };

  const [hasStock, setHasStock] = useState(getInitialStockStatus());

  // moved useEffect that initializes variation details to below

  // Handle size change
  const handleSizeChange = (sizeId: string) => {
    setSelectedSize(sizeId);
    updateVariationDetails(selectedColor, sizeId, selectedModel);
  };

  // Handle color change
  const handleColorChange = (colorId: string) => {
    setSelectedColor(colorId);
    updateVariationDetails(colorId, selectedSize, selectedModel);
  };

  // Handle model change
  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
    updateVariationDetails(selectedColor, selectedSize, modelId);
  };

  // Update variation details based on selected properties
  const updateVariationDetails = useCallback(
    (colorId: string, sizeId: string, modelId: string) => {
      debugLog("=== UPDATE VARIATION DETAILS DEBUG ===");
      debugLog("Selected color ID:", colorId);
      debugLog("Selected size ID:", sizeId);
      debugLog("Selected model ID:", modelId);

      if (
        !productData ||
        !productData.attributes ||
        !productData.attributes.product_variations ||
        !productData.attributes.product_variations.data
      ) {
        debugLog("❌ No product data available");
        return;
      }

      // Find the matching variation based on selected color, size, model
      // Convert string IDs to numbers for the findProductVariation function
      const colorIdNum = colorId ? parseInt(colorId) : undefined;
      const sizeIdNum = sizeId ? parseInt(sizeId) : undefined;
      const modelIdNum = modelId ? parseInt(modelId) : undefined;

      debugLog("Converted IDs - Color:", colorIdNum, "Size:", sizeIdNum, "Model:", modelIdNum);

      const variation = findProductVariation(productData as any, colorIdNum, sizeIdNum, modelIdNum);

      debugLog("Found variation:", variation);

      if (variation) {
        const variationAttributes = variation.attributes;
        debugLog("✅ Variation found with ID:", variation.id);
        debugLog("Variation attributes:", variationAttributes);

        // Update price based on found variation
        if (variationAttributes.DiscountPrice) {
          setCurrentPrice(Number(variationAttributes.Price));
          setCurrentDiscountPrice(Number(variationAttributes.DiscountPrice));
          // Calculate discount percentage
          const discountPercentage = Math.round(
            ((Number(variationAttributes.Price) - Number(variationAttributes.DiscountPrice)) /
              Number(variationAttributes.Price)) *
              100,
          );
          setCurrentDiscount(discountPercentage);
        } else {
          setCurrentPrice(Number(variationAttributes.Price));
          setCurrentDiscountPrice(0);
          setCurrentDiscount(0);
        }

        // Check stock for this variation - validate with default quantity of 1
        // This ensures the "Add to Cart" button shows correct availability
        const stockStatus = hasStockForVariation(variation, 1);
        debugLog("Stock status for variation:", stockStatus);
        setHasStock(stockStatus);

        // Store the current variation ID
        const variationIdString = variation.id.toString();
        debugLog("✅ Setting currentVariationId to:", variationIdString);
        setCurrentVariationId(variationIdString);
      } else {
        debugLog("❌ No variation found for selected combination");
        // Fallback to product default price if no variation found
        setCurrentPrice(product.price);
        setCurrentDiscountPrice(product.discountPrice || 0);
        setCurrentDiscount(product.discount || 0);
        setHasStock(false); // No variation found means no stock
        setCurrentVariationId(undefined);
      }

      debugLog("=== END UPDATE VARIATION DETAILS DEBUG ===");
    },
    [productData, product.price, product.discountPrice, product.discount],
  );

  // Initialize variation details based on default selections when component mounts
  useEffect(() => {
    if (!productData || !productData.attributes?.product_variations?.data) return;

    // If there's exactly one available variation (stock), auto-select it
    const availableVariations = productData.attributes.product_variations.data.filter((v: any) =>
      hasStockForVariation(v as any, 1),
    );
    if (availableVariations.length === 1) {
      const v = availableVariations[0];
      const colorId =
        v.attributes.product_variation_color?.data?.id?.toString() || colors[0]?.id || "";
      const sizeId =
        v.attributes.product_variation_size?.data?.id?.toString() || sizes[0]?.id || "";
      const modelId =
        v.attributes.product_variation_model?.data?.id?.toString() || models[0]?.id || "";

      setSelectedColor(colorId);
      setSelectedSize(sizeId);
      setSelectedModel(modelId);
      updateVariationDetails(colorId, sizeId, modelId);
      return;
    }

    // Otherwise use first non-disabled/defaults
    const firstColor = colors.find((c) => !disabledColors.includes(c.id)) || colors[0];
    const firstSize = sizes.find((s) => !disabledSizes.includes(s.id)) || sizes[0];
    const firstModel = models.find((m) => !disabledModels.includes(m.id)) || models[0];

    if (firstColor && firstSize) {
      setSelectedColor(firstColor.id);
      setSelectedSize(firstSize.id);
      if (firstModel) setSelectedModel(firstModel.id);
      updateVariationDetails(firstColor.id, firstSize.id, firstModel ? firstModel.id : "");
    }
  }, [
    productData,
    colors,
    sizes,
    models,
    updateVariationDetails,
    disabledColors,
    disabledSizes,
    disabledModels,
  ]);

  // Get selected color and size objects
  const selectedColorObj = colors.find((color) => color.id === selectedColor);
  const selectedSizeObj = sizes.find((size) => size.id === selectedSize);
  const selectedModelObj = models.find((model) => model.id === selectedModel);

  // Get current variation object for passing to Action component
  const getCurrentVariation = () => {
    if (!productData?.attributes?.product_variations?.data?.length) {
      return null;
    }

    if (currentVariationId) {
      return productData.attributes.product_variations.data.find(
        (variation: any) => variation.id.toString() === currentVariationId,
      );
    }

    // Return default variation if no specific one is selected
    return productData.attributes.product_variations.data[0];
  };

  const currentVariation = getCurrentVariation();

  return (
    <div className="flex flex-1 flex-col gap-5 md:max-w-[400px] tablet:max-w-[500px] lg:max-w-[688px]">
      {process.env.NODE_ENV !== "production" && (
        <div>
          <div className="mb-2">
            <button
              type="button"
              onClick={() => setIsDebugEnabled((s) => !s)}
              className="text-xs rounded bg-slate-100 px-2 py-1 text-slate-800"
            >
              {isDebugEnabled ? "Hide PDP Debug" : "Show PDP Debug"}
            </button>
          </div>

          {isDebugEnabled && (
            <div
              className="dev-debug-panel"
              style={{
                backgroundColor: "#f8fafc",
                padding: 12,
                fontSize: 12,
                color: "#334155",
              }}
            >
              <div style={{ fontWeight: 600 }}>DEV DEBUG: variations</div>
              <div style={{ marginTop: 8 }}>
                <div>
                  Available variation IDs:{" "}
                  {availableVariations && availableVariations.length
                    ? availableVariations.map((v: any) => v.id).join(", ")
                    : "(none)"}
                </div>
                <div>Disabled colors: {disabledColors.join(", ") || "(none)"}</div>
                <div>Disabled sizes: {disabledSizes.join(", ") || "(none)"}</div>
                <div>Disabled models: {disabledModels.join(", ") || "(none)"}</div>
                <div>
                  Selected: color={selectedColor} size={selectedSize} model=
                  {selectedModel}
                </div>
                <div>CurrentVariationId: {currentVariationId || "(none)"}</div>
              </div>
            </div>
          )}
        </div>
      )}
      <div className="hidden md:block">
        <Main category={product.category} title={product.title} discount={currentDiscount} />
      </div>

      <div className="h-[1px] bg-slate-100" />

      <Price price={currentPrice} discountPrice={currentDiscountPrice} hasStock={hasStock} />

      <div className="h-[1px] bg-slate-100" />

      <div className="flex flex-col gap-7">
        <Size
          sizes={sizes}
          onSizeChange={handleSizeChange}
          selectedSize={selectedSize}
          disabledSizeIds={disabledSizes}
          sizeHelper={productData?.attributes?.product_size_helper?.data}
        />

        <Color
          colors={colors}
          onColorChange={handleColorChange}
          selectedColor={selectedColor}
          disabledColorIds={disabledColors}
        />

        {models.length > 0 && (
          <Model
            models={models}
            onModelChange={handleModelChange}
            selectedModel={selectedModel}
            disabledModelIds={disabledModels}
          />
        )}
      </div>

      <div className="h-[1px] bg-slate-100" />

      <Action
        productId={productId}
        name={product.title}
        category={product.category}
        price={currentDiscountPrice > 0 ? currentDiscountPrice : currentPrice}
        originalPrice={currentDiscountPrice > 0 ? currentPrice : undefined}
        discountPercentage={currentDiscount > 0 ? currentDiscount : undefined}
        image={productData?.attributes?.CoverImage?.data?.attributes?.url || ""}
        color={selectedColorObj?.title}
        size={selectedSizeObj?.title}
        model={selectedModelObj?.title}
        variationId={currentVariationId}
        hasStock={hasStock}
        currentVariation={currentVariation}
      />

      <div className="h-[1px] bg-slate-100" />

      <div className="flex flex-col gap-7">
        <CommentsInfo
          commentCount={productData?.attributes?.product_reviews?.data?.length || 0}
          rateCount={productData?.attributes?.RatingCount || 0}
          last24hoursSeenCount={productData?.attributes?.last24hoursViews || 856}
        />

        {productData?.attributes?.Description && (
          <FAQItem title="جزئیات محصول" content={productData.attributes.Description} />
        )}

        {productData?.attributes?.CleaningTips && (
          <FAQItem title="نکات شست و شو" content={productData.attributes.CleaningTips} />
        )}

        {productData?.attributes?.ReturnConditions && (
          <FAQItem title="شرایط مرجوع" content={productData.attributes.ReturnConditions} />
        )}
      </div>
    </div>
  );
}
