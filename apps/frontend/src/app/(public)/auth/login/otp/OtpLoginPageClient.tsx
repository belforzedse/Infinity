"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useAtom } from "jotai";
import AuthTitle from "@/components/Kits/Auth/Title";
import OTPLoginForm from "@/components/Auth/Login/OTPForm";
import { AuthService, UserService } from "@/services";
import { useCheckPhoneNumber } from "@/hooks/useCheckPhoneNumber";
import toast from "react-hot-toast";
import { useEffect } from "react";
import { useCart } from "@/contexts/CartContext";
import {
  currentUserAtom,
  redirectUrlAtom,
  userErrorAtom,
  userLoadingAtom,
} from "@/lib/atoms/auth";
import { setAccessToken } from "@/utils/accessToken";
import { isProfileIncomplete } from "@/utils/profile";
import AuthReturnButton from "@/components/Auth/ReturnButton";
import { getUserFacingErrorMessage } from "@/utils/userErrorMessage";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { phoneNumber } = useCheckPhoneNumber();
  const { migrateLocalCartToApi } = useCart();
  const [storedRedirectUrl, setRedirectUrl] = useAtom(redirectUrlAtom);
  const [, setUserData] = useAtom(currentUserAtom);
  const [, setLoadingUser] = useAtom(userLoadingAtom);
  const [, setUserError] = useAtom(userErrorAtom);

  // Store redirect URL from query params into atom on page load
  useEffect(() => {
    const redirect = searchParams.get("redirect");
    if (redirect) {
      setRedirectUrl(redirect);
    }
  }, [searchParams, setRedirectUrl]);

  const handleLogin = async ({ verificationCode }: { verificationCode: string }) => {
    if (verificationCode.length === 6) {
      const fallbackMessage = "ورود ناموفق بود. دوباره تلاش کنید.";

      try {
        const response = await AuthService.verifyOTP(verificationCode.split("").reverse().join(""));

        if (response.token) {
          setAccessToken(response.token);
          localStorage.setItem("refreshToken", response.token);

          // Migrate local cart to API after login
          await migrateLocalCartToApi();
          // Fetch current user and redirect based on role or redirect URL
          try {
            const me = await UserService.me();
            setUserData(me);
            setLoadingUser(false);
            setUserError(null);

            // Redirect incomplete profiles to complete their info (non-admin only)
            if (!me.isAdmin && isProfileIncomplete(me)) {
              const params = new URLSearchParams();
              if (me.Phone) params.set("phone", me.Phone);
              if (storedRedirectUrl) params.set("redirect", storedRedirectUrl);
              router.push(`/auth/register/info${params.toString() ? `?${params.toString()}` : ""}`);
              setRedirectUrl(null);
              return;
            }

            // Use stored redirect URL if available, otherwise use role-based redirect
            if (storedRedirectUrl) {
              router.push(storedRedirectUrl);
              // Clear the stored redirect URL after using it
              setRedirectUrl(null);
            } else if (me?.isAdmin) {
              router.push("/super-admin");
            } else {
              router.push("/account");
            }
          } catch {
            // Fallback to account if role fetch fails
            router.push("/account");
          }
        } else {
          toast.error(fallbackMessage);
        }
      } catch (error: unknown) {
        toast.error(getUserFacingErrorMessage(error, fallbackMessage));
      }
    }
  };

  useEffect(() => {
    if (phoneNumber) {
      AuthService.sendOTP(phoneNumber);
    } else {
      router.push("/auth");
    }
  }, [phoneNumber, router]);

  return (
    <div className="mx-auto w/full">
      <AuthTitle subtitle={`لطفا کد ارسال شده به شماره همراه  ${phoneNumber} را وارد نمایید`}>
        ورود با رمز یکبار مصرف
      </AuthTitle>
      <div className="mb-6">
        <AuthReturnButton href="/" label="بازگشت به فروشگاه" preserveRedirect />
      </div>

      <OTPLoginForm
        onSubmit={handleLogin}
        phoneNumber={phoneNumber || ""}
        resendCode={() => AuthService.sendOTP(phoneNumber || "")}
      />
    </div>
  );
}
