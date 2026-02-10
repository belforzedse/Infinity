import type {
  ActionBannerSpec,
  DesktopLayout,
  LeftBannerSpec,
  MobileLayout,
  TabletLayout,
  TextBannerSpec,
} from "../types";
import {
  DesktopSlideBuilder,
  MobileSlideBuilder,
  TabletSlideBuilder,
} from "./slideFactory";
import type {
  HeroRadiusToken,
  HeroShadowToken,
  HeroSlotConfig,
  HeroSliderPayload,
} from "@/types/super-admin/heroSlider";
import {
  isHeroSlideVisible,
  normalizeHeroSliderPayload,
} from "@/types/super-admin/heroSlider";

const DEFAULT_AUTOPLAY_INTERVAL_MS = 600000;

type CmsHeroMappingResult = {
  autoplayIntervalMs: number;
  desktopSlides: DesktopLayout[];
  tabletSlides: TabletLayout[];
  mobileSlides: MobileLayout[];
  autoplayEligibility: boolean[];
};

function mapRadiusTokenToClass(token: HeroRadiusToken): string {
  switch (token) {
    case "none":
      return "rounded-none";
    case "sm":
      return "rounded-lg";
    case "md":
      return "rounded-xl";
    case "lg":
      return "rounded-2xl";
    case "xl":
      return "rounded-3xl";
    case "full":
      return "rounded-full";
    default:
      return "rounded-xl";
  }
}

function mapShadowTokenToClass(token: HeroShadowToken): string {
  switch (token) {
    case "none":
      return "shadow-none";
    case "sm":
      return "shadow-sm";
    case "md":
      return "shadow";
    case "lg":
      return "shadow-lg";
    default:
      return "shadow-none";
  }
}

function mergeClassNames(...values: Array<string | undefined | null>): string {
  return values.filter(Boolean).join(" ").trim();
}

function deriveObjectPosition(slot: HeroSlotConfig): string {
  if (slot.media.objectPosition.trim()) {
    return slot.media.objectPosition;
  }

  return `${slot.media.focalX}% ${slot.media.focalY}%`;
}

function applyTextSlot(base: TextBannerSpec, slot: HeroSlotConfig): TextBannerSpec {
  return {
    ...base,
    title: slot.title || base.title,
    subtitle: slot.subtitle || base.subtitle,
    className: mergeClassNames(base.className, mapRadiusTokenToClass(slot.style.radiusToken)),
    colors: {
      ...base.colors,
      background: slot.style.backgroundColor || base.colors?.background,
    },
  };
}

function applyActionSlot(base: ActionBannerSpec, slot: HeroSlotConfig): ActionBannerSpec {
  const href = slot.link?.href || base.image.href || "";

  return {
    ...base,
    title: slot.title || base.title,
    subtitle: slot.subtitle || base.subtitle,
    className: mergeClassNames(
      base.className,
      mapRadiusTokenToClass(slot.style.radiusToken),
      mapShadowTokenToClass(slot.style.shadowToken),
    ),
    image: {
      ...base.image,
      src: slot.media.imageUrl || base.image.src,
      alt: slot.media.alt || base.image.alt,
      href: href || undefined,
      objectPosition: deriveObjectPosition(slot),
      zoom: slot.media.zoom,
      focalX: slot.media.focalX,
      focalY: slot.media.focalY,
      objectFit: slot.media.fit,
    },
    background: slot.style.backgroundImageUrl || slot.style.backgroundColor
      ? {
          type: slot.style.backgroundImageUrl ? "image" : "color",
          value: slot.style.backgroundImageUrl || slot.style.backgroundColor,
          alt: slot.media.alt || base.background?.alt,
          width: base.background?.width || "100%",
          height: base.background?.height || "100%",
          position: base.background?.position || "center",
          backgroundSize: slot.media.fit,
          className: mergeClassNames(
            mapRadiusTokenToClass(slot.style.radiusToken),
            mapShadowTokenToClass(slot.style.shadowToken),
          ),
        }
      : base.background,
    button: href
      ? {
          label: slot.label || base.button?.label || "مشاهده",
          href,
          className: base.button?.className,
          showArrow: base.button?.showArrow ?? true,
          arrowClassName: base.button?.arrowClassName,
        }
      : base.button,
  };
}

function applyHeroSlot(base: LeftBannerSpec, slot: HeroSlotConfig): LeftBannerSpec {
  return {
    ...base,
    background: {
      ...base.background,
      type: slot.style.backgroundImageUrl ? "image" : "color",
      value:
        slot.style.backgroundImageUrl ||
        slot.style.backgroundColor ||
        base.background.value,
      className: mergeClassNames(
        base.background.className,
        mapRadiusTokenToClass(slot.style.radiusToken),
        mapShadowTokenToClass(slot.style.shadowToken),
      ),
      backgroundSize: slot.media.fit,
      position: deriveObjectPosition(slot),
    },
    foregroundImage: {
      ...base.foregroundImage,
      src: slot.media.imageUrl || base.foregroundImage.src,
      alt: slot.media.alt || base.foregroundImage.alt,
      href: slot.link?.href || base.foregroundImage.href,
      objectPosition: deriveObjectPosition(slot),
      zoom: slot.media.zoom,
      focalX: slot.media.focalX,
      focalY: slot.media.focalY,
      objectFit: slot.media.fit,
    },
  };
}

function createDesktopLayout(slide: HeroSliderPayload["slides"][number]): DesktopLayout {
  const base = new DesktopSlideBuilder().build();
  const slots = slide.devices.desktop.slots;

  return {
    ...base,
    topLeftTextBanner: applyTextSlot(base.topLeftTextBanner, slots.topLeftTextBanner),
    bottomActionBannerLeft: applyActionSlot(base.bottomActionBannerLeft, slots.bottomActionBannerLeft),
    bottomActionBannerRight: applyActionSlot(base.bottomActionBannerRight, slots.bottomActionBannerRight),
    rightBanner: applyHeroSlot(base.rightBanner, slots.rightBanner),
  };
}

function createTabletLayout(slide: HeroSliderPayload["slides"][number]): TabletLayout {
  const base = new TabletSlideBuilder().build();
  const slots = slide.devices.tablet.slots;

  return {
    ...base,
    primaryBanner: applyTextSlot(base.primaryBanner, slots.primaryBanner),
    bottomActionBannerLeft: applyActionSlot(base.bottomActionBannerLeft, slots.bottomActionBannerLeft),
    bottomActionBannerRight: applyActionSlot(base.bottomActionBannerRight, slots.bottomActionBannerRight),
    heroBanner: applyHeroSlot(base.heroBanner, slots.heroBanner),
  };
}

function createMobileLayout(slide: HeroSliderPayload["slides"][number]): MobileLayout {
  const base = new MobileSlideBuilder().build();
  const slots = slide.devices.mobile.slots;

  return {
    ...base,
    primaryBanner: applyTextSlot(base.primaryBanner, slots.primaryBanner),
    bottomActionBannerLeft: applyActionSlot(base.bottomActionBannerLeft, slots.bottomActionBannerLeft),
    bottomActionBannerRight: applyActionSlot(base.bottomActionBannerRight, slots.bottomActionBannerRight),
    heroBanner: applyHeroSlot(base.heroBanner, slots.heroBanner),
  };
}

export function mapCmsHeroSliderToLayouts(
  rawPayload: unknown,
  now = new Date(),
): CmsHeroMappingResult {
  const payload = normalizeHeroSliderPayload(rawPayload);

  const visibleSlides = payload.slides
    .filter((slide) => isHeroSlideVisible(slide, now))
    .sort((a, b) => a.order - b.order);

  return {
    autoplayIntervalMs: Number.isFinite(payload.autoplayIntervalMs)
      ? payload.autoplayIntervalMs
      : DEFAULT_AUTOPLAY_INTERVAL_MS,
    autoplayEligibility: visibleSlides.map((slide) => slide.autoplayEligible),
    desktopSlides: visibleSlides.map(createDesktopLayout),
    tabletSlides: visibleSlides.map(createTabletLayout),
    mobileSlides: visibleSlides.map(createMobileLayout),
  };
}
