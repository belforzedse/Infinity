import Image from "next/image";
import { faNum } from "@/utils/faNum";
import imageLoader from "@/utils/imageLoader";

interface QuickViewGalleryProps {
  images: string[];
  title: string;
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  onClose: () => void;
  hasDiscount?: boolean;
  discountPercent?: number;
}

export default function QuickViewGallery({
  images,
  title,
  selectedIndex,
  onSelectIndex,
  onClose,
  hasDiscount,
  discountPercent,
}: QuickViewGalleryProps) {
  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-3xl bg-neutral-50 ring-1 ring-black/5">
        {/* Top-right close (nice on mobile) */}
        <button
          type="button"
          onClick={onClose}
          aria-label="بستن"
          className="absolute right-3 top-3 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/80 ring-1 ring-black/10 backdrop-blur transition hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-infinity-primary"
        >
          <svg viewBox="0 0 20 20" className="h-5 w-5 text-gray-700" fill="currentColor" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M4.22 4.22a.75.75 0 011.06 0L10 8.94l4.72-4.72a.75.75 0 111.06 1.06L11.06 10l4.72 4.72a.75.75 0 11-1.06 1.06L10 11.06l-4.72 4.72a.75.75 0 11-1.06-1.06L8.94 10 4.22 5.28a.75.75 0 010-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </button>

        {/* Discount badge on image */}
        {hasDiscount && discountPercent && (
          <div className="absolute left-3 top-3 z-10 rounded-full bg-infinity-primary px-3 py-1 text-xs font-medium text-white shadow-sm">
            {faNum(discountPercent)}% تخفیف
          </div>
        )}

        {/* Main image */}
        <div className="relative aspect-square sm:aspect-[4/5]">
          {images.length > 0 ? (
            <Image
              src={images[Math.min(selectedIndex, images.length - 1)]}
              alt={title}
              fill
              className="object-contain p-3 sm:p-4"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
              loader={imageLoader}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-gray-400">
              <span>تصویر موجود نیست</span>
            </div>
          )}
        </div>
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {images.map((img, index) => {
            const active = selectedIndex === index;
            return (
              <button
                key={img + index}
                type="button"
                onClick={() => onSelectIndex(index)}
                className={[
                  "relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-2xl ring-1 transition",
                  active ? "ring-infinity-primary" : "ring-black/10 hover:ring-infinity-primary-lighter",
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-infinity-primary",
                ].join(" ")}
                aria-label={`تصویر ${faNum(index + 1)}`}
                aria-current={active ? "true" : "false"}
              >
                <Image
                  src={img}
                  alt={`${title} - تصویر ${faNum(index + 1)}`}
                  fill
                  className="object-cover"
                  sizes="64px"
                  loader={imageLoader}
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

