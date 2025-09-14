import React from "react";
// This page is now SSR (Server Component) by removing "use client"
import BannerImage from "./Banners/BannerImage";
import Link from "next/link";
import { MobileLayout } from "./types";

type Props = {
  layout: MobileLayout;
};

export default function MobileHero({ layout }: Props) {
  return (
    <>
      {/* Hero section with responsive images */}
      <div className="lg:hidden">
        <div className="hidden md:block">
          <BannerImage {...layout.heroDesktop} />
        </div>
        <div className="md:hidden">
          <BannerImage {...layout.heroMobile} />
        </div>

        {/* Secondary banners section */}
        <div className="mt-4 flex flex-col gap-2 md:flex-row md:gap-4">
          <div className="rounded-lg md:w-3/4">
            <Link href={layout.secondaryPrimary.href ?? "#"}>
              <BannerImage {...layout.secondaryPrimary} />
            </Link>
          </div>

          <div className="flex gap-2 md:w-1/2 md:flex-col md:gap-4">
            <div className="w-1/2 md:w-full">
              <Link href={layout.secondaryTop.href ?? "#"}>
                <BannerImage {...layout.secondaryTop} />
              </Link>
            </div>

            <div className="w-1/2 md:w-full">
              <Link href={layout.secondaryBottom.href ?? "#"}>
                <BannerImage {...layout.secondaryBottom} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
