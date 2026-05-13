"use client";

import { useEffect, useRef, useState } from "react";
import { useCheckPhoneNumber } from "@/hooks/useCheckPhoneNumber";
import AuthButton from "@/components/Kits/Auth/Button";
import AuthTitle from "@/components/Kits/Auth/Title";
import AuthInput from "@/components/Kits/Auth/Input";
import Text from "@/components/Kits/Text";
import AuthReturnButton from "@/components/Auth/ReturnButton";

export default function AuthForm() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const { isLoading, error, checkPhoneNumber } = useCheckPhoneNumber();
  const formRef = useRef<HTMLFormElement | null>(null);
  const previousError = useRef(error);

  useEffect(() => {
    if (!error || error === previousError.current) {
      previousError.current = error;
      return;
    }

    previousError.current = error;
    const form = formRef.current;
    if (!form) return;
    form.classList.remove("animate-shake");
    void form.offsetHeight;
    form.classList.add("animate-shake");
    const timeout = window.setTimeout(() => form.classList.remove("animate-shake"), 400);
    return () => window.clearTimeout(timeout);
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await checkPhoneNumber(phoneNumber);
  };

  return (
    <>
      <AuthTitle subtitle="لطفا شماره همراه خود را جهت بررسی وارد نمایید">
        ورود به حساب کاربری
      </AuthTitle>
      <div className="mb-6">
        <AuthReturnButton href="/" label="بازگشت به خانه" />
      </div>

      <form ref={formRef} onSubmit={handleSubmit} className="mt-8 space-y-6 md:space-y-7">
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
          <span className="grid min-w-[17ch] place-items-center">
            <span
              className={`col-start-1 row-start-1 transition-opacity ${isLoading ? "opacity-0" : "opacity-100"}`}
            >
              بررسی شماره همراه
            </span>
            <span
              className={`col-start-1 row-start-1 inline-block h-5 w-5 rounded-full border-2 border-white/20 border-t-white transition-opacity ${isLoading ? "animate-spin opacity-100" : "opacity-0"}`}
              aria-hidden={!isLoading}
            />
          </span>
        </AuthButton>
      </form>
    </>
  );
}
