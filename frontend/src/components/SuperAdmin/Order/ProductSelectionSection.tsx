"use client";

import React, { useState } from "react";
import classNames from "classnames";
import ProductSearch from "./ProductSearch";
import SelectedProducts from "./SelectedProducts";

type OrderItem = {
  id: number;
  productId: number;
  productVariationId?: number;
  productName: string;
  productCode: string;
  price: number;
  quantity: number;
  color: string;
  size?: string;
  image: string;
};

enum ProductViewEnum {
  SEARCH_PRODUCTS = "جستجو محصول",
  SELECTED_PRODUCTS = "محصولات انتخابی",
}

type ProductViewType = `${ProductViewEnum}`;

interface ProductSelectionSectionProps {
  selectedItems: OrderItem[];
  onItemsChange: (items: OrderItem[]) => void;
}

const ProductSelectionSection: React.FC<ProductSelectionSectionProps> = ({
  selectedItems,
  onItemsChange,
}) => {
  const [activeView, setActiveView] = useState<ProductViewType>(ProductViewEnum.SEARCH_PRODUCTS);

  const views: ProductViewType[] = [
    ProductViewEnum.SEARCH_PRODUCTS,
    ProductViewEnum.SELECTED_PRODUCTS,
  ];

  const handleProductSelect = (product: any, variation?: any) => {
    const newItem: OrderItem = {
      id: Date.now(), // Temporary ID for UI
      productId: product.id,
      productVariationId: variation?.id || product.id,
      productName: product.Title,
      productCode: variation?.ProductSKU || product.ProductSKU || `PRD-${product.id}`,
      price: variation?.Price || product.Price || 0,
      quantity: 1,
      color: variation?.product_variation_color?.Title || "N/A",
      size: variation?.product_variation_size?.Title,
      image: product.image || "/placeholder-product.png",
    };

    onItemsChange([...selectedItems, newItem]);
  };

  const handleItemUpdate = (itemId: number, updates: Partial<OrderItem>) => {
    const updatedItems = selectedItems.map(item =>
      item.id === itemId ? { ...item, ...updates } : item
    );
    onItemsChange(updatedItems);
  };

  const handleItemRemove = (itemId: number) => {
    const updatedItems = selectedItems.filter(item => item.id !== itemId);
    onItemsChange(updatedItems);
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden rounded-lg bg-white">
      {/* View Selector */}
      <div className="flex gap-8 border-b border-gray-200 px-5 py-4">
        {views.map((view) => (
          <button
            key={view}
            onClick={() => setActiveView(view)}
            className={classNames(
              "text-sm relative border-b-2 pb-2 transition-colors",
              view === activeView
                ? "border-pink-500 text-pink-500"
                : "border-transparent text-gray-500 hover:text-gray-700",
            )}
          >
            {view}
            {view === ProductViewEnum.SELECTED_PRODUCTS && selectedItems.length > 0 && (
              <span className="absolute -top-1 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-pink-500 text-xs text-white">
                {selectedItems.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 p-5">
        {activeView === ProductViewEnum.SEARCH_PRODUCTS && (
          <ProductSearch
            onProductSelect={handleProductSelect}
            selectedItems={selectedItems}
          />
        )}

        {activeView === ProductViewEnum.SELECTED_PRODUCTS && (
          <SelectedProducts
            items={selectedItems}
            onItemUpdate={handleItemUpdate}
            onItemRemove={handleItemRemove}
          />
        )}
      </div>
    </div>
  );
};

export default ProductSelectionSection;