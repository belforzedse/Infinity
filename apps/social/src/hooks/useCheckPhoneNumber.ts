"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { atom, useAtom } from "jotai";
import { AuthService } from "@/services";

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

  const checkPhoneNumber = async (phone: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const isValidPhone = /^09\d{9}$/.test(phone) || /^\+989\d{9}$/.test(phone);

      if (!isValidPhone) {
        setError("شماره تلفن نامعتبر است");
        return;
      }

      const response = await AuthService.checkUserExists(phone);

      setPhoneNumber(phone);

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
