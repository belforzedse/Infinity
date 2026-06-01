import Link from "next/link";
import Image from "next/image";
import type { CSSProperties } from "react";
import { Sparkle } from "lucide-react";
import ProductSmallCard, { type ProductSmallCardProps } from "@/components/Product/SmallCard";
import resolveAssetUrl from "@/utils/resolveAssetUrl";
import { getCategoryPlpHref } from "@/utils/plpRoutes";
import type { HomeBannerImageFit } from "@/types/super-admin/settings";

type FeaturedCategorySectionProps = {
  bannerImageUrl: string;
  categorySlug: string;
  products: ProductSmallCardProps[];
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaHref?: string;
  textColor?: string;
  textSize?: number;
  fontWeight?: string;
  bannerBackgroundColor?: string;
  bannerImageFit?: HomeBannerImageFit;
  bannerImagePosition?: string;
  desktopBannerHeight?: number;
  mobileBannerHeight?: number;
  previewMode?: "responsive" | "desktop" | "mobile";
};

export default function FeaturedCategorySection({
  bannerImageUrl,
  categorySlug,
  products,
  title,
  subtitle,
  ctaText,
  ctaHref,
  textColor = "#111827",
  textSize = 30,
  fontWeight = "500",
  bannerBackgroundColor = "#f1f5f9",
  bannerImageFit = "cover",
  bannerImagePosition = "center",
  desktopBannerHeight = 340,
  mobileBannerHeight = 260,
  previewMode = "responsive",
}: FeaturedCategorySectionProps) {
  const normalizedBannerImage = bannerImageUrl.trim();
  const normalizedCategorySlug = categorySlug.trim();

  if (!normalizedBannerImage || !normalizedCategorySlug || products.length === 0) {
    return null;
  }

  const categoryHref = ctaHref?.trim() || getCategoryPlpHref(normalizedCategorySlug);
  const heading = title?.trim() || "شاید بپسندید";
  const actionText = ctaText?.trim() || "مشاهده همه";
  const contentGridClass =
    previewMode === "desktop"
      ? "grid gap-4 grid-cols-[1.12fr_1.02fr] items-stretch"
      : previewMode === "mobile"
        ? "grid gap-3"
        : "grid gap-3 lg:grid-cols-[1.12fr_1.02fr] lg:items-stretch lg:gap-4";
  const bannerHeightClass =
    previewMode === "desktop"
      ? "h-[var(--featured-category-desktop-height)]"
      : previewMode === "mobile"
        ? "h-[var(--featured-category-mobile-height)]"
        : "h-[var(--featured-category-mobile-height)] lg:h-[var(--featured-category-desktop-height)]";
  const productGridClass =
    previewMode === "mobile" ? "grid content-start gap-3" : "grid content-start gap-3 sm:grid-cols-2";

  return (
    <div className="space-y-4 md:space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2
            className="text-foreground-primary flex items-center gap-2 leading-tight"
            style={{
              color: textColor,
              fontSize: `clamp(22px, ${textSize}px, 34px)`,
              fontWeight,
            }}
          >
            <Sparkle className="h-5 w-5 shrink-0 text-pink-600 md:h-6 md:w-6" aria-hidden />
            <span>{heading}</span>
          </h2>
          {subtitle?.trim() && (
            <p className="mt-1 max-w-xl text-sm leading-6 text-slate-500">{subtitle.trim()}</p>
          )}
        </div>
        <Link
          href={categoryHref}
          className="text-foreground-primary inline-flex shrink-0 items-center gap-1 text-sm transition-colors hover:text-pink-600 md:text-base"
        >
          <span>{actionText}</span>
          <span aria-hidden className="text-lg leading-none">
            ←
          </span>
        </Link>
      </div>

      <div className={contentGridClass}>
        <div className={productGridClass}>
          {products.map((product) => (
            <ProductSmallCard key={product.id} {...product} className="md:w-full lg:max-w-none" />
          ))}
        </div>
        <div
          className={`relative overflow-hidden rounded-2xl border border-slate-100 bg-slate-100 md:rounded-[22px] ${bannerHeightClass}`}
          style={
            {
              "--featured-category-desktop-height": `${desktopBannerHeight}px`,
              "--featured-category-mobile-height": `${mobileBannerHeight}px`,
              backgroundColor: bannerBackgroundColor,
            } as CSSProperties
          }
        >
          <Image
            src={resolveAssetUrl(normalizedBannerImage)}
            alt="Featured category banner"
            aria-label="Featured category banner"
            fill
            className="object-cover"
            style={{
              objectFit: bannerImageFit,
              objectPosition: bannerImagePosition,
            }}
            sizes="(max-width: 1024px) 100vw, 48vw"
            loading="lazy"
          />
        </div>
      </div>
    </div>
  );
}
