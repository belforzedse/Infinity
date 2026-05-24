import { cn } from "@/lib/utils";
import type { HTMLAttributes, ReactNode } from "react";

type StorefrontSectionProps = HTMLAttributes<HTMLElement> & {
  children: ReactNode;
};

export function StorefrontSection({ children, className, ...props }: StorefrontSectionProps) {
  return (
    <section className={cn("flex flex-col gap-6", className)} {...props}>
      {children}
    </section>
  );
}
