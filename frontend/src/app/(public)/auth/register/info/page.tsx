"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthTitle from "@/components/Kits/Auth/Title";
import Text from "@/components/Kits/Text";
import AuthInput from "@/components/Kits/Auth/Input";
import AuthButton from "@/components/Kits/Auth/Button";
import AuthPasswordInput from "@/components/Kits/Auth/Input/Password";
import { useCheckPhoneNumber } from "@/hooks/useCheckPhoneNumber";
import { AuthService } from "@/services";

interface FormData {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  password: string;
  confirmPassword: string;
}

export default function RegisterInfoPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const { phoneNumber } = useCheckPhoneNumber();

  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    phoneNumber,
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (!phoneNumber) {
      router.push("/auth");
    }
  }, [phoneNumber, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await AuthService.register(
        formData.firstName,
        formData.lastName,
        formData.password,
      );

      if (res.message) {
        router.push("/super-admin");
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange =
    (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));
    };

  return (
    <div className="space-y-8" dir="rtl">
      <AuthTitle subtitle="لطفا اطلاعات خود را تکمیل نمایید">
        ایجاد حساب کاربری
      </AuthTitle>

      <form onSubmit={handleSubmit} className="space-y-7">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6">
          <div>
            <Text variant="label" className="mb-2 md:mb-2.5">
              نام
            </Text>
            <AuthInput
              type="text"
              value={formData.firstName}
              onChange={handleChange("firstName")}
              placeholder="نام"
            />
          </div>
          <div>
            <Text variant="label" className="mb-2 md:mb-2.5">
              نام خانوادگی
            </Text>
            <AuthInput
              type="text"
              value={formData.lastName}
              onChange={handleChange("lastName")}
              placeholder="نام خانوادگی"
            />
          </div>
        </div>

        <div>
          <Text variant="label" className="mb-2 md:mb-2.5">
            شماره همراه
          </Text>
          <AuthInput
            type="tel"
            value={formData.phoneNumber}
            onChange={handleChange("phoneNumber")}
            placeholder="09122032114"
            disabled
          />
        </div>

        <div className="space-y-3">
          <div>
            <Text variant="label" className="mb-2 md:mb-2.5">
              رمز عبور
            </Text>
            <AuthPasswordInput
              value={formData.password}
              onChange={handleChange("password")}
              showStrength
            />
          </div>

          <div>
            <Text variant="label" className="mb-2 md:mb-2.5">
              تکرار رمز عبور
            </Text>
            <AuthPasswordInput
              value={formData.confirmPassword}
              onChange={handleChange("confirmPassword")}
              error={
                formData.confirmPassword &&
                formData.password !== formData.confirmPassword
                  ? "رمز عبور مطابقت ندارد"
                  : undefined
              }
            />
          </div>
        </div>

        <AuthButton
          type="submit"
          disabled={
            isLoading ||
            !formData.firstName ||
            !formData.lastName ||
            !formData.password ||
            !formData.confirmPassword ||
            formData.password !== formData.confirmPassword
          }
        >
          {isLoading ? "در حال ثبت نام..." : "ایجاد حساب کاربری"}
        </AuthButton>
      </form>
    </div>
  );
}
