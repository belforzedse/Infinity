import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import UserSidebar from "@/components/User/Sidebar";

type StorefrontAccountShellProps = {
  children: ReactNode;
  sidebar?: ReactNode;
  className?: string;
  contentClassName?: string;
};

export function StorefrontAccountShell({
  children,
  sidebar = <UserSidebar />,
  className,
  contentClassName,
}: StorefrontAccountShellProps) {
  return (
    <div className={cn("flex flex-col gap-6 lg:flex-row lg:gap-8", className)}>
      <aside className="hidden w-full max-w-[240px] shrink-0 lg:block">{sidebar}</aside>
      <main className={cn("min-w-0 flex-1", contentClassName)}>{children}</main>
    </div>
  );
}
