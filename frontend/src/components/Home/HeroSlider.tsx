'use client';

import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';

interface Slide {
  desktop: string;
  mobile: string;
  alt: string;
}

const slides: Slide[] = [
  {
    desktop: '/images/index-img1-desktop.png',
    mobile: '/images/index-img1-mobile.png',
    alt: 'Hero Banner 1',
  },
  {
    desktop: '/images/index-img2-desktop.png',
    mobile: '/images/index-img2-mobile.png',
    alt: 'Hero Banner 2',
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
          <div>
            <Image
              src={slide.desktop}
              alt={slide.alt}
              width={1920}
              height={560}
              className="hidden w-screen object-cover md:block"
              priority={index === 0}
            />
            <Image
              src={slide.mobile}
              alt={slide.alt}
              width={750}
              height={520}
              className="w-screen md:hidden"
              priority={index === 0}
            />
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  );
}

