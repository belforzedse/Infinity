import BlurImage from "@/components/ui/BlurImage";
import { priceFormatter } from "@/utils/price";

interface ShareModalProductPreviewProps {
  title: string;
  imageUrl?: string;
  variantLabel?: string;
  displayPrice?: number;
  originalPrice?: number;
  hasDiscount: boolean;
  shareUrl: string;
  onOpenLink: () => void;
}

export default function ShareModalProductPreview({
  title,
  imageUrl,
  variantLabel,
  displayPrice,
  originalPrice,
  hasDiscount,
  shareUrl,
  onOpenLink,
}: ShareModalProductPreviewProps): React.JSX.Element {
  return (
    <div className="mb-5 flex items-center gap-3 rounded-2xl bg-neutral-50 p-3 ring-1 ring-black/5">
      <div className="relative h-14 w-14 overflow-hidden rounded-xl bg-white ring-1 ring-black/5">
        {imageUrl ? (
          <BlurImage
            src={imageUrl}
            alt={title}
            fill
            sizes="56px"
            className="object-cover"
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-xs font-semibold text-gray-500">
            {title?.slice?.(0, 1) ?? "—"}
          </div>
        )}

        {hasDiscount && (
          <span className="absolute left-1 top-1 rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-bold text-white">
            تخفیف
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-gray-900">{title}</p>

        {variantLabel?.trim() && (
          <p className="mt-0.5 truncate text-xs text-gray-600">
            {variantLabel.trim()}
          </p>
        )}

        {typeof displayPrice === "number" && (
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <p className="text-xs font-semibold text-gray-800">
              {priceFormatter(displayPrice)} تومان
            </p>
            {hasDiscount && typeof originalPrice === "number" && (
              <p className="text-xs text-gray-500 line-through">
                {priceFormatter(originalPrice)} تومان
              </p>
            )}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onOpenLink}
        disabled={!shareUrl}
        className="h-10 shrink-0 rounded-xl bg-white px-3 text-xs font-semibold text-gray-700 ring-1 ring-black/10 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        باز کردن
      </button>
    </div>
  );
}
