"use client";

import Image from "next/image";
import BackButtonToStore from "../BackButtonToStore";

const EmptyShoppingCart: React.FC = () => {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 lg:gap-6">
      <div className="relative mb-4 h-36 w-32 md:h-60 md:w-56 lg:mb-2">
        <Image
          src="/images/cart/empty-cart.png"
          alt="empty cart"
          fill
          className="object-fill"
        />
      </div>

      <span className="text-xl text-neutral-800 lg:text-3xl">
        سبد خرید شما خالی است
      </span>

      <BackButtonToStore isResponsive={false} />
    </div>
  );
};

export default EmptyShoppingCart;
