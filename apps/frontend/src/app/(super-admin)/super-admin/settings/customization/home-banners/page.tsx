"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import HomePromoBanners from "@/components/Home/PromoBanners";
import CustomizationPreviewSection from "@/components/SuperAdmin/CustomizationPreviewSection";
import UpsertPageContentWrapper from "@/components/SuperAdmin/UpsertPage/ContentWrapper";
import { getSuperAdminSettings } from "@/services/super-admin/settings/get";
import { updateSuperAdminSettings } from "@/services/super-admin/settings/update";
import type { SuperAdminSettings } from "@/types/super-admin/settings";
import { config } from "./config";

function HomeBannersPreviewInner({ data }: { data: SuperAdminSettings }) {
  const banners = useMemo(
    () => [
      {
        id: "home-banner-one",
        imageUrl: data.homeBannerOneImage?.trim() ?? "",
        title: data.homeBannerOneTitle?.trim() ?? "",
        titleColor: data.homeBannerOneTitleColor?.trim() || "#ffffff",
        buttonText: data.homeBannerOneButtonText?.trim(),
        buttonColor: data.homeBannerOneButtonColor?.trim() || "#111827",
        buttonHref: data.homeBannerOneButtonHref?.trim(),
      },
      {
        id: "home-banner-two",
        imageUrl: data.homeBannerTwoImage?.trim() ?? "",
        title: data.homeBannerTwoTitle?.trim() ?? "",
        titleColor: data.homeBannerTwoTitleColor?.trim() || "#ffffff",
        buttonText: data.homeBannerTwoButtonText?.trim(),
        buttonColor: data.homeBannerTwoButtonColor?.trim() || "#111827",
        buttonHref: data.homeBannerTwoButtonHref?.trim(),
      },
    ],
    [data],
  );

  return <HomePromoBanners banners={banners} />;
}

function isBannerReady(imageUrl: string, title: string) {
  return Boolean(imageUrl) && Boolean(title);
}

function HomeBannersPreview({ data }: { data: SuperAdminSettings }) {
  const hasBannerOne = isBannerReady(
    data.homeBannerOneImage?.trim() ?? "",
    data.homeBannerOneTitle?.trim() ?? "",
  );
  const hasBannerTwo = isBannerReady(
    data.homeBannerTwoImage?.trim() ?? "",
    data.homeBannerTwoTitle?.trim() ?? "",
  );
  const isEmpty = !hasBannerOne && !hasBannerTwo;

  return (
    <CustomizationPreviewSection
      title="پیش‌نمایش قالب"
      browserFrame
      empty={
        isEmpty
          ? {
              title: "بنری تنظیم نشده است",
              description:
                "برای مشاهده پیش‌نمایش، تصویر یا عنوان بنرهای اول و دوم را در فرم بالا وارد کنید.",
            }
          : undefined
      }
    >
      <HomeBannersPreviewInner data={data} />
    </CustomizationPreviewSection>
  );
}

export default function HomeBannersSettingsPage() {
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
      footer={(formData) => <HomeBannersPreview data={formData} />}
      onSubmit={async (formData) => {
        try {
          const saved = await updateSuperAdminSettings({
            homeBannerOneImage: formData.homeBannerOneImage,
            homeBannerOneTitle: formData.homeBannerOneTitle,
            homeBannerOneTitleColor: formData.homeBannerOneTitleColor,
            homeBannerOneButtonText: formData.homeBannerOneButtonText,
            homeBannerOneButtonColor: formData.homeBannerOneButtonColor,
            homeBannerOneButtonHref: formData.homeBannerOneButtonHref,
            homeBannerTwoImage: formData.homeBannerTwoImage,
            homeBannerTwoTitle: formData.homeBannerTwoTitle,
            homeBannerTwoTitleColor: formData.homeBannerTwoTitleColor,
            homeBannerTwoButtonText: formData.homeBannerTwoButtonText,
            homeBannerTwoButtonColor: formData.homeBannerTwoButtonColor,
            homeBannerTwoButtonHref: formData.homeBannerTwoButtonHref,
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
