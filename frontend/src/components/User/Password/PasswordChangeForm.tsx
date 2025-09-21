"use client";
import AuthPasswordInput from "@/components/Kits/Auth/Input/Password";
import { Button } from "@/components/ui/Button";
import { useState } from "react";
import SaveIcon from "../Icons/SaveIcon";

export default function PasswordChangeForm() {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Handle password change submission
  };

  return (
    <div className="space-y-6 rounded-lg bg-white px-0.5">
      <form onSubmit={handleSubmit} className="space-y-5 lg:space-y-6">
        <div className="space-y-3 lg:space-y-4">
          <div>
            <label className="text-base mb-2 block text-right text-foreground-primary lg:text-lg">
              رمز عبور فعلی
            </label>
            <AuthPasswordInput
              value={formData.currentPassword}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  currentPassword: e.target.value,
                })
              }
              className="!bg-white"
            />
          </div>

          <div>
            <label className="text-base mb-2 block text-right text-foreground-primary lg:text-lg">
              رمز عبور جدید
            </label>
            <AuthPasswordInput
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              showStrength
              className="!bg-white"
            />
          </div>

          <div>
            <label className="text-base mb-2 block text-right text-foreground-primary lg:text-lg">
              تکرار رمز عبور جدید
            </label>
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
              className="!bg-white"
            />
          </div>
        </div>
        <div className="flex w-full justify-end">
          <Button
            type="submit"
            disabled={
              !formData.currentPassword ||
              !formData.newPassword ||
              !formData.confirmPassword ||
              formData.newPassword !== formData.confirmPassword
            }
            className="gap-1 bg-[#EC4899] px-8 text-white hover:bg-[#EC4899]/80 disabled:cursor-not-allowed disabled:bg-gray-300"
            fullWidth
          >
            <SaveIcon className="h-5 w-5 lg:h-6 lg:w-6" />
            <span className="text-base lg:text-sm">ذخیره</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
