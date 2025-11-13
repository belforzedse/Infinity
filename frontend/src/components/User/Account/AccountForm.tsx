"use client";
import type { FormEvent, ChangeEvent} from "react";
import { useState, useEffect } from "react";
import Input from "@/components/Kits/Form/Input";
import { RadioGroup } from "@/components/Kits/Form/RadioButton";
import SaveIcon from "../Icons/SaveIcon";
import CalenderIcon from "../Icons/CalenderIcon";
import { GENDER_OPTIONS } from "./constants";
import useUser from "@/hooks/useUser";
import { updateProfile } from "@/services/user/updateProfile";
import { toast } from "react-hot-toast";
import { extractErrorMessage, translateErrorMessage } from "@/lib/errorTranslations";

interface AccountFormData {
  firstName: string;
  lastName: string;
  nationalId: string;
  phone: string;
  birthDate: string;
  gender: "male" | "female" | "";
}

export default function AccountForm() {
  const { userData, isLoading, error, refetch } = useUser();
  const [formData, setFormData] = useState<AccountFormData>({
    firstName: "",
    lastName: "",
    nationalId: "",
    phone: "",
    birthDate: "",
    gender: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  // Update form when user data is loaded
  useEffect(() => {
    if (userData) {
      setFormData({
        firstName: userData.FirstName || "",
        lastName: userData.LastName || "",
        nationalId: userData.NationalCode || "",
        phone: userData.Phone || "",
        birthDate: userData.BirthDate || "",
        gender: (userData.Sex as "male" | "female" | "") || "",
      });
    }
  }, [userData]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      setIsSaving(true);

      await updateProfile({
        FirstName: formData.firstName,
        LastName: formData.lastName,
        NationalCode: formData.nationalId,
        Phone: formData.phone,
        BirthDate: formData.birthDate,
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

  const handleGenderChange = (e: ChangeEvent<HTMLInputElement>) => {
    handleInputChange("gender", e.target.value as "male" | "female");
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4 rounded-lg bg-white p-6 shadow-sm">
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-pink-600 border-t-transparent"></div>
        </div>
      </div>
    );
  }

  if (error) {
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

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Input
            label="کد ملی"
            name="nationalId"
            value={formData.nationalId}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              handleInputChange("nationalId", e.target.value)
            }
            placeholder="0543758236"
            maxLength={10}
            pattern="[0-9]{10}"
          />
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

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Input
            label="تاریخ تولد"
            name="birthDate"
            value={formData.birthDate}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              handleInputChange("birthDate", e.target.value)
            }
            placeholder="1370/06/23"
            icon={<CalenderIcon />}
            onIconClick={() => {}}
          />

          <RadioGroup
            label="جنسیت"
            name="gender"
            options={GENDER_OPTIONS}
            value={formData.gender}
            onChange={handleGenderChange}
          />
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
