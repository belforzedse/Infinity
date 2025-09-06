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
    <div className="col-span-1 space-y-3 px-0.5 lg:col-span-2">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
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
          className="absolute left-0 top-2 flex gap-0.5"
          type="button"
          onClick={handleAddAddress}
        >
          <span className="text-xs text-pink-500">افزودن آدرس</span>
          <CirculePlusIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="w-full">
        <label className="text-base mb-1 block text-right text-foreground-primary lg:text-lg lg:mb-2">
          توضیحات سفارش (در صورت نیاز)
        </label>
        <textarea
          {...register("notes")}
          placeholder="توضیحات سفارش"
          className="text-sm w-full resize-none rounded-lg border border-slate-200 p-2 text-right text-foreground-primary placeholder:text-sm lg:text-lg placeholder:text-foreground-muted focus:outline-none lg:p-3"
          rows={3}
        />
      </div>

      <div className="flex items-center gap-1 rounded-lg bg-pink-50 p-4 lg:p-5">
        <CirculeInformationIcon className="h-6 w-6" />
        <span className="text-sm text-pink-600 lg:text-base">
          برای دریافت فاکتور، بعد از دریافت سفارش به حساب کاربری و صفحه جزئیات
          سفارش سر بزنید
        </span>
      </div>
    </div>
  );
}

export default ShoppingCartBillInformationForm;
