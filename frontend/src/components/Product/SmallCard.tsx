import React from "react";
import Image from "next/image";
import Link from "next/link";
import GridIcon from "./Icons/GridIcon";
import MoreIcon from "./Icons/MoreIcon";
import HeartIcon from "./Icons/HeartIcon";
import clsx from "clsx";

export interface ProductSmallCardProps {
  id: number;
  title: string;
  category: string;
  likedCount: number;
  price: number;
  discountedPrice?: number;
  discount?: number;
  image: string;
  className?: string;
}

const ProductSmallCard: React.FC<ProductSmallCardProps> = ({
  id,
  title,
  category,
  likedCount,
  price,
  discountedPrice,
  discount,
  image,
  className,
}) => {
  return (
    <Link
      href={`/pdp/${id}`}
      className={clsx("w-full md:w-[269px]", className)}
    >
      <div className="flex flex-row gap-2 p-2 rounded-2xl border border-slate-200 bg-white md:w-full h-[116px]">
        <div className="relative w-24 h-[100px]">
          {discount && discount > 0 && (
            <div className="absolute top-0 left-0 bg-rose-600 text-white text-xs px-2 py-0.5  rounded-br-xl rounded-tl-xl z-10">
              ٪{discount}
            </div>
          )}
          <Image
            src={image}
            alt={title}
            fill
            className="object-cover rounded-xl"
          />
          <div className="absolute bottom-1 right-1 bg-stone-50 rounded-xl px-2 py-1 flex items-center gap-0.5 shadow-sm">
            <span className="text-xxs text-neutral-800">3+</span>
            <div className="relative w-4">
              <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-blue-600 to-blue-400 absolute left-0 top-1/2 -translate-y-1/2" />
              <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-pink-600 to-pink-400 absolute left-1.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>
        </div>

        <div className="flex flex-col flex-1 justify-between py-0.5">
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1">
              <GridIcon className="w-4 h-4 text-neutral-400" />
              <span className="text-xs text-neutral-400">{category}</span>
            </div>
            <div className="flex items-center justify-between">
              <button>
                <MoreIcon className="w-6 h-6 text-pink-500" />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-0.5">
            <h3 className="text-xs text-neutral-800 line-clamp-1">{title}</h3>
            <div className="flex items-center gap-0.5">
              <HeartIcon className="w-2 h-2 text-pink-600" />
              <span className="text-[10px] text-pink-600">
                {likedCount} نفر این محصول را پسندیدند!
              </span>
            </div>
          </div>

          <div className="bg-stone-100 rounded-lg px-3 py-1 md:p-1">
            <div className="flex justify-between md:justify-center">
              <div className="md:hidden text-xs text-neutral-500">قیمت</div>

              <div className="flex justify-end md:justify-center items-center gap-1">
                <span
                  className={`text-xs ${
                    discountedPrice ? "text-pink-600" : "text-neutral-800"
                  } font-medium`}
                >
                  {(discountedPrice || price)?.toLocaleString()} تومان
                </span>

                {discountedPrice && (
                  <span className="text-[10px] text-neutral-400 line-through">
                    {price?.toLocaleString()} تومان
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductSmallCard;
