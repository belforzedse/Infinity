"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthButton from "@/components/Kits/Auth/Button";
import PhoneInput from "@/components/Kits/Auth/Input/Phone";
import VerificationInput from "../VerificationInput";
import { useCountdown } from "@/hooks/useCountdown";
import Text from "@/components/Kits/Text";

interface OTPLoginFormProps {
  phoneNumber: string;
  onSubmit: (data: { verificationCode: string }) => Promise<void>;
  resendCode: () => void;
}

export default function OTPLoginForm({ onSubmit, phoneNumber, resendCode }: OTPLoginFormProps) {
  const router = useRouter();
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent | null) => {
    e?.preventDefault();
    setIsLoading(true);

    try {
      await onSubmit({ verificationCode });
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditPhone = () => {
    router.push("/auth");
  };

  const { timeLeft, isActive, startTimer } = useCountdown(); // Using default 2 minutes

  const handleResendCode = () => {
    if (!isActive) {
      startTimer();
      resendCode();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-7">
      <div className="space-y-7">
        <div>
          <Text variant="label" className="mb-2 inline-block">
            شماره همراه
          </Text>
          <PhoneInput value={phoneNumber} onEdit={handleEditPhone} />
        </div>

        <div className="space-y-3">
          <Text variant="label">کدتایید شماره همراه</Text>
          <div className="flex flex-col items-end">
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
      </div>

      <AuthButton
        type="submit"
        disabled={isLoading}
        icon={
          isLoading && (
            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
          )
        }
      >
        ورود
      </AuthButton>
    </form>
  );
}
