"use client";

import { useEffect, useState } from "react";
import DiscountIcon from "../../Icons/DiscountIcon";
import Image from "next/image";
import imageLoader from "@/utils/imageLoader";
import GridIcon from "@/components/Product/Icons/GridIcon";
import LookBasketIcon from "../../Icons/LookBasketIcon";

type Props = {
  endOfferDate: Date;
  imageSrc: string;
  category: string;
  title: string;
  discount: number;
  discountPrice: number;
  price: number;
};

export default function PDPCommentAddSpecialOffer(props: Props) {
  const { endOfferDate, imageSrc, category, title, discount, discountPrice, price } = props;

  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = endOfferDate.getTime() - now;

      if (distance < 0) {
        clearInterval(timer);
        return;
      }

      const hours = Math.floor(distance / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(timer);
  }, [endOfferDate]);

  return (
    <div className="flex flex-col gap-3 bg-stone-50 rounded-3xl  p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-3xl text-actions-primary">تخفیف ویژه</span>

          <DiscountIcon />
        </div>

        <div className="flex flex-row-reverse items-center gap-1">
          {/* hours */}
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white">
            <span className="text-xs text-foreground-primary">
              {timeLeft.hours.toString().padStart(2, "0")}
            </span>
          </div>

          <span className="text-xs text-foreground-primary">:</span>

          {/* minutes */}
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white">
            <span className="text-xs text-foreground-primary">
              {timeLeft.minutes.toString().padStart(2, "0")}
            </span>
          </div>

          <span className="text-xs text-foreground-primary">:</span>

          {/* seconds */}
          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 bg-white">
            <span className="text-xs text-foreground-primary">
              {timeLeft.seconds.toString().padStart(2, "0")}
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="h-[79px] w-[82px] overflow-hidden rounded-xl">
          <Image width={82} height={79} src={imageSrc} alt="special offer" loader={imageLoader} />
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1">
            <GridIcon className="text-neutral-400" />
            <span className="text-xs text-neutral-400">{category}</span>
          </div>

          <span className="text-xl text-foreground-primary">{title}</span>
        </div>
      </div>

      <div className="h-[1px] w-full bg-slate-100" />

      <div className="flex flex-col gap-3">
        <div className="flex w-fit items-center justify-center self-end rounded-3xl bg-[#E11D48] px-3 py-2 text-[9px] !leading-5 text-white">
          <span>{discount}% تخفیف</span>
        </div>

        <div className="flex items-center gap-2 self-end">
          {discountPrice && (
            <span className="text-xl text-pink-600">
              {(discountPrice || price).toLocaleString("fa-IR")}تومان
            </span>
          )}

          <span
            className={`${
              discountPrice
                ? "text-sm text-foreground-muted line-through"
                : "text-xl text-neutral-700"
            }`}
          >
            {price.toLocaleString("fa-IR")}تومان
          </span>
        </div>

        <button
          className="flex h-[49px] w-full items-center justify-center gap-2 rounded-[12px] border border-slate-100 bg-white text-[16px] hover:bg-actions-primary hover:text-white font-medium text-[#DB2777] transition-all active:scale-[0.98]"
        >
          <LookBasketIcon />
          <span>مشاهده سبد خرید</span>
        </button>
      </div>
    </div>
  );
}
