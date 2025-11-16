"use client";

import { useRouter, useSearchParams } from "next/navigation";
import AuthTitle from "@/components/Kits/Auth/Title";
import VerifyForgotPasswordForm from "@/components/Auth/ForgotPassword/VerifyForm";
import { Suspense, useEffect } from "react";
import { AuthService } from "@/services";
import toast from "react-hot-toast";
import { extractErrorStatus } from "@/utils/errorMessages";
import { getUserFacingErrorMessage } from "@/utils/userErrorMessage";

function VerifyContent() {
  const queryParams = useSearchParams();
  const phoneNumber = queryParams.get("phoneNumber");

  const router = useRouter();

  useEffect(() => {
    if (!phoneNumber) {
      router.push("/auth/forgot-password");
      return;
    }

    const sendInitialOTP = async () => {
      try {
        await AuthService.sendOTP(phoneNumber);
      } catch (error: unknown) {
        const friendlyMessage = getUserFacingErrorMessage(
          error,
          "کد تایید ارسال نشده است",
        );
        toast.error(friendlyMessage);
      }
    };

    sendInitialOTP();
  }, [phoneNumber, router]);

  return (
    <div className="mx-auto w-full">
      <AuthTitle subtitle={`لطفا کد تایید ارسال شده  به شماره همراه ${phoneNumber} را وارد نمایید`}>
        بازیابی رمز عبور
      </AuthTitle>

      <VerifyForgotPasswordForm
        resendCode={async () => {
          try {
            await AuthService.sendOTP(phoneNumber || "");
            toast.success("کد تایید دوباره ارسال شد");
          } catch (error: unknown) {
            const friendlyMessage = getUserFacingErrorMessage(error, "خطا در ارسال کد تایید");
            const errorStatus = extractErrorStatus(error);

            if (errorStatus === 429) {
              toast.error(friendlyMessage);
              return;
            }

            toast.error(friendlyMessage);
          }
        }}
        onSubmit={async (data) => {
          if (!phoneNumber) {
            router.push("/auth/forgot-password");
            return;
          }

          try {
            const response = await AuthService.resetPassword({
              otp: data.otp.split("").reverse().join(""),
              newPassword: data.password,
              otpToken: typeof window !== "undefined" ? sessionStorage.getItem("otpToken") : null,
              phone: phoneNumber || undefined,
            });

            if (response.message || response.success) {
              // Preserve redirect parameter when redirecting to login
              const redirectParam = queryParams.get("redirect");
              const redirectQuery = redirectParam ? `?redirect=${encodeURIComponent(redirectParam)}` : "";
              router.push(`/auth/login${redirectQuery}`);
            } else {
              toast.error("کد تایید اشتباه است");
            }
          } catch (error: unknown) {
            const friendlyMessage = getUserFacingErrorMessage(
              error,
              "کد تایید یا توکن معتبر نیست",
            );
            const errorStatus = extractErrorStatus(error);

            if (errorStatus === 429) {
              toast.error(friendlyMessage);
              return;
            }

            toast.error(friendlyMessage);
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
