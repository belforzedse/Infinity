export interface ProductVariable {
  id: number;
  attributes: {
    SKU: string;
    Price: number;
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
  };
}

export interface ProductVariableDisplay {
  id: number;
  sku: string;
  price: number;
  stock: number;
  stockId?: number;
  variable: string;
  isPublished: boolean;
  colorId?: number;
  sizeId?: number;
  modelId?: number;
}
