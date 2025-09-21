"use client";

import { useRouter } from "next/navigation";
import AuthTitle from "@/components/Kits/Auth/Title";
import OTPLoginForm from "@/components/Auth/Login/OTPForm";
import { AuthService, UserService } from "@/services";
import { useCheckPhoneNumber } from "@/hooks/useCheckPhoneNumber";
import toast from "react-hot-toast";
import { useEffect } from "react";
import { useCart } from "@/contexts/CartContext";

export default function LoginPage() {
  const router = useRouter();
  const { phoneNumber } = useCheckPhoneNumber();
  const { migrateLocalCartToApi } = useCart();

  const handleLogin = async ({ verificationCode }: { verificationCode: string }) => {
    if (verificationCode.length === 6) {
      const response = await AuthService.verifyOTP(verificationCode.split("").reverse().join(""));

      if (response.token) {
        localStorage.setItem("accessToken", response.token);
        localStorage.setItem("refreshToken", response.token);

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
        toast.error("کد تایید اشتباه است");
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
    <div className="mx-auto w-full">
      <AuthTitle subtitle={`لطفا کد ارسال شده به شماره همراه  ${phoneNumber} را وارد نمایید`}>
        ورود با رمز یکبار مصرف
      </AuthTitle>

      <OTPLoginForm
        onSubmit={handleLogin}
        phoneNumber={phoneNumber || ""}
        resendCode={() => AuthService.sendOTP(phoneNumber || "")}
      />
    </div>
  );
}
