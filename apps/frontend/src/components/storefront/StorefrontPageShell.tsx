import { cn } from "@/lib/utils";
import type { HTMLAttributes, ReactNode } from "react";
import { StorefrontContainer } from "./StorefrontContainer";

type StorefrontPageShellProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  containerClassName?: string;
  disableContainerPadding?: boolean;
};

export function StorefrontPageShell({
  children,
  className,
  containerClassName,
  disableContainerPadding = false,
  ...props
}: StorefrontPageShellProps) {
  return (
    <main className={cn("w-full", className)} {...props}>
      <StorefrontContainer
        disablePadding={disableContainerPadding}
        className={cn("flex flex-col gap-10 pb-16 pt-6 lg:gap-12 lg:pb-12", containerClassName)}
      >
        {children}
      </StorefrontContainer>
    </main>
  );
}
