import React, { useEffect, useState } from "react";
import {
  Controller,
  UseFormRegister,
  FieldErrors,
  Control,
  UseFormSetValue,
} from "react-hook-form";
import Input from "@/components/Kits/Form/Input";
import Select, { Option } from "@/components/Kits/Form/Select";
import CirculePlusIcon from "@/components/User/Icons/CirculePlusIcon";
import { FormData } from "./index";
import CirculeInformationIcon from "../Icons/CirculeInformationIcon";
import UserService from "@/services/user";
import { UserAddress } from "@/services/user/addresses";
import { MeResponse } from "@/services/user/me";
import { useRouter } from "next/navigation";

interface Props {
  register: UseFormRegister<FormData>;
  errors: FieldErrors<FormData>;
  control: Control<FormData>;
  setValue: UseFormSetValue<FormData>;
}

function ShoppingCartBillInformationForm({
  register,
  errors,
  control,
  setValue,
}: Props) {
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<MeResponse | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        setLoading(true);
        setError(null);
        const addresses = await UserService.addresses.getAll();
        setAddresses(addresses);
      } catch (err) {
        console.error("Failed to fetch addresses:", err);
        setError("خطا در دریافت آدرس‌ها");
      } finally {
        setLoading(false);
      }
    };

    const fetchUserInfo = async () => {
      try {
        const user = await UserService.me();
        setUserInfo(user);

        // Prefill form with user data
        if (user) {
          setValue("fullName", `${user.FirstName} ${user.LastName}`);
          setValue("phoneNumber", user.Phone);
        }
      } catch (err) {
        console.error("Failed to fetch user info:", err);
      }
    };

    fetchAddresses();
    fetchUserInfo();
  }, [setValue]);

  // Convert addresses to select options
  const addressOptions: Option[] = addresses.map((address) => ({
    id: address.id,
    name: `${address.FullAddress} - ${address.shipping_city.Title}, ${address.shipping_city.shipping_province.Title}`,
  }));

  const handleAddAddress = () => {
    router.push("/addresses");
  };

  return (
    <div className="lg:col-span-2 col-span-1 space-y-3 px-0.5">
      <div className="grid lg:grid-cols-2 grid-cols-1 gap-3">
        <Input
          {...register("fullName")}
          name="fullName"
          placeholder="نام و نام خانوادگی تحویل گیرنده"
          error={errors.fullName?.message?.toString()}
          label="نام و نام خانوادگی"
          readOnly
          className="bg-gray-50"
        />

        <Input
          {...register("phoneNumber")}
          name="phoneNumber"
          placeholder="شماره همراه فعال"
          error={errors.phoneNumber?.message?.toString()}
          pattern="^[0-9]{11}$"
          label="شماره همراه"
          readOnly
          className="bg-gray-50"
        />
      </div>
      <div className="relative">
        <Controller
          name="address"
          control={control}
          rules={{ required: "آدرس الزامی است" }}
          render={({ field: { onChange, value } }) => (
            <Select
              label="آدرس"
              value={value}
              onChange={onChange}
              options={addressOptions}
              placeholder={loading ? "در حال دریافت آدرس‌ها..." : "انتخاب آدرس"}
              isLoading={loading}
              error={error || errors.address?.message?.toString()}
              selectButtonClassName={"!border-slate-200"}
            />
          )}
        />
        <button
          className="absolute top-2 left-0 flex gap-0.5"
          type="button"
          onClick={handleAddAddress}
        >
          <span className="text-pink-500 text-xs">افزودن آدرس</span>
          <CirculePlusIcon className="w-5 h-5" />
        </button>
      </div>

      <div className="w-full">
        <label className="block text-right text-foreground-primary lg:mb-2 mb-1 lg:text-lg text-base">
          توضیحات سفارش (در صورت نیاز)
        </label>
        <textarea
          {...register("notes")}
          placeholder="توضیحات سفارش"
          className="w-full lg:p-3 p-2 text-right border border-slate-200 rounded-lg focus:outline-none text-foreground-primary placeholder:text-foreground-muted placeholder:text-sm lg:text-lg text-sm resize-none"
          rows={3}
        />
      </div>

      <div className="flex items-center gap-1 bg-pink-50 rounded-lg lg:p-5 p-4">
        <CirculeInformationIcon className="w-6 h-6" />
        <span className="text-pink-600 lg:text-base text-sm">
          برای دریافت فاکتور، بعد از دریافت سفارش به حساب کاربری و صفحه جزئیات
          سفارش سر بزنید
        </span>
      </div>
    </div>
  );
}

export default ShoppingCartBillInformationForm;
