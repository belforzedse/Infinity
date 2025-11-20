"use client";

import { useRouter } from "next/navigation";
import ChevronLeftIcon from "@/components/Product/Icons/ChevronLeftIcon";

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
    <div className="mb-4 flex justify-start">
      <button
        type="button"
        onClick={handleClick}
        className="group inline-flex items-center gap-1 text-sm font-medium text-pink-600 transition-colors hover:text-pink-500 focus:outline-none"
      >
        <span>{label}</span>
        <ChevronLeftIcon className="h-4 w-4 text-pink-600 transition-colors group-hover:text-pink-500" />
      </button>
    </div>
  );
}


