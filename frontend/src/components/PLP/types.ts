export type ProductStatus = "Active" | "InActive";

export interface PLPProduct {
  id: number;
  attributes: {
    Title: string;
    Slug?: string;
    Description?: string;
    Status?: ProductStatus;
    AverageRating?: number | null;
    RatingCount?: number | null;
    CoverImage?: {
      data?: {
        attributes?: {
          url?: string;
        };
      } | null;
    };
    Media?: {
      data?: Array<{
        attributes?: {
          url?: string;
          mime?: string;
        };
      }> | null;
    };
    product_main_category?: {
      data?: {
        attributes?: {
          Title?: string;
          Slug?: string;
        };
      } | null;
    };
    product_variations?: {
      data?: Array<{
        attributes?: {
          SKU?: string;
          Price?: string;
          IsPublished?: boolean;
          DiscountPrice?: string;
          general_discounts?: {
            data?: Array<{
              attributes?: {
                Amount?: number;
              };
            }> | null;
          };
          product_stock?: {
            data?: {
              attributes?: {
                Count?: number;
              };
            } | null;
          };
        };
      }> | null;
    };
  };
}

export interface PLPPagination {
  page: number;
  pageSize: number;
  pageCount: number;
  total: number;
}
