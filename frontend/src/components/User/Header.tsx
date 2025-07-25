"use client";

import React from "react";
import Image from "next/image";
import MobileHamburgerMenu from "./MobileHamburgerMenu";
import ShoppingCartCounter from "../ShoppingCart/Counter";
import BackButtonToStore from "../BackButtonToStore";

const UserHeader: React.FC = () => {
  return (
    <header className="bg-[#F5F5F4] w-full flex lg:flex-row flex-row-reverse items-center justify-between rounded-2xl lg:px-10 px-3 lg:mb-8 mb-3 lg:py-2">
      <BackButtonToStore />

      <div className="w-[76px] md:w-[104px] h-[65px] md:h-[47px] relative">
        <Image
          src="/images/full-logo.png"
          alt="Logo"
          fill
          className="object-contain"
          priority
        />
      </div>

      <ShoppingCartCounter />

      <MobileHamburgerMenu />
    </header>
  );
};

export default UserHeader;
