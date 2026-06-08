import Link from "next/link";
import Image from "next/image";
import resolveAssetUrl from "@/utils/resolveAssetUrl";
import type {
  HomeBannerImageFit,
  HomePromoContentPosition,
  HomePromoTextAlign,
} from "@/types/super-admin/settings";

export type HomePromoBanner = {
  id: string;
  imageUrl: string;
  title?: string;
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

export default function HomePromoBanners({ banners }: HomePromoBannersProps) {
  const visibleBanners = banners.filter((b) => Boolean(b.imageUrl?.trim()));
  if (visibleBanners.length === 0) return null;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {visibleBanners.map((banner) => {
        const resolvedUrl = resolveAssetUrl(banner.imageUrl.trim());
        const link = banner.buttonHref?.trim();

        const imageEl = (
          <div className="relative aspect-[670/452] w-full max-w-[670px] overflow-hidden rounded-2xl">
            <Image
              src={resolvedUrl}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 670px"
              loading="lazy"
            />
          </div>
        );

        return (
          <div key={banner.id}>
            {link ? (
              <Link href={link} className="block">
                {imageEl}
              </Link>
            ) : (
              imageEl
            )}
          </div>
        );
      })}
    </div>
  );
}
