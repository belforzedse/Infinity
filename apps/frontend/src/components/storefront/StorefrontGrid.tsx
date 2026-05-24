import { cn } from "@/lib/utils";
import type { HTMLAttributes, ReactNode } from "react";

type StorefrontGridVariant = "products" | "categories" | "cards";

type StorefrontGridProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  variant?: StorefrontGridVariant;
};

const variantClasses: Record<StorefrontGridVariant, string> = {
  products: "grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4",
  categories: "grid grid-cols-3 gap-4 md:grid-cols-5 lg:grid-cols-6",
  cards: "grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3",
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
