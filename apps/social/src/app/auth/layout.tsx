import type { ReactNode } from "react";
import { AuthLayoutClient } from "@/app/auth/AuthLayoutClient";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <AuthLayoutClient>{children}</AuthLayoutClient>;
}
