"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthService } from "@/services";
import { atom, useAtom } from "jotai";

interface UseCheckPhoneNumberReturn {
  isLoading: boolean;
  error: string | null;
  phoneNumber: string;
  checkPhoneNumber: (phoneNumber: string) => Promise<void>;
}

export const phoneNumberAtom = atom<string>("");

export function useCheckPhoneNumber(): UseCheckPhoneNumberReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useAtom(phoneNumberAtom);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const checkPhoneNumber = async (phoneNumber: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Accept both formats:
      // - 09XXXXXXXXX (11 digits starting with 0)
      // - +989XXXXXXXXX (international format with +98)
      const isValidPhone =
        /^09\d{9}$/.test(phoneNumber) || /^\+989\d{9}$/.test(phoneNumber);

      if (!isValidPhone) {
        setError("شماره تلفن نامعتبر است");
        return;
      }

      const response = await AuthService.checkUserExists(phoneNumber);

      // Navigate based on the result
      setPhoneNumber(phoneNumber);

      // Preserve redirect parameter from query string
      const redirectParam = searchParams.get("redirect");
      const redirectQuery = redirectParam ? `?redirect=${encodeURIComponent(redirectParam)}` : "";

      if (response.hasUser) {
        router.push(`/auth/login${redirectQuery}`);
      } else {
        router.push(`/auth/register${redirectQuery}`);
      }
    } catch (err) {
      setError("خطا در بررسی شماره تلفن");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    phoneNumber,
    checkPhoneNumber,
  };
}
