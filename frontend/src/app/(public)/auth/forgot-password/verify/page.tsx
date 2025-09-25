"use client";

import { useRouter, useSearchParams } from "next/navigation";
import AuthTitle from "@/components/Kits/Auth/Title";
import VerifyForgotPasswordForm from "@/components/Auth/ForgotPassword/VerifyForm";
import { Suspense, useEffect } from "react";
import { AuthService } from "@/services";
import toast from "react-hot-toast";

function VerifyContent() {
  const queryParams = useSearchParams();
  const phoneNumber = queryParams.get("phoneNumber");

  const router = useRouter();

  useEffect(() => {
    if (phoneNumber) {
      AuthService.sendOTP(phoneNumber);
    } else {
      router.push("/auth/forgot-password");
    }
  }, [phoneNumber, router]);

  return (
    <div className="mx-auto w-full">
      <AuthTitle subtitle={`لطفا کد تایید ارسال شده  به شماره همراه ${phoneNumber} را وارد نمایید`}>
        بازیابی رمز عبور
      </AuthTitle>

      <VerifyForgotPasswordForm
        resendCode={() => AuthService.sendOTP(phoneNumber || "")}
        onSubmit={async (data) => {
          if (!phoneNumber) {
            router.push("/auth/forgot-password");
            return;
          }

          try {
            const response = await AuthService.resetPassword({
              otp: data.otp,
              newPassword: data.password,
              otpToken: typeof window !== "undefined" ? sessionStorage.getItem("otpToken") : null,
              phone: phoneNumber || undefined,
            });

            if (response.message || response.success) {
              router.push("/auth/login");
            } else {
              toast.error("کد تایید اشتباه است");
            }
          } catch {
            toast.error("کد تایید یا توکن معتبر نیست");
          }
        }}
      />
    </div>
  );
}

export default function VerifyForgotPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto w-full p-8 text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-t-2 border-pink-500"></div>
          <p className="text-lg">در حال بارگذاری...</p>
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
