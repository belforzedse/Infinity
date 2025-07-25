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
      <div className="bg-white rounded-lg flex flex-col lg:gap-4 gap-2 p-4">
        <span className="text-xl text-foreground-primary">
          در حال بارگذاری...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg flex flex-col lg:gap-4 gap-2 p-4">
        <span className="text-xl text-red-500">
          خطا در بارگذاری اطلاعات کاربر
        </span>
        <button
          onClick={refetch}
          className="bg-[#EC4899] text-white rounded-lg py-2 px-4 w-fit"
        >
          تلاش مجدد
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg flex flex-col lg:gap-4 gap-2">
      <span className="text-xl text-foreground-primary">
        اطلاعات حساب کاربری
      </span>

      <form onSubmit={handleSubmit} className="flex flex-col lg:gap-6 gap-3">
        <div className="grid lg:grid-cols-2 grid-cols-1 lg:gap-4 gap-3">
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

        <div className="grid lg:grid-cols-2 grid-cols-1 lg:gap-4 gap-3">
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

        <div className="grid lg:grid-cols-2 grid-cols-1 lg:gap-4 gap-3">
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

        <div className="w-full flex items-end justify-end lg:mt-0 mt-2">
          <button
            type="submit"
            className="bg-[#EC4899] text-white rounded-lg lg:py-2 py-2.5 px-8 lg:w-fit w-full justify-center flex items-center gap-1 disabled:bg-pink-300 disabled:cursor-not-allowed"
            disabled={isSaving}
          >
            <SaveIcon className="lg:h-6 lg:w-6 h-5 w-5" />
            <span className="lg:text-sm text-base">
              {isSaving ? "در حال ذخیره..." : "ذخیره تغییرات"}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}
