"use client";

import AuthPasswordInput from "@/components/Kits/Auth/Input/Password";
import { Button } from "@/components/ui/Button";
import AuthService from "@/services/auth";
import { resetPassword } from "@/services/auth/resetPassword";
import useUser from "@/hooks/useUser";
import { useState } from "react";
import SaveIcon from "../Icons/SaveIcon";
import toast from "react-hot-toast";
import { extractErrorStatus } from "@/utils/errorMessages";
import { getUserFacingErrorMessage } from "@/utils/userErrorMessage";

export default function PasswordChangeForm() {
  const { userData } = useUser();
  const [formData, setFormData] = useState({
    newPassword: "",
    confirmPassword: "",
    otp: "",
  });
  const [otpSent, setOtpSent] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("رمز عبور جدید و تکرار آن مطابقت ندارند");
      return;
    }

    if (!userData?.Phone) {
      toast.error("شماره تماس شما ثبت نشده است");
      return;
    }

    setIsSubmitting(true);

    if (!otpSent) {
      try {
        await AuthService.sendOTP(userData.Phone);
        setOtpSent(true);
        toast.success("کد تایید ارسال شد");
      } catch (error) {
        const friendly = getUserFacingErrorMessage(error, "ارسال کد تایید با خطا مواجه شد");
        toast.error(friendly);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (!formData.otp) {
      toast.error("کد تایید را وارد کنید");
      setIsSubmitting(false);
      return;
    }

    try {
      await resetPassword({
        otp: formData.otp,
        newPassword: formData.newPassword,
        phone: userData.Phone,
      });
      toast.success("رمز عبور با موفقیت تغییر کرد");
      setOtpSent(false);
      setFormData({
        newPassword: "",
        confirmPassword: "",
        otp: "",
      });
    } catch (error) {
      const status = extractErrorStatus(error);
      const friendly = getUserFacingErrorMessage(error, "تغییر رمز عبور با خطا مواجه شد");
      if (status === 429) {
        toast.error(friendly);
        setIsSubmitting(false);
        return;
      }
      toast.error(friendly);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-2xl bg-white p-5 lg:p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-right text-foreground-primary">رمز عبور جدید</label>
            <AuthPasswordInput
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              showStrength
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-right text-foreground-primary">تکرار رمز عبور جدید</label>
            <AuthPasswordInput
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  confirmPassword: e.target.value,
                })
              }
              error={
                formData.confirmPassword && formData.newPassword !== formData.confirmPassword
                  ? "رمز عبور مطابقت ندارد"
                  : undefined
              }
            />
          </div>
          {otpSent && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-right text-foreground-primary">کد تایید</label>
              <input
                type="text"
                value={formData.otp}
                onChange={(e) => setFormData({ ...formData, otp: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-right text-foreground-primary focus:border-pink-500 focus:outline-none"
                placeholder="۶ کد دریافت شده"
                dir="ltr"
              />
              <p className="text-xs text-slate-500">
                اگر کد را دریافت نکردید، دکمه را دوباره فشار دهید.
              </p>
            </div>
          )}
        </div>
        <div className="flex w-full justify-end">
          <Button
            type="submit"
            disabled={
              isSubmitting ||
              !formData.newPassword ||
              !formData.confirmPassword ||
              formData.newPassword !== formData.confirmPassword ||
              (otpSent && !formData.otp)
            }
            className="gap-2 rounded-xl bg-[#EC4899] px-6 py-3 text-white transition hover:bg-[#EC4899]/90 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {otpSent && <SaveIcon className="h-5 w-5 lg:h-6 lg:w-6" />}
            <span className="text-sm font-medium">
              {isSubmitting
                ? otpSent
                  ? "در حال تایید..."
                  : "در حال ارسال..."
                : otpSent
                ? "تایید و تغییر"
                : "ارسال کد"}
            </span>
          </Button>
        </div>
      </form>
    </div>
  );
}
