"use client";

import { useState } from "react";
import AuthButton from "@/components/Kits/Auth/Button";
import Text from "@/components/Kits/Text";
import AuthInput from "@/components/Kits/Auth/Input";

interface ForgotPasswordFormProps {
  onSubmit: (data: { phoneNumber: string }) => Promise<void>;
}

export default function ForgotPasswordForm({
  onSubmit,
}: ForgotPasswordFormProps) {
  const [formData, setFormData] = useState({
    phoneNumber: "", // This would come from previous step
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditPhone = (value: string) => {
    setFormData({
      ...formData,
      phoneNumber: value,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-7">
      <div className="space-y-7">
        <div>
          <Text variant="label" className="mb-2 inline-block">
            شماره همراه
          </Text>
          <AuthInput
            value={formData.phoneNumber}
            onEdit={handleEditPhone}
            dir="ltr"
          />
        </div>

        <AuthButton
          type="submit"
          disabled={isLoading}
          icon={
            isLoading && (
              <span className="inline-block w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            )
          }
        >
          تایید شماره همراه
        </AuthButton>
      </div>
    </form>
  );
}
