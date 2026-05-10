"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { atom, useAtom } from "jotai";
import type { ApiError } from "@repo/api";
import { AuthService } from "@/services";

function isApiError(err: unknown): err is ApiError {
  return (
    typeof err === "object" &&
    err !== null &&
    "message" in err &&
    typeof (err as ApiError).message === "string" &&
    "status" in err &&
    typeof (err as ApiError).status === "number"
  );
}

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
      setError(isApiError(err) ? err.message : "خطا در بررسی شماره تلفن");
      if (isApiError(err)) {
        console.error("checkPhoneNumber failed", { status: err.status, message: err.message });
      } else if (err instanceof Error) {
        console.error("checkPhoneNumber failed", err.message, err.stack);
      } else {
        console.error("checkPhoneNumber failed", err);
      }
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
