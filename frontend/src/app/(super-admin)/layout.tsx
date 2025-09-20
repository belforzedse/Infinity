import ClientLayout from "./ClientLayout";
import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  alternates: { canonical: "/super-admin" },
};

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ClientLayout>{children}</ClientLayout>;
}
