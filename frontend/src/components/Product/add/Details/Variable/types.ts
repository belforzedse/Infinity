export interface ProductVariable {
  id: number;
  attributes: {
    SKU: string;
    Price: number;
    DiscountPrice?: number;
    IsPublished?: boolean;
    product: {
      data: {
        id: number;
      };
    };
    product_variation_color?: {
      data: {
        id: number;
        attributes: {
          Title: string;
        };
      };
    };
    product_variation_size?: {
      data: {
        id: number;
        attributes: {
          Title: string;
        };
      };
    };
    product_variation_model?: {
      data: {
        id: number;
        attributes: {
          Title: string;
        };
      };
    };
    product_stock?: {
      data: {
        id: number;
        attributes: {
          Count: number;
        };
      };
    };
    general_discounts?: {
      data: Array<{
        id: number;
        attributes: {
          Type: "Discount" | "Cash";
          Amount: number;
          IsActive: boolean;
          StartDate: string;
          EndDate: string;
        };
      }>;
    };
  };
}

export interface ProductVariableDisplay {
  id: number;
  sku: string;
  price: number;
  discountPrice?: number;
  stock: number;
  stockId?: number;
  variable: string;
  isPublished: boolean;
  colorId?: number;
  sizeId?: number;
  modelId?: number;
  generalDiscounts?: Array<{
    id: number;
    attributes: {
      Type: "Discount" | "Cash";
      Amount: number;
      IsActive: boolean;
      StartDate: string;
      EndDate: string;
    };
  }>;
}
