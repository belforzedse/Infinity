"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthTitle from "@/components/Kits/Auth/Title";
import Text from "@/components/Kits/Text";
import AuthInput from "@/components/Kits/Auth/Input";
import AuthButton from "@/components/Kits/Auth/Button";
import AuthPasswordInput from "@/components/Kits/Auth/Input/Password";
import { AuthService } from "@/services";
import toast from "react-hot-toast";
import AuthReturnButton from "@/components/Auth/ReturnButton";

interface FormData {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  birthYear: string;
  birthMonth: string;
  birthDay: string;
  password: string;
  confirmPassword: string;
}

export default function RegisterInfoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    birthYear: "",
    birthMonth: "",
    birthDay: "",
    password: "",
    confirmPassword: "",
  });

  useEffect(() => {
    const paramsPhone = searchParams.get("phone");
    const storedPhone =
      typeof window !== "undefined" ? localStorage.getItem("pendingPhone") : null;
    const phoneToUse = paramsPhone || storedPhone;

    if (phoneToUse) {
      setFormData((prev) => ({ ...prev, phoneNumber: phoneToUse }));
    } else {
      toast.error("لطفا ابتدا شماره خود را تایید کنید.");
      router.replace("/auth");
    }
    if (storedPhone) {
      localStorage.removeItem("pendingPhone");
    }
  }, [router, searchParams]);

  const normalizePhone = (value: string) => {
    if (!value) return value;
    let trimmed = value.trim();
    if (trimmed.startsWith("+")) return trimmed;
    if (trimmed.startsWith("0")) trimmed = trimmed.substring(1);
    if (!trimmed.startsWith("98")) trimmed = `98${trimmed}`;
    return `+${trimmed}`;
  };

  const formatBirthDate = (year: string, month: string, day: string): string => {
    // Format Persian date as yyyy-MM-dd (keep Persian year, no conversion)
    const y = year.padStart(4, "0");
    const m = month.padStart(2, "0");
    const d = day.padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const normalizedPhone = normalizePhone(formData.phoneNumber);
      const birthDate = formatBirthDate(formData.birthYear, formData.birthMonth, formData.birthDay);
      const res = await AuthService.register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        password: formData.password,
        phone: normalizedPhone,
        birthDate: birthDate,
      });

      if (res.token || res.message) {
        // Preserve redirect parameter when redirecting to login
        const redirectParam = searchParams.get("redirect");
        const redirectQuery = redirectParam ? `?redirect=${encodeURIComponent(redirectParam)}` : "";
        router.push(`/auth/login${redirectQuery}`);
      }
    } catch (error: any) {
      console.error(error);
      const message =
        error?.response?.data?.error?.message ||
        error?.message ||
        "خطا در ثبت اطلاعات. لطفا دوباره تلاش کنید";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  return (
    <div className="space-y-8" dir="rtl">
      <AuthReturnButton href="/" label="بازگشت به فروشگاه" preserveRedirect />
      <AuthTitle subtitle="لطفا اطلاعات خود را تکمیل نمایید">ایجاد حساب کاربری</AuthTitle>

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
            تاریخ تولد
          </Text>
          <div className="flex gap-2">
            <div className="flex-1">
              <AuthInput
                type="number"
                value={formData.birthYear}
                onChange={handleChange("birthYear")}
                placeholder="سال (مثلا 1370)"
                min="1300"
                max="1450"
              />
            </div>
            <div className="flex-1">
              <AuthInput
                type="number"
                value={formData.birthMonth}
                onChange={handleChange("birthMonth")}
                placeholder="ماه (1-12)"
                min="1"
                max="12"
              />
            </div>
            <div className="flex-1">
              <AuthInput
                type="number"
                value={formData.birthDay}
                onChange={handleChange("birthDay")}
                placeholder="روز (1-31)"
                min="1"
                max="31"
              />
            </div>
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
                formData.confirmPassword && formData.password !== formData.confirmPassword
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
            !formData.birthYear ||
            !formData.birthMonth ||
            !formData.birthDay ||
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
