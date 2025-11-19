"use client";

import { useRouter, useSearchParams } from "next/navigation";
import AuthTitle from "@/components/Kits/Auth/Title";
import ForgotPasswordForm from "@/components/Auth/ForgotPassword/Form";
import AuthReturnButton from "@/components/Auth/ReturnButton";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleForgotPassword = async (data: { phoneNumber: string }) => {
    // Preserve redirect parameter when navigating to verify page
    const redirectParam = searchParams.get("redirect");
    const redirectQuery = redirectParam ? `&redirect=${encodeURIComponent(redirectParam)}` : "";
    router.push(`/auth/forgot-password/verify?phoneNumber=${data.phoneNumber}${redirectQuery}`);
  };

  return (
    <div className="mx-auto w-full">
      <AuthReturnButton href="/auth" label="بازگشت به ورود" preserveRedirect />
      <AuthTitle subtitle="لطفا شماره همراه خود را جهت بازیابی رمز وارد نمایید">
        بازیابی رمز عبور
      </AuthTitle>

      <ForgotPasswordForm onSubmit={handleForgotPassword} />
    </div>
  );
}
