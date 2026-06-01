"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import FeaturedCategorySection from "@/components/Home/FeaturedCategorySection";
import CustomizationPreviewSection from "@/components/SuperAdmin/CustomizationPreviewSection";
import UpsertPageContentWrapper from "@/components/SuperAdmin/UpsertPage/ContentWrapper";
import { getSuperAdminSettings } from "@/services/super-admin/settings/get";
import { updateSuperAdminSettings } from "@/services/super-admin/settings/update";
import type { SuperAdminSettings } from "@/types/super-admin/settings";
import type { ProductSmallCardProps } from "@/components/Product/SmallCard";
import { config } from "./config";

const FEATURED_PLACEHOLDER_PRODUCTS: ProductSmallCardProps[] = Array.from(
  { length: 6 },
  (_, i) => ({
    id: -(i + 1),
    slug: "",
    title: "محصول نمونه",
    category: "",
    likedCount: 0,
    price: 0,
    image: "/images/placeholders/image-placeholder.svg",
    isAvailable: true,
  }),
);

function FeaturedCategoryPreviewInner({ data }: { data: SuperAdminSettings }) {
  const bannerImageUrl = data.homeFeaturedCategoryBannerImage?.trim() ?? "";
  const categorySlug = data.homeFeaturedCategorySlug?.trim() ?? "";

  return (
    <FeaturedCategorySection
      bannerImageUrl={bannerImageUrl}
      categorySlug={categorySlug}
      products={FEATURED_PLACEHOLDER_PRODUCTS}
    />
  );
}

function FeaturedCategoryPreview({ data }: { data: SuperAdminSettings }) {
  const hasBanner = Boolean(data.homeFeaturedCategoryBannerImage?.trim());
  const hasCategory = Boolean(data.homeFeaturedCategorySlug?.trim());
  const isEmpty = !hasBanner || !hasCategory;

  return (
    <CustomizationPreviewSection
      title="پیش‌نمایش قالب"
      browserFrame
      empty={
        isEmpty
          ? {
              title: "بنر و دسته‌بندی را انتخاب کنید",
              description:
                "برای مشاهده پیش‌نمایش مطابق سایت، دسته‌بندی و تصویر بنر بخش «شاید بپسندید» را در فرم بالا تنظیم کنید.",
            }
          : undefined
      }
    >
      <FeaturedCategoryPreviewInner data={data} />
    </CustomizationPreviewSection>
  );
}

export default function FeaturedCategorySettingsPage() {
  const [data, setData] = useState<SuperAdminSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const settings = await getSuperAdminSettings();
        setData(settings);
      } catch (error) {
        console.error(error);
        toast.error("خطا در دریافت تنظیمات");
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, []);

  if (loading) return <div>در حال بارگذاری...</div>;
  if (!data) return <div>تنظیمات یافت نشد</div>;

  return (
    <UpsertPageContentWrapper
      config={config}
      data={data}
      usePanelLayout
      footer={(formData) => <FeaturedCategoryPreview data={formData} />}
      onSubmit={async (formData) => {
        try {
          const saved = await updateSuperAdminSettings({
            homeFeaturedCategorySlug: formData.homeFeaturedCategorySlug,
            homeFeaturedCategoryBannerImage: formData.homeFeaturedCategoryBannerImage,
          });
          toast.success("تنظیمات با موفقیت بروزرسانی شد");
          setData(saved ?? (await getSuperAdminSettings()));
        } catch (error) {
          console.error(error);
          toast.error("خطا در ذخیره تنظیمات");
        }
      }}
    />
  );
}
