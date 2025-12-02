"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthButton from "@/components/Kits/Auth/Button";
import Text from "@/components/Kits/Text";
import VerificationInput from "../../VerificationInput";
import { useCountdown } from "@/hooks/useCountdown";
import AuthPasswordInput from "@/components/Kits/Auth/Input/Password";
import EditIcon from "@/components/Kits/Auth/Icons/EditIcon";

interface VerifyForgotPasswordFormProps {
  onSubmit: (data: { otp: string; password: string }) => Promise<void>;
  resendCode: () => void;
  initialPassword?: string;
  onSuccess?: () => void;
}

export default function VerifyForgotPasswordForm({
  onSubmit,
  resendCode,
  initialPassword,
  onSuccess,
}: VerifyForgotPasswordFormProps) {
  const router = useRouter();

  const [formData, setFormData] = useState({
    password: initialPassword || "",
    otp: "",
    confirmPassword: initialPassword || "",
  });

  useEffect(() => {
    if (initialPassword) {
      setFormData((prev) => ({
        ...prev,
        password: initialPassword,
        confirmPassword: initialPassword,
      }));
    }
  }, [initialPassword]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent | null) => {
    e?.preventDefault();
    setIsLoading(true);

    try {
      await onSubmit(formData);
      onSuccess?.();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange =
    (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData({
        ...formData,
        [field]: e.target.value,
      });
    };

  const { timeLeft, isActive, startTimer } = useCountdown(); // Using default 2 minutes

  const handleResendCode = () => {
    if (!isActive) {
      startTimer();
      resendCode();
    }
  };

  const handleEditPhone = () => {
    router.push("/auth/forgot-password");
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-7">
      <div className="space-y-7">
        <div className="space-y-3">
          <Text variant="label">کدتایید شماره همراه</Text>
          <div className="flex flex-col items-end">
            <VerificationInput onChange={(value) => setFormData({ ...formData, otp: value })} />

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

        <div className="flex flex-col gap-3 space-y-3">
          <div className="flex flex-col gap-1">
            <Text variant="label" className="mb-2 md:mb-2.5">
              رمز عبور
            </Text>
            <AuthPasswordInput
              value={formData.password}
              onChange={handleChange("password")}
              showStrength
            />
          </div>

          <div className="flex flex-col gap-1">
            <Text variant="label" className="mb-2 md:mb-2.5">
              تکرار رمز عبور
            </Text>
            <AuthPasswordInput
              value={formData.confirmPassword}
              onChange={handleChange("confirmPassword")}
              error={
                formData.confirmPassword && formData.password !== formData.confirmPassword
                  ? "رمز عبور مطابقت ندارد"
                  : undefined
              }
            />
          </div>
        </div>

        <div className="flex flex-col gap-5 md:flex-row-reverse">
          <AuthButton
            type="submit"
            disabled={isLoading}
            icon={
              isLoading && (
                <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
              )
            }
          >
            تایید
          </AuthButton>

          <AuthButton
            onClick={handleEditPhone}
            className="border border-pink-600 !bg-transparent !text-pink-600 hover:!bg-pink-50"
            icon={<EditIcon className="h-5 w-5 md:h-6 md:w-6" color="#db2777" />}
          >
            ویرایش شماره همراه
          </AuthButton>
        </div>
      </div>
    </form>
  );
}
