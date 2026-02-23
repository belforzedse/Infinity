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
    SeenCount?: number | null;
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

/**
 * Lightweight PLP payload shape returned by /products/plp.
 * Keeps only card/filter fields needed by PLP initial render and client updates.
 */
export interface PLPProductLite {
  id: number;
  attributes: {
    Title: string;
    Slug?: string;
    SeenCount?: number | null;
    createdAt?: string;
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
          product_variation_color?: {
            data?: {
              attributes?: {
                ColorCode?: string;
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
