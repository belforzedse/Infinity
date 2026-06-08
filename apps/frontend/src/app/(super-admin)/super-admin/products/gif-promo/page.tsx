"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import ContentWrapper from "@/components/SuperAdmin/Layout/ContentWrapper";
import HomepageProductPicker, {
  type ProductSummary,
} from "@/components/SuperAdmin/Products/HomepageProductPicker";
import ProductSmallCard from "@/components/Product/SmallCard";
import { getSuperAdminSettings } from "@/services/super-admin/settings/get";
import { updateSuperAdminSettings } from "@/services/super-admin/settings/update";
import {
  getGifPromoPreviewProducts,
  getProductSummariesByIds,
} from "@/services/super-admin/product/get";
import { fetchFeaturedCategoryOptions } from "@/app/(super-admin)/super-admin/customization/featured-category/config";
import type {
  HomeGifPromoAssignment,
  SuperAdminSettings,
} from "@/types/super-admin/settings";
import resolveAssetUrl from "@/utils/resolveAssetUrl";
import logger from "@/utils/logger";
import { useEditorRedirect } from "@/hooks/useEditorRedirect";
import type { ProductCardProps } from "@/components/Product/Card";

type SlotKey = "slot1" | "slot2";

type SlotState = {
  assignment: HomeGifPromoAssignment;
  summaries: ProductSummary[];
  previewProducts: ProductCardProps[];
};

const EMPTY_SLOT: SlotState = {
  assignment: { mode: "manual", productIds: [], categorySlug: "" },
  summaries: [],
  previewProducts: [],
};

function mapToSmallCard(product: ProductCardProps) {
  return {
    id: product.id,
    slug: product.slug,
    title: product.title,
    category: product.category,
    likedCount: product.seenCount || 0,
    price: product.price,
    discountedPrice: product.discountPrice,
    discount: product.discount,
    image: product.images.find((image) => image?.trim()) || "",
    isAvailable: product.isAvailable,
    colorsCount: product.colorsCount,
    colorCodes: product.colorCodes,
  };
}

function GifThumbnail({ imageUrl }: { imageUrl: string }) {
  const trimmed = imageUrl.trim();
  if (!trimmed) {
    return (
      <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
        گیف تنظیم نشده است
      </div>
    );
  }

  return (
    <div className="relative h-48 overflow-hidden rounded-2xl bg-slate-100">
      {/* eslint-disable-next-line @next/next/no-img-element -- GIF animation requires native img */}
      <img src={resolveAssetUrl(trimmed)} alt="" className="h-full w-full object-cover" />
    </div>
  );
}

function ProductPreview({ products }: { products: ProductCardProps[] }) {
  if (products.length === 0) {
    return (
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-500">
        محصولی برای نمایش پیدا نشد.
      </div>
    );
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
      {products.slice(0, 4).map((product) => (
        <ProductSmallCard key={product.id} {...mapToSmallCard(product)} />
      ))}
    </div>
  );
}

export default function GifPromoProductsPage() {
  useEditorRedirect();

  const [settings, setSettings] = useState<SuperAdminSettings | null>(null);
  const [slot1, setSlot1] = useState<SlotState>(EMPTY_SLOT);
  const [slot2, setSlot2] = useState<SlotState>(EMPTY_SLOT);
  const [categoryOptions, setCategoryOptions] = useState<Array<{ label: string; value: string }>>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadSlotData = useCallback(async (assignment: HomeGifPromoAssignment) => {
    const [summaries, previewProducts] = await Promise.all([
      assignment.mode === "manual" ? getProductSummariesByIds(assignment.productIds) : [],
      getGifPromoPreviewProducts(assignment),
    ]);

    return { assignment, summaries, previewProducts };
  }, []);

  const load = useCallback(async () => {
    try {
      const [loadedSettings, loadedCategories] = await Promise.all([
        getSuperAdminSettings(),
        fetchFeaturedCategoryOptions(""),
      ]);
      setSettings(loadedSettings);
      setCategoryOptions(loadedCategories);

      const [nextSlot1, nextSlot2] = await Promise.all([
        loadSlotData(loadedSettings.homeGifPromoSlot1Assignment),
        loadSlotData(loadedSettings.homeGifPromoSlot2Assignment),
      ]);
      setSlot1(nextSlot1);
      setSlot2(nextSlot2);
    } catch (error) {
      logger.error("[GifPromoProducts] Failed to load", { error });
      toast.error("خطا در دریافت تنظیمات");
    } finally {
      setLoading(false);
    }
  }, [loadSlotData]);

  useEffect(() => {
    void load();
  }, [load]);

  const refreshSlotPreview = useCallback(
    async (slotKey: SlotKey, assignment: HomeGifPromoAssignment) => {
      const nextSlot = await loadSlotData(assignment);
      if (slotKey === "slot1") setSlot1(nextSlot);
      else setSlot2(nextSlot);
    },
    [loadSlotData],
  );

  const setSlotAssignment = (slotKey: SlotKey, assignment: HomeGifPromoAssignment) => {
    if (slotKey === "slot1") {
      setSlot1((current) => ({ ...current, assignment }));
    } else {
      setSlot2((current) => ({ ...current, assignment }));
    }
    void refreshSlotPreview(slotKey, assignment);
  };

  const save = async () => {
    try {
      setSaving(true);
      const saved = await updateSuperAdminSettings({
        homeGifPromoSlot1Assignment: slot1.assignment,
        homeGifPromoSlot2Assignment: slot2.assignment,
      });
      const nextSettings = saved ?? (await getSuperAdminSettings());
      setSettings(nextSettings);
      toast.success("تنظیمات محصولات کمپین ذخیره شد");
      const [nextSlot1, nextSlot2] = await Promise.all([
        loadSlotData(nextSettings.homeGifPromoSlot1Assignment),
        loadSlotData(nextSettings.homeGifPromoSlot2Assignment),
      ]);
      setSlot1(nextSlot1);
      setSlot2(nextSlot2);
    } catch (error) {
      logger.error("[GifPromoProducts] Failed to save", { error });
      toast.error("خطا در ذخیره تنظیمات");
    } finally {
      setSaving(false);
    }
  };

  const slots = useMemo(
    () => [
      {
        key: "slot1" as const,
        label: "اسلات ۱",
        imageUrl: settings?.homeGifPromoSlot1Image ?? "",
        state: slot1,
      },
      {
        key: "slot2" as const,
        label: "اسلات ۲",
        imageUrl: settings?.homeGifPromoSlot2Image ?? "",
        state: slot2,
      },
    ],
    [settings, slot1, slot2],
  );

  if (loading) {
    return (
      <ContentWrapper title="محصولات کمپین گیف">
        <div className="p-4 text-neutral-600">در حال بارگذاری...</div>
      </ContentWrapper>
    );
  }

  return (
    <ContentWrapper title="محصولات کمپین گیف">
      <div className="space-y-6 p-4">
        <p className="rounded-lg border border-blue-100 bg-blue-50/50 p-3 text-sm text-blue-800">
          گیف ها از بخش شخصی سازی تنظیم می شوند. این صفحه فقط محصولات هر اسلات را مشخص
          می کند.
        </p>

        <div className="grid gap-6 xl:grid-cols-2">
          {slots.map((slot) => (
            <section key={slot.key} className="rounded-2xl border border-neutral-200 bg-white p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-neutral-900">{slot.label}</h2>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                  {slot.state.assignment.mode === "manual" ? "انتخاب دستی" : "دسته بندی"}
                </span>
              </div>

              <div className="grid gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
                <GifThumbnail imageUrl={slot.imageUrl} />

                <div className="space-y-4">
                  <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1 text-sm">
                    <button
                      type="button"
                      onClick={() =>
                        setSlotAssignment(slot.key, {
                          mode: "manual",
                          productIds:
                            slot.state.assignment.mode === "manual"
                              ? slot.state.assignment.productIds
                              : [],
                          categorySlug: "",
                        })
                      }
                      className={`flex-1 rounded-lg px-3 py-2 ${
                        slot.state.assignment.mode === "manual"
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-500"
                      }`}
                    >
                      انتخاب دستی
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setSlotAssignment(slot.key, {
                          mode: "category",
                          categorySlug:
                            slot.state.assignment.mode === "category"
                              ? slot.state.assignment.categorySlug
                              : "",
                          productIds: [],
                        })
                      }
                      className={`flex-1 rounded-lg px-3 py-2 ${
                        slot.state.assignment.mode === "category"
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-500"
                      }`}
                    >
                      دسته بندی
                    </button>
                  </div>

                  {slot.state.assignment.mode === "manual" ? (
                    <HomepageProductPicker
                      title={`${slot.label} - محصولات دستی`}
                      selectedProductIds={slot.state.assignment.productIds}
                      productSummaries={slot.state.summaries}
                      maxProducts={4}
                      onProductsChange={(productIds) =>
                        setSlotAssignment(slot.key, {
                          mode: "manual",
                          productIds: productIds.slice(0, 4),
                          categorySlug: "",
                        })
                      }
                      onProductAdded={(product) => {
                        if (slot.key === "slot1") {
                          setSlot1((current) => ({
                            ...current,
                            summaries: [...current.summaries, product],
                          }));
                        } else {
                          setSlot2((current) => ({
                            ...current,
                            summaries: [...current.summaries, product],
                          }));
                        }
                      }}
                    />
                  ) : (
                    <label className="block text-sm text-slate-600">
                      دسته بندی
                      <select
                        value={slot.state.assignment.categorySlug}
                        onChange={(event) =>
                          setSlotAssignment(slot.key, {
                            mode: "category",
                            categorySlug: event.target.value,
                            productIds: [],
                          })
                        }
                        className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                      >
                        <option value="">انتخاب دسته بندی</option>
                        {categoryOptions.map((category) => (
                          <option key={category.value} value={category.value}>
                            {category.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}

                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-slate-700">پیش نمایش محصولات</h3>
                    <ProductPreview products={slot.state.previewProducts} />
                  </div>
                </div>
              </div>
            </section>
          ))}
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="rounded-xl bg-infinity-primary px-6 py-2.5 text-white transition hover:bg-infinity-primary-dark disabled:opacity-50"
          >
            {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
          </button>
        </div>
      </div>
    </ContentWrapper>
  );
}
