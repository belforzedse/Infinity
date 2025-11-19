"use client";
import type { FormEvent, ChangeEvent } from "react";
import { useState, useEffect } from "react";
import Input from "@/components/Kits/Form/Input";
import SaveIcon from "../Icons/SaveIcon";
import CalenderIcon from "../Icons/CalenderIcon";
import useUser from "@/hooks/useUser";
import { updateProfile } from "@/services/user/updateProfile";
import { toast } from "react-hot-toast";
import { extractErrorMessage, translateErrorMessage } from "@/lib/errorTranslations";
interface AccountFormData {
  firstName: string;
  lastName: string;
  nationalId: string;
  phone: string;
  birthYear: string;
  birthMonth: string;
  birthDay: string;
  gender: "male" | "female" | "";
}

const parseBirthDate = (value?: string | null) => {
  if (!value) {
    return { birthYear: "", birthMonth: "", birthDay: "" };
  }

  const digits = value.split(/[^\d]/).filter(Boolean);
  if (digits.length === 3) {
    if (digits[0].length === 4) {
      return { birthYear: digits[0], birthMonth: digits[1], birthDay: digits[2] };
    }
    if (digits[2].length === 4) {
      return { birthYear: digits[2], birthMonth: digits[1], birthDay: digits[0] };
    }
  }

  return { birthYear: "", birthMonth: "", birthDay: "" };
};

const formatBirthDate = (year: string, month: string, day: string): string | null => {
  if (!year || !month || !day) return null;
  const y = year.padStart(4, "0");
  const m = month.padStart(2, "0");
  const d = day.padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export default function AccountForm() {
  const { userData, isLoading, error, refetch } = useUser();
  const [formData, setFormData] = useState<AccountFormData>({
    firstName: "",
    lastName: "",
    nationalId: "",
    phone: "",
    birthYear: "",
    birthMonth: "",
    birthDay: "",
    gender: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Mark component as hydrated to prevent hydration mismatches with loading state
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Update form when user data is loaded
  useEffect(() => {
    if (userData) {
      const { birthYear, birthMonth, birthDay } = parseBirthDate(userData.BirthDate);
      setFormData({
        firstName: userData.FirstName || "",
        lastName: userData.LastName || "",
        nationalId: userData.NationalCode || "",
        phone: userData.Phone || "",
        birthYear,
        birthMonth,
        birthDay,
        gender: (userData.Sex as "male" | "female" | "") || "",
      });
    }
  }, [userData]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      setIsSaving(true);

      const formattedBirthDate = formatBirthDate(
        formData.birthYear,
        formData.birthMonth,
        formData.birthDay,
      );

      await updateProfile({
        FirstName: formData.firstName,
        LastName: formData.lastName,
        NationalCode: formData.nationalId,
        Phone: formData.phone,
        BirthDate: formattedBirthDate ?? userData?.BirthDate ?? undefined,
        Sex: (formData.gender || null) as any,
      });

      // Refresh user data
      await refetch();

      toast.success("اطلاعات حساب کاربری با موفقیت بروزرسانی شد");
    } catch (error: any) {
      console.error("Error updating profile:", error);
      const rawErrorMessage = extractErrorMessage(error);
      const message = translateErrorMessage(rawErrorMessage, "خطا در بروزرسانی اطلاعات");
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (name: keyof AccountFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Only show loading/error states after hydration to prevent mismatches
  if (isHydrated && isLoading) {
    return (
      <div className="flex flex-col gap-4 rounded-lg bg-white p-6 shadow-sm">
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-pink-600 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  if (isHydrated && error) {
    return (
      <div className="flex flex-col gap-4 rounded-lg bg-white p-6 shadow-sm">
        <span className="text-lg font-medium text-red-600">خطا در بارگذاری اطلاعات کاربر</span>
        <button
          onClick={refetch}
          className="w-fit rounded-lg bg-[#EC4899] px-6 py-2.5 text-sm font-medium text-white hover:bg-pink-600 transition-colors"
        >
          تلاش مجدد
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 rounded-lg bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-foreground-primary">اطلاعات حساب کاربری</h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Input
            label="نام"
            name="firstName"
            value={formData.firstName}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              handleInputChange("firstName", e.target.value)
            }
            placeholder="نام"
          />

          <Input
            label="نام خانوادگی"
            name="lastName"
            value={formData.lastName}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              handleInputChange("lastName", e.target.value)
            }
            placeholder="نام خانوادگی"
          />
        </div>

        <div>
          <Input
            label="شماره همراه"
            name="phone"
            type="tel"
            value={formData.phone}
            placeholder="09122034113"
            dir="ltr"
            disabled={true}
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-foreground-primary">
            تاریخ تولد
          </label>
          <div className="flex gap-2">
            <Input
              label=""
              name="birthYear"
              type="number"
              value={formData.birthYear}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                handleInputChange("birthYear", e.target.value)
              }
              placeholder="سال"
              min="1300"
              max="1500"
            />
            <Input
              label=""
              name="birthMonth"
              type="number"
              value={formData.birthMonth}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                handleInputChange("birthMonth", e.target.value)
              }
              placeholder="ماه"
              min="1"
              max="12"
            />
            <Input
              label=""
              name="birthDay"
              type="number"
              value={formData.birthDay}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                handleInputChange("birthDay", e.target.value)
              }
              placeholder="روز"
              min="1"
              max="31"
              icon={<CalenderIcon />}
              onIconClick={() => {}}
            />
          </div>
        </div>

        <div className="flex w-full justify-end border-t border-neutral-200 pt-6">
          <button
            type="submit"
            className="flex items-center justify-center gap-2 rounded-lg bg-[#EC4899] px-8 py-3 text-sm font-medium text-white transition-all hover:bg-pink-600 disabled:cursor-not-allowed disabled:bg-pink-300 disabled:hover:bg-pink-300"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                <span>در حال ذخیره...</span>
              </>
            ) : (
              <>
                <SaveIcon className="h-5 w-5" />
                <span>ذخیره تغییرات</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
