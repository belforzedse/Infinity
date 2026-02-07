import Link from "next/link";
import resolveAssetUrl from "@/utils/resolveAssetUrl";

export type HomePromoBanner = {
  id: string;
  imageUrl: string;
  title: string;
  titleColor?: string;
  buttonText?: string;
  buttonColor?: string;
  buttonHref?: string;
};

type HomePromoBannersProps = {
  banners: HomePromoBanner[];
};

const isBannerReady = (banner: HomePromoBanner) =>
  Boolean(banner.imageUrl?.trim()) && Boolean(banner.title?.trim());

export default function HomePromoBanners({ banners }: HomePromoBannersProps) {
  const visibleBanners = banners
    .filter(isBannerReady)
    .map((banner) => ({
      ...banner,
      imageUrl: resolveAssetUrl(banner.imageUrl.trim()),
      title: banner.title.trim(),
      titleColor: banner.titleColor?.trim() || "#ffffff",
      buttonText: banner.buttonText?.trim(),
      buttonColor: banner.buttonColor?.trim() || "#111827",
      buttonHref: banner.buttonHref?.trim(),
    }));

  if (visibleBanners.length === 0) return null;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {visibleBanners.map((banner) => (
        <div
          key={banner.id}
          className="relative h-[452px] overflow-hidden rounded-[34px] bg-slate-100"
          style={{
            backgroundImage: `url(${banner.imageUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-black/5 to-transparent" />
          <div className="relative z-10 flex h-full flex-col items-center justify-start gap-4 px-6 pt-10 text-center md:pt-14">
            <h3
              className="text-3xl font-medium leading-tight md:text-[44px]"
              style={{ color: banner.titleColor }}
            >
              {banner.title}
            </h3>

            {banner.buttonText &&
              (banner.buttonHref ? (
                <Link
                  href={banner.buttonHref}
                  className="inline-flex items-center text-sm font-medium transition hover:opacity-80 md:text-lg"
                  style={{
                    color: banner.buttonColor,
                  }}
                >
                  {banner.buttonText}
                  <span className="ml-1 text-xl">←</span>
                </Link>
              ) : (
                <span
                  className="inline-flex items-center text-sm font-medium md:text-lg"
                  style={{
                    color: banner.buttonColor,
                  }}
                >
                  {banner.buttonText}
                </span>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
