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
import {
  findProductVariation,
  getInitialPdpSelection,
  hasStockForVariation,
} from "@/services/product/product";
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

  const initialSelection = useMemo(
    () => getInitialPdpSelection(productData, colors, sizes, models),
    [productData, colors, sizes, models],
  );

  // State for selected variation properties (default to first in-stock variation)
  const [selectedColor, setSelectedColor] = useState<string>(initialSelection.colorId);
  const [selectedSize, setSelectedSize] = useState<string>(initialSelection.sizeId);
  const [selectedModel, setSelectedModel] = useState<string>(initialSelection.modelId);

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
  const [currentVariationId, setCurrentVariationId] = useState<string | undefined>(
    initialSelection.variationId,
  );
  const [hasStock, setHasStock] = useState(initialSelection.hasStock);

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

  // Sync price/stock with the first in-stock variation (matches product card availability)
  useEffect(() => {
    if (!productData?.attributes?.product_variations?.data?.length) return;

    const selection = getInitialPdpSelection(productData, colors, sizes, models);
    if (!selection.colorId && !selection.sizeId) return;

    setSelectedColor(selection.colorId);
    setSelectedSize(selection.sizeId);
    setSelectedModel(selection.modelId);
    updateVariationDetails(selection.colorId, selection.sizeId, selection.modelId);
  }, [productData, colors, sizes, models, updateVariationDetails]);

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
    <div className="flex min-w-0 flex-1 flex-col gap-5 md:max-w-[400px] tablet:max-w-[500px] lg:max-w-[688px]">
      {process.env.NODE_ENV !== "production" && (
        <div>
          <div className="mb-2">
            <button
              type="button"
              onClick={() => setIsDebugEnabled((s) => !s)}
              className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-800"
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
          last24hoursSeenCount={productData?.attributes?.SeenCount || 0}
        />

        {productData?.attributes?.Description && (
          <FAQItem title="جزئیات محصول" content={productData.attributes.Description} />
        )}

        {productData?.attributes?.CleaningTips && (
          <FAQItem title="توضیحات" content={productData.attributes.CleaningTips} />
        )}

        {productData?.attributes?.ReturnConditions && (
          <FAQItem title="شرایط مرجوع" content={productData.attributes.ReturnConditions} />
        )}
      </div>
    </div>
  );
}
