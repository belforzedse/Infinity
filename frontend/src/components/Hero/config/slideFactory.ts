import type { DesktopLayout, MobileLayout, BannerImageSpec, TextBannerSpec, ColorScheme, Typography } from "../types";

/**
 * Deep clone helper to avoid shared references
 */
export function cloneDesktopLayout(layout: DesktopLayout): DesktopLayout {
  return {
    textBanner: { ...layout.textBanner },
    belowLeft: { ...layout.belowLeft },
    belowRight: { ...layout.belowRight },
    side: { ...layout.side },
  };
}

export function cloneMobileLayout(layout: MobileLayout): MobileLayout {
  return {
    heroDesktop: { ...layout.heroDesktop },
    heroMobile: { ...layout.heroMobile },
    secondaryPrimary: { ...layout.secondaryPrimary },
    secondaryTop: { ...layout.secondaryTop },
    secondaryBottom: { ...layout.secondaryBottom },
  };
}

/**
 * Builder for creating desktop slides with fluent API
 */
export class DesktopSlideBuilder {
  private layout: DesktopLayout;

  constructor(base?: DesktopLayout) {
    this.layout = base ? cloneDesktopLayout(base) : this.createDefault();
  }

  private createDefault(): DesktopLayout {
    return {
      textBanner: {
        title: "",
        subtitle: "",
        className: "2xl:h-[200px] w-full gap-[8px] rounded-3xl px-[36px] pb-[36px] pt-[30px]",
        titleClassName: "",
        subtitleClassName: "",
        colors: {
          background: "bg-stone-50",
          titleColor: "text-red-900",
          subtitleColor: "text-gray-600",
        },
        typography: {
          titleFont: "font-rokh",
          titleSize: "lg:text-[44px] 2xl:text-[54px]",
          subtitleSize: "lg:text-[30px] 2xl:text-[34px]",
          titleWeight: "font-bold",
          subtitleWeight: "font-medium",
          titleLeading: "leading-[150%]",
          subtitleLeading: "leading-[110%]",
        },
      },
      belowLeft: {
        src: "",
        alt: "Banner",
        width: 600,
        height: 600,
        className: "h-full w-full rounded-lg object-cover",
        loading: "lazy",
      },
      belowRight: {
        src: "",
        alt: "Banner",
        width: 600,
        height: 600,
        className: "h-full w-full rounded-lg object-cover",
        loading: "lazy",
      },
      side: {
        src: "",
        alt: "Hero Side Banner",
        width: 650,
        height: 650,
        className: "object-fit h-[650] w-[650px] rounded-lg",
      },
    };
  }

  textBanner(config: Partial<TextBannerSpec>): this {
    this.layout.textBanner = {
      ...this.layout.textBanner,
      ...config,
      colors: config.colors
        ? { ...this.layout.textBanner.colors, ...config.colors }
        : this.layout.textBanner.colors,
      typography: config.typography
        ? { ...this.layout.textBanner.typography, ...config.typography }
        : this.layout.textBanner.typography
    };
    return this;
  }

  colors(colors: Partial<ColorScheme>): this {
    this.layout.textBanner.colors = {
      ...this.layout.textBanner.colors,
      ...colors,
    };
    return this;
  }

  typography(typography: Partial<Typography>): this {
    this.layout.textBanner.typography = {
      ...this.layout.textBanner.typography,
      ...typography,
    };
    return this;
  }

  belowLeft(config: Partial<BannerImageSpec>): this {
    this.layout.belowLeft = { ...this.layout.belowLeft, ...config };
    return this;
  }

  belowRight(config: Partial<BannerImageSpec>): this {
    this.layout.belowRight = { ...this.layout.belowRight, ...config };
    return this;
  }

  side(config: Partial<BannerImageSpec>): this {
    this.layout.side = { ...this.layout.side, ...config };
    return this;
  }

  // Convenience methods for common modifications
  withPriority(): this {
    this.layout.side.priority = true;
    this.layout.side.loading = "eager";
    return this;
  }

  withClassName(target: keyof DesktopLayout, className: string): this {
    if (target === "textBanner") return this;
    this.layout[target].className = className;
    return this;
  }

  appendClassName(target: keyof DesktopLayout, className: string): this {
    if (target === "textBanner") return this;
    this.layout[target].className = `${this.layout[target].className} ${className}`;
    return this;
  }

  build(): DesktopLayout {
    return this.layout;
  }
}

/**
 * Builder for creating mobile slides with fluent API
 */
export class MobileSlideBuilder {
  private layout: MobileLayout;

  constructor(base?: MobileLayout) {
    this.layout = base ? cloneMobileLayout(base) : this.createDefault();
  }

  private createDefault(): MobileLayout {
    return {
      heroDesktop: {
        src: "",
        alt: "Hero Banner",
        width: 1920,
        height: 560,
        className: "w-full rounded-lg object-cover",
        sizes: "100vw",
      },
      heroMobile: {
        src: "",
        alt: "Hero Banner Mobile",
        width: 750,
        height: 520,
        className: "w-full rounded-lg",
        sizes: "100vw",
      },
      secondaryPrimary: {
        src: "",
        alt: "Banner",
        width: 1200,
        height: 600,
        className: "h-full w-full rounded-b-[10px] rounded-t-[10px] object-cover",
        loading: "lazy",
        sizes: "(max-width: 768px) 100vw, 50vw",
      },
      secondaryTop: {
        src: "",
        alt: "Banner",
        width: 600,
        height: 600,
        className: "h-full w-full rounded-lg object-cover",
        loading: "lazy",
        sizes: "(max-width: 768px) 50vw, 50vw",
      },
      secondaryBottom: {
        src: "",
        alt: "Banner",
        width: 600,
        height: 600,
        className: "h-full w-full rounded-lg object-cover",
        loading: "lazy",
        sizes: "(max-width: 768px) 50vw, 50vw",
      },
    };
  }

  heroDesktop(config: Partial<BannerImageSpec>): this {
    this.layout.heroDesktop = { ...this.layout.heroDesktop, ...config };
    return this;
  }

  heroMobile(config: Partial<BannerImageSpec>): this {
    this.layout.heroMobile = { ...this.layout.heroMobile, ...config };
    return this;
  }

  secondaryPrimary(config: Partial<BannerImageSpec>): this {
    this.layout.secondaryPrimary = { ...this.layout.secondaryPrimary, ...config };
    return this;
  }

  secondaryTop(config: Partial<BannerImageSpec>): this {
    this.layout.secondaryTop = { ...this.layout.secondaryTop, ...config };
    return this;
  }

  secondaryBottom(config: Partial<BannerImageSpec>): this {
    this.layout.secondaryBottom = { ...this.layout.secondaryBottom, ...config };
    return this;
  }

  // Convenience methods
  withPriority(): this {
    this.layout.heroDesktop.priority = true;
    this.layout.heroMobile.priority = true;
    return this;
  }

  appendClassName(target: keyof MobileLayout, className: string): this {
    this.layout[target].className = `${this.layout[target].className} ${className}`;
    return this;
  }

  build(): MobileLayout {
    return this.layout;
  }
}
