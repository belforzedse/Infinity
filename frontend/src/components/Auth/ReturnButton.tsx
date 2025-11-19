"use client";

import { useRouter } from "next/navigation";
import AuthButton from "@/components/Kits/Auth/Button";
import LeftArrowIcon from "@/components/Kits/Icons/LeftArrowIcon";

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
      <AuthButton
        onClick={handleClick}
        type="button"
        className="border border-pink-600 !bg-transparent !text-pink-600 hover:!bg-pink-50"
        icon={<LeftArrowIcon />}
        iconPosition="right"
        fullWidth={false}
      >
        {label}
      </AuthButton>
    </div>
  );
}

