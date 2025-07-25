"use client";

import { useRouter } from "next/navigation";
import AuthTitle from "@/components/Kits/Auth/Title";
import ForgotPasswordForm from "@/components/Auth/ForgotPassword/Form";

export default function ForgotPasswordPage() {
  const router = useRouter();

  const handleForgotPassword = async (data: { phoneNumber: string }) => {
    router.push(`/auth/forgot-password/verify?phoneNumber=${data.phoneNumber}`);
  };

  return (
    <div className="w-full mx-auto">
      <AuthTitle subtitle="لطفا شماره همراه خود را جهت بازیابی رمز وارد نمایید">
        بازیابی رمز عبور
      </AuthTitle>

      <ForgotPasswordForm onSubmit={handleForgotPassword} />
    </div>
  );
}
