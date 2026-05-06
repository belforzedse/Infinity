// Shared product and variation types used across the frontend
export type Variation = {
  id: number;
  attributes: {
    IsPublished?: boolean;
    Price?: string | number;
    DiscountPrice?: string | number;
    product_stock?: { data?: { attributes?: { Count?: number } } } | null;
    product_variation_color?: { data?: { id: number; attributes?: any } } | null;
    product_variation_size?: { data?: { id: number; attributes?: any } } | null;
    product_variation_model?: { data?: { id: number; attributes?: any } } | null;
    [k: string]: any;
  };
};

export type ProductData = {
  attributes: {
    product_variations?: { data?: Variation[] };
    product_size_helper?: any;
    CoverImage?: any;
    Description?: string;
    CleaningTips?: string;
    ReturnConditions?: string;
    [k: string]: any;
  };
};
export type ProductCoverImage = {
  data: {
    id: string;
    attributes: {
      name: string;
      alternativeText: string | null;
      caption: string | null;
      width: number | null; // Can be null for videos
      height: number | null; // Can be null for videos
      formats: {
        small?: {
          ext: string;
          url: string;
          hash: string;
          mime: string;
          name: string;
          path: string | null;
          size: number;
          width: number;
          height: number;
          sizeInBytes: number;
        };
        thumbnail?: {
          ext: string;
          url: string;
          hash: string;
          mime: string;
          name: string;
          path: string | null;
          size: number;
          width: number;
          height: number;
          sizeInBytes: number;
        };
      } | null; // Can be null for videos
      hash: string;
      ext: string;
      mime: string; // Can be "video/*" or "image/*"
      size: number;
      url: string;
      previewUrl: string | null;
      provider: string;
      provider_metadata: string | null;
      createdAt: string;
      updatedAt: string;
    };
  };
};
