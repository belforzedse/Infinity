"use client";

import { useEffect, useState } from "react";
import logger from "@/utils/logger";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import VerificationInput from "@/components/Auth/VerificationInput";
import { useCountdown } from "@/hooks/useCountdown";
import AuthButton from "@/components/Kits/Auth/Button";
import AuthTitle from "@/components/Kits/Auth/Title";
import Text from "@/components/Kits/Text";
import { useCheckPhoneNumber } from "@/hooks/useCheckPhoneNumber";
import { AuthService } from "@/services";
import { useCart } from "@/contexts/CartContext";
import { setAccessToken } from "@/utils/accessToken";

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { phoneNumber } = useCheckPhoneNumber();
  const { migrateLocalCartToApi } = useCart();

  const [verificationCode, setVerificationCode] = useState("");
  const { timeLeft, isActive, startTimer } = useCountdown(); // Using default 2 minutes

  const handleResendCode = () => {
    if (!isActive) {
      AuthService.sendOTP(phoneNumber).then(() => {
        startTimer();
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationCode.length === 6) {
      try {
        const response = await AuthService.verifyOTP(verificationCode.split("").reverse().join(""));

        if (response.token) {
          setAccessToken(response.token);

          // Migrate local cart to API after registration
          await migrateLocalCartToApi();

          const params = new URLSearchParams();
          const redirectParam = searchParams.get("redirect");
          if (redirectParam) {
            params.set("redirect", redirectParam);
          }
          if (phoneNumber) {
            params.set("phone", phoneNumber);
          }
          const query = params.toString();
          router.push(`/auth/register/info${query ? `?${query}` : ""}`);
        } else {
          toast.error("کد تایید اشتباه است");
        }
      } catch (error: any) {
        const message =
          error?.response?.data?.error?.message ||
          error?.message ||
          "خطا در ارسال کد تایید. لطفا دوباره تلاش کنید";
        toast.error(message);
      }
    }
  };

  useEffect(() => {
    if (phoneNumber) {
      if (process.env.NODE_ENV !== "production") {
        logger.info("Sending OTP", { phoneNumber });
      }

      AuthService.sendOTP(phoneNumber).then(() => {
        startTimer();
      });
    } else {
      router.push("/auth");
    }
  }, [phoneNumber, router, startTimer]);

  return (
    <div className="space-y-8" dir="rtl">
      <AuthTitle subtitle={`لطفا کد ارسال شده به شماره همراه ${phoneNumber} را وارد نمایید`}>
        ایجاد حساب کاربری
      </AuthTitle>

      <form onSubmit={handleSubmit} className="space-y-7">
        <div className="space-y-3">
          <Text variant="label">کدتایید شماره همراه</Text>
          <div className="flex flex-col items-end gap-4">
            <VerificationInput onChange={setVerificationCode} />

            <div className="flex w-full flex-row-reverse items-center justify-between">
              <span className="text-foreground-primary/80 text-sm">{timeLeft}</span>
              <div>
                <Text variant="helper">
                  کد را دریافت نکردید؟{" "}
                  <Text variant="link" onClick={handleResendCode} disabled={isActive}>
                    ارسال مجدد
                  </Text>
                </Text>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end">
          <AuthButton type="submit" disabled={verificationCode.length !== 6}>
            ایجاد حساب کاربری
          </AuthButton>
        </div>
      </form>
    </div>
  );
}
