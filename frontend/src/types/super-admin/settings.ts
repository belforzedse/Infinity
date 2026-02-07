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
  createdAt: new Date(data?.createdAt || Date.now()),
  updatedAt: new Date(data?.updatedAt || Date.now()),
});
