import type { DesktopLayout, MobileLayout, TabletLayout, BannerImageSpec, TextBannerSpec, ColorScheme, Typography, LeftBannerSpec, ActionBannerSpec, BackgroundSpec, ActionBannerButtonSpec } from "../types";

/**
 * Deep clone helper to avoid shared references
 */
export function cloneDesktopLayout(layout: DesktopLayout): DesktopLayout {
  return {
    topLeftTextBanner: { ...layout.topLeftTextBanner },
    bottomActionBannerLeft: { ...layout.bottomActionBannerLeft, image: { ...layout.bottomActionBannerLeft.image } },
    bottomActionBannerRight: { ...layout.bottomActionBannerRight, image: { ...layout.bottomActionBannerRight.image } },
    rightBanner: { ...layout.rightBanner, background: { ...layout.rightBanner.background }, foregroundImage: { ...layout.rightBanner.foregroundImage } },
  };
}

export function cloneMobileLayout(layout: MobileLayout): MobileLayout {
  return {
    heroBanner: { ...layout.heroBanner },
    primaryBanner: { ...layout.primaryBanner },
    topActionBanner: { ...layout.topActionBanner, image: { ...layout.topActionBanner.image } },
    bottomActionBanner: { ...layout.bottomActionBanner, image: { ...layout.bottomActionBanner.image } },
  };
}

export function cloneTabletLayout(layout: TabletLayout): TabletLayout {
  return {
    heroBanner: { ...layout.heroBanner },
    leftBannerTop: { ...layout.leftBannerTop, image: { ...layout.leftBannerTop.image } },
    leftBannerBottom: { ...layout.leftBannerBottom, image: { ...layout.leftBannerBottom.image } },
    rightBanner: { ...layout.rightBanner, foregroundImage: { ...layout.rightBanner.foregroundImage } },
  };
}

/**
 * Builder for creating desktop slides with fluent API
 * Desktop layout uses: leftBanner + topRightTextBanner + bottomActionBanners
 */
export class DesktopSlideBuilder {
  private layout: DesktopLayout;

  constructor(base?: DesktopLayout) {
    this.layout = base ? cloneDesktopLayout(base) : this.createDefault();
  }

  private createDefault(): DesktopLayout {
    return {
      topLeftTextBanner: {
        title: "",
        subtitle: "",
        className: "w-full gap-[8px] rounded-3xl px-[36px] pb-[36px] pt-[30px]",
        colors: {
          background: "bg-stone-50",
          titleColor: "text-red-900",
          subtitleColor: "text-gray-600",
        },
        typography: {
          titleFont: "font-kaghaz",
          titleSize: "lg:text-[44px] 2xl:text-[54px]",
          subtitleSize: "lg:text-[30px] 2xl:text-[34px]",
          titleWeight: "font-bold",
          subtitleWeight: "font-medium",
          titleLeading: "leading-[150%]",
          subtitleLeading: "leading-[110%]",
        },
      },
      bottomActionBannerLeft: {
        title: "",
        subtitle: "",
        image: {
          src: "",
          alt: "Action Banner",
          width: 600,
          height: 600,
          className: "object-cover",
        },
        className: "h-[280px] rounded-lg",
      },
      bottomActionBannerRight: {
        title: "",
        subtitle: "",
        image: {
          src: "",
          alt: "Action Banner",
          width: 600,
          height: 600,
          className: "object-cover",
        },
        className: "h-[280px] rounded-lg",
      },
      rightBanner: {
        background: {
          type: "image",
          value: "",
          alt: "Background",
          width: "100%", // Can be "300px", "50%", etc.
          height: "100%", // Can be "300px", "50%", etc.
          position: "center", // e.g., "center", "bottom center", "top left"
          backgroundSize: "cover", // e.g., "cover", "contain"
        },
        foregroundImage: {
          src: "",
          alt: "Foreground",
          width: 650,
          height: 650,
          className: "object-contain",
        },
      },
    };
  }

  /**
   * Configure top-left text banner
   */
  topLeftTextBanner(config: Partial<TextBannerSpec>): this {
    this.layout.topLeftTextBanner = {
      ...this.layout.topLeftTextBanner,
      ...config,
      colors: config.colors
        ? { ...this.layout.topLeftTextBanner.colors, ...config.colors }
        : this.layout.topLeftTextBanner.colors,
      typography: config.typography
        ? { ...this.layout.topLeftTextBanner.typography, ...config.typography }
        : this.layout.topLeftTextBanner.typography,
    };
    return this;
  }

  /**
   * Configure bottom-left action banner
   */
  bottomActionBannerLeft(config: Partial<ActionBannerSpec>): this {
    this.layout.bottomActionBannerLeft = {
      ...this.layout.bottomActionBannerLeft,
      ...config,
      image: config.image
        ? { ...this.layout.bottomActionBannerLeft.image, ...config.image }
        : this.layout.bottomActionBannerLeft.image,
      colors: config.colors
        ? { ...this.layout.bottomActionBannerLeft.colors, ...config.colors }
        : this.layout.bottomActionBannerLeft.colors,
      typography: config.typography
        ? { ...this.layout.bottomActionBannerLeft.typography, ...config.typography }
        : this.layout.bottomActionBannerLeft.typography,
    };
    return this;
  }

  /**
   * Configure bottom-right action banner
   */
  bottomActionBannerRight(config: Partial<ActionBannerSpec>): this {
    this.layout.bottomActionBannerRight = {
      ...this.layout.bottomActionBannerRight,
      ...config,
      image: config.image
        ? { ...this.layout.bottomActionBannerRight.image, ...config.image }
        : this.layout.bottomActionBannerRight.image,
      colors: config.colors
        ? { ...this.layout.bottomActionBannerRight.colors, ...config.colors }
        : this.layout.bottomActionBannerRight.colors,
      typography: config.typography
        ? { ...this.layout.bottomActionBannerRight.typography, ...config.typography }
        : this.layout.bottomActionBannerRight.typography,
    };
    return this;
  }

  /**
   * Configure right banner with background and foreground image
   */
  rightBanner(config: Partial<LeftBannerSpec>): this {
    this.layout.rightBanner = {
      ...this.layout.rightBanner,
      ...config,
      background: config.background
        ? { ...this.layout.rightBanner.background, ...config.background }
        : this.layout.rightBanner.background,
      foregroundImage: config.foregroundImage
        ? { ...this.layout.rightBanner.foregroundImage, ...config.foregroundImage }
        : this.layout.rightBanner.foregroundImage,
    };
    return this;
  }

  /**
   * Convenience method: Set foreground image as priority for LCP
   */
  withPriority(): this {
    this.layout.rightBanner.foregroundImage.priority = true;
    this.layout.rightBanner.foregroundImage.loading = "eager";
    return this;
  }

  build(): DesktopLayout {
    return this.layout;
  }
}

/**
 * Builder for creating mobile slides with fluent API
 * Mobile layout uses: heroBanner + primaryBanner + actionBanners
 */
export class MobileSlideBuilder {
  private layout: MobileLayout;

  constructor(base?: MobileLayout) {
    this.layout = base ? cloneMobileLayout(base) : this.createDefault();
  }

  private createDefault(): MobileLayout {
    return {
      heroBanner: {
        src: "",
        alt: "Hero Banner",
        width: 1920,
        height: 560,
        className: "w-full rounded-lg object-cover",
        sizes: "100vw",
      },
      primaryBanner: {
        src: "",
        alt: "Primary Banner",
        width: 1200,
        height: 600,
        className: "w-full rounded-lg object-cover",
        loading: "lazy",
        sizes: "(max-width: 768px) 100vw, 50vw",
      },
      topActionBanner: {
        title: "",
        subtitle: "",
        image: {
          src: "",
          alt: "Action Banner",
          width: 600,
          height: 600,
          className: "object-cover",
        },
        className: "rounded-lg",
      },
      bottomActionBanner: {
        title: "",
        subtitle: "",
        image: {
          src: "",
          alt: "Action Banner",
          width: 600,
          height: 600,
          className: "object-cover",
        },
        className: "rounded-lg",
      },
    };
  }

  /**
   * Configure hero banner image
   */
  heroBanner(config: Partial<BannerImageSpec>): this {
    this.layout.heroBanner = { ...this.layout.heroBanner, ...config };
    return this;
  }

  /**
   * Configure primary banner image
   */
  primaryBanner(config: Partial<BannerImageSpec>): this {
    this.layout.primaryBanner = { ...this.layout.primaryBanner, ...config };
    return this;
  }

  /**
   * Configure top action banner
   */
  topActionBanner(config: Partial<ActionBannerSpec>): this {
    this.layout.topActionBanner = {
      ...this.layout.topActionBanner,
      ...config,
      image: config.image
        ? { ...this.layout.topActionBanner.image, ...config.image }
        : this.layout.topActionBanner.image,
      colors: config.colors
        ? { ...this.layout.topActionBanner.colors, ...config.colors }
        : this.layout.topActionBanner.colors,
      typography: config.typography
        ? { ...this.layout.topActionBanner.typography, ...config.typography }
        : this.layout.topActionBanner.typography,
    };
    return this;
  }

  /**
   * Configure bottom action banner
   */
  bottomActionBanner(config: Partial<ActionBannerSpec>): this {
    this.layout.bottomActionBanner = {
      ...this.layout.bottomActionBanner,
      ...config,
      image: config.image
        ? { ...this.layout.bottomActionBanner.image, ...config.image }
        : this.layout.bottomActionBanner.image,
      colors: config.colors
        ? { ...this.layout.bottomActionBanner.colors, ...config.colors }
        : this.layout.bottomActionBanner.colors,
      typography: config.typography
        ? { ...this.layout.bottomActionBanner.typography, ...config.typography }
        : this.layout.bottomActionBanner.typography,
    };
    return this;
  }

  /**
   * Convenience method: Set hero images as priority for LCP
   */
  withPriority(): this {
    this.layout.heroBanner.priority = true;
    this.layout.heroBanner.loading = "eager";
    return this;
  }

  build(): MobileLayout {
    return this.layout;
  }
}

/**
 * Builder for creating tablet slides with fluent API
 * Tablet layout uses: heroBanner + leftBanners (stacked) + rightBanner (LeftBanner with bg + fg)
 */
export class TabletSlideBuilder {
  private layout: TabletLayout;

  constructor(base?: TabletLayout) {
    this.layout = base ? cloneTabletLayout(base) : this.createDefault();
  }

  private createDefault(): TabletLayout {
    return {
      heroBanner: {
        src: "",
        alt: "Hero Banner",
        width: 1920,
        height: 560,
        className: "w-full rounded-lg object-cover",
        sizes: "100%",
      },
      leftBannerTop: {
        title: "",
        subtitle: "",
        image: {
          src: "",
          alt: "Action Banner",
          width: 400,
          height: 280,
          className: "object-cover",
        },
        className: "h-[280px] rounded-lg",
      },
      leftBannerBottom: {
        title: "",
        subtitle: "",
        image: {
          src: "",
          alt: "Action Banner",
          width: 400,
          height: 280,
          className: "object-cover",
        },
        className: "h-[280px] rounded-lg",
      },
      rightBanner: {
        background: {
          type: "color",
          value: "bg-stone-50",
          width: "100%",
          height: "100%",
          position: "center",
        },
        foregroundImage: {
          src: "",
          alt: "Right Banner",
          width: 600,
          height: 600,
          className: "object-cover",
        },
      },
    };
  }

  /**
   * Configure hero banner image
   */
  heroBanner(config: Partial<BannerImageSpec>): this {
    this.layout.heroBanner = { ...this.layout.heroBanner, ...config };
    return this;
  }

  /**
   * Configure left top action banner
   */
  leftBannerTop(config: Partial<ActionBannerSpec>): this {
    this.layout.leftBannerTop = {
      ...this.layout.leftBannerTop,
      ...config,
      image: config.image
        ? { ...this.layout.leftBannerTop.image, ...config.image }
        : this.layout.leftBannerTop.image,
      colors: config.colors
        ? { ...this.layout.leftBannerTop.colors, ...config.colors }
        : this.layout.leftBannerTop.colors,
      typography: config.typography
        ? { ...this.layout.leftBannerTop.typography, ...config.typography }
        : this.layout.leftBannerTop.typography,
    };
    return this;
  }

  /**
   * Configure left bottom action banner
   */
  leftBannerBottom(config: Partial<ActionBannerSpec>): this {
    this.layout.leftBannerBottom = {
      ...this.layout.leftBannerBottom,
      ...config,
      image: config.image
        ? { ...this.layout.leftBannerBottom.image, ...config.image }
        : this.layout.leftBannerBottom.image,
      colors: config.colors
        ? { ...this.layout.leftBannerBottom.colors, ...config.colors }
        : this.layout.leftBannerBottom.colors,
      typography: config.typography
        ? { ...this.layout.leftBannerBottom.typography, ...config.typography }
        : this.layout.leftBannerBottom.typography,
    };
    return this;
  }

  /**
   * Configure right banner with background and foreground image
   */
  rightBanner(config: Partial<LeftBannerSpec>): this {
    this.layout.rightBanner = {
      ...this.layout.rightBanner,
      ...config,
      background: config.background
        ? { ...this.layout.rightBanner.background, ...config.background }
        : this.layout.rightBanner.background,
      foregroundImage: config.foregroundImage
        ? { ...this.layout.rightBanner.foregroundImage, ...config.foregroundImage }
        : this.layout.rightBanner.foregroundImage,
    };
    return this;
  }

  /**
   * Convenience method: Set hero banner as priority for LCP
   */
  withPriority(): this {
    this.layout.heroBanner.priority = true;
    this.layout.heroBanner.loading = "eager";
    return this;
  }

  build(): TabletLayout {
    return this.layout;
  }
}
