"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

  const checkPhoneNumber = async (phoneNumber: string) => {
    try {
      setIsLoading(true);
      setError(null);

      if (!phoneNumber.match(/^09\d{9}$/)) {
        setError("شماره تلفن نامعتبر است");
        return;
      }

      const response = await AuthService.checkUserExists(phoneNumber);

      // Navigate based on the result
      setPhoneNumber(phoneNumber);

      if (response.hasUser) {
        router.push("/auth/login");
      } else {
        router.push("/auth/register");
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
