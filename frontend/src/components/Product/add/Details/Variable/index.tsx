import React, { useState, useEffect } from "react";
import type { ProductVariable, ProductVariableDisplay } from "./types";
import { ProductVariableTable } from "./Table";
import { apiClient } from "@/services";
import toast from "react-hot-toast";

interface ProductVariablesProps {
  productId: number;
  refreshKey?: number;
}

const DEFAULT_TITLES = {
  sizes: "تک سایز",
  models: "استاندارد",
};

const MAX_STOCK = 1000;

const ProductVariables: React.FC<ProductVariablesProps> = ({ productId, refreshKey = 0 }) => {
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [variables, setVariables] = useState<ProductVariableDisplay[]>([]);
  const [loading, setLoading] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentVariation, setCurrentVariation] = useState<ProductVariableDisplay | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Fetch product variations
  useEffect(() => {
    const fetchVariations = async () => {
      if (!productId) return;

      setLoading(true);
      try {
        const response = await apiClient.get(
          `/product-variations?filters[product][id][$eq]=${productId}&populate=product_variation_color,product_variation_size,product_variation_model,product_stock,general_discounts&pagination[pageSize]=100`,
        );

        // Type assertion to work with the data
        const variations = response.data as ProductVariable[];

        // Debug: Log the API response to see what we're getting
        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.log("Product variations API response:", variations);
          variations.forEach((variation, index) => {
            // eslint-disable-next-line no-console
            console.log(`Variation ${index}:`, {
              id: variation.id,
              Price: variation.attributes.Price,
              generalDiscounts: variation.attributes.general_discounts?.data,
              attributes: variation.attributes,
            });
          });
        }

        // Transform API data to display format
        const formattedVariations = variations.map((variation: ProductVariable) => {
          // Extract color, size, model details
          const color = variation.attributes.product_variation_color?.data?.attributes.Title || "";
          const size =
            variation.attributes.product_variation_size?.data?.attributes.Title ||
            DEFAULT_TITLES.sizes;
          const model =
            variation.attributes.product_variation_model?.data?.attributes.Title ||
            DEFAULT_TITLES.models;

          // Create variable name from combinations
          const variableParts = [size, color, model].filter((part) => part !== "");
          const variableName = variableParts.join(" - ");

          // Get variation-specific discount price (priority)
          const basePrice = Number(variation.attributes.Price || 0);
          let discountPrice: number | undefined = variation.attributes.DiscountPrice
            ? Number(variation.attributes.DiscountPrice)
            : undefined;

          // If no variation-specific discount, calculate from general_discounts
          const generalDiscounts = variation.attributes.general_discounts?.data || [];
          if (!discountPrice && generalDiscounts.length > 0) {
            // Use the first active discount
            const discount = generalDiscounts[0].attributes;
            if (discount.Type === "Discount") {
              // Percentage discount
              const discountAmount = (basePrice * Number(discount.Amount || 0)) / 100;
              discountPrice = Math.max(0, basePrice - discountAmount);
            } else if (discount.Type === "Cash") {
              // Fixed amount discount
              discountPrice = Math.max(0, basePrice - Number(discount.Amount || 0));
            }
          }

          return {
            id: variation.id,
            sku: variation.attributes.SKU || "",
            price: variation.attributes.Price || 0,
            discountPrice,
            stock: variation.attributes.product_stock?.data?.attributes.Count || 0,
            stockId: variation.attributes.product_stock?.data?.id,
            variable: variableName,
            isPublished: variation.attributes.IsPublished || false,
            colorId: variation.attributes.product_variation_color?.data?.id,
            sizeId: variation.attributes.product_variation_size?.data?.id,
            modelId: variation.attributes.product_variation_model?.data?.id,
            generalDiscounts: generalDiscounts,
          };
        });

        // Debug: Log the formatted variations
        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.log("Formatted variations:", formattedVariations);
          formattedVariations.forEach((variation, index) => {
            // eslint-disable-next-line no-console
            console.log(`Formatted variation ${index}:`, {
              id: variation.id,
              price: variation.price,
              discountPrice: variation.discountPrice,
              variable: variation.variable,
            });
          });
        }

        setVariables(formattedVariations);
      } catch (error) {
        console.error("Error fetching product variations:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVariations();
  }, [productId, refreshKey]);

  const handleCheckboxChange = (id: number) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id],
    );
  };

  const handleEditVariation = (id: number) => {
    const variation = variables.find((v) => v.id === id);
    if (variation) {
      setCurrentVariation(variation);
      setEditModalOpen(true);
    }
  };

  const handleDeleteVariation = (id: number) => {
    setDeleteId(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    try {
      await apiClient.delete(`/product-variations/${deleteId}`);

      // Update local state
      setVariables((prev) => prev.filter((v) => v.id !== deleteId));
      setDeleteConfirmOpen(false);
      setDeleteId(null);
    } catch (error) {
      console.error("Error deleting product variation:", error);
    }
  };

  const handleSaveVariation = async (updatedVariation: ProductVariableDisplay) => {
    try {
      if (updatedVariation.stock > MAX_STOCK) {
        toast.error(`موجودی هر تنوع نمی‌تواند بیشتر از ${MAX_STOCK.toLocaleString()} باشد.`);
        return;
      }
      if (updatedVariation.stock < 0) {
        toast.error("موجودی نمی‌تواند مقدار منفی باشد.");
        return;
      }

      // Update variation data
      await apiClient.put(`/product-variations/${updatedVariation.id}`, {
        data: {
          SKU: updatedVariation.sku,
          Price: updatedVariation.price,
          DiscountPrice: updatedVariation.discountPrice || null,
          IsPublished: updatedVariation.isPublished,
        },
      });

      // Update stock if it exists, or create new stock
      if (updatedVariation.stockId) {
        await apiClient.put(`/product-stocks/${updatedVariation.stockId}`, {
          data: {
            Count: Math.min(Math.max(updatedVariation.stock, 0), MAX_STOCK),
          },
        });
      } else {
        // Create new stock and link to variation
        const stockResponse = await apiClient.post("/product-stocks", {
          data: {
            Count: Math.min(Math.max(updatedVariation.stock, 0), MAX_STOCK),
            product_variation: updatedVariation.id,
          },
        });

        // Update stockId in local state
        const stockData = stockResponse.data as { id: number };
        updatedVariation.stockId = stockData.id;
      }

      // Update local state
      setVariables((prev) =>
        prev.map((v) => (v.id === updatedVariation.id ? updatedVariation : v)),
      );

      setEditModalOpen(false);
      setCurrentVariation(null);
    } catch (error) {
      console.error("Error updating product variation:", error);
    }
  };

  return (
    <div className="w-full p-5 pt-0" dir="rtl">
      <h2 className="mb-4 text-base text-neutral-400">متغیر های محصول</h2>

      {loading ? (
        <div className="p-8 text-center">در حال بارگذاری...</div>
      ) : variables.length === 0 ? (
        <div className="rounded-lg border border-slate-100 p-8 text-center">
          <p className="text-slate-500">هیچ متغیری برای این محصول تعریف نشده است.</p>
          <p className="mt-2 text-sm text-slate-400">
            ابتدا ویژگی‌های محصول را تعریف کنید و سپس تنوع‌های محصول را ایجاد کنید.
          </p>
        </div>
      ) : (
        <ProductVariableTable
          variables={variables}
          selectedRows={selectedRows}
          onSelectRow={handleCheckboxChange}
          onEditRow={handleEditVariation}
          onDeleteRow={handleDeleteVariation}
        />
      )}

      {/* Edit Modal - In real implementation you would have a complete modal component */}
      {editModalOpen && currentVariation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-lg rounded-xl bg-white p-6">
            <h3 className="mb-4 text-lg font-medium">ویرایش متغیر محصول</h3>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm">کد محصول (SKU)</label>
                <input
                  type="text"
                  value={currentVariation.sku}
                  onChange={(e) =>
                    setCurrentVariation({
                      ...currentVariation,
                      sku: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 p-2"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm">قیمت اصلی (تومان)</label>
                <input
                  type="number"
                  value={currentVariation.price}
                  onChange={(e) =>
                    setCurrentVariation({
                      ...currentVariation,
                      price: Number(e.target.value),
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 p-2"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm">تخفیف اختصاصی این متغیر (تومان)</label>
                <input
                  type="number"
                  value={currentVariation.discountPrice || ""}
                  onChange={(e) =>
                    setCurrentVariation({
                      ...currentVariation,
                      discountPrice: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  placeholder="خالی بگذارید برای عدم تخفیف"
                  className="w-full rounded-lg border border-slate-300 p-2"
                />
                <div className="mt-1 text-xs text-slate-500">
                  تخفیف مخصوص این متغیر - مستقل از تخفیف‌های عمومی
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm">تخفیف‌های عمومی</label>
                <div className="min-h-[40px] rounded-lg border border-slate-300 bg-slate-50 p-2">
                  {currentVariation.generalDiscounts &&
                  currentVariation.generalDiscounts.length > 0 ? (
                    currentVariation.generalDiscounts.map((discount, index: number) => (
                      <div key={index} className="text-sm text-slate-600">
                        {discount.attributes.Type === "Discount"
                          ? `${discount.attributes.Amount}% تخفیف`
                          : `${Number(discount.attributes.Amount).toLocaleString()} تومان تخفیف`}
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-slate-400">هیچ تخفیف فعالی تعریف نشده</div>
                  )}
                </div>
                <div className="mt-1 text-xs text-slate-500">
                  برای مدیریت تخفیف‌ها از بخش &quot;تخفیف‌های عمومی&quot; استفاده کنید
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm">موجودی</label>
                <input
                  type="number"
                  value={currentVariation.stock}
                  onChange={(e) =>
                    setCurrentVariation({
                      ...currentVariation,
                      stock: Math.min(
                        Math.max(Number(e.target.value), 0),
                        MAX_STOCK,
                      ),
                    })
                  }
                  max={MAX_STOCK}
                  min={0}
                  className="w-full rounded-lg border border-slate-300 p-2"
                />
                <p className="mt-1 text-xs text-slate-500">
                  حداکثر موجودی قابل ثبت برای هر تنوع {MAX_STOCK.toLocaleString()} عدد است.
                </p>
              </div>

              <div>
                <label className="mb-1 block text-sm">وضعیت انتشار</label>
                <div className="flex items-center space-x-4 space-x-reverse">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      checked={currentVariation.isPublished}
                      onChange={() =>
                        setCurrentVariation({
                          ...currentVariation,
                          isPublished: true,
                        })
                      }
                      className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="mr-2 text-sm text-gray-700">منتشر شده</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      checked={!currentVariation.isPublished}
                      onChange={() =>
                        setCurrentVariation({
                          ...currentVariation,
                          isPublished: false,
                        })
                      }
                      className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="mr-2 text-sm text-gray-700">پیش نویس</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => {
                  setEditModalOpen(false);
                  setCurrentVariation(null);
                }}
                className="rounded-lg border border-slate-300 px-4 py-2 text-slate-700"
              >
                انصراف
              </button>
              <button
                onClick={() => currentVariation && handleSaveVariation(currentVariation)}
                className="rounded-lg bg-blue-600 px-4 py-2 text-white"
              >
                ذخیره تغییرات
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-full max-w-md rounded-xl bg-white p-6">
            <h3 className="mb-4 text-lg font-medium">حذف متغیر محصول</h3>
            <p className="mb-6 text-slate-600">
              آیا از حذف این متغیر محصول اطمینان دارید؟ این عمل قابل بازگشت نیست.
            </p>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setDeleteId(null);
                }}
                className="rounded-lg border border-slate-300 px-4 py-2 text-slate-700"
              >
                انصراف
              </button>
              <button
                onClick={confirmDelete}
                className="rounded-lg bg-red-600 px-4 py-2 text-white"
              >
                حذف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductVariables;
