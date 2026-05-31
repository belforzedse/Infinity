import { cn } from "@/lib/utils";
import type { HTMLAttributes, ReactNode } from "react";

export type StorefrontContainerProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  disablePadding?: boolean;
};

export const STOREFRONT_CONTAINER_CLASS =
  "mx-auto w-full max-w-[1280px] px-1 sm:px-5 lg:px-[60px]";

export function StorefrontContainer({
  children,
  className,
  disablePadding = false,
  ...props
}: StorefrontContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[1280px]",
        disablePadding ? null : "px-1 sm:px-5 lg:px-[60px]",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
