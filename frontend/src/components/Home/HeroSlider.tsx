"use client";

import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";

interface Slide {
  desktop: string;
  mobile: string;
  alt: string;
  sideTop: {
    desktop: string;
    mobile: string;
    alt: string;
  };
  sideBottom: {
    desktop: string;
    mobile: string;
    alt: string;
  };
}

const slides: Slide[] = [
  {
    desktop: "/images/index-img1-desktop.png",
    mobile: "/images/index-img1-mobile.png",
    alt: "Hero Banner 1",
    sideTop: {
      desktop: "/images/index-img3-desktop.png",
      mobile: "/images/index-img3-mobile.png",
      alt: "Side Top Banner 1",
    },
    sideBottom: {
      desktop: "/images/index-img4-desktop.png",
      mobile: "/images/index-img4-mobile.png",
      alt: "Side Bottom Banner 1",
    },
  },
  {
    desktop: "/images/index-img2-desktop.png",
    mobile: "/images/index-img2-mobile.png",
    alt: "Hero Banner 2",
    sideTop: {
      desktop: "/images/index-img3-desktop.png",
      mobile: "/images/index-img3-mobile.png",
      alt: "Side Top Banner 2",
    },
    sideBottom: {
      desktop: "/images/index-img4-desktop.png",
      mobile: "/images/index-img4-mobile.png",
      alt: "Side Bottom Banner 2",
    },
  },
];

export default function HeroSlider() {
  return (
    <Swiper
      slidesPerView={1}
      className="w-screen"
      breakpoints={{
        1024: { slidesPerView: 1 },
      }}
    >
      {slides.map((slide, index) => (
        <SwiperSlide key={index}>
          <div className="grid w-screen grid-cols-7 grid-rows-4">
            <div className="relative col-span-3 row-span-4">
              <Image
                src={slide.desktop}
                alt={slide.alt}
                width={1920}
                height={560}
                className="hidden h-full w-full object-cover md:block"
                priority={index === 0}
              />
              <Image
                src={slide.mobile}
                alt={slide.alt}
                width={750}
                height={520}
                className="h-full w-full object-cover md:hidden"
                priority={index === 0}
              />
            </div>
            <div className="relative col-span-4 col-start-4 row-span-2">
              <Image
                src={slide.sideTop.desktop}
                alt={slide.sideTop.alt}
                width={1096}
                height={270}
                className="hidden h-full w-full object-cover md:block"
                priority={index === 0}
              />
              <Image
                src={slide.sideTop.mobile}
                alt={slide.sideTop.alt}
                width={750}
                height={270}
                className="h-full w-full object-cover md:hidden"
                priority={index === 0}
              />
            </div>
            <div className="relative col-span-4 col-start-4 row-span-2 row-start-3">
              <Image
                src={slide.sideBottom.desktop}
                alt={slide.sideBottom.alt}
                width={1096}
                height={270}
                className="hidden h-full w-full object-cover md:block"
                priority={index === 0}
              />
              <Image
                src={slide.sideBottom.mobile}
                alt={slide.sideBottom.alt}
                width={750}
                height={270}
                className="h-full w-full object-cover md:hidden"
                priority={index === 0}
              />
            </div>
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  );
}
