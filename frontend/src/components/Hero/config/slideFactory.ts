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
    heroBanner: {
      ...layout.heroBanner,
      background: { ...layout.heroBanner.background },
      foregroundImage: { ...layout.heroBanner.foregroundImage },
    },
    primaryBanner: { ...layout.primaryBanner },
    bottomActionBannerLeft: {
      ...layout.bottomActionBannerLeft,
      image: { ...layout.bottomActionBannerLeft.image },
    },
    bottomActionBannerRight: {
      ...layout.bottomActionBannerRight,
      image: { ...layout.bottomActionBannerRight.image },
    },
  };
}

export function cloneTabletLayout(layout: TabletLayout): TabletLayout {
  return {
    heroBanner: {
      ...layout.heroBanner,
      background: { ...layout.heroBanner.background },
      foregroundImage: { ...layout.heroBanner.foregroundImage },
    },
    primaryBanner: { ...layout.primaryBanner },
    bottomActionBannerLeft: {
      ...layout.bottomActionBannerLeft,
      image: { ...layout.bottomActionBannerLeft.image },
    },
    bottomActionBannerRight: {
      ...layout.bottomActionBannerRight,
      image: { ...layout.bottomActionBannerRight.image },
    },
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
 * Mobile layout uses: heroBanner (square) + primaryBanner (text) + bottomActionBanners
 */
export class MobileSlideBuilder {
  private layout: MobileLayout;

  constructor(base?: MobileLayout) {
    this.layout = base ? cloneMobileLayout(base) : this.createDefault();
  }

  private createDefault(): MobileLayout {
    return {
      heroBanner: {
        background: {
          type: "color",
          value: "bg-slate-50",
          width: "100%",
          height: "100%",
          position: "center",
        },
        foregroundImage: {
          src: "",
          alt: "Hero Banner",
          width: 600,
          height: 600,
          className: "object-contain",
        },
      },
      primaryBanner: {
        title: "",
        subtitle: "",
        className: "w-full gap-[8px] rounded-3xl px-[24px] pb-[24px] pt-[20px]",
        colors: {
          background: "bg-stone-50",
          titleColor: "text-gray-900",
          subtitleColor: "text-gray-600",
        },
        typography: {
          titleFont: "font-kaghaz",
          titleSize: "text-xl sm:text-2xl md:text-3xl",
          subtitleSize: "text-sm sm:text-base md:text-lg",
          titleWeight: "font-bold",
          subtitleWeight: "font-medium",
          titleLeading: "leading-tight",
          subtitleLeading: "leading-relaxed",
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
        className: "rounded-lg",
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
        className: "rounded-lg",
      },
    };
  }

  /**
   * Configure hero banner (square with background + foreground)
   */
  heroBanner(config: Partial<LeftBannerSpec>): this {
    this.layout.heroBanner = {
      ...this.layout.heroBanner,
      ...config,
      background: config.background
        ? { ...this.layout.heroBanner.background, ...config.background }
        : this.layout.heroBanner.background,
      foregroundImage: config.foregroundImage
        ? { ...this.layout.heroBanner.foregroundImage, ...config.foregroundImage }
        : this.layout.heroBanner.foregroundImage,
    };
    return this;
  }

  /**
   * Configure primary text banner
   */
  primaryBanner(config: Partial<TextBannerSpec>): this {
    this.layout.primaryBanner = {
      ...this.layout.primaryBanner,
      ...config,
      colors: config.colors
        ? { ...this.layout.primaryBanner.colors, ...config.colors }
        : this.layout.primaryBanner.colors,
      typography: config.typography
        ? { ...this.layout.primaryBanner.typography, ...config.typography }
        : this.layout.primaryBanner.typography,
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
   * Convenience method: Set foreground image as priority for LCP
   */
  withPriority(): this {
    this.layout.heroBanner.foregroundImage.priority = true;
    this.layout.heroBanner.foregroundImage.loading = "eager";
    return this;
  }

  build(): MobileLayout {
    return this.layout;
  }
}

/**
 * Builder for creating tablet slides with fluent API
 * Tablet layout uses: heroBanner (square) + primaryBanner (text) + bottomActionBanners
 */
export class TabletSlideBuilder {
  private layout: TabletLayout;

  constructor(base?: TabletLayout) {
    this.layout = base ? cloneTabletLayout(base) : this.createDefault();
  }

  private createDefault(): TabletLayout {
    return {
      heroBanner: {
        background: {
          type: "color",
          value: "bg-slate-50",
          width: "100%",
          height: "100%",
          position: "center",
        },
        foregroundImage: {
          src: "",
          alt: "Hero Banner",
          width: 600,
          height: 600,
          className: "object-contain",
        },
      },
      primaryBanner: {
        title: "",
        subtitle: "",
        className: "w-full gap-[8px] rounded-3xl px-[32px] pb-[32px] pt-[28px]",
        colors: {
          background: "bg-stone-50",
          titleColor: "text-gray-900",
          subtitleColor: "text-gray-600",
        },
        typography: {
          titleFont: "font-kaghaz",
          titleSize: "lg:text-[40px] 2xl:text-[48px]",
          subtitleSize: "lg:text-[24px] 2xl:text-[28px]",
          titleWeight: "font-bold",
          subtitleWeight: "font-medium",
          titleLeading: "leading-tight",
          subtitleLeading: "leading-relaxed",
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
        className: "rounded-lg",
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
        className: "rounded-lg",
      },
    };
  }

  /**
   * Configure hero banner (square with background + foreground)
   */
  heroBanner(config: Partial<LeftBannerSpec>): this {
    this.layout.heroBanner = {
      ...this.layout.heroBanner,
      ...config,
      background: config.background
        ? { ...this.layout.heroBanner.background, ...config.background }
        : this.layout.heroBanner.background,
      foregroundImage: config.foregroundImage
        ? { ...this.layout.heroBanner.foregroundImage, ...config.foregroundImage }
        : this.layout.heroBanner.foregroundImage,
    };
    return this;
  }

  /**
   * Configure primary text banner
   */
  primaryBanner(config: Partial<TextBannerSpec>): this {
    this.layout.primaryBanner = {
      ...this.layout.primaryBanner,
      ...config,
      colors: config.colors
        ? { ...this.layout.primaryBanner.colors, ...config.colors }
        : this.layout.primaryBanner.colors,
      typography: config.typography
        ? { ...this.layout.primaryBanner.typography, ...config.typography }
        : this.layout.primaryBanner.typography,
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
   * Convenience method: Set foreground image as priority for LCP
   */
  withPriority(): this {
    this.layout.heroBanner.foregroundImage.priority = true;
    this.layout.heroBanner.foregroundImage.loading = "eager";
    return this;
  }

  build(): TabletLayout {
    return this.layout;
  }
}
