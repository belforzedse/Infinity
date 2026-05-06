import type {
  ProductDetail} from "@/services/product/product";
import {
  formatGalleryAssets,
  getDefaultProductVariation,
  getProductColors,
  getProductSizes,
  getProductModels,
} from "@/services/product/product";
import PDPHeroGallery from "./Gallery";
import PDPHeroInfo from "./Info";
import Main from "./Info/Main";

type PDPHeroProps = {
  productData: ProductDetail | null;
  productId: string;
};

export default function PDPHero({ productData, productId }: PDPHeroProps) {
  // Format gallery assets from product data - return empty array if no product data
  const assets = productData ? formatGalleryAssets(productData) : [];

  // Get product colors from helper function - only if productData exists
  let colors: { id: string; title: string; colorCode: string }[] = [];

  if (productData) {
    const extractedColors = getProductColors(productData);

    if (extractedColors.length > 0) {
      colors = extractedColors.map((color) => ({
        id: color.id.toString(),
        title: color.title,
        colorCode: color.colorCode,
      }));
    }
  }

  // Get product sizes from helper function - only if productData exists
  let sizes: { id: string; title: string; variations: { title: string; value: string }[] }[] = [];

  if (productData) {
    const extractedSizes = getProductSizes(productData);

    if (extractedSizes.length > 0) {
      sizes = extractedSizes.map((size) => ({
        id: size.id.toString(),
        title: size.title,
        variations: [
          {
            title: "اندازه",
            value: size.title,
          },
        ],
      }));
    }
  }

  // Get product models - only if productData exists
  let models: { id: string; title: string }[] = [];

  if (productData) {
    const extractedModels = getProductModels(productData);

    if (extractedModels.length > 0) {
      models = extractedModels.map((model) => ({
        id: model.id.toString(),
        title: model.title,
      }));
    }
  }

  // Get default variation for pricing - return 0 if no product data
  let price = 0;
  let discountPrice: number | undefined = undefined;
  let discount = 0;

  if (productData) {
    const defaultVariation = getDefaultProductVariation(productData);

    if (defaultVariation) {
      // Get price from the default variation
      const priceStr = defaultVariation.attributes.Price;
      price = typeof priceStr === "string" ? parseInt(priceStr, 10) : priceStr;

      // Get discount price if available
      const discountPriceStr = defaultVariation.attributes.DiscountPrice;
      if (discountPriceStr) {
        discountPrice =
          typeof discountPriceStr === "string" ? parseInt(discountPriceStr, 10) : discountPriceStr;

        // Calculate discount percentage
        discount = Math.round(((price - discountPrice) / price) * 100);
      }
    }
  }

  const product = {
    title: productData?.attributes.Title || "",
    description: productData?.attributes.Description || "",
    cleaningInstructions: productData?.attributes.CleaningTips || "",
    returnPolicy: productData?.attributes.ReturnConditions || "",
    price: price,
    discount: discount,
    discountPrice: discountPrice,
    category:
      productData?.attributes.product_main_category?.data?.attributes.Title ||
      productData?.attributes.product_main_category?.data?.attributes.Name ||
      "",
  };

  return (
    <div className="relative flex flex-col gap-4 md:flex-row md:gap-7">
      <div className="md:hidden">
        <Main category={product.category} title={product.title} discount={product.discount} />
      </div>

      <PDPHeroGallery assets={assets} />

      <PDPHeroInfo
        colors={colors}
        product={product}
        sizes={sizes}
        models={models}
        productData={productData}
        productId={productId}
      />
    </div>
  );
}
