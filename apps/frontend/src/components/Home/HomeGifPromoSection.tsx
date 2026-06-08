import ProductSmallCard from "@/components/Product/SmallCard";
import type { ProductCardProps } from "@/components/Product/Card";
import { cn } from "@/lib/utils";
import resolveAssetUrl from "@/utils/resolveAssetUrl";

export type HomeGifPromoSlot = {
  id: "slot-1" | "slot-2";
  imageUrl: string;
  products: ProductCardProps[];
};

type HomeGifPromoSectionProps = {
  slots: HomeGifPromoSlot[];
  className?: string;
};

function mapToSmallCard(product: ProductCardProps) {
  return {
    id: product.id,
    slug: product.slug,
    title: product.title,
    category: product.category,
    likedCount: product.seenCount || 0,
    price: product.price,
    discountedPrice: product.discountPrice,
    discount: product.discount,
    image: product.images.find((image) => image?.trim()) || "",
    isAvailable: product.isAvailable,
    colorsCount: product.colorsCount,
    colorCodes: product.colorCodes,
  };
}

function PromoSlot({ slot }: { slot: HomeGifPromoSlot }) {
  const imageUrl = slot.imageUrl.trim();
  const products = slot.products.slice(0, 4);
  if (!imageUrl || products.length === 0) return null;

  return (
    <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-[minmax(190px,42vw)_minmax(0,1fr)] lg:grid-cols-[329.5px_1fr]">
      {/* gif first → renders on the RIGHT in RTL */}
      <div className="relative min-h-[360px] w-full overflow-hidden rounded-[24px] bg-slate-100 sm:min-h-[480px] lg:h-[564px] lg:min-h-0">
        {/* eslint-disable-next-line @next/next/no-img-element -- GIF animation requires native img */}
        <img
          src={resolveAssetUrl(imageUrl)}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
        />
      </div>

      {/* products second → renders on the LEFT in RTL */}
      <div className="grid min-w-0 grid-cols-1 gap-3 xs:grid-cols-2 sm:grid-cols-1 lg:h-full lg:content-between lg:gap-0">
        {products.map((product) => (
          <ProductSmallCard key={product.id} {...mapToSmallCard(product)} />
        ))}
      </div>
    </div>
  );
}

export default function HomeGifPromoSection({
  slots,
  className,
}: HomeGifPromoSectionProps) {
  const readySlots = slots.filter((slot) => slot.imageUrl.trim() && slot.products.length > 0);
  if (readySlots.length === 0) return null;

  return (
    <section className={cn("w-full min-w-0 overflow-hidden", className)}>
      <div className="grid min-w-0 grid-cols-1 gap-2 xl:grid-cols-2">
        {readySlots.map((slot) => (
          <PromoSlot key={slot.id} slot={slot} />
        ))}
      </div>
    </section>
  );
}
