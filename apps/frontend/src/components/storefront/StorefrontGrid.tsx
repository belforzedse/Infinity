import { cn } from "@/lib/utils";
import type { HTMLAttributes, ReactNode } from "react";

type StorefrontGridVariant = "products" | "plp" | "categories" | "cards";

type StorefrontGridProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  variant?: StorefrontGridVariant;
};

const variantClasses: Record<StorefrontGridVariant, string> = {
  /** Homepage / full-width product rails */
  products:
    "grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-2 sm:gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-3 xl:grid-cols-4",
  /** PLP main column (280px sidebar on md+) */
  plp: "grid min-w-0 grid-cols-2 gap-2 md:grid-cols-2 md:gap-4 lg:grid-cols-2 xl:grid-cols-3",
  categories:
    "grid min-w-0 grid-cols-3 gap-4 md:grid-cols-4 min-[900px]:grid-cols-5 xl:grid-cols-6",
  cards: "grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3",
};

export function StorefrontGrid({
  children,
  className,
  variant = "cards",
  ...props
}: StorefrontGridProps) {
  return (
    <div className={cn(variantClasses[variant], className)} {...props}>
      {children}
    </div>
  );
}
