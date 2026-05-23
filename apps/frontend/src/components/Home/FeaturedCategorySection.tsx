import Link from "next/link";
import { Sparkle } from "lucide-react";
import ProductSmallCard, { type ProductSmallCardProps } from "@/components/Product/SmallCard";
import resolveAssetUrl from "@/utils/resolveAssetUrl";
import { getCategoryPlpHref } from "@/utils/plpRoutes";

type FeaturedCategorySectionProps = {
  bannerImageUrl: string;
  categorySlug: string;
  products: ProductSmallCardProps[];
};

export default function FeaturedCategorySection({
  bannerImageUrl,
  categorySlug,
  products,
}: FeaturedCategorySectionProps) {
  const normalizedBannerImage = bannerImageUrl.trim();
  const normalizedCategorySlug = categorySlug.trim();

  if (!normalizedBannerImage || !normalizedCategorySlug || products.length === 0) {
    return null;
  }

  const categoryHref = getCategoryPlpHref(normalizedCategorySlug);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-foreground-primary flex items-center gap-2 text-2xl md:text-3xl">
          <Sparkle className="h-6 w-6 text-pink-600" aria-hidden />
          <span>شاید بپسندید</span>
        </h2>
        <Link
          href={categoryHref}
          className="text-foreground-primary inline-flex items-center gap-1 text-sm transition-colors hover:text-pink-600 md:text-base"
        >
          <span>مشاهده همه</span>
          <span aria-hidden className="text-lg">
            ←
          </span>
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.10fr_1.25fr] lg:items-stretch">
        <div className="grid content-start gap-3 sm:grid-cols-2 lg:grid-cols-2">
          {products.map((product) => (
            <ProductSmallCard key={product.id} {...product} className="md:w-full lg:max-w-none" />
          ))}
        </div>
        <div
          className="h-[280px] overflow-hidden rounded-[32px] border border-slate-100 bg-slate-100 sm:h-[360px] lg:h-full"
          style={{
            backgroundImage: `url(${resolveAssetUrl(normalizedBannerImage)})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
          aria-label="Featured category banner"
        />
      </div>
    </div>
  );
}
