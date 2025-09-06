"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import Text from "@/components/Kits/Text";
import { Input } from "@/components/ui/Input";

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
          <Input
            value={formData.phoneNumber}
            onChange={(e) => handleEditPhone(e.target.value)}
            dir="ltr"
            variant="auth"
            size="lg"
          />
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          size="xl"
          fullWidth
        >
          {isLoading && (
            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
          )}
          {!isLoading && "تایید شماره همراه"}
        </Button>
      </div>
    </form>
  );
}
