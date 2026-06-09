import Link from "next/link";
import ProductCard, { type ProductCardProps } from "@/components/Product/Card";
import { StorefrontGrid } from "@/components/storefront";
import ArrowLeftIcon from "./Icons/ArrowLeftIcon";

type Props = {
  icon: React.ReactNode;
  title: string;
  products: ProductCardProps[];
  hideBottomViewMore?: boolean;
};

function getPlpHref(title: string): string {
  if (title.includes("ØªØ®ÙÛŒÙ")) {
    return "/plp?hasDiscount=true";
  }
  if (title.includes("Ø¬Ø¯ÛŒØ¯")) {
    return "/plp?sort=createdAt:desc";
  }
  if (title.includes("Ù…Ø­Ø¨ÙˆØ¨")) {
    return "/plp?sort=AverageRating:desc";
  }
  return "/plp";
}

export default function OffersListHomePageServerShell({
  icon,
  title,
  products,
  hideBottomViewMore = false,
}: Props) {
  const currentProducts = products.slice(0, 4);
  const plpHref = getPlpHref(title);

  return (
    <>
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .smooth-scroll {
          scroll-behavior: smooth;
          transition: scroll-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>
      <div className="flex min-w-0 flex-col gap-3" data-home-server-shell="true">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            {icon}
            <span className="text-foreground-primary text-2xl md:text-3xl">{title}</span>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={plpHref}
              className="hidden text-sm text-infinity-primary underline-offset-4 transition-colors hover:text-infinity-primary-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-infinity-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white md:block"
            >
              Ù…Ø´Ø§Ù‡Ø¯Ù‡ Ù‡Ù…Ù‡
            </Link>
          </div>
        </div>

        <div className="w-full overflow-hidden md:hidden">
          <div
            className="scrollbar-hide smooth-scroll flex snap-x snap-mandatory gap-1.5 overflow-x-auto scroll-smooth transition-transform duration-300 ease-out"
            style={{
              WebkitOverflowScrolling: "touch",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              width: "100%",
              maxWidth: "none",
            }}
          >
            {products.map((product, index) => (
              <div
                key={product.id}
                data-product-card-slide
                className="w-[calc(50%-0.1875rem)] shrink-0 snap-start transition-transform duration-200 ease-out"
                style={{
                  animationDelay: `${index * 60}ms`,
                  animation: `fadeInUp 0.3s ease-out forwards ${index * 60}ms`,
                }}
              >
                <ProductCard {...product} />
              </div>
            ))}
          </div>

          {!hideBottomViewMore && products.length > 5 && (
            <div className="mt-4 flex items-center justify-center">
              <Link
                href={plpHref}
                className="text-foreground-primary flex items-center gap-1 text-base underline-offset-4 transition-colors hover:text-infinity-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-infinity-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                <span>Ù…Ø´Ø§Ù‡Ø¯Ù‡ Ù‡Ù…Ù‡</span>
                <ArrowLeftIcon />
              </Link>
            </div>
          )}
        </div>

        <div className="hidden min-w-0 md:block">
          <StorefrontGrid variant="products" className="transition-all duration-300 ease-out">
            {currentProducts.map((product) => (
              <div
                key={product.id}
                className="min-w-0 transform transition-all duration-200 ease-out hover:-translate-y-1 hover:scale-[1.02]"
              >
                <ProductCard {...product} />
              </div>
            ))}
          </StorefrontGrid>
        </div>

        {!hideBottomViewMore && products.length > 5 && (
          <div className="mt-6 hidden items-center justify-center md:flex">
            <Link
              href={plpHref}
              className="pressable text-foreground-primary flex items-center gap-1 rounded-full border border-infinity-primary-lighter/40 px-4 py-2 text-base transition-colors hover:bg-infinity-primary-lighter/20 hover:text-infinity-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-infinity-primary focus-visible:ring-offset-2 focus-visible:ring-offset-white"
            >
              <span>Ù…Ø´Ø§Ù‡Ø¯Ù‡ Ù…Ø­ØµÙˆÙ„Ø§Øª Ø¨ÛŒØ´ØªØ±</span>
              <ArrowLeftIcon />
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
