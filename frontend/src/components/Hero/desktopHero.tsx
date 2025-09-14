import React from "react";
import BannerImage from "./Banners/BannerImage";
import TextBanner from "./Banners/TextBanner";

export default function DesktopHero() {
  return (
    <>
      {/*Desktop hero section*/}
      <div className="hidden h-[650px] w-full lg:block">
        <div className="grid-cols-1 grid-rows-2">
          <div className="flex gap-10">
            <div className="h-full w-7/12 flex-none">
              <div className="mt-11 grid grid-cols-2 grid-rows-2 gap-4">
                <div className="col-span-2 row-span-1">
                  {/*Wide pinterest banner*/}
                  <TextBanner
                    title="لباس‌هایی از قلــــــب پینترست..."
                    subtitle="برای خاص پسندها"
                    className="h-[200px] w-full gap-[8px] rounded-3xl bg-stone-50 px-[36px] pb-[36px] pt-[30px]"
                    titleClassName="text-[54px] font-bold leading-[150%] text-red-900"
                    subtitleClassName="leading[110%] text-[34px] font-medium text-gray-600"
                  />
                </div>
                {/* the 2 banners below the wide banner */}
                <div className="col-span-1 col-start-1 row-span-1 row-start-2">
                  <BannerImage
                    src="/images/index-img3-desktop.png"
                    alt="Banner"
                    width={600}
                    height={600}
                    className="h-full w-full translate-y-[-2px] rounded-lg object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="col-span-1 col-start-2 row-span-1 row-start-2">
                  <BannerImage
                    src="/images/index-img4-desktop.png"
                    alt="Banner"
                    width={600}
                    height={600}
                    loading="lazy"
                    className="translate-y-[7px]"
                  />
                </div>
              </div>
            </div>
            {/* Side banner */}
            <div className="h-full w-4/12 flex-1">
              <BannerImage
                src="/images/index-img2-desktop.png"
                alt="Hero Banner Mobile"
                width={700}
                height={700}
                className="object-fit h-full rounded-lg"
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
