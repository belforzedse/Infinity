import { faNum } from "@/utils/faNum";

interface QuickViewPricingProps {
  price: number;
  discountPrice?: number | null;
  hasDiscount: boolean;
  onViewFullDetails: () => void;
  onClose: () => void;
}

export default function QuickViewPricing({
  price,
  discountPrice,
  hasDiscount,
  onViewFullDetails,
  onClose,
}: QuickViewPricingProps) {
  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-3xl bg-gray-50 p-4 ring-1 ring-black/5">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">قیمت</span>
          {hasDiscount && (
            <span className="text-xs text-gray-500">
              قبل: <span className="line-through">{faNum(price)} تومان</span>
            </span>
          )}
        </div>

        <div className="mt-2 flex items-end justify-between gap-3">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-gray-900 sm:text-3xl">
              {faNum(hasDiscount && discountPrice ? discountPrice : price)}
            </span>
            <span className="text-sm text-gray-500">تومان</span>
          </div>

          {hasDiscount && discountPrice && (
            <span className="rounded-full bg-white px-3 py-1 text-sm text-rose-700 ring-1 ring-rose-200">
              صرفه‌جویی: {faNum(price - discountPrice)} تومان
            </span>
          )}
        </div>
      </div>

      {/* Actions (sticky on mobile) */}
      <div className="sticky bottom-0 -mx-4 mt-auto border-t border-black/5 bg-white/80 p-4 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onViewFullDetails}
            className="flex-1 rounded-2xl bg-pink-500 px-5 py-3 text-sm font-medium text-white shadow-sm transition hover:bg-pink-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:ring-offset-2"
          >
            مشاهده جزئیات کامل
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-2xl bg-white px-5 py-3 text-sm font-medium text-gray-700 ring-1 ring-black/10 transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-300 focus-visible:ring-offset-2"
          >
            بستن
          </button>
        </div>
      </div>
    </div>
  );
}

