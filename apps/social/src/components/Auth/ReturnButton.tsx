"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

interface AuthReturnButtonProps {
  href: string;
  label: string;
  preserveRedirect?: boolean;
}

export default function AuthReturnButton({ href, label, preserveRedirect = false }: AuthReturnButtonProps) {
  const router = useRouter();

  const handleClick = () => {
    if (preserveRedirect && typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const redirect = searchParams.get("redirect");
      if (redirect) {
        router.push(`${href}?redirect=${encodeURIComponent(redirect)}`);
        return;
      }
    }
    router.push(href);
  };

  return (
    <div className="mt-4 flex justify-center md:mt-5">
      <button
        type="button"
        onClick={handleClick}
        className="group inline-flex items-center gap-1 text-sm font-medium text-infinity-primary transition-opacity hover:opacity-80 focus:outline-none"
      >
        <span>{label}</span>
        <ChevronLeft className="h-4 w-4 text-infinity-primary transition-opacity group-hover:opacity-80" aria-hidden />
      </button>
    </div>
  );
}
