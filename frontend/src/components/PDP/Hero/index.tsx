import {
  ProductDetail,
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
  // Format gallery assets from product data
  const assets = productData
    ? formatGalleryAssets(productData)
    : [
        {
          alt: "alt",
          id: "1",
          src: "/images/pdp/image-1.png",
          thumbnail: "/images/pdp/image-1-th.png",
          type: "image" as "image",
        },
        {
          alt: "alt",
          id: "2",
          src: "/images/pdp/image-2.png",
          thumbnail: "/images/pdp/image-2-th.png",
          type: "image" as "image",
        },
        {
          alt: "alt",
          id: "3",
          src: "/images/pdp/video-1.mp4",
          thumbnail: "/images/pdp/video-1-th.png",
          type: "video" as "video",
        },
        {
          alt: "alt",
          id: "4",
          src: "/images/pdp/image-1.png",
          thumbnail: "/images/pdp/image-1-th.png",
          type: "image" as "image",
        },
        {
          alt: "alt",
          id: "5",
          src: "/images/pdp/image-2.png",
          thumbnail: "/images/pdp/image-2-th.png",
          type: "image" as "image",
        },
      ];

  // Default colors array
  const defaultColors = [
    {
      id: "1",
      title: "مشکی",
      colorCode: "#000000",
    },
    {
      id: "2",
      title: "کرم",
      colorCode: "#ECB176",
    },
    {
      id: "3",
      title: "آبی",
      colorCode: "#0000FF",
    },
  ];

  // Get product colors from helper function
  let colors = defaultColors;

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

  // Default sizes array
  const defaultSizes = [
    {
      id: "1",
      title: "S",
      variations: [
        {
          title: "دور سینه",
          value: "88",
        },
        {
          title: "دور کمر",
          value: "70",
        },
      ],
    },
    {
      id: "2",
      title: "M",
      variations: [
        {
          title: "دور سینه",
          value: "92",
        },
        {
          title: "دور کمر",
          value: "74",
        },
      ],
    },
  ];

  // Get product sizes from helper function
  let sizes = defaultSizes;

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

  // Get product models
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

  // Get default variation for pricing
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
          typeof discountPriceStr === "string"
            ? parseInt(discountPriceStr, 10)
            : discountPriceStr;

        // Calculate discount percentage
        discount = Math.round(((price - discountPrice) / price) * 100);
      }
    } else {
      // Fallback to first variation or default price
      price = 1850000;
    }
  } else {
    // Default values if no product data
    price = 1850000;
    discount = 15;
    discountPrice = 1572500;
  }

  const product = {
    title: productData?.attributes.Title || "مانتو زنانه مدل پاییزه",
    description:
      productData?.attributes.Description ||
      "مانتو زنانه شیک و مجلسی با پارچه نخی درجه یک، مناسب برای استفاده روزمره و مهمانی",
    cleaningInstructions:
      productData?.attributes.CleaningTips ||
      "شستشو با آب سرد، اتو در دمای متوسط",
    returnPolicy:
      productData?.attributes.ReturnConditions ||
      "۷ روز مهلت تست و بازگشت کالا",
    price: price,
    discount: discount,
    discountPrice: discountPrice,
    category:
      productData?.attributes.product_main_category?.data?.attributes.Title ||
      productData?.attributes.product_main_category?.data?.attributes.Name ||
      "لباس زمستانی زنانه",
  };

  return (
    <div className="flex flex-col md:flex-row gap-4 md:gap-7 relative">
      <div className="md:hidden">
        <Main
          category={product.category}
          title={product.title}
          discount={product.discount}
        />
      </div>

      <PDPHeroGallery assets={assets} />

      <PDPHeroInfo
        colors={colors}
        commentCount={productData?.attributes.RatingCount || 124}
        last24hoursSeenCount={856}
        product={product}
        sizes={sizes}
        models={models}
        rateCount={productData?.attributes.RatingCount || 40}
        productData={productData}
        productId={productId}
      />
    </div>
  );
}
