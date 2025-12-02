"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useAtom } from "jotai";
import AuthTitle from "@/components/Kits/Auth/Title";
import LoginForm from "@/components/Auth/Login/Form";
import LoginActions from "@/components/Auth/Login/Actions";
import { AuthService, UserService } from "@/services";
import { toast } from "react-hot-toast";
import { useCart } from "@/contexts/CartContext";
import {
  currentUserAtom,
  redirectUrlAtom,
  userErrorAtom,
  userLoadingAtom,
} from "@/lib/atoms/auth";
import { useEffect } from "react";
import { setAccessToken } from "@/utils/accessToken";
import AuthReturnButton from "@/components/Auth/ReturnButton";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
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

  const handleLogin = async (data: {
    phoneNumber: string;
    password: string;
    rememberMe: boolean;
  }) => {
    try {
      const res = await AuthService.loginPassword(data.phoneNumber, data.password);

      if (res.token) {
        setAccessToken(res.token);

        // Migrate local cart to API after login
        await migrateLocalCartToApi();
        // Fetch current user and redirect based on role or redirect URL
        try {
          const me = await UserService.me();

          setUserData(me);
          setLoadingUser(false);
          setUserError(null);

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
        toast.error("رمز عبور یا شماره همراه اشتباه است");
      }
    } catch {
      toast.error("رمز عبور یا شماره همراه اشتباه است");
    }
  };

  const handleForgotPassword = () => {
    router.push("/auth/forgot-password");
  };

  const handleOtpLogin = () => {
    router.push("/auth/login/otp");
  };

  return (
    <div className="mx-auto w-full">
      <AuthTitle subtitle="لطفا شماره همراه و رمز عبور خود را وارد نمایید">
        ورود به حساب کاربری
      </AuthTitle>
      <div className="mb-6">
        <AuthReturnButton href="/" label="بازگشت به فروشگاه" preserveRedirect />
      </div>

      <LoginForm onSubmit={handleLogin} />
      <LoginActions onForgotPassword={handleForgotPassword} onOtpLogin={handleOtpLogin} />
    </div>
  );
}
