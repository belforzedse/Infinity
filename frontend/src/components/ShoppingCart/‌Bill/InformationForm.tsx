import React, { useEffect, useState } from "react";
import type {
  UseFormRegister,
  FieldErrors,
  Control,
  UseFormSetValue} from "react-hook-form";
import {
  Controller
} from "react-hook-form";
import { useAtom } from "jotai";
import Input from "@/components/Kits/Form/Input";
import type { Option } from "@/components/Kits/Form/Select";
import Select from "@/components/Kits/Form/Select";
import CirculePlusIcon from "@/components/User/Icons/CirculePlusIcon";
import type { FormData } from "./index";
import CirculeInformationIcon from "../Icons/CirculeInformationIcon";
import UserService from "@/services/user";
import type { UserAddress } from "@/services/user/addresses";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { extractErrorMessage, translateErrorMessage } from "@/lib/errorTranslations";
import { addressesAtom, addressesLoadingAtom, addressesErrorAtom } from "@/atoms/addressesAtom";

interface Props {
  register: UseFormRegister<FormData>;
  errors: FieldErrors<FormData>;
  control: Control<FormData>;
  setValue: UseFormSetValue<FormData>;
}

function ShoppingCartBillInformationForm({ register, errors, control, setValue }: Props) {
  // Use global addresses atom for real-time updates
  const [addresses, setAddresses] = useAtom(addressesAtom);
  const [loading, setLoading] = useAtom(addressesLoadingAtom);
  const [error, setError] = useAtom(addressesErrorAtom);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchAddresses = async () => {
      // Only fetch if atom is empty (initial load)
      if (addresses.length > 0) return;

      try {
        setLoading(true);
        setError(null);
        const fetchedAddresses = await UserService.addresses.getAll();
        setAddresses(fetchedAddresses);
      } catch (err: any) {
        console.error("Failed to fetch addresses:", err);
        const rawErrorMessage = extractErrorMessage(err);
        const message = translateErrorMessage(rawErrorMessage, "خطا در دریافت آدرس‌ها");
        setError(message);
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
      } catch (err: any) {
        console.error("Failed to fetch user info:", err);
        const rawErrorMessage = extractErrorMessage(err);
        const message = translateErrorMessage(rawErrorMessage, "خطا در دریافت اطلاعات کاربری");
        toast.error(message);
      }
    };

    fetchAddresses();
    fetchUserInfo();
  }, [setValue, addresses.length, setAddresses, setLoading, setError]);

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
        />

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-sm font-medium text-gray-700">شماره همراه</label>
            <button
              type="button"
              onClick={() => setIsEditingPhone(!isEditingPhone)}
              className="text-xs text-blue-600 hover:text-blue-700 underline"
            >
              {isEditingPhone ? "انصراف" : "ویرایش"}
            </button>
          </div>
          <Input
            {...register("phoneNumber")}
            name="phoneNumber"
            placeholder="شماره همراه فعال"
            error={errors.phoneNumber?.message?.toString()}
            pattern="^[0-9]{11}$"
            disabled={!isEditingPhone}
            maxLength={11}
          />
        </div>
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
          برای دریافت فاکتور، بعد از دریافت سفارش به حساب کاربری و صفحه جزئیات سفارش سر بزنید
        </span>
      </div>
    </div>
  );
}

export default ShoppingCartBillInformationForm;
