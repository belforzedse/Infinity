"use client";
import ProductCard, { type ProductCardProps } from "@/components/Product/Card";
import PDPHeroNavigationButtons from "./NavigationButtons";
import { useRef, useState } from "react";
import ProductSmallCard from "../Product/SmallCard";
import ArrowLeftIcon from "./Icons/ArrowLeftIcon";

type Props = {
  icon: React.ReactNode;
  title: string;
  products: ProductCardProps[];
};

export default function PDPOffersList(props: Props) {
  const { icon, title, products } = props;

  const [isShowAllProducts, setIsShowAllProducts] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  function goToNextProduct() {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        left: scrollRef.current.scrollLeft + 400,
        behavior: "smooth",
      });
    }
  }

  function goToPreviousProduct() {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        left: scrollRef.current.scrollLeft - 400,
        behavior: "smooth",
      });
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {icon}
          <span className="text-3xl text-foreground-primary">{title}</span>
        </div>

        <div className="hidden md:block">
          <PDPHeroNavigationButtons
            goToNextImage={goToNextProduct}
            goToPreviousImage={goToPreviousProduct}
          />
        </div>
      </div>
      <div>
        <div ref={scrollRef} className="hidden gap-5 overflow-x-hidden md:flex">
          {products.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>

        <div
          ref={scrollRef}
          className="flex flex-col gap-5 overflow-x-hidden md:hidden"
        >
          {products
            .slice(0, isShowAllProducts ? products.length : 4)
            .map((product) => (
              <ProductSmallCard
                key={product.id}
                category={product.category}
                id={product.id}
                title={product.title}
                likedCount={product.seenCount}
                price={product.price}
                discountedPrice={product.discountPrice}
                image={product.images[0]}
                discount={product.discount}
              />
            ))}
        </div>

        {!isShowAllProducts && (
          <div className="mt-4 flex items-center justify-center md:hidden">
            <button
              className="text-base flex items-center gap-1 text-foreground-primary"
              onClick={() => setIsShowAllProducts(true)}
            >
              <span>مشاهده همه</span>
              <ArrowLeftIcon />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
