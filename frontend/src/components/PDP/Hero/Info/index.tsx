"use client";
import { useState, useEffect, useCallback } from "react";
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
  hasStockForVariation,
} from "@/services/product/product";
import logger from "@/utils/logger";

const debugLog = (...args: any[]) => {
  if (process.env.NODE_ENV !== "production") {
    const [message, ...meta] = args;
    logger.info(message, meta.length ? { meta } : undefined);
  }
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

  productData?: any; // Add productData to be able to call findProductVariation
  productId: string;
};

export default function PDPHeroInfo(props: Props) {
  const { product, sizes, colors, models = [], productData, productId } = props;

  // State for selected variation properties
  const [selectedColor, setSelectedColor] = useState<string>(
    colors.length > 0 ? colors[0].id : "",
  );
  const [selectedSize, setSelectedSize] = useState<string>(
    sizes.length > 0 ? sizes[0].id : "",
  );
  const [selectedModel, setSelectedModel] = useState<string>(
    models.length > 0 ? models[0].id : "",
  );

  // Calculate the current price based on selected variation
  const [currentPrice, setCurrentPrice] = useState(product.price);
  const [currentDiscount, setCurrentDiscount] = useState(product.discount || 0);
  const [currentDiscountPrice, setCurrentDiscountPrice] = useState(
    product.discountPrice || 0,
  );
  const [currentVariationId, setCurrentVariationId] = useState<
    string | undefined
  >(undefined); // Will be set properly in useEffect based on default selections
  // Initialize stock status based on the initial/default variation
  const getInitialStockStatus = () => {
    debugLog("=== INITIAL STOCK STATUS DEBUG ===");
    debugLog("Product data:", productData);
    debugLog(
      "Product variations:",
      productData?.attributes?.product_variations?.data,
    );

    if (productData?.attributes?.product_variations?.data?.length) {
      debugLog(
        "Number of variations:",
        productData.attributes.product_variations.data.length,
      );

      // Try to get the default variation (same logic as in Hero component)
      const defaultVariation =
        productData.attributes.product_variations.data.find(
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
        const stockStatus = hasStockForVariation(defaultVariation);
        debugLog("Default variation stock status:", stockStatus);
        return stockStatus;
      }

      // Fallback: check if any published variation exists
      const anyPublished = productData.attributes.product_variations.data.find(
        (variation: any) => variation.attributes.IsPublished === true,
      );

      debugLog("Found any published variation:", anyPublished);

      if (anyPublished) {
        const stockStatus = hasStockForVariation(anyPublished);
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

      debugLog(
        "Converted IDs - Color:",
        colorIdNum,
        "Size:",
        sizeIdNum,
        "Model:",
        modelIdNum,
      );

      const variation = findProductVariation(
        productData,
        colorIdNum,
        sizeIdNum,
        modelIdNum,
      );

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
            ((Number(variationAttributes.Price) -
              Number(variationAttributes.DiscountPrice)) /
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
    if (productData && colors.length > 0 && sizes.length > 0) {
      updateVariationDetails(
        colors[0].id,
        sizes[0].id,
        models.length > 0 ? models[0].id : "",
      );
    }
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
    <div className="flex flex-1 flex-col gap-5 md:max-w-[688px]">
      <div className="hidden md:block">
        <Main
          category={product.category}
          title={product.title}
          discount={currentDiscount}
        />
      </div>

      <div className="h-[1px] bg-slate-100" />

      <Price
        price={currentPrice}
        discountPrice={currentDiscountPrice}
        hasStock={hasStock}
      />

      <div className="h-[1px] bg-slate-100" />

      <div className="flex flex-col gap-7">
        <Size
          sizes={sizes}
          onSizeChange={handleSizeChange}
          selectedSize={selectedSize}
          sizeHelper={productData?.attributes?.product_size_helper?.data}
        />

        <Color
          colors={colors}
          onColorChange={handleColorChange}
          selectedColor={selectedColor}
        />

        {models.length > 0 && (
          <Model
            models={models}
            onModelChange={handleModelChange}
            selectedModel={selectedModel}
          />
        )}
      </div>

      <div className="h-[1px] bg-slate-100" />

      <Action
        productId={productId}
        name={product.title}
        category={product.category}
        price={currentDiscountPrice > 0 ? currentDiscountPrice : currentPrice}
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
          commentCount={
            productData?.attributes?.product_reviews?.data?.length || 0
          }
          rateCount={productData?.attributes?.RatingCount || 0}
          last24hoursSeenCount={
            productData?.attributes?.last24hoursViews || 856
          }
        />

        {productData?.attributes?.Description && (
          <FAQItem
            title="جزئیات محصول"
            content={productData.attributes.Description}
          />
        )}

        {productData?.attributes?.CleaningTips && (
          <FAQItem
            title="نکات شست و شو"
            content={productData.attributes.CleaningTips}
          />
        )}

        {productData?.attributes?.ReturnConditions && (
          <FAQItem
            title="شرایط مرجوع"
            content={productData.attributes.ReturnConditions}
          />
        )}
      </div>
    </div>
  );
}
