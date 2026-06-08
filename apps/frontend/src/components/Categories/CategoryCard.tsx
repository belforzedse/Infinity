import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ProductCategorySummary } from "@/services/product/categories";
import { CATEGORY_IMAGE_PLACEHOLDER } from "@/constants/placeholders";
import { getCategoryPlpHref } from "@/utils/plpRoutes";

export type CategoryCardCategory = Pick<
  ProductCategorySummary,
  "slug" | "name" | "imageUrl" | "imageAlt"
>;

export type CategoryCardSize = "carousel" | "compact";

export interface CategoryCardProps {
  category: CategoryCardCategory;
  size?: CategoryCardSize;
  className?: string;
  onClick?: () => void;
}

const isLocalImageUrl = (src: string) =>
  src.startsWith("http://localhost") ||
  src.startsWith("https://localhost") ||
  src.startsWith("http://127.0.0.1") ||
  src.startsWith("https://127.0.0.1") ||
  src.startsWith("http://[::1]") ||
  src.startsWith("https://[::1]");

const mobileCircleSize: Record<CategoryCardSize, { circle: string; label: string; imageSizes: string }> =
  {
    carousel: {
      circle: "h-[88px] w-[88px] sm:h-24 sm:w-24",
      label: "mt-2 text-sm font-medium text-foreground-primary",
      imageSizes: "(max-width: 640px) 88px, 96px",
    },
    compact: {
      circle: "h-20 w-20",
      label: "mt-1.5 text-xs font-medium text-foreground-primary",
      imageSizes: "80px",
    },
  };

function MobileCategoryCircle({
  imageSrc,
  imageAlt,
  label,
  size,
  useUnoptimizedImage,
}: {
  imageSrc: string;
  imageAlt: string;
  label: string;
  size: CategoryCardSize;
  useUnoptimizedImage: boolean;
}) {
  const tokens = mobileCircleSize[size];

  return (
    <div className={cn("flex flex-col items-center", size === "carousel" && "lg:hidden")}>
      <div
        className={cn(
          "relative flex-shrink-0 overflow-hidden rounded-full bg-slate-100",
          tokens.circle,
        )}
      >
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          unoptimized={useUnoptimizedImage}
          className="object-cover"
          loading="lazy"
          sizes={tokens.imageSizes}
        />
      </div>
      <span className={cn("text-center", tokens.label)}>{label}</span>
    </div>
  );
}

function DesktopCategoryPortrait({
  imageSrc,
  imageAlt,
  label,
  useUnoptimizedImage,
}: {
  imageSrc: string;
  imageAlt: string;
  label: string;
  useUnoptimizedImage: boolean;
}) {
  return (
    <div className="hidden w-full lg:block">
      <div className="relative aspect-[227/310] w-full overflow-hidden rounded-3xl">
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          unoptimized={useUnoptimizedImage}
          className="object-cover"
          loading="lazy"
          sizes="(min-width: 1280px) calc(100vw/6), (min-width: 900px) calc(100vw/5), (min-width: 768px) calc(100vw/4), calc(100vw/3)"
        />
        <div
          className="absolute inset-x-0 bottom-0 flex items-end justify-center px-4 pb-4 pt-8 backdrop-blur-md"
          style={{
            background:
              "linear-gradient(0deg, rgba(83, 52, 32, 1) 0%, rgba(214, 179, 142, 0) 100%)",
          }}
        >
          <span className="w-full text-center text-xl font-normal text-white">{label}</span>
        </div>
      </div>
    </div>
  );
}

export default function CategoryCard({
  category,
  size = "carousel",
  className,
  onClick,
}: CategoryCardProps) {
  const imageSrc = category.imageUrl || CATEGORY_IMAGE_PLACEHOLDER;
  const label = category.name || category.slug;
  const useUnoptimizedImage = isLocalImageUrl(imageSrc);
  const imageAlt = category.imageAlt || label;
  const showDesktopPortrait = size === "carousel";

  return (
    <Link
      href={getCategoryPlpHref(category.slug)}
      onClick={onClick}
      className={cn(
        "group flex w-full flex-col items-center text-center transition-transform duration-300 hover:-translate-y-0.5",
        className,
      )}
      aria-label={label}
    >
      <MobileCategoryCircle
        imageSrc={imageSrc}
        imageAlt={imageAlt}
        label={label}
        size={size}
        useUnoptimizedImage={useUnoptimizedImage}
      />
      {showDesktopPortrait && (
        <DesktopCategoryPortrait
          imageSrc={imageSrc}
          imageAlt={imageAlt}
          label={label}
          useUnoptimizedImage={useUnoptimizedImage}
        />
      )}
    </Link>
  );
}
