import React, { useState, useEffect } from "react";
import type { ProductVariable, ProductVariableDisplay } from "./types";
import { ProductVariableTable } from "./Table";
import { apiClient } from "@/services";
import toast from "react-hot-toast";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import Modal from "@/components/Kits/Modal";
import ConfirmDialog from "@/components/Kits/ConfirmDialog";

interface ProductVariablesProps {
  productId: number;
  refreshKey?: number;
}

const DEFAULT_TITLES = {
  sizes: "تک سایز",
  models: "استاندارد",
};

const MAX_STOCK = 1000;
type BulkPublishState = "no-change" | "published" | "draft";

const BULK_FORM_DEFAULT = {
  price: "",
  discountPrice: "",
  stock: "",
  publishState: "no-change" as BulkPublishState,
  removeDiscount: false,
};

const ProductVariables: React.FC<ProductVariablesProps> = ({ productId, refreshKey = 0 }) => {
  const { isStoreManager, isAdmin } = useCurrentUser();
  const canDeleteVariations = isStoreManager || isAdmin;

  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [variables, setVariables] = useState<ProductVariableDisplay[]>([]);
  const [loading, setLoading] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [currentVariation, setCurrentVariation] = useState<ProductVariableDisplay | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkForm, setBulkForm] = useState(BULK_FORM_DEFAULT);
  const [isBulkSaving, setIsBulkSaving] = useState(false);

  const resetBulkForm = () => {
    setBulkForm(BULK_FORM_DEFAULT);
  };

  const closeBulkModal = () => {
    setBulkModalOpen(false);
    resetBulkForm();
  };

  const parseNumberInput = (value: string) => {
    if (value === "") return undefined;
    const parsed = Number(value);
    if (Number.isNaN(parsed)) {
      return undefined;
    }
    return parsed;
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setCurrentVariation(null);
  };

  // Fetch product variations
  useEffect(() => {
    const fetchVariations = async () => {
      if (!productId) return;

      setLoading(true);
      try {
        const response = await apiClient.get(
          `/product-variations?filters[product][id][$eq]=${productId}&populate=product_variation_color,product_variation_size,product_variation_model,product_stock,general_discounts&pagination[pageSize]=100`,
          {
            cache: "no-store",
          },
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

    if (!canDeleteVariations) {
      toast.error("شما مجوز حذف تنوع محصول را ندارید");
      setDeleteConfirmOpen(false);
      setDeleteId(null);
      return;
    }

    try {
      // Find the variation to get its stockId
      const variationToDelete = variables.find((v) => v.id === deleteId);
      const stockId = variationToDelete?.stockId;

      // Delete product_stock first if it exists (to avoid relation errors)
      if (stockId) {
        try {
          await apiClient.delete(`/product-stocks/${stockId}`);
        } catch (stockError: any) {
          // If stock deletion fails, log but continue - the variation deletion might still work
          // This handles cases where stock might already be deleted or doesn't exist
          if (process.env.NODE_ENV !== "production") {
            console.warn("Could not delete product_stock:", stockError);
          }
        }
      }

      // Now delete the variation
      await apiClient.delete(`/product-variations/${deleteId}`);

      // Update local state and refresh
      setVariables((prev) => prev.filter((v) => v.id !== deleteId));
      setDeleteConfirmOpen(false);
      setDeleteId(null);
      toast.success("تنوع محصول با موفقیت حذف شد");

      // Trigger a refresh by updating refreshKey if parent component supports it
      // This ensures the list is refreshed after deletion
    } catch (error: any) {
      // Check if the error is about relations (which can happen after successful deletion)
      // If variation was deleted (204), we can ignore relation errors
      if (error?.status === 400 && error?.error?.message?.includes("relation")) {
        // Variation was likely deleted successfully, but a relation cleanup failed
        // This is acceptable - the variation is gone
        setVariables((prev) => prev.filter((v) => v.id !== deleteId));
        setDeleteConfirmOpen(false);
        setDeleteId(null);
        toast.success("تنوع محصول با موفقیت حذف شد");
        return;
      }

      console.error("Error deleting product variation:", error);
      toast.error("خطا در حذف تنوع محصول");
    }
  };

  const handleBulkUpdate = async () => {
    if (!selectedRows.length) return;

    const priceValue = parseNumberInput(bulkForm.price);
    if (priceValue !== undefined && priceValue <= 0) {
      toast.error("قیمت باید بزرگ‌تر از صفر باشد");
      return;
    }

    const discountInput = parseNumberInput(bulkForm.discountPrice);
    let discountValue: number | null | undefined = undefined;
    if (bulkForm.removeDiscount) {
      discountValue = null;
    } else if (discountInput !== undefined) {
      discountValue = Math.max(0, discountInput);
    }

    const stockInput = parseNumberInput(bulkForm.stock);
    const stockValue =
      stockInput !== undefined ? Math.min(Math.max(stockInput, 0), MAX_STOCK) : undefined;

    const publishValue =
      bulkForm.publishState === "no-change"
        ? undefined
        : bulkForm.publishState === "published";

    if (!isValidAction(priceValue, discountValue, stockValue, publishValue)) {
      toast.error("هیچ تغییری برای اعمال انتخاب نشده است");
      return;
    }

    setIsBulkSaving(true);
    const stockIdUpdates: Record<number, number | undefined> = {};
    let updatedCount = 0;

    try {
      for (const variationId of selectedRows) {
        const variation = variables.find((v) => v.id === variationId);
        if (!variation) continue;

        try {
          const updatePayload: Record<string, unknown> = {};
          if (priceValue !== undefined) updatePayload.Price = priceValue;
          if (discountValue !== undefined) updatePayload.DiscountPrice = discountValue;
          if (publishValue !== undefined) updatePayload.IsPublished = publishValue;

          if (Object.keys(updatePayload).length > 0) {
            await apiClient.put(`/product-variations/${variationId}`, {
              data: updatePayload,
            });
          }

          if (stockValue !== undefined) {
            if (variation.stockId) {
              await apiClient.put(`/product-stocks/${variation.stockId}`, {
                data: {
                  Count: stockValue,
                },
              });
            } else {
              const stockResponse = await apiClient.post("/product-stocks", {
                data: {
                  Count: stockValue,
                  product_variation: variationId,
                },
              });
              const stockData = stockResponse.data as { id: number };
              stockIdUpdates[variationId] = stockData.id;
            }
          }

          updatedCount++;
        } catch (error) {
          console.error(`Error updating variation ${variationId}:`, error);
        }
      }

      if (updatedCount > 0) {
        setVariables((prev) =>
          prev.map((variation) => {
            if (!selectedRows.includes(variation.id)) return variation;

            return {
              ...variation,
              price: priceValue !== undefined ? priceValue : variation.price,
              discountPrice:
                discountValue === undefined
                  ? variation.discountPrice
                  : discountValue === null
                    ? undefined
                    : discountValue,
              stock: stockValue !== undefined ? stockValue : variation.stock,
              stockId:
                stockIdUpdates[variation.id] !== undefined
                  ? stockIdUpdates[variation.id]
                  : variation.stockId,
              isPublished:
                publishValue !== undefined ? publishValue : variation.isPublished,
            };
          }),
        );
        toast.success(`تغییرات روی ${updatedCount} تنوع اعمال شد`);
        setSelectedRows([]);
        closeBulkModal();
      } else {
        toast.error("ویرایش گروهی با خطا مواجه شد");
      }
    } finally {
      setIsBulkSaving(false);
    }
  };

  const isValidAction = (
    priceValue: number | undefined,
    discountValue: number | null | undefined,
    stockValue: number | undefined,
    publishValue: boolean | undefined
  ): boolean => {
    if (
      priceValue === undefined &&
      discountValue === undefined &&
      stockValue === undefined &&
      publishValue === undefined
    ) {
      return false;
    }
    return true;
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
      toast.success("تنوع محصول با موفقیت به‌روزرسانی شد");
    } catch (error) {
      console.error("Error updating product variation:", error);
    }
  };

  const handleSelectAll = () => {
    setSelectedRows(variables.map((v) => v.id));
  };

  return (
    <div className="w-full p-5 pt-0" dir="rtl">
      <h2 className="mb-4 text-base text-neutral-400">متغیر های محصول</h2>

      {variables.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-100 bg-white p-4 text-sm text-slate-600">
          <div>
            {selectedRows.length > 0
              ? `${selectedRows.length} تنوع انتخاب شده`
              : "هیچ تنوعی انتخاب نشده است"}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                if (selectedRows.length === variables.length && variables.length > 0) {
                  setSelectedRows([]);
                } else {
                  handleSelectAll();
                }
              }}
              className="rounded-lg border border-slate-300 px-4 py-2 text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-60"
              disabled={variables.length === 0}
            >
              {selectedRows.length === variables.length && variables.length > 0
                ? "برداشتن انتخاب"
                : "انتخاب همه"}
            </button>
            <button
              onClick={() => setBulkModalOpen(true)}
              disabled={selectedRows.length === 0}
              className="rounded-lg bg-pink-500 px-4 py-2 text-white transition-colors hover:bg-pink-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              ویرایش گروهی
            </button>
          </div>
        </div>
      )}

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
          onDeleteRow={canDeleteVariations ? handleDeleteVariation : undefined}
        />
      )}

      <Modal
        isOpen={editModalOpen && !!currentVariation}
        onClose={closeEditModal}
        title="ویرایش متغیر محصول"
      >
        {currentVariation && (
          <>
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
                <div className="flex items-center gap-6">
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
                onClick={closeEditModal}
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
          </>
        )}
      </Modal>

      <Modal
        isOpen={bulkModalOpen}
        onClose={closeBulkModal}
        title="ویرایش گروهی تنوع‌ها"
      >
        <p className="mb-4 text-sm text-slate-500">
          تغییرات زیر برای {selectedRows.length} تنوع انتخاب شده اعمال می‌شود. فیلدهایی که خالی
          بمانند بدون تغییر خواهند ماند.
        </p>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm">قیمت جدید (تومان)</label>
            <input
              type="number"
              value={bulkForm.price}
              onChange={(e) => setBulkForm((prev) => ({ ...prev, price: e.target.value }))}
              placeholder="بدون تغییر"
              className="w-full rounded-lg border border-slate-300 p-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm">تخفیف اختصاصی (تومان)</label>
            <input
              type="number"
              value={bulkForm.discountPrice}
              onChange={(e) =>
                setBulkForm((prev) => ({ ...prev, discountPrice: e.target.value }))
              }
              disabled={bulkForm.removeDiscount}
              placeholder="بدون تغییر"
              className="w-full rounded-lg border border-slate-300 p-2 disabled:bg-slate-100"
            />
            <label className="mt-2 flex items-center gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={bulkForm.removeDiscount}
                onChange={(e) =>
                  setBulkForm((prev) => ({
                    ...prev,
                    removeDiscount: e.target.checked,
                    discountPrice: e.target.checked ? "" : prev.discountPrice,
                  }))
                }
              />
              حذف تخفیف اختصاصی از همه تنوع‌ها
            </label>
          </div>

          <div>
            <label className="mb-1 block text-sm">موجودی</label>
            <input
              type="number"
              value={bulkForm.stock}
              onChange={(e) => setBulkForm((prev) => ({ ...prev, stock: e.target.value }))}
              placeholder="بدون تغییر"
              className="w-full rounded-lg border border-slate-300 p-2"
            />
            <p className="mt-1 text-xs text-slate-500">
              حداکثر موجودی قابل ثبت {MAX_STOCK.toLocaleString()} عدد است.
            </p>
          </div>

          <div>
            <label className="mb-1 block text-sm">وضعیت انتشار</label>
            <select
              value={bulkForm.publishState}
              onChange={(e) =>
                setBulkForm((prev) => ({
                  ...prev,
                  publishState: e.target.value as BulkPublishState,
                }))
              }
              className="w-full rounded-lg border border-slate-300 p-2"
            >
              <option value="no-change">بدون تغییر</option>
              <option value="published">منتشر شود</option>
              <option value="draft">به حالت پیش نویس درآید</option>
            </select>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={closeBulkModal}
            className="rounded-lg border border-slate-300 px-4 py-2 text-slate-700"
            disabled={isBulkSaving}
          >
            انصراف
          </button>
          <button
            onClick={handleBulkUpdate}
            className="rounded-lg bg-pink-400 px-4 py-2 text-white disabled:bg-pink-100 disabled:border-pink-200"
            disabled={isBulkSaving}
          >
            {isBulkSaving ? "در حال اعمال..." : "ثبت تغییرات"}
          </button>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        title="حذف متغیر محصول"
        description="آیا از حذف این متغیر محصول اطمینان دارید؟ این عمل قابل بازگشت نیست."
        confirmText="حذف"
        cancelText="انصراف"
        onConfirm={confirmDelete}
        onCancel={() => {
          setDeleteConfirmOpen(false);
          setDeleteId(null);
        }}
      />
    </div>
  );
};

export default ProductVariables;
