import type { CmsHeroEditorLayouts } from "@/components/Hero/config/fromCms";
import type { BannerImageSpec } from "@/components/Hero/types";
import type {
  HeroDesktopSlotKey,
  HeroMobileSlotKey,
  HeroTabletSlotKey,
} from "@/types/super-admin/heroSlider";

export type DeviceMode = "desktop" | "tablet" | "mobile";
export type SlotKey = HeroDesktopSlotKey | HeroTabletSlotKey | HeroMobileSlotKey;

export const FALLBACK_IMAGE_SRC = "/images/placeholders/image-placeholder.svg";
export const HERO_MAIN_PLACEHOLDER = "/images/placeholders/HeroEditorMainVisualSlot.png";
export const HERO_CARD_PLACEHOLDER = "/images/placeholders/HeroEditorCardSlot.png";
export const HERO_CARD_PLACEHOLDER_ZOOM = 0.7;

export const slotLabelMap: Record<string, string> = {
  topLeftTextBanner: "تیتر",
  primaryBanner: "تیتر",
  rightBanner: "تصویر اصلی",
  heroBanner: "تصویر اصلی",
  bottomActionBannerLeft: "کارت ۱",
  bottomActionBannerRight: "کارت ۲",
};

export function getFrameByDevice(device: DeviceMode): { width: number; height: number } {
  if (device === "desktop") return { width: 1358, height: 480 };
  if (device === "tablet") return { width: 960, height: 820 };
  return { width: 430, height: 920 };
}

export function safeImageSrc(src?: string, fallback = FALLBACK_IMAGE_SRC): string {
  if (typeof src !== "string") return fallback;
  const normalized = src.trim();
  return normalized ? normalized : fallback;
}

export function makeLayoutsSafe(layouts: CmsHeroEditorLayouts): CmsHeroEditorLayouts {
  const cardImageWithPlaceholder = (img: BannerImageSpec): BannerImageSpec => {
    const src = safeImageSrc(img.src, HERO_CARD_PLACEHOLDER);
    const isPlaceholder = !(typeof img.src === "string" && img.src.trim());
    return {
      ...img,
      src,
      ...(isPlaceholder && { zoom: HERO_CARD_PLACEHOLDER_ZOOM }),
    };
  };

  return {
    desktop: {
      ...layouts.desktop,
      bottomActionBannerLeft: {
        ...layouts.desktop.bottomActionBannerLeft,
        image: cardImageWithPlaceholder(layouts.desktop.bottomActionBannerLeft.image),
      },
      bottomActionBannerRight: {
        ...layouts.desktop.bottomActionBannerRight,
        image: cardImageWithPlaceholder(layouts.desktop.bottomActionBannerRight.image),
      },
      rightBanner: {
        ...layouts.desktop.rightBanner,
        foregroundImage: {
          ...layouts.desktop.rightBanner.foregroundImage,
          src: safeImageSrc(
            layouts.desktop.rightBanner.foregroundImage.src,
            HERO_MAIN_PLACEHOLDER,
          ),
        },
      },
    },
    tablet: {
      ...layouts.tablet,
      bottomActionBannerLeft: {
        ...layouts.tablet.bottomActionBannerLeft,
        image: cardImageWithPlaceholder(layouts.tablet.bottomActionBannerLeft.image),
      },
      bottomActionBannerRight: {
        ...layouts.tablet.bottomActionBannerRight,
        image: cardImageWithPlaceholder(layouts.tablet.bottomActionBannerRight.image),
      },
      heroBanner: {
        ...layouts.tablet.heroBanner,
        foregroundImage: {
          ...layouts.tablet.heroBanner.foregroundImage,
          src: safeImageSrc(
            layouts.tablet.heroBanner.foregroundImage.src,
            HERO_MAIN_PLACEHOLDER,
          ),
        },
      },
    },
    mobile: {
      ...layouts.mobile,
      bottomActionBannerLeft: {
        ...layouts.mobile.bottomActionBannerLeft,
        image: cardImageWithPlaceholder(layouts.mobile.bottomActionBannerLeft.image),
      },
      bottomActionBannerRight: {
        ...layouts.mobile.bottomActionBannerRight,
        image: cardImageWithPlaceholder(layouts.mobile.bottomActionBannerRight.image),
      },
      heroBanner: {
        ...layouts.mobile.heroBanner,
        foregroundImage: {
          ...layouts.mobile.heroBanner.foregroundImage,
          src: safeImageSrc(
            layouts.mobile.heroBanner.foregroundImage.src,
            HERO_MAIN_PLACEHOLDER,
          ),
        },
      },
    },
  };
}

export function resolveColorForInput(value: string, fallback = "#111827"): string {
  if (/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value)) {
    return value;
  }
  return fallback;
}
