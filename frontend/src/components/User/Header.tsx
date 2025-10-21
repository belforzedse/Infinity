"use client";

import React from "react";
import Image from "next/image";
import MobileHamburgerMenu from "./MobileHamburgerMenu";
import ShoppingCartCounter from "../ShoppingCart/Counter";
import BackButtonToStore from "../BackButtonToStore";

const UserHeader: React.FC = () => {
  return (
    <header className="mb-6 flex w-full items-center justify-between bg-neutral-50 px-6 py-4 lg:mb-8 lg:rounded-2xl lg:px-10">
      {/* Right side: Back to Store */}
      <BackButtonToStore />

      {/* Center: Logo */}
      <div className="relative h-10 w-28 flex-shrink-0 md:h-12 md:w-36">
        <Image
          src="/images/full-logo.png"
          alt="Logo"
          fill
          className="object-contain"
          priority
          sizes="(max-width: 768px) 112px, 144px"
        />
      </div>

      {/* Left side: Cart */}
      <div className="flex items-center">
        <ShoppingCartCounter />
        <div className="lg:hidden">
          <MobileHamburgerMenu />
        </div>
      </div>
    </header>
  );
};

export default UserHeader;
