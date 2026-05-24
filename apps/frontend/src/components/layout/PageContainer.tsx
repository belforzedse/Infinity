import { cn } from "@/lib/utils";
import type { HTMLAttributes, ReactNode } from "react";
import { StorefrontContainer } from "@/components/storefront";

type PageContainerVariant = "default" | "wide";

interface PageContainerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  variant?: PageContainerVariant;
  disablePadding?: boolean;
}

export default function PageContainer({
  children,
  className,
  variant: _variant = "default",
  disablePadding = false,
  ...props
}: PageContainerProps) {
  return (
    <StorefrontContainer
      disablePadding={disablePadding}
      className={cn(disablePadding ? null : "pb-12 pt-6", className)}
      {...props}
    >
      {children}
    </StorefrontContainer>
  );
}
