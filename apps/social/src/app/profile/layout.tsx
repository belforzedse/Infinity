import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { ProfileSidebar } from "@/components/profile/ProfileSidebar";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function ProfileLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-dvh flex-col">
      <Header />
      <main className="mx-auto w-full max-w-[1280px] flex-1 px-5 pb-6 pt-6 sm:px-6 lg:px-[60px] lg:pb-12">
        <div className="flex min-w-0 flex-col gap-6 lg:flex-row lg:gap-8">
          <ProfileSidebar />
          <div className="min-w-0 flex-1">{children}</div>
        </div>
      </main>
    </div>
  );
}
