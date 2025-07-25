"use client";

import Image from "next/image";
import BackButtonToStore from "../BackButtonToStore";

const EmptyShoppingCart: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center lg:gap-6 gap-3 w-full h-full">
      <div className="relative md:w-56 md:h-60 w-32 h-36 lg:mb-2 mb-4">
        <Image
          src="/images/cart/empty-cart.png"
          alt="empty cart"
          fill
          className="object-fill"
        />
      </div>

      <span className="lg:text-3xl text-xl text-neutral-800">
        سبد خرید شما خالی است
      </span>

      <BackButtonToStore isResponsive={false} />
    </div>
  );
};

export default EmptyShoppingCart;
