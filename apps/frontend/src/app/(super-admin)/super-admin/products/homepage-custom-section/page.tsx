"use client";

import { useCallback, useEffect, useState } from "react";
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
import { fetchFeaturedCategoryOptions } from "@/app/(super-admin)/super-admin/settings/customization/featured-category/config";
import type {
  HomeGifPromoAssignment,
  SuperAdminSettings,
} from "@/types/super-admin/settings";
import logger from "@/utils/logger";
import { useEditorRedirect } from "@/hooks/useEditorRedirect";
import type { ProductCardProps } from "@/components/Product/Card";

type SectionState = {
  assignment: HomeGifPromoAssignment;
  summaries: ProductSummary[];
  previewProducts: ProductCardProps[];
};

const EMPTY_STATE: SectionState = {
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

function ProductPreview({ products }: { products: ProductCardProps[] }) {
  if (products.length === 0) {
    return (
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-sm text-slate-500">
        محصولی برای نمایش پیدا نشد.
      </div>
    );
  }

  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
      {products.slice(0, 6).map((product) => (
        <ProductSmallCard key={product.id} {...mapToSmallCard(product)} />
      ))}
    </div>
  );
}

export default function HomepageCustomSectionPage() {
  useEditorRedirect();

  const [settings, setSettings] = useState<SuperAdminSettings | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [title, setTitle] = useState("");
  const [section, setSection] = useState<SectionState>(EMPTY_STATE);
  const [categoryOptions, setCategoryOptions] = useState<Array<{ label: string; value: string }>>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadSectionData = useCallback(async (assignment: HomeGifPromoAssignment) => {
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
      setEnabled(loadedSettings.homeCustomSectionEnabled);
      setTitle(loadedSettings.homeCustomSectionTitle);
      setCategoryOptions(loadedCategories);

      const nextSection = await loadSectionData(loadedSettings.homeCustomSectionAssignment);
      setSection(nextSection);
    } catch (error) {
      logger.error("[HomepageCustomSection] Failed to load", { error });
      toast.error("خطا در دریافت تنظیمات");
    } finally {
      setLoading(false);
    }
  }, [loadSectionData]);

  useEffect(() => {
    void load();
  }, [load]);

  const setAssignment = (assignment: HomeGifPromoAssignment) => {
    setSection((current) => ({ ...current, assignment }));
    void loadSectionData(assignment).then(setSection);
  };

  const save = async () => {
    try {
      setSaving(true);
      const saved = await updateSuperAdminSettings({
        homeCustomSectionEnabled: enabled,
        homeCustomSectionTitle: title,
        homeCustomSectionAssignment: section.assignment,
      });
      const nextSettings = saved ?? (await getSuperAdminSettings());
      setSettings(nextSettings);
      setEnabled(nextSettings.homeCustomSectionEnabled);
      setTitle(nextSettings.homeCustomSectionTitle);
      const nextSection = await loadSectionData(nextSettings.homeCustomSectionAssignment);
      setSection(nextSection);
      toast.success("تنظیمات بخش ویژه ذخیره شد");
    } catch (error) {
      logger.error("[HomepageCustomSection] Failed to save", { error });
      toast.error("خطا در ذخیره تنظیمات");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ContentWrapper title="بخش ویژه صفحه اصلی">
        <div className="p-4 text-neutral-600">در حال بارگذاری...</div>
      </ContentWrapper>
    );
  }

  return (
    <ContentWrapper title="بخش ویژه صفحه اصلی">
      <div className="space-y-6 p-4">
        <p className="rounded-lg border border-blue-100 bg-blue-50/50 p-3 text-sm text-blue-800">
          این بخش بین کمپین گیف و بنرهای صفحه اصلی نمایش داده می‌شود. عنوان و محصولات آن قابل
          تنظیم است.
        </p>

        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 accent-infinity-primary"
            />
            نمایش این بخش در صفحه اصلی
          </label>
          {enabled && (
            <span className="rounded-full bg-emerald-50 px-3 py-0.5 text-xs text-emerald-700">
              فعال
            </span>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <label className="block text-sm text-slate-600">
            عنوان بخش
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: پیشنهاد هفته"
              className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-infinity-primary focus:outline-none"
            />
          </label>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-neutral-900">محصولات بخش</h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
              {section.assignment.mode === "manual" ? "انتخاب دستی" : "دسته بندی"}
            </span>
          </div>

          <div className="space-y-4">
            <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1 text-sm">
              <button
                type="button"
                onClick={() =>
                  setAssignment({
                    mode: "manual",
                    productIds:
                      section.assignment.mode === "manual"
                        ? section.assignment.productIds
                        : [],
                    categorySlug: "",
                  })
                }
                className={`flex-1 rounded-lg px-3 py-2 ${
                  section.assignment.mode === "manual"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500"
                }`}
              >
                انتخاب دستی
              </button>
              <button
                type="button"
                onClick={() =>
                  setAssignment({
                    mode: "category",
                    categorySlug:
                      section.assignment.mode === "category"
                        ? section.assignment.categorySlug
                        : "",
                    productIds: [],
                  })
                }
                className={`flex-1 rounded-lg px-3 py-2 ${
                  section.assignment.mode === "category"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500"
                }`}
              >
                دسته بندی
              </button>
            </div>

            {section.assignment.mode === "manual" ? (
              <HomepageProductPicker
                title="انتخاب محصولات"
                selectedProductIds={section.assignment.productIds}
                productSummaries={section.summaries}
                onProductsChange={(productIds) =>
                  setAssignment({ mode: "manual", productIds, categorySlug: "" })
                }
                onProductAdded={(product) =>
                  setSection((current) => ({
                    ...current,
                    summaries: [...current.summaries, product],
                  }))
                }
              />
            ) : (
              <label className="block text-sm text-slate-600">
                دسته بندی
                <select
                  value={section.assignment.categorySlug}
                  onChange={(e) =>
                    setAssignment({
                      mode: "category",
                      categorySlug: e.target.value,
                      productIds: [],
                    })
                  }
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="">انتخاب دسته بندی</option>
                  {categoryOptions.map((cat) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </label>
            )}

            <div className="space-y-2">
              <h3 className="text-sm font-medium text-slate-700">پیش نمایش محصولات</h3>
              <ProductPreview products={section.previewProducts} />
            </div>
          </div>
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
