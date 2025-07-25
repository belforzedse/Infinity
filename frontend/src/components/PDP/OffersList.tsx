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
        <div className="flex gap-1 items-center">
          {icon}
          <span className="text-foreground-primary text-3xl">{title}</span>
        </div>

        <div className="hidden md:block">
          <PDPHeroNavigationButtons
            goToNextImage={goToNextProduct}
            goToPreviousImage={goToPreviousProduct}
          />
        </div>
      </div>
      <div>
        <div ref={scrollRef} className="gap-5 overflow-x-hidden hidden md:flex">
          {products.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>

        <div
          ref={scrollRef}
          className="gap-5 overflow-x-hidden md:hidden flex flex-col"
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
          <div className="flex items-center justify-center md:hidden mt-4">
            <button
              className="text-foreground-primary text-base flex items-center gap-1"
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
