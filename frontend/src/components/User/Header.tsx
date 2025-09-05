"use client";

import React from "react";
import Image from "next/image";
import MobileHamburgerMenu from "./MobileHamburgerMenu";
import ShoppingCartCounter from "../ShoppingCart/Counter";
import BackButtonToStore from "../BackButtonToStore";

const UserHeader: React.FC = () => {
  return (
    <header className="mb-3 flex w-full flex-row-reverse items-center justify-between rounded-2xl bg-[#F5F5F4] px-3 lg:mb-8 lg:flex-row lg:px-10 lg:py-2">
      <BackButtonToStore />

      <div className="relative h-[65px] w-[76px] md:h-[47px] md:w-[104px]">
        <Image
          src="/images/full-logo.png"
          alt="Logo"
          fill
          className="object-contain"
          priority
          sizes="(max-width: 768px) 76px, 104px"
        />
      </div>

      <ShoppingCartCounter />

      <MobileHamburgerMenu />
    </header>
  );
};

export default UserHeader;
