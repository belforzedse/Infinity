"use client";
import AuthPasswordInput from "@/components/Kits/Auth/Input/Password";
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
    console.log(formData);
  };

  return (
    <div className="bg-white rounded-lg space-y-6 px-0.5">
      <form onSubmit={handleSubmit} className="lg:space-y-6 space-y-5">
        <div className="lg:space-y-4 space-y-3">
          <div>
            <label className="block text-right text-foreground-primary mb-2 lg:text-lg text-base">
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
            <label className="block text-right text-foreground-primary mb-2 lg:text-lg text-base">
              رمز عبور جدید
            </label>
            <AuthPasswordInput
              value={formData.newPassword}
              onChange={(e) =>
                setFormData({ ...formData, newPassword: e.target.value })
              }
              showStrength
              className="!bg-white"
            />
          </div>

          <div>
            <label className="block text-right text-foreground-primary mb-2 lg:text-lg text-base">
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
                formData.confirmPassword &&
                formData.newPassword !== formData.confirmPassword
                  ? "رمز عبور مطابقت ندارد"
                  : undefined
              }
              className="!bg-white"
            />
          </div>
        </div>
        <div className="w-full flex justify-end">
          <button
            type="submit"
            disabled={
              !formData.currentPassword ||
              !formData.newPassword ||
              !formData.confirmPassword ||
              formData.newPassword !== formData.confirmPassword
            }
            className="w-full lg:w-auto bg-[#EC4899] text-white rounded-lg py-2 px-8 hover:bg-[#EC4899]/80 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex gap-1 justify-center"
          >
            <SaveIcon className="lg:w-6 lg:h-6 w-5 h-5" />
            <span className="lg:text-sm text-base">ذخیره</span>
          </button>
        </div>
      </form>
    </div>
  );
}
