"use client";
import { useState, FormEvent, ChangeEvent, useEffect } from "react";
import Input from "@/components/Kits/Form/Input";
import { RadioGroup } from "@/components/Kits/Form/RadioButton";
import SaveIcon from "../Icons/SaveIcon";
import CalenderIcon from "../Icons/CalenderIcon";
import { GENDER_OPTIONS } from "./constants";
import useUser from "@/hooks/useUser";
import { updateProfile } from "@/services/user/updateProfile";
import { toast } from "react-hot-toast";

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
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("خطا در بروزرسانی اطلاعات");
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
      <div className="flex flex-col gap-2 rounded-lg bg-white p-4 lg:gap-4">
        <span className="text-xl text-foreground-primary">
          در حال بارگذاری...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col gap-2 rounded-lg bg-white p-4 lg:gap-4">
        <span className="text-xl text-red-500">
          خطا در بارگذاری اطلاعات کاربر
        </span>
        <button
          onClick={refetch}
          className="w-fit rounded-lg bg-[#EC4899] px-4 py-2 text-white"
        >
          تلاش مجدد
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg bg-white lg:gap-4">
      <span className="text-xl text-foreground-primary">
        اطلاعات حساب کاربری
      </span>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3 lg:gap-6">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4">
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

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4">
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
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              handleInputChange("phone", e.target.value)
            }
            placeholder="09122034113"
            dir="ltr"
            disabled={true} // Phone number should not be editable
          />
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:gap-4">
          <Input
            label="تاریخ تولد"
            name="birthDate"
            value={formData.birthDate}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              handleInputChange("birthDate", e.target.value)
            }
            placeholder="1370/06/23"
            icon={<CalenderIcon />}
            onIconClick={() => {
              console.log("clicked");
            }}
          />

          <RadioGroup
            label="جنسیت"
            name="gender"
            options={GENDER_OPTIONS}
            value={formData.gender}
            onChange={handleGenderChange}
          />
        </div>

        <div className="mt-2 flex w-full items-end justify-end lg:mt-0">
          <button
            type="submit"
            className="flex w-full items-center justify-center gap-1 rounded-lg bg-[#EC4899] px-8 py-2.5 text-white disabled:cursor-not-allowed disabled:bg-pink-300 lg:w-fit lg:py-2"
            disabled={isSaving}
          >
            <SaveIcon className="h-5 w-5 lg:h-6 lg:w-6" />
            <span className="text-base lg:text-sm">
              {isSaving ? "در حال ذخیره..." : "ذخیره تغییرات"}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}
