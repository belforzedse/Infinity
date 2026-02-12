import type {
  ActionBannerSpec,
  DesktopLayout,
  LeftBannerSpec,
  MobileLayout,
  TabletLayout,
  TextBannerSpec,
  Typography,
} from "../types";
import {
  DesktopSlideBuilder,
  MobileSlideBuilder,
  TabletSlideBuilder,
} from "./slideFactory";
import type {
  HeroCardSlot,
  HeroHeadlineSlot,
  HeroMainVisualSlot,
  HeroSliderPayload,
  HeroTextStyle,
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

export type CmsHeroEditorLayouts = {
  desktop: DesktopLayout;
  tablet: TabletLayout;
  mobile: MobileLayout;
};

function mergeClassNames(...values: Array<string | undefined | null>): string {
  return values.filter(Boolean).join(" ").trim();
}

function isInlineColor(value?: string): boolean {
  if (!value) return false;
  return /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value) || /^(rgba?|hsla?)\(/i.test(value);
}

function textStyleToTypography(style: HeroTextStyle, base: Typography | undefined): Typography {
  return {
    ...base,
    titleFont: style.fontFamily,
    titleSize: style.fontSize,
    titleWeight: style.fontWeight,
    titleLeading: style.lineHeight,
    titleTracking: style.letterSpacing,
  };
}

function textStyleToSubtitleTypography(style: HeroTextStyle, base: Typography | undefined): Typography {
  return {
    ...base,
    subtitleFont: style.fontFamily,
    subtitleSize: style.fontSize,
    subtitleWeight: style.fontWeight,
    subtitleLeading: style.lineHeight,
    subtitleTracking: style.letterSpacing,
  };
}

function applyHeadlineSlot(base: TextBannerSpec, slot: HeroHeadlineSlot): TextBannerSpec {
  return {
    ...base,
    title: slot.title || base.title,
    subtitle: slot.subtitle || base.subtitle,
    marginBottomPx: slot.bottomMarginPx,
    className: slot.className || base.className,
    titleClassName: mergeClassNames(base.titleClassName, slot.titleClassName),
    subtitleClassName: mergeClassNames(base.subtitleClassName, slot.subtitleClassName),
    colors: {
      ...base.colors,
      background: slot.backgroundColor || base.colors?.background,
      titleColor: slot.titleStyle.color || base.colors?.titleColor,
      subtitleColor: slot.subtitleStyle.color || base.colors?.subtitleColor,
    },
    typography: textStyleToSubtitleTypography(
      slot.subtitleStyle,
      textStyleToTypography(slot.titleStyle, base.typography),
    ),
  };
}

function buildButtonClass(slot: HeroCardSlot, baseClassName?: string): string {
  const colorClass = isInlineColor(slot.buttonStyle.color) ? "" : slot.buttonStyle.color;

  return mergeClassNames(
    baseClassName || "inline-flex items-center rounded-lg px-4 py-2 transition",
    colorClass,
    slot.buttonStyle.fontFamily,
    slot.buttonStyle.fontSize,
    slot.buttonStyle.fontWeight,
    slot.buttonStyle.lineHeight,
    slot.buttonStyle.letterSpacing,
  );
}

function applyCardSlot(base: ActionBannerSpec, slot: HeroCardSlot): ActionBannerSpec {
  const href = slot.buttonHref || slot.link?.href || base.button?.href || "";
  const imageHref = slot.imageHref || href || base.image.href || undefined;
  const backgroundValue =
    slot.backgroundType === "image" && slot.backgroundImageUrl
      ? slot.backgroundImageUrl
      : slot.backgroundColor || "#f8fafc";

  return {
    ...base,
    title: slot.title || base.title,
    subtitle: slot.subtitle || base.subtitle || "",
    className: slot.className || base.className,
    titleClassName: mergeClassNames(base.titleClassName, slot.titleClassName),
    subtitleClassName: mergeClassNames(base.subtitleClassName, slot.subtitleClassName),
    image: {
      ...base.image,
      src: slot.imageUrl || base.image.src,
      alt: slot.imageAlt || base.image.alt,
      href: imageHref,
      objectFit: "contain",
      zoom: 1,
      objectPosition: slot.imageObjectPosition || base.image.objectPosition,
      className: slot.imageClassName || base.image.className,
      customWidth: slot.imageCustomWidth || base.image.customWidth,
      customHeight: slot.imageCustomHeight || base.image.customHeight,
    },
    colors: {
      ...base.colors,
      background: slot.backgroundColor || base.colors?.background,
      titleColor: slot.titleStyle.color || base.colors?.titleColor,
    },
    typography: {
      ...base.typography,
      titleFont: slot.titleStyle.fontFamily,
      titleSize: slot.titleStyle.fontSize,
      titleWeight: slot.titleStyle.fontWeight,
      titleLeading: slot.titleStyle.lineHeight,
      titleTracking: slot.titleStyle.letterSpacing,
    },
    background: {
      type: slot.backgroundType,
      value: backgroundValue,
      width: slot.backgroundWidth || base.background?.width || "100%",
      height: slot.backgroundHeight || base.background?.height || "100%",
      position: slot.backgroundPosition || base.background?.position || "center",
      backgroundSize: slot.backgroundSize || base.background?.backgroundSize || "cover",
      className: slot.backgroundClassName || base.background?.className,
    },
    contentAlignment: slot.contentAlignment || base.contentAlignment,
    paddingClassName: slot.paddingClassName || base.paddingClassName,
    button: href
      ? {
          label: slot.buttonLabel || base.button?.label || "مشاهده",
          href,
          className: slot.buttonClassName || buildButtonClass(slot, base.button?.className),
          showArrow: slot.buttonShowArrow,
          arrowClassName: slot.buttonArrowClassName || base.button?.arrowClassName,
          style: isInlineColor(slot.buttonStyle.color)
            ? { color: slot.buttonStyle.color }
            : undefined,
        }
      : undefined,
  };
}

function applyMainVisualSlot(base: LeftBannerSpec, slot: HeroMainVisualSlot): LeftBannerSpec {
  const hasBackgroundImage = slot.backgroundType === "image" && Boolean(slot.backgroundImageUrl);
  return {
    ...base,
    background: {
      ...base.background,
      type: hasBackgroundImage ? "image" : "color",
      value: hasBackgroundImage
        ? slot.backgroundImageUrl
        : slot.backgroundColor || base.background.value,
      backgroundSize: slot.backgroundSize || "cover",
      position: slot.backgroundPosition || base.background.position || "center",
      width: slot.backgroundWidth || base.background.width,
      height: slot.backgroundHeight || base.background.height,
      className: slot.backgroundClassName || base.background.className,
    },
    foregroundImage: {
      ...base.foregroundImage,
      src: slot.foregroundImageUrl || base.foregroundImage.src,
      alt: slot.foregroundAlt || base.foregroundImage.alt,
      href: slot.link?.href || base.foregroundImage.href,
      objectFit: "contain",
      zoom: 1,
      className: slot.foregroundClassName || base.foregroundImage.className,
      objectPosition: slot.foregroundObjectPosition || base.foregroundImage.objectPosition,
      customWidth: slot.foregroundCustomWidth || base.foregroundImage.customWidth,
      customHeight: slot.foregroundCustomHeight || base.foregroundImage.customHeight,
    },
  };
}

function createDesktopLayout(slide: HeroSliderPayload["slides"][number]): DesktopLayout {
  const base = new DesktopSlideBuilder().build();
  const slots = slide.devices.desktop.slots;

  return {
    ...base,
    topLeftTextBanner: applyHeadlineSlot(base.topLeftTextBanner, slots.topLeftTextBanner),
    bottomActionBannerLeft: applyCardSlot(base.bottomActionBannerLeft, slots.bottomActionBannerLeft),
    bottomActionBannerRight: applyCardSlot(base.bottomActionBannerRight, slots.bottomActionBannerRight),
    rightBanner: applyMainVisualSlot(base.rightBanner, slots.rightBanner),
  };
}

function createTabletLayout(slide: HeroSliderPayload["slides"][number]): TabletLayout {
  const base = new TabletSlideBuilder().build();
  const slots = slide.devices.tablet.slots;

  return {
    ...base,
    primaryBanner: applyHeadlineSlot(base.primaryBanner, slots.primaryBanner),
    bottomActionBannerLeft: applyCardSlot(base.bottomActionBannerLeft, slots.bottomActionBannerLeft),
    bottomActionBannerRight: applyCardSlot(base.bottomActionBannerRight, slots.bottomActionBannerRight),
    heroBanner: applyMainVisualSlot(base.heroBanner, slots.heroBanner),
  };
}

function createMobileLayout(slide: HeroSliderPayload["slides"][number]): MobileLayout {
  const base = new MobileSlideBuilder().build();
  const slots = slide.devices.mobile.slots;

  return {
    ...base,
    primaryBanner: applyHeadlineSlot(base.primaryBanner, slots.primaryBanner),
    bottomActionBannerLeft: applyCardSlot(base.bottomActionBannerLeft, slots.bottomActionBannerLeft),
    bottomActionBannerRight: applyCardSlot(base.bottomActionBannerRight, slots.bottomActionBannerRight),
    heroBanner: applyMainVisualSlot(base.heroBanner, slots.heroBanner),
  };
}

export function mapHeroSlideToLayoutsForEditor(
  slide: HeroSliderPayload["slides"][number],
): CmsHeroEditorLayouts {
  return {
    desktop: createDesktopLayout(slide),
    tablet: createTabletLayout(slide),
    mobile: createMobileLayout(slide),
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
