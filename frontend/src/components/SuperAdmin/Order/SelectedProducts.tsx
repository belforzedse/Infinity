"use client";

import React from "react";
import { motion } from "framer-motion";

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

interface SelectedProductsProps {
  items: OrderItem[];
  onItemUpdate: (itemId: number, updates: Partial<OrderItem>) => void;
  onItemRemove: (itemId: number) => void;
}

const SelectedProducts: React.FC<SelectedProductsProps> = ({
  items,
  onItemUpdate,
  onItemRemove,
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR').format(price);
  };

  const calculateItemTotal = (item: OrderItem) => {
    return item.price * item.quantity;
  };

  const calculateGrandTotal = () => {
    return items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-slate-400 text-lg mb-2">هیچ محصولی انتخاب نشده</div>
        <div className="text-slate-500 text-sm">
          از تب "جستجو محصول" محصولات مورد نظر را اضافه کنید
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Items List */}
      <div className="space-y-3">
        {items.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="border border-slate-200 rounded-lg p-4"
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 flex-shrink-0">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.productName}
                    className="w-16 h-16 object-cover rounded-md"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className={`w-16 h-16 bg-slate-200 rounded-md flex items-center justify-center ${item.image ? 'hidden' : ''}`}>
                  <svg className="w-8 h-8 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>

              <div className="flex-1">
                <h4 className="font-medium text-slate-900">{item.productName}</h4>
                <p className="text-sm text-slate-600">کد: {item.productCode}</p>

                {(item.color || item.size) && (
                  <div className="mt-1 flex items-center gap-2">
                    {item.color && (
                      <span className="text-xs bg-slate-100 px-2 py-1 rounded">
                        رنگ: {item.color}
                      </span>
                    )}
                    {item.size && (
                      <span className="text-xs bg-slate-100 px-2 py-1 rounded">
                        سایز: {item.size}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4">
                {/* Price Input */}
                <div className="flex flex-col items-center">
                  <label className="text-xs text-slate-500 mb-1">قیمت واحد</label>
                  <input
                    type="number"
                    value={item.price}
                    onChange={(e) =>
                      onItemUpdate(item.id, { price: Number(e.target.value) || 0 })
                    }
                    className="w-24 text-center border border-slate-200 rounded-md px-2 py-1 text-sm"
                    min="0"
                  />
                  <span className="text-xs text-slate-500 mt-1">تومان</span>
                </div>

                {/* Quantity Input */}
                <div className="flex flex-col items-center">
                  <label className="text-xs text-slate-500 mb-1">تعداد</label>
                  <div className="flex items-center border border-slate-200 rounded-md">
                    <button
                      onClick={() =>
                        onItemUpdate(item.id, { quantity: Math.max(1, item.quantity - 1) })
                      }
                      className="px-2 py-1 text-slate-500 hover:text-slate-700"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        onItemUpdate(item.id, { quantity: Math.max(1, Number(e.target.value) || 1) })
                      }
                      className="w-16 text-center border-none outline-none text-sm"
                      min="1"
                    />
                    <button
                      onClick={() =>
                        onItemUpdate(item.id, { quantity: item.quantity + 1 })
                      }
                      className="px-2 py-1 text-slate-500 hover:text-slate-700"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Total */}
                <div className="flex flex-col items-center">
                  <label className="text-xs text-slate-500 mb-1">جمع</label>
                  <span className="font-semibold text-green-600">
                    {formatPrice(calculateItemTotal(item))}
                  </span>
                  <span className="text-xs text-slate-500">تومان</span>
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => onItemRemove(item.id)}
                  className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                  title="حذف محصول"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Summary */}
      <div className="border-t border-slate-200 pt-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-slate-600">
            تعداد محصولات: {items.length}
          </div>
          <div className="text-lg font-semibold text-green-600">
            جمع کل: {formatPrice(calculateGrandTotal())} تومان
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        <button
          onClick={() => items.forEach(item => onItemRemove(item.id))}
          className="px-4 py-2 text-red-600 hover:text-red-800 text-sm font-medium"
        >
          حذف همه
        </button>
      </div>
    </div>
  );
};

export default SelectedProducts;
