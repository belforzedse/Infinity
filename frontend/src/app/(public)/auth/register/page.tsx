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
      const response = await AuthService.verifyOTP(verificationCode.split("").reverse().join(""));

      if (response.token) {
        localStorage.setItem("accessToken", response.token);

        // Migrate local cart to API after registration
        await migrateLocalCartToApi();

        // Preserve redirect parameter when redirecting to info page
        const redirectParam = searchParams.get("redirect");
        const redirectQuery = redirectParam ? `?redirect=${encodeURIComponent(redirectParam)}` : "";
        router.push(`/auth/register/info${redirectQuery}`);
      } else {
        toast.error("کد تایید اشتباه است");
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
              <span className="text-sm text-foreground-primary/80">{timeLeft}</span>
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
