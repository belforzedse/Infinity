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
          }
        );

        // Type assertion to work with the data
        const variations = (response as any).data as ProductVariable[];

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
              (part) => part !== ""
            );
            const variableName = variableParts.join(" - ");

            return {
              id: variation.id,
              sku: variation.attributes.SKU || "",
              price: variation.attributes.Price || 0,
              stock:
                variation.attributes.product_stock?.data?.attributes.Count || 0,
              stockId: variation.attributes.product_stock?.data?.id,
              variable: variableName,
              isPublished: variation.attributes.IsPublished || false,
              colorId: variation.attributes.product_variation_color?.data?.id,
              sizeId: variation.attributes.product_variation_size?.data?.id,
              modelId: variation.attributes.product_variation_model?.data?.id,
            };
          }
        );

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
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
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
    updatedVariation: ProductVariableDisplay
  ) => {
    try {
      // Update variation data
      await apiClient.put(
        `/product-variations/${updatedVariation.id}`,
        {
          data: {
            SKU: updatedVariation.sku,
            Price: updatedVariation.price,
            IsPublished: updatedVariation.isPublished,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${STRAPI_TOKEN}`,
          },
        }
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
          }
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
          }
        );

        // Update stockId in local state
        const stockData = (stockResponse as any).data;
        updatedVariation.stockId = stockData.id;
      }

      // Update local state
      setVariables((prev) =>
        prev.map((v) => (v.id === updatedVariation.id ? updatedVariation : v))
      );

      setEditModalOpen(false);
      setCurrentVariation(null);
    } catch (error) {
      console.error("Error updating product variation:", error);
    }
  };

  return (
    <div className="w-full p-5 pt-0" dir="rtl">
      <h2 className="text-base text-neutral-400 mb-4">متغیر های محصول</h2>

      {loading ? (
        <div className="text-center p-8">در حال بارگذاری...</div>
      ) : variables.length === 0 ? (
        <div className="text-center p-8 border border-slate-100 rounded-lg">
          <p className="text-slate-500">
            هیچ متغیری برای این محصول تعریف نشده است.
          </p>
          <p className="text-slate-400 text-sm mt-2">
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h3 className="text-lg font-medium mb-4">ویرایش متغیر محصول</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1">کد محصول (SKU)</label>
                <input
                  type="text"
                  value={currentVariation.sku}
                  onChange={(e) =>
                    setCurrentVariation({
                      ...currentVariation,
                      sku: e.target.value,
                    })
                  }
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">قیمت (تومان)</label>
                <input
                  type="number"
                  value={currentVariation.price}
                  onChange={(e) =>
                    setCurrentVariation({
                      ...currentVariation,
                      price: Number(e.target.value),
                    })
                  }
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">موجودی</label>
                <input
                  type="number"
                  value={currentVariation.stock}
                  onChange={(e) =>
                    setCurrentVariation({
                      ...currentVariation,
                      stock: Number(e.target.value),
                    })
                  }
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">وضعیت انتشار</label>
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
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="mr-2 text-sm text-gray-700">
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
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span className="mr-2 text-sm text-gray-700">پیش نویس</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setEditModalOpen(false);
                  setCurrentVariation(null);
                }}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700"
              >
                انصراف
              </button>
              <button
                onClick={() =>
                  currentVariation && handleSaveVariation(currentVariation)
                }
                className="px-4 py-2 bg-blue-600 text-white rounded-lg"
              >
                ذخیره تغییرات
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-medium mb-4">حذف متغیر محصول</h3>
            <p className="text-slate-600 mb-6">
              آیا از حذف این متغیر محصول اطمینان دارید؟ این عمل قابل بازگشت
              نیست.
            </p>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  setDeleteId(null);
                }}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700"
              >
                انصراف
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-lg"
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
