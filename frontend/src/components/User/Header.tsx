"use client";

import React from "react";
import Image from "next/image";
import MobileHamburgerMenu from "./MobileHamburgerMenu";
import ShoppingCartCounter from "../ShoppingCart/Counter";
import BackButtonToStore from "../BackButtonToStore";

const UserHeader: React.FC = () => {
  return (
    <header className="mb-4 flex w-full items-center justify-between bg-white px-4 py-3 shadow-sm lg:mb-6 lg:px-8 lg:py-4 rounded-lg">
      <div className="flex items-center gap-3">
        <MobileHamburgerMenu />
        <ShoppingCartCounter />
      </div>

      <div className="relative h-12 w-24 md:h-14 md:w-28 flex-shrink-0">
        <Image
          src="/images/cropped-02.png"
          alt="Logo"
          fill
          className="object-contain"
          priority
          sizes="(max-width: 768px) 96px, 112px"
        />
      </div>

      <BackButtonToStore />
    </header>
  );
};

export default UserHeader;
