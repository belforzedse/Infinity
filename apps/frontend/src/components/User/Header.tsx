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

      <header
        className="fixed left-1/2 top-5 z-50 hidden min-h-[4.5rem] w-[calc(100%-2.5rem)] max-w-[1360px] -translate-x-1/2 items-center justify-between rounded-2xl border border-white/60 bg-white/55 px-6 py-3 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-white/35 lg:flex"
        dir="ltr"
      >
        <div className="relative z-10 flex w-48 items-center justify-start">
          <ShoppingCartCounter />
        </div>

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="pointer-events-auto">
            <StorefrontLogo width={92} height={58} />
          </div>
        </div>

        <div className="relative z-10 flex w-48 items-center justify-end">
          <BackButtonToStore />
        </div>
      </header>
      <div className="mb-8 hidden h-[4.5rem] lg:block" aria-hidden />
    </>
  );
};

export default UserHeader;
