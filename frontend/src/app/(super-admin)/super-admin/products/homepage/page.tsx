"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import ContentWrapper from "@/components/SuperAdmin/Layout/ContentWrapper";
import HomepageProductPicker, { type ProductSummary } from "@/components/SuperAdmin/Products/HomepageProductPicker";
import { getSuperAdminSettings } from "@/services/super-admin/settings/get";
import { updateSuperAdminSettings } from "@/services/super-admin/settings/update";
import { getProductSummariesByIds } from "@/services/super-admin/product/get";
import { useEditorRedirect } from "@/hooks/useEditorRedirect";

export default function HomepageProductsPage() {
  useEditorRedirect();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newestIds, setNewestIds] = useState<number[]>([]);
  const [discountedIds, setDiscountedIds] = useState<number[]>([]);
  const [newestSummaries, setNewestSummaries] = useState<ProductSummary[]>([]);
  const [discountedSummaries, setDiscountedSummaries] = useState<ProductSummary[]>([]);

  const loadSettingsAndSummaries = useCallback(async () => {
    try {
      const settings = await getSuperAdminSettings();
      setNewestIds(settings.homeNewestProductIds);
      setDiscountedIds(settings.homeDiscountedProductIds);

      const [newest, discounted] = await Promise.all([
        getProductSummariesByIds(settings.homeNewestProductIds),
        getProductSummariesByIds(settings.homeDiscountedProductIds),
      ]);
      setNewestSummaries(newest);
      setDiscountedSummaries(discounted);
    } catch (err) {
      console.error(err);
      toast.error("خطا در دریافت تنظیمات. دوباره تلاش کنید.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettingsAndSummaries();
  }, [loadSettingsAndSummaries]);

  const newestSummariesForPicker = useMemo(
    () => newestSummaries.filter((s) => newestIds.includes(s.id)),
    [newestSummaries, newestIds],
  );
  const discountedSummariesForPicker = useMemo(
    () => discountedSummaries.filter((s) => discountedIds.includes(s.id)),
    [discountedSummaries, discountedIds],
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSuperAdminSettings({
        homeNewestProductIds: newestIds,
        homeDiscountedProductIds: discountedIds,
      });
      toast.success("تنظیمات با موفقیت ذخیره شد");
      await loadSettingsAndSummaries();
    } catch (err) {
      console.error(err);
      toast.error("خطا در ذخیره. دوباره تلاش کنید.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ContentWrapper title="محصولات صفحه اصلی">
        <div className="p-4 text-neutral-600">در حال بارگذاری...</div>
      </ContentWrapper>
    );
  }

  return (
    <ContentWrapper title="محصولات صفحه اصلی">
      <div className="space-y-6 p-4">
        <p className="rounded-lg border border-blue-100 bg-blue-50/50 p-3 text-sm text-blue-800">
          اگر برای هر بخش محصولی انتخاب نشود، در صفحه اصلی محصولات به صورت خودکار (جدیدترین یا دارای تخفیف) نمایش داده می‌شوند.
        </p>

        <div className="grid gap-6 lg:grid-cols-2">
          <HomepageProductPicker
            title="جدیدترین ها"
            selectedProductIds={newestIds}
            productSummaries={newestSummariesForPicker}
            onProductsChange={setNewestIds}
            onProductAdded={(p) => setNewestSummaries((prev) => [...prev, p])}
          />
          <HomepageProductPicker
            title="تخفیف‌های وسوسه انگیز"
            selectedProductIds={discountedIds}
            productSummaries={discountedSummariesForPicker}
            onProductsChange={setDiscountedIds}
            onProductAdded={(p) => setDiscountedSummaries((prev) => [...prev, p])}
          />
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-xl bg-pink-600 px-6 py-2.5 text-white transition hover:bg-pink-700 disabled:opacity-50"
          >
            {saving ? "در حال ذخیره..." : "ذخیره تغییرات"}
          </button>
        </div>
      </div>
    </ContentWrapper>
  );
}
