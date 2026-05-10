"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { MobileBottomNav } from "@/components/MobileBottomNav";

export function AppChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAuth = pathname.startsWith("/auth");

  return (
    <>
      <div className={isAuth ? "min-h-dvh" : "min-h-dvh pb-28 lg:pb-0"}>{children}</div>
      {!isAuth ? <MobileBottomNav /> : null}
    </>
  );
}
