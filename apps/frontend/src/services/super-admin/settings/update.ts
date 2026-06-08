import { apiClient } from "@/services";
import type { SuperAdminSettings } from "@/types/super-admin/settings";
import { normalizeSettingsApiResponse } from "./get";

export async function updateSuperAdminSettings(
  settings: Partial<SuperAdminSettings>,
): Promise<SuperAdminSettings | null> {
  const data: Partial<SuperAdminSettings> = {};

  if (typeof settings.filterPublicProductsByTitle === "boolean") {
    data.filterPublicProductsByTitle = settings.filterPublicProductsByTitle;
  }

  if (settings.homeBannerOneImage !== undefined)
    data.homeBannerOneImage = settings.homeBannerOneImage;
  if (settings.homeBannerOneTitle !== undefined)
    data.homeBannerOneTitle = settings.homeBannerOneTitle;
  if (settings.homeBannerOneTitleColor !== undefined) {
    data.homeBannerOneTitleColor = settings.homeBannerOneTitleColor;
  }
  if (settings.homeBannerOneButtonText !== undefined) {
    data.homeBannerOneButtonText = settings.homeBannerOneButtonText;
  }
  if (settings.homeBannerOneButtonColor !== undefined) {
    data.homeBannerOneButtonColor = settings.homeBannerOneButtonColor;
  }
  if (settings.homeBannerOneButtonHref !== undefined) {
    data.homeBannerOneButtonHref = settings.homeBannerOneButtonHref;
  }
  if (settings.homeBannerOneSubtitle !== undefined)
    data.homeBannerOneSubtitle = settings.homeBannerOneSubtitle;
  if (settings.homeBannerOneSubtitleColor !== undefined)
    data.homeBannerOneSubtitleColor = settings.homeBannerOneSubtitleColor;
  if (settings.homeBannerOneBackgroundColor !== undefined)
    data.homeBannerOneBackgroundColor = settings.homeBannerOneBackgroundColor;
  if (settings.homeBannerOneTextSize !== undefined)
    data.homeBannerOneTextSize = settings.homeBannerOneTextSize;
  if (settings.homeBannerOneFontWeight !== undefined)
    data.homeBannerOneFontWeight = settings.homeBannerOneFontWeight;
  if (settings.homeBannerOneTextAlign !== undefined)
    data.homeBannerOneTextAlign = settings.homeBannerOneTextAlign;
  if (settings.homeBannerOneContentPosition !== undefined)
    data.homeBannerOneContentPosition = settings.homeBannerOneContentPosition;
  if (settings.homeBannerOneImageFit !== undefined)
    data.homeBannerOneImageFit = settings.homeBannerOneImageFit;
  if (settings.homeBannerOneImagePosition !== undefined)
    data.homeBannerOneImagePosition = settings.homeBannerOneImagePosition;
  if (settings.homeBannerOneDesktopHeight !== undefined)
    data.homeBannerOneDesktopHeight = settings.homeBannerOneDesktopHeight;
  if (settings.homeBannerOneMobileHeight !== undefined)
    data.homeBannerOneMobileHeight = settings.homeBannerOneMobileHeight;

  if (settings.homeBannerTwoImage !== undefined)
    data.homeBannerTwoImage = settings.homeBannerTwoImage;
  if (settings.homeBannerTwoTitle !== undefined)
    data.homeBannerTwoTitle = settings.homeBannerTwoTitle;
  if (settings.homeBannerTwoTitleColor !== undefined) {
    data.homeBannerTwoTitleColor = settings.homeBannerTwoTitleColor;
  }
  if (settings.homeBannerTwoButtonText !== undefined) {
    data.homeBannerTwoButtonText = settings.homeBannerTwoButtonText;
  }
  if (settings.homeBannerTwoButtonColor !== undefined) {
    data.homeBannerTwoButtonColor = settings.homeBannerTwoButtonColor;
  }
  if (settings.homeBannerTwoButtonHref !== undefined) {
    data.homeBannerTwoButtonHref = settings.homeBannerTwoButtonHref;
  }
  if (settings.homeBannerTwoSubtitle !== undefined)
    data.homeBannerTwoSubtitle = settings.homeBannerTwoSubtitle;
  if (settings.homeBannerTwoSubtitleColor !== undefined)
    data.homeBannerTwoSubtitleColor = settings.homeBannerTwoSubtitleColor;
  if (settings.homeBannerTwoBackgroundColor !== undefined)
    data.homeBannerTwoBackgroundColor = settings.homeBannerTwoBackgroundColor;
  if (settings.homeBannerTwoTextSize !== undefined)
    data.homeBannerTwoTextSize = settings.homeBannerTwoTextSize;
  if (settings.homeBannerTwoFontWeight !== undefined)
    data.homeBannerTwoFontWeight = settings.homeBannerTwoFontWeight;
  if (settings.homeBannerTwoTextAlign !== undefined)
    data.homeBannerTwoTextAlign = settings.homeBannerTwoTextAlign;
  if (settings.homeBannerTwoContentPosition !== undefined)
    data.homeBannerTwoContentPosition = settings.homeBannerTwoContentPosition;
  if (settings.homeBannerTwoImageFit !== undefined)
    data.homeBannerTwoImageFit = settings.homeBannerTwoImageFit;
  if (settings.homeBannerTwoImagePosition !== undefined)
    data.homeBannerTwoImagePosition = settings.homeBannerTwoImagePosition;
  if (settings.homeBannerTwoDesktopHeight !== undefined)
    data.homeBannerTwoDesktopHeight = settings.homeBannerTwoDesktopHeight;
  if (settings.homeBannerTwoMobileHeight !== undefined)
    data.homeBannerTwoMobileHeight = settings.homeBannerTwoMobileHeight;
  if (settings.homeFeaturedCategorySlug !== undefined) {
    data.homeFeaturedCategorySlug = settings.homeFeaturedCategorySlug;
  }
  if (settings.homeFeaturedCategoryBannerImage !== undefined) {
    data.homeFeaturedCategoryBannerImage = settings.homeFeaturedCategoryBannerImage;
  }
  if (settings.homeFeaturedCategoryTitle !== undefined) {
    data.homeFeaturedCategoryTitle = settings.homeFeaturedCategoryTitle;
  }
  if (settings.homeFeaturedCategorySubtitle !== undefined) {
    data.homeFeaturedCategorySubtitle = settings.homeFeaturedCategorySubtitle;
  }
  if (settings.homeFeaturedCategoryCtaText !== undefined) {
    data.homeFeaturedCategoryCtaText = settings.homeFeaturedCategoryCtaText;
  }
  if (settings.homeFeaturedCategoryCtaHref !== undefined) {
    data.homeFeaturedCategoryCtaHref = settings.homeFeaturedCategoryCtaHref;
  }
  if (settings.homeFeaturedCategoryTextColor !== undefined) {
    data.homeFeaturedCategoryTextColor = settings.homeFeaturedCategoryTextColor;
  }
  if (settings.homeFeaturedCategoryTextSize !== undefined) {
    data.homeFeaturedCategoryTextSize = settings.homeFeaturedCategoryTextSize;
  }
  if (settings.homeFeaturedCategoryFontWeight !== undefined) {
    data.homeFeaturedCategoryFontWeight = settings.homeFeaturedCategoryFontWeight;
  }
  if (settings.homeFeaturedCategoryBannerBackgroundColor !== undefined) {
    data.homeFeaturedCategoryBannerBackgroundColor =
      settings.homeFeaturedCategoryBannerBackgroundColor;
  }
  if (settings.homeFeaturedCategoryBannerImageFit !== undefined) {
    data.homeFeaturedCategoryBannerImageFit = settings.homeFeaturedCategoryBannerImageFit;
  }
  if (settings.homeFeaturedCategoryBannerImagePosition !== undefined) {
    data.homeFeaturedCategoryBannerImagePosition =
      settings.homeFeaturedCategoryBannerImagePosition;
  }
  if (settings.homeFeaturedCategoryDesktopBannerHeight !== undefined) {
    data.homeFeaturedCategoryDesktopBannerHeight =
      settings.homeFeaturedCategoryDesktopBannerHeight;
  }
  if (settings.homeFeaturedCategoryMobileBannerHeight !== undefined) {
    data.homeFeaturedCategoryMobileBannerHeight = settings.homeFeaturedCategoryMobileBannerHeight;
  }
  if (settings.blogDefaultBannerImage !== undefined) {
    data.blogDefaultBannerImage = settings.blogDefaultBannerImage;
  }
  if (settings.blogDefaultBannerTitle !== undefined) {
    data.blogDefaultBannerTitle = settings.blogDefaultBannerTitle;
  }
  if (settings.blogDefaultBannerSubtitle !== undefined) {
    data.blogDefaultBannerSubtitle = settings.blogDefaultBannerSubtitle;
  }
  if (settings.blogDefaultBannerTitleColor !== undefined) {
    data.blogDefaultBannerTitleColor = settings.blogDefaultBannerTitleColor;
  }
  if (settings.blogDefaultBannerSubtitleColor !== undefined) {
    data.blogDefaultBannerSubtitleColor = settings.blogDefaultBannerSubtitleColor;
  }
  if (settings.blogDefaultBannerLinkText !== undefined) {
    data.blogDefaultBannerLinkText = settings.blogDefaultBannerLinkText;
  }
  if (settings.blogDefaultBannerLinkColor !== undefined) {
    data.blogDefaultBannerLinkColor = settings.blogDefaultBannerLinkColor;
  }
  if (settings.blogCategoryBannerOrder !== undefined) {
    data.blogCategoryBannerOrder = settings.blogCategoryBannerOrder;
  }
  if (settings.homeNewestProductIds !== undefined) {
    data.homeNewestProductIds = settings.homeNewestProductIds;
  }
  if (settings.homeDiscountedProductIds !== undefined) {
    data.homeDiscountedProductIds = settings.homeDiscountedProductIds;
  }
  if (settings.siteGifEnabled !== undefined) {
    data.siteGifEnabled = settings.siteGifEnabled;
  }
  if (settings.siteGifImage !== undefined) {
    data.siteGifImage = settings.siteGifImage;
  }
  if (settings.siteGifLinkHref !== undefined) {
    data.siteGifLinkHref = settings.siteGifLinkHref;
  }
  if (settings.siteGifAltText !== undefined) {
    data.siteGifAltText = settings.siteGifAltText;
  }
  if (settings.homeGifPromoEnabled !== undefined) {
    data.homeGifPromoEnabled = settings.homeGifPromoEnabled;
  }
  if (settings.homeGifPromoSlot1Image !== undefined) {
    data.homeGifPromoSlot1Image = settings.homeGifPromoSlot1Image;
  }
  if (settings.homeGifPromoSlot2Image !== undefined) {
    data.homeGifPromoSlot2Image = settings.homeGifPromoSlot2Image;
  }
  if (settings.homeGifPromoSlot1Assignment !== undefined) {
    data.homeGifPromoSlot1Assignment = settings.homeGifPromoSlot1Assignment;
  }
  if (settings.homeGifPromoSlot2Assignment !== undefined) {
    data.homeGifPromoSlot2Assignment = settings.homeGifPromoSlot2Assignment;
  }

  if (Object.keys(data).length === 0) return null;

  // PUT to /settings with data object
  const response = await apiClient.put(`/settings?populate=*`, {
    data,
  });

  return normalizeSettingsApiResponse(response);
}
