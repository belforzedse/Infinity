"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
// Import Swiper styles
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import DesktopHero from "./desktopHero";

export default function DesktopSlider() {
  return (
    <div className="desktop-slider-container">
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        spaceBetween={30}
        slidesPerView={1}
        navigation
        pagination={{ clickable: true }}
        autoplay={{
          delay: 3000,
          disableOnInteraction: true,
        }}
        loop={true}
      >
        <SwiperSlide>
          <div className="slide-content">
            <DesktopHero />
          </div>
        </SwiperSlide>

        <SwiperSlide>
          <div className="slide-content">
            <DesktopHero />
          </div>
        </SwiperSlide>

        <SwiperSlide>
          <div className="slide-content">
            <DesktopHero />
          </div>
        </SwiperSlide>
      </Swiper>
    </div>
  );
}
