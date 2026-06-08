import { API_BASE_URL, getStrapiServerUrl } from "@/constants/api";
import type { SuperAdminSettings } from "@/types/super-admin/settings";
import { defaultSettings, normalizeSuperAdminSettings } from "@/types/super-admin/settings";
import logger from "@/utils/logger";

const PUBLIC_SETTINGS_FIELDS = [
  "filterPublicProductsByTitle",
  "homeBannerOneImage",
  "homeBannerOneTitle",
  "homeBannerOneTitleColor",
  "homeBannerOneButtonText",
  "homeBannerOneButtonColor",
  "homeBannerOneButtonHref",
  "homeBannerOneSubtitle",
  "homeBannerOneSubtitleColor",
  "homeBannerOneBackgroundColor",
  "homeBannerOneTextSize",
  "homeBannerOneFontWeight",
  "homeBannerOneTextAlign",
  "homeBannerOneContentPosition",
  "homeBannerOneImageFit",
  "homeBannerOneImagePosition",
  "homeBannerOneDesktopHeight",
  "homeBannerOneMobileHeight",
  "homeBannerTwoImage",
  "homeBannerTwoTitle",
  "homeBannerTwoTitleColor",
  "homeBannerTwoButtonText",
  "homeBannerTwoButtonColor",
  "homeBannerTwoButtonHref",
  "homeBannerTwoSubtitle",
  "homeBannerTwoSubtitleColor",
  "homeBannerTwoBackgroundColor",
  "homeBannerTwoTextSize",
  "homeBannerTwoFontWeight",
  "homeBannerTwoTextAlign",
  "homeBannerTwoContentPosition",
  "homeBannerTwoImageFit",
  "homeBannerTwoImagePosition",
  "homeBannerTwoDesktopHeight",
  "homeBannerTwoMobileHeight",
  "homeFeaturedCategorySlug",
  "homeFeaturedCategoryBannerImage",
  "homeFeaturedCategoryTitle",
  "homeFeaturedCategorySubtitle",
  "homeFeaturedCategoryCtaText",
  "homeFeaturedCategoryCtaHref",
  "homeFeaturedCategoryTextColor",
  "homeFeaturedCategoryTextSize",
  "homeFeaturedCategoryFontWeight",
  "homeFeaturedCategoryBannerBackgroundColor",
  "homeFeaturedCategoryBannerImageFit",
  "homeFeaturedCategoryBannerImagePosition",
  "homeFeaturedCategoryDesktopBannerHeight",
  "homeFeaturedCategoryMobileBannerHeight",
  "blogDefaultBannerImage",
  "blogDefaultBannerTitle",
  "blogDefaultBannerSubtitle",
  "blogDefaultBannerTitleColor",
  "blogDefaultBannerSubtitleColor",
  "blogDefaultBannerLinkText",
  "blogDefaultBannerLinkColor",
  "blogCategoryBannerOrder",
  "homeNewestProductIds",
  "homeDiscountedProductIds",
  "siteGifEnabled",
  "siteGifImage",
  "siteGifLinkHref",
  "siteGifAltText",
  "homeGifPromoEnabled",
  "homeGifPromoSlot1Image",
  "homeGifPromoSlot2Image",
  "homeGifPromoSlot1Assignment",
  "homeGifPromoSlot2Assignment",
  "homeCustomSectionEnabled",
  "homeCustomSectionTitle",
  "homeCustomSectionAssignment",
  "homeWeeklyPicksEnabled",
  "homeWeeklyPicksProductIds",
  "homeEveryoneFollowsEnabled",
  "homeEveryoneFollowsProductIds",
  "createdAt",
  "updatedAt",
];

const PUBLIC_SETTINGS_QUERY = PUBLIC_SETTINGS_FIELDS.map(
  (field, index) => `fields[${index}]=${encodeURIComponent(field)}`,
).join("&");

const HERO_SLIDER_QUERY = "fields[0]=homeHeroSliderPublished&fields[1]=homeHeroSliderMeta";

export type PublicHeroSlider = {
  published: unknown;
  meta: unknown;
};

export async function getPublicHeroSlider(): Promise<PublicHeroSlider> {
  try {
    const baseUrl = typeof window === "undefined" ? getStrapiServerUrl() : API_BASE_URL;
    const response = await fetch(`${baseUrl}/settings?${HERO_SLIDER_QUERY}`, {
      // Never expires — only cleared by revalidateTag("hero-slider") on publish
      next: { revalidate: false, tags: ["hero-slider"] },
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Accept-Encoding": "gzip",
      },
    }).then((res) => res.json());

    const data = (response as any)?.data?.attributes;
    return {
      published: data?.homeHeroSliderPublished ?? null,
      meta: data?.homeHeroSliderMeta ?? null,
    };
  } catch (error) {
    logger.error("[Settings] Error fetching hero slider:", error as any);
    return { published: null, meta: null };
  }
}

export async function getPublicSuperAdminSettings(): Promise<SuperAdminSettings> {
  try {
    // Use internal URL for server-side fetches to bypass TLS/DNS overhead
    const baseUrl = typeof window === "undefined" ? getStrapiServerUrl() : API_BASE_URL;
    const response = await fetch(`${baseUrl}/settings?${PUBLIC_SETTINGS_QUERY}`, {
      next: { revalidate: 60, tags: ["site-settings"] },
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Accept-Encoding": "gzip",
      },
    }).then((res) => res.json());

    const data = (response as any)?.data?.attributes;
    if (!data) return defaultSettings();

    return normalizeSuperAdminSettings(data, (response as any).data?.id || 1);
  } catch (error) {
    logger.error("[Settings] Error fetching public settings:", error as any);
    return defaultSettings();
  }
}
