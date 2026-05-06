"use client";

import React from "react";
import MobileHamburgerMenu from "./MobileHamburgerMenu";
import ShoppingCartCounter from "../ShoppingCart/Counter";
import BackButtonToStore from "../BackButtonToStore";
import Logo from "../Kits/Logo";

const UserHeader: React.FC = () => {
  const [isStandalone, setIsStandalone] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== "undefined" && "matchMedia" in window) {
      const mq = window.matchMedia("(display-mode: standalone)");
      setIsStandalone(mq.matches);

      // Optional: listen for changes
      const handleChange = (e: MediaQueryListEvent) => {
        setIsStandalone(e.matches);
      };

      if (mq.addEventListener) {
        mq.addEventListener("change", handleChange);
        return () => mq.removeEventListener("change", handleChange);
      } else if (mq.addListener) {
        mq.addListener(handleChange);
        return () => mq.removeListener(handleChange);
      }
    }
  }, []);

  return (
    <>
      {/* Safe area white bar for standalone mode */}
      {isStandalone && (
        <div
          className="fixed top-0 left-0 right-0 z-[60] bg-white"
          style={{ height: "env(safe-area-inset-top)" }}
        />
      )}
      <header
        className="mb-6 flex w-full items-center justify-between bg-neutral-50 px-6 py-4 lg:mb-8 lg:rounded-2xl lg:px-10"
        style={{
          marginTop: isStandalone ? "env(safe-area-inset-top)" : "0",
        }}
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
    </>
  );
};

export default UserHeader;
