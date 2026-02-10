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

export type SuperAdminSettings = {
  id: number;
  filterPublicProductsByTitle: boolean;
  homeBannerOneImage: string;
  homeBannerOneTitle: string;
  homeBannerOneTitleColor: string;
  homeBannerOneButtonText: string;
  homeBannerOneButtonColor: string;
  homeBannerOneButtonHref: string;
  homeBannerTwoImage: string;
  homeBannerTwoTitle: string;
  homeBannerTwoTitleColor: string;
  homeBannerTwoButtonText: string;
  homeBannerTwoButtonColor: string;
  homeBannerTwoButtonHref: string;
  homeFeaturedCategorySlug: string;
  homeFeaturedCategoryBannerImage: string;
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
  homeBannerTwoImage: "",
  homeBannerTwoTitle: "",
  homeBannerTwoTitleColor: "",
  homeBannerTwoButtonText: "",
  homeBannerTwoButtonColor: "",
  homeBannerTwoButtonHref: "",
  homeFeaturedCategorySlug: "",
  homeFeaturedCategoryBannerImage: "",
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
  createdAt: new Date(),
  updatedAt: new Date(),
});

export const normalizeSuperAdminSettings = (
  data: any,
  id: number = 1,
): SuperAdminSettings => ({
  id,
  filterPublicProductsByTitle: Boolean(data?.filterPublicProductsByTitle) || false,
  homeBannerOneImage: typeof data?.homeBannerOneImage === "string" ? data.homeBannerOneImage : "",
  homeBannerOneTitle: typeof data?.homeBannerOneTitle === "string" ? data.homeBannerOneTitle : "",
  homeBannerOneTitleColor:
    typeof data?.homeBannerOneTitleColor === "string" ? data.homeBannerOneTitleColor : "",
  homeBannerOneButtonText:
    typeof data?.homeBannerOneButtonText === "string" ? data.homeBannerOneButtonText : "",
  homeBannerOneButtonColor:
    typeof data?.homeBannerOneButtonColor === "string" ? data.homeBannerOneButtonColor : "",
  homeBannerOneButtonHref:
    typeof data?.homeBannerOneButtonHref === "string" ? data.homeBannerOneButtonHref : "",
  homeBannerTwoImage: typeof data?.homeBannerTwoImage === "string" ? data.homeBannerTwoImage : "",
  homeBannerTwoTitle: typeof data?.homeBannerTwoTitle === "string" ? data.homeBannerTwoTitle : "",
  homeBannerTwoTitleColor:
    typeof data?.homeBannerTwoTitleColor === "string" ? data.homeBannerTwoTitleColor : "",
  homeBannerTwoButtonText:
    typeof data?.homeBannerTwoButtonText === "string" ? data.homeBannerTwoButtonText : "",
  homeBannerTwoButtonColor:
    typeof data?.homeBannerTwoButtonColor === "string" ? data.homeBannerTwoButtonColor : "",
  homeBannerTwoButtonHref:
    typeof data?.homeBannerTwoButtonHref === "string" ? data.homeBannerTwoButtonHref : "",
  homeFeaturedCategorySlug:
    typeof data?.homeFeaturedCategorySlug === "string" ? data.homeFeaturedCategorySlug : "",
  homeFeaturedCategoryBannerImage:
    typeof data?.homeFeaturedCategoryBannerImage === "string"
      ? data.homeFeaturedCategoryBannerImage
      : "",
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
  createdAt: new Date(data?.createdAt || Date.now()),
  updatedAt: new Date(data?.updatedAt || Date.now()),
});
