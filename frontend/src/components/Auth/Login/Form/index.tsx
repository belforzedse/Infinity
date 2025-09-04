"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthPasswordInput from "@/components/Kits/Auth/Input/Password";
import AuthButton from "@/components/Kits/Auth/Button";
import PhoneInput from "@/components/Kits/Auth/Input/Phone";
import Checkbox from "@/components/Kits/Auth/Checkbox";
import LoginIcon from "@/components/Kits/Auth/Icons/LoginIcon";
import Text from "@/components/Kits/Text";
import { useCheckPhoneNumber } from "@/hooks/useCheckPhoneNumber";

interface LoginFormProps {
  onSubmit: (data: {
    phoneNumber: string;
    password: string;
    rememberMe: boolean;
  }) => Promise<void>;
}

export default function LoginForm({ onSubmit }: LoginFormProps) {
  const router = useRouter();

  const { phoneNumber } = useCheckPhoneNumber();

  useEffect(() => {
    if (!phoneNumber) {
      router.push("/auth");
    }
  }, [phoneNumber]);

  const [formData, setFormData] = useState({
    phoneNumber,
    password: "",
    rememberMe: false,
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

  const handleEditPhone = () => {
    router.push("/auth");
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-7">
      <div className="space-y-7">
        <div>
          <Text variant="label" className="mb-2 inline-block">
            شماره همراه
          </Text>
          <PhoneInput value={formData.phoneNumber} onEdit={handleEditPhone} />
        </div>

        <div>
          <Text variant="label" className="mb-2 inline-block">
            رمز عبور
          </Text>
          <AuthPasswordInput
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
          />
        </div>

        <div className="flex items-center">
          <Checkbox
            checked={formData.rememberMe}
            onChange={(checked) =>
              setFormData({ ...formData, rememberMe: checked })
            }
            label={<Text variant="helper">مرا به خاطر بسپار</Text>}
          />
        </div>
      </div>

      <AuthButton
        type="submit"
        disabled={isLoading}
        icon={
          isLoading ? (
            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
          ) : (
            <LoginIcon className="h-6 w-6" />
          )
        }
      >
        ورود به حساب کاربری
      </AuthButton>
    </form>
  );
}
