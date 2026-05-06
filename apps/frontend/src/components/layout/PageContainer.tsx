"use client";

import { cn } from "@/lib/utils";
import type { HTMLAttributes, ReactNode } from "react";

type PageContainerVariant = "default" | "wide";

interface PageContainerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: PageContainerVariant;
  disablePadding?: boolean;
}

const variantMaxWidth: Record<PageContainerVariant, string> = {
  default: "max-w-[1200px]",
  wide: "max-w-[1440px]",
};

export default function PageContainer({
  children,
  className,
  variant = "default",
  disablePadding = false,
  ...props
}: PageContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full",
        disablePadding ? null : "px-4 pb-12 pt-6 sm:px-6 lg:px-8",
        variantMaxWidth[variant],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
