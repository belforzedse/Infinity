"use client";

import React from "react";
import MobileHamburgerMenu from "./MobileHamburgerMenu";
import ShoppingCartCounter from "../ShoppingCart/Counter";
import BackButtonToStore from "../BackButtonToStore";
import { StorefrontLogo } from "@repo/brand";
import MobileBackButton from "@/components/MobileBackButton";
import { useMobileStickyHeader } from "@/hooks/useMobileStickyHeader";

const UserHeader: React.FC = () => {
  const [isStandalone, setIsStandalone] = React.useState(false);
  const { showHeader } = useMobileStickyHeader({ breakpointPx: 1024 });

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
          className="fixed left-0 right-0 top-0 z-[60] bg-white"
          style={{ height: "env(safe-area-inset-top)" }}
        />
      )}
      <header
        className={`fixed left-5 right-5 z-50 transform transition-all duration-200 lg:hidden ${
          showHeader ? "translate-y-0" : "-translate-y-[calc(100%+1rem)]"
        }`}
        style={{
          top: isStandalone ? "calc(env(safe-area-inset-top) + 0.75rem)" : "0.75rem",
        }}
      >
        <div
          className="relative flex min-h-[4.5rem] items-center justify-between rounded-2xl border border-white/60 bg-white/55 px-4 py-3 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-white/35"
          dir="ltr"
        >
          <div className="relative z-10 flex w-28 items-center justify-start">
            <ShoppingCartCounter />
          </div>

          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="pointer-events-auto">
              <StorefrontLogo width={92} height={58} />
            </div>
          </div>

          <div className="relative z-10 flex w-28 items-center justify-end gap-2">
            <MobileBackButton />
            <MobileHamburgerMenu />
          </div>
        </div>
      </header>
      <div className="mb-6 h-[4.5rem] lg:hidden" aria-hidden />

      <header className="mb-8 hidden w-full items-center justify-between rounded-2xl bg-neutral-50 px-10 py-4 lg:flex">
      {/* Right side: Back to Store */}
      <div className="flex">
        <BackButtonToStore />
      </div>

      {/* Center: Logo */}
      <div className="relative h-10 w-28 flex-shrink-0 -translate-y-4 md:h-12 md:w-36">
        <StorefrontLogo />
      </div>

      {/* Left side: Desktop Cart */}
      <div className="flex items-center gap-3">
        <ShoppingCartCounter />
      </div>
    </header>
    </>
  );
};

export default UserHeader;
