"use client";

import { useMemo } from "react";
import ProductSearch from "@/components/SuperAdmin/Order/ProductSearch";
import type { Product } from "@/components/SuperAdmin/Order/ProductSearch";

export type SelectedProduct = {
  id: number;
  title: string;
  sku?: string;
};

interface ProductSelectorProps {
  products: SelectedProduct[];
  onAddProduct: (product: SelectedProduct) => void;
  onRemoveProduct: (productId: number) => void;
}

type OrderItem = {
  id: number;
  productId: number;
  productVariationId?: number;
  productName: string;
  productCode: string;
  price: number;
  quantity: number;
  color?: string;
  size?: string;
  image?: string;
};

export default function CouponProductSelector({
  products,
  onAddProduct,
  onRemoveProduct,
}: ProductSelectorProps) {
  const selectedItems = useMemo<OrderItem[]>(() => {
    return products.map((p) => ({
      id: p.id,
      productId: p.id,
      productName: p.title,
      productCode: p.sku || "",
      price: 0,
      quantity: 0,
    }));
  }, [products]);

  const handleSelection = (product: Product) => {
    onAddProduct({
      id: product.id,
      title: product.Title,
      sku: product.ProductSKU,
    });
  };

  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-lg font-semibold text-neutral-800">محدودیت محصولات</p>
          <p className="text-sm text-neutral-500">
            می‌توانید محصولات مشخصی را برای این کد انتخاب کنید
          </p>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
          {products.length} محصول انتخاب شده
        </span>
      </div>

      <ProductSearch
        onProductSelect={handleSelection}
        selectedItems={selectedItems}
        enableVariationSelection={false}
      />

      {products.length > 0 && (
        <div className="mt-4">
          <p className="text-sm font-medium text-neutral-700">محصولات انتخاب شده</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {products.map((product) => (
              <span
                key={product.id}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-600"
              >
                {product.title}
                <button
                  type="button"
                  className="text-slate-400 hover:text-red-500"
                  onClick={() => onRemoveProduct(product.id)}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
