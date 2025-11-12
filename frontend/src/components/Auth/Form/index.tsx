"use client";

import { useState } from "react";
import { useCheckPhoneNumber } from "@/hooks/useCheckPhoneNumber";
import AuthButton from "@/components/Kits/Auth/Button";
import AuthTitle from "@/components/Kits/Auth/Title";
import AuthInput from "@/components/Kits/Auth/Input";
import Text from "@/components/Kits/Text";

export default function AuthForm() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const { isLoading, error, checkPhoneNumber } = useCheckPhoneNumber();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await checkPhoneNumber(phoneNumber);
  };

  return (
    <>
      <AuthTitle subtitle="لطفا شماره همراه خود را جهت بررسی وارد نمایید">
        ورود به حساب کاربری
      </AuthTitle>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6 md:space-y-7">
        <div className="space-y-5 md:space-y-6">
          <div>
            <Text variant="label" className="mb-2 md:mb-2.5">
              شماره همراه
            </Text>
            <AuthInput
              type="tel"
              id="phone"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="09122032114"
              error={error}
              inputMode="numeric"
              pattern="[0-9]*"
              required
              aria-required="true"
              aria-describedby={error ? "phone-error" : undefined}
            />
          </div>
        </div>

        <AuthButton type="submit" disabled={isLoading}>
          {isLoading ? (
            <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
          ) : (
            "بررسی شماره همراه"
          )}
        </AuthButton>
      </form>
    </>
  );
}
