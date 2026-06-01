import {
  createDefaultHeroSliderPayload,
  normalizeHeroSliderMeta,
  normalizeHeroSliderPayload,
  type HeroSliderMeta,
  type HeroSliderPayload,
} from "./heroSlider";

export type BlogCategoryBannerOrderItem = {
  id: number;
  title: string;
  slug: string;
};

export type HomePromoTextAlign = "right" | "center" | "left";
export type HomePromoContentPosition = "top" | "center" | "bottom";
export type HomeBannerImageFit = "cover" | "contain";

const normalizeString = (value: unknown): string => (typeof value === "string" ? value : "");

const normalizeNumber = (value: unknown, fallback: number): number => {
  const numeric = typeof value === "number" ? value : Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const normalizeTextAlign = (value: unknown): HomePromoTextAlign =>
  value === "left" || value === "center" || value === "right" ? value : "right";

const normalizeContentPosition = (value: unknown): HomePromoContentPosition =>
  value === "top" || value === "center" || value === "bottom" ? value : "top";

const normalizeImageFit = (value: unknown): HomeBannerImageFit =>
  value === "contain" || value === "cover" ? value : "cover";

export const normalizeBlogCategoryBannerOrder = (value: unknown): BlogCategoryBannerOrderItem[] => {
  if (!Array.isArray(value)) return [];

  const seenSlugs = new Set<string>();
  const result: BlogCategoryBannerOrderItem[] = [];

  for (const item of value) {
    const id = Number((item as any)?.id);
    const slug = typeof (item as any)?.slug === "string" ? (item as any).slug.trim() : "";
    const title = typeof (item as any)?.title === "string" ? (item as any).title : "";

    if (!Number.isFinite(id) || id <= 0 || !slug) continue;

    const normalizedSlug = slug.toLowerCase();
    if (seenSlugs.has(normalizedSlug)) continue;
    seenSlugs.add(normalizedSlug);

    result.push({ id, title, slug });
  }

  return result;
};

export const normalizeHomepageProductIds = (value: unknown): number[] => {
  if (!Array.isArray(value)) return [];
  const result: number[] = [];
  const seen = new Set<number>();
  for (const item of value) {
    const id = Number(item);
    if (!Number.isFinite(id) || id <= 0 || seen.has(id)) continue;
    seen.add(id);
    result.push(id);
  }
  return result;
};

export type SuperAdminSettings = {
  id: number;
  filterPublicProductsByTitle: boolean;
  homeBannerOneImage: string;
  homeBannerOneTitle: string;
  homeBannerOneTitleColor: string;
  homeBannerOneButtonText: string;
  homeBannerOneButtonColor: string;
  homeBannerOneButtonHref: string;
  homeBannerOneSubtitle: string;
  homeBannerOneSubtitleColor: string;
  homeBannerOneBackgroundColor: string;
  homeBannerOneTextSize: number;
  homeBannerOneFontWeight: string;
  homeBannerOneTextAlign: HomePromoTextAlign;
  homeBannerOneContentPosition: HomePromoContentPosition;
  homeBannerOneImageFit: HomeBannerImageFit;
  homeBannerOneImagePosition: string;
  homeBannerOneDesktopHeight: number;
  homeBannerOneMobileHeight: number;
  homeBannerTwoImage: string;
  homeBannerTwoTitle: string;
  homeBannerTwoTitleColor: string;
  homeBannerTwoButtonText: string;
  homeBannerTwoButtonColor: string;
  homeBannerTwoButtonHref: string;
  homeBannerTwoSubtitle: string;
  homeBannerTwoSubtitleColor: string;
  homeBannerTwoBackgroundColor: string;
  homeBannerTwoTextSize: number;
  homeBannerTwoFontWeight: string;
  homeBannerTwoTextAlign: HomePromoTextAlign;
  homeBannerTwoContentPosition: HomePromoContentPosition;
  homeBannerTwoImageFit: HomeBannerImageFit;
  homeBannerTwoImagePosition: string;
  homeBannerTwoDesktopHeight: number;
  homeBannerTwoMobileHeight: number;
  homeFeaturedCategorySlug: string;
  homeFeaturedCategoryBannerImage: string;
  homeFeaturedCategoryTitle: string;
  homeFeaturedCategorySubtitle: string;
  homeFeaturedCategoryCtaText: string;
  homeFeaturedCategoryCtaHref: string;
  homeFeaturedCategoryTextColor: string;
  homeFeaturedCategoryTextSize: number;
  homeFeaturedCategoryFontWeight: string;
  homeFeaturedCategoryBannerBackgroundColor: string;
  homeFeaturedCategoryBannerImageFit: HomeBannerImageFit;
  homeFeaturedCategoryBannerImagePosition: string;
  homeFeaturedCategoryDesktopBannerHeight: number;
  homeFeaturedCategoryMobileBannerHeight: number;
  blogDefaultBannerImage: string;
  blogDefaultBannerTitle: string;
  blogDefaultBannerSubtitle: string;
  blogDefaultBannerTitleColor: string;
  blogDefaultBannerSubtitleColor: string;
  blogDefaultBannerLinkText: string;
  blogDefaultBannerLinkColor: string;
  blogCategoryBannerOrder: BlogCategoryBannerOrderItem[];
  homeHeroSliderDraft: HeroSliderPayload;
  homeHeroSliderPublished: HeroSliderPayload;
  homeHeroSliderMeta: HeroSliderMeta | null;
  homeNewestProductIds: number[];
  homeDiscountedProductIds: number[];
  createdAt: Date;
  updatedAt: Date;
};

export const defaultSettings = (): SuperAdminSettings => ({
  id: 1,
  filterPublicProductsByTitle: false,
  homeBannerOneImage: "",
  homeBannerOneTitle: "",
  homeBannerOneTitleColor: "",
  homeBannerOneButtonText: "",
  homeBannerOneButtonColor: "",
  homeBannerOneButtonHref: "",
  homeBannerOneSubtitle: "",
  homeBannerOneSubtitleColor: "#ffffff",
  homeBannerOneBackgroundColor: "#f1f5f9",
  homeBannerOneTextSize: 30,
  homeBannerOneFontWeight: "500",
  homeBannerOneTextAlign: "right",
  homeBannerOneContentPosition: "top",
  homeBannerOneImageFit: "cover",
  homeBannerOneImagePosition: "center",
  homeBannerOneDesktopHeight: 220,
  homeBannerOneMobileHeight: 220,
  homeBannerTwoImage: "",
  homeBannerTwoTitle: "",
  homeBannerTwoTitleColor: "",
  homeBannerTwoButtonText: "",
  homeBannerTwoButtonColor: "",
  homeBannerTwoButtonHref: "",
  homeBannerTwoSubtitle: "",
  homeBannerTwoSubtitleColor: "#ffffff",
  homeBannerTwoBackgroundColor: "#f1f5f9",
  homeBannerTwoTextSize: 30,
  homeBannerTwoFontWeight: "500",
  homeBannerTwoTextAlign: "right",
  homeBannerTwoContentPosition: "top",
  homeBannerTwoImageFit: "cover",
  homeBannerTwoImagePosition: "center",
  homeBannerTwoDesktopHeight: 220,
  homeBannerTwoMobileHeight: 220,
  homeFeaturedCategorySlug: "",
  homeFeaturedCategoryBannerImage: "",
  homeFeaturedCategoryTitle: "",
  homeFeaturedCategorySubtitle: "",
  homeFeaturedCategoryCtaText: "",
  homeFeaturedCategoryCtaHref: "",
  homeFeaturedCategoryTextColor: "#111827",
  homeFeaturedCategoryTextSize: 30,
  homeFeaturedCategoryFontWeight: "500",
  homeFeaturedCategoryBannerBackgroundColor: "#f1f5f9",
  homeFeaturedCategoryBannerImageFit: "cover",
  homeFeaturedCategoryBannerImagePosition: "center",
  homeFeaturedCategoryDesktopBannerHeight: 340,
  homeFeaturedCategoryMobileBannerHeight: 260,
  blogDefaultBannerImage: "",
  blogDefaultBannerTitle: "",
  blogDefaultBannerSubtitle: "",
  blogDefaultBannerTitleColor: "",
  blogDefaultBannerSubtitleColor: "",
  blogDefaultBannerLinkText: "",
  blogDefaultBannerLinkColor: "",
  blogCategoryBannerOrder: [],
  homeHeroSliderDraft: createDefaultHeroSliderPayload(),
  homeHeroSliderPublished: createDefaultHeroSliderPayload(),
  homeHeroSliderMeta: null,
  homeNewestProductIds: [],
  homeDiscountedProductIds: [],
  createdAt: new Date(),
  updatedAt: new Date(),
});

export const normalizeSuperAdminSettings = (
  data: any,
  id: number = 1,
): SuperAdminSettings => ({
  id,
  filterPublicProductsByTitle: Boolean(data?.filterPublicProductsByTitle) || false,
  homeBannerOneImage: normalizeString(data?.homeBannerOneImage),
  homeBannerOneTitle: normalizeString(data?.homeBannerOneTitle),
  homeBannerOneTitleColor: normalizeString(data?.homeBannerOneTitleColor),
  homeBannerOneButtonText: normalizeString(data?.homeBannerOneButtonText),
  homeBannerOneButtonColor: normalizeString(data?.homeBannerOneButtonColor),
  homeBannerOneButtonHref: normalizeString(data?.homeBannerOneButtonHref),
  homeBannerOneSubtitle: normalizeString(data?.homeBannerOneSubtitle),
  homeBannerOneSubtitleColor: normalizeString(data?.homeBannerOneSubtitleColor) || "#ffffff",
  homeBannerOneBackgroundColor: normalizeString(data?.homeBannerOneBackgroundColor) || "#f1f5f9",
  homeBannerOneTextSize: normalizeNumber(data?.homeBannerOneTextSize, 30),
  homeBannerOneFontWeight: normalizeString(data?.homeBannerOneFontWeight) || "500",
  homeBannerOneTextAlign: normalizeTextAlign(data?.homeBannerOneTextAlign),
  homeBannerOneContentPosition: normalizeContentPosition(data?.homeBannerOneContentPosition),
  homeBannerOneImageFit: normalizeImageFit(data?.homeBannerOneImageFit),
  homeBannerOneImagePosition: normalizeString(data?.homeBannerOneImagePosition) || "center",
  homeBannerOneDesktopHeight: normalizeNumber(data?.homeBannerOneDesktopHeight, 220),
  homeBannerOneMobileHeight: normalizeNumber(data?.homeBannerOneMobileHeight, 220),
  homeBannerTwoImage: normalizeString(data?.homeBannerTwoImage),
  homeBannerTwoTitle: normalizeString(data?.homeBannerTwoTitle),
  homeBannerTwoTitleColor: normalizeString(data?.homeBannerTwoTitleColor),
  homeBannerTwoButtonText: normalizeString(data?.homeBannerTwoButtonText),
  homeBannerTwoButtonColor: normalizeString(data?.homeBannerTwoButtonColor),
  homeBannerTwoButtonHref: normalizeString(data?.homeBannerTwoButtonHref),
  homeBannerTwoSubtitle: normalizeString(data?.homeBannerTwoSubtitle),
  homeBannerTwoSubtitleColor: normalizeString(data?.homeBannerTwoSubtitleColor) || "#ffffff",
  homeBannerTwoBackgroundColor: normalizeString(data?.homeBannerTwoBackgroundColor) || "#f1f5f9",
  homeBannerTwoTextSize: normalizeNumber(data?.homeBannerTwoTextSize, 30),
  homeBannerTwoFontWeight: normalizeString(data?.homeBannerTwoFontWeight) || "500",
  homeBannerTwoTextAlign: normalizeTextAlign(data?.homeBannerTwoTextAlign),
  homeBannerTwoContentPosition: normalizeContentPosition(data?.homeBannerTwoContentPosition),
  homeBannerTwoImageFit: normalizeImageFit(data?.homeBannerTwoImageFit),
  homeBannerTwoImagePosition: normalizeString(data?.homeBannerTwoImagePosition) || "center",
  homeBannerTwoDesktopHeight: normalizeNumber(data?.homeBannerTwoDesktopHeight, 220),
  homeBannerTwoMobileHeight: normalizeNumber(data?.homeBannerTwoMobileHeight, 220),
  homeFeaturedCategorySlug: normalizeString(data?.homeFeaturedCategorySlug),
  homeFeaturedCategoryBannerImage: normalizeString(data?.homeFeaturedCategoryBannerImage),
  homeFeaturedCategoryTitle: normalizeString(data?.homeFeaturedCategoryTitle),
  homeFeaturedCategorySubtitle: normalizeString(data?.homeFeaturedCategorySubtitle),
  homeFeaturedCategoryCtaText: normalizeString(data?.homeFeaturedCategoryCtaText),
  homeFeaturedCategoryCtaHref: normalizeString(data?.homeFeaturedCategoryCtaHref),
  homeFeaturedCategoryTextColor: normalizeString(data?.homeFeaturedCategoryTextColor) || "#111827",
  homeFeaturedCategoryTextSize: normalizeNumber(data?.homeFeaturedCategoryTextSize, 30),
  homeFeaturedCategoryFontWeight: normalizeString(data?.homeFeaturedCategoryFontWeight) || "500",
  homeFeaturedCategoryBannerBackgroundColor:
    normalizeString(data?.homeFeaturedCategoryBannerBackgroundColor) || "#f1f5f9",
  homeFeaturedCategoryBannerImageFit: normalizeImageFit(data?.homeFeaturedCategoryBannerImageFit),
  homeFeaturedCategoryBannerImagePosition:
    normalizeString(data?.homeFeaturedCategoryBannerImagePosition) || "center",
  homeFeaturedCategoryDesktopBannerHeight: normalizeNumber(
    data?.homeFeaturedCategoryDesktopBannerHeight,
    340,
  ),
  homeFeaturedCategoryMobileBannerHeight: normalizeNumber(
    data?.homeFeaturedCategoryMobileBannerHeight,
    260,
  ),
  blogDefaultBannerImage:
    typeof data?.blogDefaultBannerImage === "string" ? data.blogDefaultBannerImage : "",
  blogDefaultBannerTitle:
    typeof data?.blogDefaultBannerTitle === "string" ? data.blogDefaultBannerTitle : "",
  blogDefaultBannerSubtitle:
    typeof data?.blogDefaultBannerSubtitle === "string" ? data.blogDefaultBannerSubtitle : "",
  blogDefaultBannerTitleColor:
    typeof data?.blogDefaultBannerTitleColor === "string" ? data.blogDefaultBannerTitleColor : "",
  blogDefaultBannerSubtitleColor:
    typeof data?.blogDefaultBannerSubtitleColor === "string"
      ? data.blogDefaultBannerSubtitleColor
      : "",
  blogDefaultBannerLinkText:
    typeof data?.blogDefaultBannerLinkText === "string" ? data.blogDefaultBannerLinkText : "",
  blogDefaultBannerLinkColor:
    typeof data?.blogDefaultBannerLinkColor === "string" ? data.blogDefaultBannerLinkColor : "",
  blogCategoryBannerOrder: normalizeBlogCategoryBannerOrder(data?.blogCategoryBannerOrder),
  homeHeroSliderDraft: normalizeHeroSliderPayload(data?.homeHeroSliderDraft),
  homeHeroSliderPublished: normalizeHeroSliderPayload(data?.homeHeroSliderPublished),
  homeHeroSliderMeta: normalizeHeroSliderMeta(data?.homeHeroSliderMeta),
  homeNewestProductIds: normalizeHomepageProductIds(data?.homeNewestProductIds),
  homeDiscountedProductIds: normalizeHomepageProductIds(data?.homeDiscountedProductIds),
  createdAt: new Date(data?.createdAt || Date.now()),
  updatedAt: new Date(data?.updatedAt || Date.now()),
});
