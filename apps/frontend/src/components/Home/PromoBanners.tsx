import Link from "next/link";
import Image from "next/image";
import type { CSSProperties } from "react";
import resolveAssetUrl from "@/utils/resolveAssetUrl";
import type {
  HomeBannerImageFit,
  HomePromoContentPosition,
  HomePromoTextAlign,
} from "@/types/super-admin/settings";

export type HomePromoBanner = {
  id: string;
  imageUrl: string;
  title: string;
  titleColor?: string;
  buttonText?: string;
  buttonColor?: string;
  buttonHref?: string;
  subtitle?: string;
  subtitleColor?: string;
  backgroundColor?: string;
  textSize?: number;
  fontWeight?: string;
  textAlign?: HomePromoTextAlign;
  contentPosition?: HomePromoContentPosition;
  imageFit?: HomeBannerImageFit;
  imagePosition?: string;
  desktopHeight?: number;
  mobileHeight?: number;
};

type HomePromoBannersProps = {
  banners: HomePromoBanner[];
  previewMode?: "responsive" | "desktop" | "mobile";
};

const isBannerReady = (banner: HomePromoBanner) =>
  Boolean(banner.imageUrl?.trim()) && Boolean(banner.title?.trim());

const contentPositionClass: Record<HomePromoContentPosition, string> = {
  top: "justify-start pt-7 md:pt-8",
  center: "justify-center",
  bottom: "justify-end pb-7 md:pb-8",
};

const textAlignClass: Record<HomePromoTextAlign, string> = {
  right: "items-start text-right",
  center: "items-center text-center",
  left: "items-end text-left",
};

export default function HomePromoBanners({
  banners,
  previewMode = "responsive",
}: HomePromoBannersProps) {
  const visibleBanners = banners
    .filter(isBannerReady)
    .map((banner) => ({
      ...banner,
      imageUrl: resolveAssetUrl(banner.imageUrl.trim()),
      title: banner.title.trim(),
      titleColor: banner.titleColor?.trim() || "#ffffff",
      subtitle: banner.subtitle?.trim(),
      subtitleColor: banner.subtitleColor?.trim() || banner.titleColor?.trim() || "#ffffff",
      buttonText: banner.buttonText?.trim(),
      buttonColor: banner.buttonColor?.trim() || "#111827",
      buttonHref: banner.buttonHref?.trim(),
      backgroundColor: banner.backgroundColor?.trim() || "#f1f5f9",
      textSize: banner.textSize || 30,
      fontWeight: banner.fontWeight?.trim() || "500",
      textAlign: banner.textAlign || "right",
      contentPosition: banner.contentPosition || "top",
      imageFit: banner.imageFit || "cover",
      imagePosition: banner.imagePosition?.trim() || "center",
      desktopHeight: banner.desktopHeight || 220,
      mobileHeight: banner.mobileHeight || 220,
    }));

  if (visibleBanners.length === 0) return null;

  const gridClass =
    previewMode === "desktop"
      ? "grid gap-4 grid-cols-2"
      : previewMode === "mobile"
        ? "grid gap-3 grid-cols-1"
        : "grid gap-3 md:grid-cols-2 md:gap-4";
  const cardHeightClass =
    previewMode === "desktop"
      ? "h-[var(--home-banner-desktop-height)]"
      : previewMode === "mobile"
        ? "h-[var(--home-banner-mobile-height)]"
        : "h-[var(--home-banner-mobile-height)] md:h-[var(--home-banner-desktop-height)]";

  return (
    <div className={gridClass}>
      {visibleBanners.map((banner) => (
        <div
          key={banner.id}
          className={`relative overflow-hidden rounded-2xl bg-slate-100 md:rounded-[22px] ${cardHeightClass}`}
          style={
            {
              "--home-banner-desktop-height": `${banner.desktopHeight}px`,
              "--home-banner-mobile-height": `${banner.mobileHeight}px`,
              backgroundColor: banner.backgroundColor,
            } as CSSProperties
          }
        >
          <Image
            src={banner.imageUrl}
            alt={banner.title}
            fill
            className="object-cover"
            style={{
              objectFit: banner.imageFit,
              objectPosition: banner.imagePosition,
            }}
            sizes="(max-width: 768px) 100vw, 50vw"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-black/20 via-black/5 to-transparent" />
          <div
            className={`relative z-10 flex h-full flex-col gap-2 px-5 md:px-7 ${contentPositionClass[banner.contentPosition]} ${textAlignClass[banner.textAlign]}`}
          >
            <h3
              className="max-w-[78%] leading-tight"
              style={{
                color: banner.titleColor,
                fontSize: `clamp(22px, ${banner.textSize}px, 40px)`,
                fontWeight: banner.fontWeight,
              }}
            >
              {banner.title}
            </h3>

            {banner.subtitle && (
              <p
                className="max-w-[70%] text-xs leading-6 md:text-sm"
                style={{ color: banner.subtitleColor }}
              >
                {banner.subtitle}
              </p>
            )}

            {banner.buttonText && banner.buttonHref && (
              <Link
                href={banner.buttonHref}
                className="inline-flex items-center gap-1 text-xs font-medium transition hover:opacity-80 md:text-sm"
                style={{
                  color: banner.buttonColor,
                }}
              >
                {banner.buttonText}
                <span aria-hidden className="text-lg leading-none">
                  ←
                </span>
              </Link>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
