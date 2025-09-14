import React from "react";
// This page is now SSR (Server Component) by removing "use client"
import BannerImage from "./Banners/BannerImage";
import Link from "next/link";

export default function MobileHero() {
  return (
    <>
      {/* Hero section with responsive images */}
      <div className="lg:hidden">
        <div className="hidden md:block">
          <BannerImage
            src="/images/index-img1-desktop.png"
            alt="Hero Banner"
            width={1920}
            height={560}
            className="w-full rounded-lg object-cover"
            priority
            sizes="100vw"
          />
        </div>
        <div className="md:hidden">
          <BannerImage
            src="/images/index-img1-mobile.png"
            alt="Hero Banner Mobile"
            width={750}
            height={520}
            className="w-full rounded-lg"
            priority
            sizes="100vw"
          />
        </div>

        {/* Secondary banners section */}
        <div className="mt-4 flex flex-col gap-2 md:flex-row md:gap-4">
          <div className="rounded-lg md:w-3/4">
            <Link href={`/plp?category=shirt`}>
              <BannerImage
                src="/images/index-img2-mobile.png"
                alt="Banner"
                width={1200}
                height={600}
                className="h-full w-full rounded-b-[10px] rounded-t-[10px] object-cover"
                loading="lazy"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </Link>
          </div>

          <div className="flex gap-2 md:w-1/2 md:flex-col md:gap-4">
            <div className="w-1/2 md:w-full">
              <Link
                href={`/plp?category=%d9%be%d9%84%db%8c%d9%88%d8%b1-%d9%88-%d8%a8%d8%a7%d9%81%d8%aa`}
              >
                <BannerImage
                  src="/images/index-img3-desktop.png"
                  alt="Banner"
                  width={600}
                  height={600}
                  className="h-full w-full rounded-lg object-cover"
                  loading="lazy"
                  sizes="(max-width: 768px) 50vw, 50vw"
                />
              </Link>
            </div>

            <div className="w-1/2 md:w-full">
              <Link href={`/plp?category=skirt`}>
                <BannerImage
                  src="/images/index-img4-desktop.png"
                  alt="Banner"
                  width={600}
                  height={600}
                  className="h-full w-full rounded-lg object-cover"
                  loading="lazy"
                  sizes="(max-width: 768px) 50vw, 50vw"
                />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
