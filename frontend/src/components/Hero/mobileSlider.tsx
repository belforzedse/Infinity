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
import MobileHero from "./mobileHero";

export default function MobileSlider() {
  return (
    <div className="mobile-slider-container">
      <Swiper
        modules={[Navigation, Pagination, Autoplay]}
        spaceBetween={10}
        slidesPerView={1}
        centeredSlides={true}
        autoplay={{
          delay: 3000,
          disableOnInteraction: false,
        }}
        pagination={{
          clickable: true,
          dynamicBullets: false,
          renderBullet: function (index, className) {
            return '<span class="' + className + ' custom-bullet"></span>';
          },
        }}
        navigation={true}
        loop={true}
        breakpoints={{
          640: {
            slidesPerView: 1,
            spaceBetween: 10,
          },
          768: {
            slidesPerView: 2,
            spaceBetween: 20,
          },
          1024: {
            slidesPerView: 3,
            spaceBetween: 30,
          },
        }}
        className="mobile-hero-swiper"
      >
        <SwiperSlide>
          <MobileHero />
        </SwiperSlide>
        <SwiperSlide>
          <MobileHero />
        </SwiperSlide>
        <SwiperSlide>
          <MobileHero />
        </SwiperSlide>
        <SwiperSlide>
          <MobileHero />
        </SwiperSlide>
        <SwiperSlide>
          <MobileHero />
        </SwiperSlide>
      </Swiper>

      <style jsx>{`
        .mobile-slider-container {
          width: 100%;
          height: auto;
          border-radius: 12px;
          overflow: hidden;
          margin-bottom: 20px;
        }

        .mobile-hero-swiper {
          width: 100%;
          height: 100%;
          padding-bottom: 50px; /* Space for pagination */
        }

        :global(.swiper-pagination) {
          bottom: 15px !important;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.8);
          border-radius: 20px;
          padding: 8px 16px;
          backdrop-filter: blur(10px);
          width: fit-content;
          left: 50%;
          transform: translateX(-50%);
        }

        :global(.swiper-pagination-bullet) {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #e5e7eb;
          opacity: 1;
          margin: 0 2px;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        :global(.swiper-pagination-bullet-active) {
          background: #ec4899;
          width: 24px;
          border-radius: 12px;
          transform: scale(1.2);
        }

        :global(.swiper-button-next),
        :global(.swiper-button-prev) {
          color: #ec4899;
          background: rgba(255, 255, 255, 0.9);
          border-radius: 50%;
          width: 32px;
          height: 32px;
          margin-top: -16px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
        }

        :global(.swiper-button-next:hover),
        :global(.swiper-button-prev:hover) {
          background: rgba(236, 72, 153, 0.1);
          transform: scale(1.1);
        }

        :global(.swiper-button-next:after),
        :global(.swiper-button-prev:after) {
          font-size: 14px;
          font-weight: bold;
        }

        @media (max-width: 768px) {
          :global(.swiper-button-next),
          :global(.swiper-button-prev) {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}
