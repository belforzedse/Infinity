import React, { useState, useEffect } from "react";
import { ProductVariable, ProductVariableDisplay } from "./types";
import { ProductVariableTable } from "./Table";
import { apiClient } from "@/services";
import { STRAPI_TOKEN } from "@/constants/api";

interface ProductVariablesProps {
  productId: number;
}

const ProductVariables: React.FC<ProductVariablesProps> = ({ productId }) => {
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [variables, setVariables] = useState<ProductVariableDisplay[]>([]);
  const [loading, setLoading] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentVariation, setCurrentVariation] =
    useState<ProductVariableDisplay | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Fetch product variations
  useEffect(() => {
    const fetchVariations = async () => {
      if (!productId) return;

      setLoading(true);
      try {
        const response = await apiClient.get(
          `/product-variations?filters[product][id][$eq]=${productId}&populate=product_variation_color,product_variation_size,product_variation_model,product_stock&pagination[pageSize]=100`,
          {
            headers: {
              Authorization: `Bearer ${STRAPI_TOKEN}`,
            },
          },
        );

        // Type assertion to work with the data
        const variations = (response as any).data as ProductVariable[];

        // Debug: Log the API response to see what we're getting
        if (process.env.NODE_ENV !== "production") {
          console.log("Product variations API response:", variations);
          variations.forEach((variation, index) => {
            console.log(`Variation ${index}:`, {
              id: variation.id,
              DiscountPrice: variation.attributes.DiscountPrice,
              Price: variation.attributes.Price,
              attributes: variation.attributes
            });
          });
        }

        // Transform API data to display format
        const formattedVariations = variations.map(
          (variation: ProductVariable) => {
            // Extract color, size, model details
            const color =
              variation.attributes.product_variation_color?.data?.attributes
                .Title || "";
            const size =
              variation.attributes.product_variation_size?.data?.attributes
                .Title || "";
            const model =
              variation.attributes.product_variation_model?.data?.attributes
                .Title || "";

            // Create variable name from combinations
            const variableParts = [size, color, model].filter(
              (part) => part !== "",
            );
            const variableName = variableParts.join(" - ");

            return {
              id: variation.id,
              sku: variation.attributes.SKU || "",
              price: variation.attributes.Price || 0,
              discountPrice: variation.attributes.DiscountPrice ? Number(variation.attributes.DiscountPrice) : undefined,
              stock:
                variation.attributes.product_stock?.data?.attributes.Count || 0,
              stockId: variation.attributes.product_stock?.data?.id,
              variable: variableName,
              isPublished: variation.attributes.IsPublished || false,
              colorId: variation.attributes.product_variation_color?.data?.id,
              sizeId: variation.attributes.product_variation_size?.data?.id,
              modelId: variation.attributes.product_variation_model?.data?.id,
            };
          },
        );

        // Debug: Log the formatted variations
        if (process.env.NODE_ENV !== "production") {
          console.log("Formatted variations:", formattedVariations);
          formattedVariations.forEach((variation, index) => {
            console.log(`Formatted variation ${index}:`, {
              id: variation.id,
              price: variation.price,
              discountPrice: variation.discountPrice,
              variable: variation.variable
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
  }, [productId]);

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
      await apiClient.delete(`/product-variations/${deleteId}`, {
        headers: {
          Authorization: `Bearer ${STRAPI_TOKEN}`,
        },
      });

      // Update local state
      setVariables((prev) => prev.filter((v) => v.id !== deleteId));
      setDeleteConfirmOpen(false);
      setDeleteId(null);
    } catch (error) {
      console.error("Error deleting product variation:", error);
    }
  };

  const handleSaveVariation = async (
    updatedVariation: ProductVariableDisplay,
  ) => {
    try {
      // Update variation data
      await apiClient.put(
        `/product-variations/${updatedVariation.id}`,
        {
          data: {
            SKU: updatedVariation.sku,
            Price: updatedVariation.price,
            DiscountPrice: updatedVariation.discountPrice || null,
            IsPublished: updatedVariation.isPublished,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${STRAPI_TOKEN}`,
          },
        },
      );

      // Update stock if it exists, or create new stock
      if (updatedVariation.stockId) {
        await apiClient.put(
          `/product-stocks/${updatedVariation.stockId}`,
          {
            data: {
              Count: updatedVariation.stock,
            },
          },
          {
            headers: {
              Authorization: `Bearer ${STRAPI_TOKEN}`,
            },
          },
        );
      } else {
        // Create new stock and link to variation
        const stockResponse = await apiClient.post(
          "/product-stocks",
          {
            data: {
              Count: updatedVariation.stock,
              product_variation: updatedVariation.id,
            },
          },
          {
            headers: {
              Authorization: `Bearer ${STRAPI_TOKEN}`,
            },
          },
        );

        // Update stockId in local state
        const stockData = (stockResponse as any).data;
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
      <h2 className="text-base mb-4 text-neutral-400">متغیر های محصول</h2>

      {loading ? (
        <div className="p-8 text-center">در حال بارگذاری...</div>
      ) : variables.length === 0 ? (
        <div className="rounded-lg border border-slate-100 p-8 text-center">
          <p className="text-slate-500">
            هیچ متغیری برای این محصول تعریف نشده است.
          </p>
          <p className="text-sm mt-2 text-slate-400">
            ابتدا ویژگی‌های محصول را تعریف کنید و سپس تنوع‌های محصول را ایجاد
            کنید.
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
            <h3 className="text-lg mb-4 font-medium">ویرایش متغیر محصول</h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm mb-1 block">کد محصول (SKU)</label>
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
                <label className="text-sm mb-1 block">قیمت اصلی (تومان)</label>
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
                <label className="text-sm mb-1 block">قیمت تخفیف‌دار (تومان) - اختیاری</label>
                <input
                  type="number"
                  value={currentVariation.discountPrice || ""}
                  onChange={(e) =>
                    setCurrentVariation({
                      ...currentVariation,
                      discountPrice: e.target.value ? Number(e.target.value) : undefined,
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 p-2"
                  placeholder="قیمت تخفیف‌دار وارد کنید"
                />
              </div>

              <div>
                <label className="text-sm mb-1 block">موجودی</label>
                <input
                  type="number"
                  value={currentVariation.stock}
                  onChange={(e) =>
                    setCurrentVariation({
                      ...currentVariation,
                      stock: Number(e.target.value),
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 p-2"
                />
              </div>

              <div>
                <label className="text-sm mb-1 block">وضعیت انتشار</label>
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
                    <span className="text-sm mr-2 text-gray-700">
                      منتشر شده
                    </span>
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
                    <span className="text-sm mr-2 text-gray-700">پیش نویس</span>
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
                onClick={() =>
                  currentVariation && handleSaveVariation(currentVariation)
                }
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
            <h3 className="text-lg mb-4 font-medium">حذف متغیر محصول</h3>
            <p className="mb-6 text-slate-600">
              آیا از حذف این متغیر محصول اطمینان دارید؟ این عمل قابل بازگشت
              نیست.
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
