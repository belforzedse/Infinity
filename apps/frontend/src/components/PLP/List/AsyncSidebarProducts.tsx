import { getHomepageSections } from "@/services/product/homepage";
import type { ProductCardProps } from "@/components/Product/Card";
import type { ProductSmallCardProps } from "@/components/Product/SmallCard";
import SidebarSuggestions from "./SidebarSuggestions";
import HeartIcon from "../Icons/HeartIcon";
import DiscountIcon from "../Icons/DiscountIcon";

function mapCardToSmallCard(products: ProductCardProps[]): ProductSmallCardProps[] {
  return products
    .filter((p) => p.isAvailable && p.images?.[0])
    .slice(0, 3)
    .map((p) => ({
      id: p.id,
      slug: p.slug,
      title: p.title,
      category: p.category,
      likedCount: p.seenCount ?? 0,
      price: p.price,
      discountedPrice: p.discountPrice,
      discount: p.discount,
      image: p.images?.[0] ?? "",
      isAvailable: p.isAvailable,
      colorsCount: p.colorsCount,
      colorCodes: p.colorCodes,
    }));
}

/**
 * Async server component: fetches sidebar sections (discounted + favorites) so the main PLP content is not blocked.
 * Rendered inside a Suspense boundary on the PLP page.
 */
export default async function AsyncSidebarProducts() {
  const { discounted, favorites } = await getHomepageSections();
  const mappedDiscounted = mapCardToSmallCard(discounted);
  const mappedSuggested = mapCardToSmallCard(favorites);

  return (
    <>
      <SidebarSuggestions
        title="شاید بپسندید"
        icon={<HeartIcon />}
        items={mappedSuggested}
      />
      <SidebarSuggestions
        title="تخفیف های آخرماه"
        icon={<DiscountIcon />}
        items={mappedDiscounted}
      />
    </>
  );
}
