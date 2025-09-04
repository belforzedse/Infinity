"use client";

import { useRouter } from "next/navigation";
import AuthTitle from "@/components/Kits/Auth/Title";
import LoginForm from "@/components/Auth/Login/Form";
import LoginActions from "@/components/Auth/Login/Actions";
import { AuthService, UserService } from "@/services";
import { toast } from "react-hot-toast";
import { useCart } from "@/contexts/CartContext";
import { useEffect } from "react";

export default function LoginPage() {
  const router = useRouter();
  const { migrateLocalCartToApi } = useCart();

  const handleLogin = async (data: {
    phoneNumber: string;
    password: string;
    rememberMe: boolean;
  }) => {
    try {
      const res = await AuthService.loginPassword(
        data.phoneNumber,
        data.password
      );

      if (res.token) {
        localStorage.setItem("accessToken", res.token);

        // Migrate local cart to API after login
        await migrateLocalCartToApi();
        // Fetch current user and redirect based on role
        try {
          const me = await UserService.me();
          if (me?.isAdmin) {
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
    } catch (error) {
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
    <div className="w-full mx-auto">
      <AuthTitle subtitle="لطفا شماره همراه و رمز عبور خود را وارد نمایید">
        ورود به حساب کاربری
      </AuthTitle>

      <LoginForm onSubmit={handleLogin} />
      <LoginActions
        onForgotPassword={handleForgotPassword}
        onOtpLogin={handleOtpLogin}
      />
    </div>
  );
}
