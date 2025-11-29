"use client";

import React from "react";
import Image from "next/image";
import MobileHamburgerMenu from "./MobileHamburgerMenu";
import ShoppingCartCounter from "../ShoppingCart/Counter";
import BackButtonToStore from "../BackButtonToStore";
import Logo from "../Kits/Logo";

const UserHeader: React.FC = () => {
  return (
    <header 
      className="mb-6 flex w-full items-center justify-between bg-neutral-50 px-6 py-4 lg:mb-8 lg:rounded-2xl lg:px-10"
      style={{ paddingTop: "max(1rem, calc(1rem + env(safe-area-inset-top)))" }}
    >
      <div className="flex items-center gap-2 lg:hidden">
        <div className="lg:hidden">
          <MobileHamburgerMenu />
        </div>
        <ShoppingCartCounter />
      </div>
      {/* Right side: Back to Store */}
      <div className="hidden lg:flex">
        <BackButtonToStore />
      </div>

      {/* Center: Logo */}
      <div className="relative -translate-y-4 h-10 w-28 flex-shrink-0 md:h-12 md:w-36">
        <Logo />

      </div>
      <div className="lg:hidden">
        <BackButtonToStore />
      </div>
      {/* Left side: Desktop Cart */}
      <div className="hidden items-center gap-2 lg:flex lg:gap-3">
        <ShoppingCartCounter />
        <div className="lg:hidden">
          <MobileHamburgerMenu />
        </div>
      </div>
    </header>
  );
};

export default UserHeader;
