import React, { useEffect, useState, useMemo } from "react";
import type { UseFormRegister, FieldErrors, Control, UseFormSetValue } from "react-hook-form";
import { Controller, useWatch } from "react-hook-form";
import { useAtom, useAtomValue } from "jotai";
import Input from "@/components/Kits/Form/Input";
import type { Option } from "@/components/Kits/Form/Select";
import Select from "@/components/Kits/Form/Select";
import CirculePlusIcon from "@/components/User/Icons/CirculePlusIcon";
import type { FormData } from "./index";
import CirculeInformationIcon from "../Icons/CirculeInformationIcon";
import UserService from "@/services/user";
import type { UserAddress } from "@/services/user/addresses";
import toast from "react-hot-toast";
import { extractErrorMessage, translateErrorMessage } from "@/lib/errorTranslations";
import { addressesAtom, addressesLoadingAtom, addressesErrorAtom } from "@/atoms/addressesAtom";
import AddAddress from "@/components/User/Address/AddAddress";
import { getProvinces, getCities } from "@/services/location";
import type { Province, City } from "@/services/location";
import { currentUserAtom } from "@/lib/atoms/auth";

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
  const currentUser = useAtomValue(currentUserAtom);
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [isAddAddressModalOpen, setIsAddAddressModalOpen] = useState(false);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [errorProvinces, setErrorProvinces] = useState<string | null>(null);
  const [errorCities, setErrorCities] = useState<string | null>(null);
  const [lastProvinceId, setLastProvinceId] = useState<number | null>(null);
  const lastHydratedAddressIdRef = React.useRef<number | null>(null);

  useEffect(() => {
    const fetchAddresses = async () => {
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

    // Fetch addresses on mount
    fetchAddresses();

    // Refetch addresses when page becomes visible (user returns from another tab/page)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchAddresses();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [setAddresses, setLoading, setError]);

  useEffect(() => {
    const applyUserInfo = (user: { FirstName?: string; LastName?: string; Phone?: string }) => {
      const fullName = [user.FirstName || "", user.LastName || ""].join(" ").trim();
      if (fullName) setValue("fullName", fullName);
      if (user.Phone) setValue("phoneNumber", user.Phone);
    };

    if (currentUser) {
      applyUserInfo(currentUser as unknown as { FirstName?: string; LastName?: string; Phone?: string });
      return;
    }

    if (typeof window !== "undefined" && !localStorage.getItem("accessToken")) {
      return;
    }

    const fetchUserInfo = async () => {
      try {
        const user = await UserService.me();
        if (user) applyUserInfo(user);
      } catch (err: any) {
        console.error("Failed to fetch user info:", err);
        const rawErrorMessage = extractErrorMessage(err);
        const message = translateErrorMessage(rawErrorMessage, "خطا در دریافت اطلاعات کاربری");
        toast.error(message);
      }
    };

    fetchUserInfo();
  }, [currentUser, setValue]);

  // Watch the current address value from the form
  const selectedAddress = useWatch({ control, name: "address" });
  const selectedProvince = useWatch({ control, name: "province" });

  // Clear form value if selected address was deleted
  useEffect(() => {
    if (selectedAddress && selectedAddress.id) {
      const addressExists = addresses.some((addr) => addr.id === selectedAddress.id);
      if (!addressExists) {
        // Selected address was deleted, clear the form value
        setValue("address", null);
      }
    }
  }, [addresses, selectedAddress, setValue]);

  // Fetch provinces on mount
  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        setLoadingProvinces(true);
        setErrorProvinces(null);
        const provincesData = await getProvinces({ sort: "Title:asc" });
        setProvinces(provincesData);
      } catch (err) {
        console.error("Failed to fetch provinces:", err);
        setErrorProvinces("خطا در دریافت استان‌ها");
      } finally {
        setLoadingProvinces(false);
      }
    };

    fetchProvinces();
  }, []);

  // Fetch cities when province changes
  useEffect(() => {
    const fetchCities = async () => {
      const provinceId = selectedProvince?.id ? Number(selectedProvince.id) : null;

      if (!provinceId) {
        setCities([]);
        setLastProvinceId(null);
        return;
      }

      if (lastProvinceId === provinceId) {
        // Already loaded for this province
        return;
      }

      try {
        setLoadingCities(true);
        setErrorCities(null);
        const citiesData = await getCities(provinceId, { sort: "Title:asc" });
        setCities(citiesData);
        setLastProvinceId(provinceId);
      } catch (err) {
        console.error("Failed to fetch cities:", err);
        setErrorCities("خطا در دریافت شهرها");
      } finally {
        setLoadingCities(false);
      }
    };

    fetchCities();
  }, [selectedProvince, lastProvinceId]);

  // Convert addresses to select options with useMemo to ensure reactivity
  const addressOptions: Option[] = useMemo(() => {
    return addresses
      .filter((address) => {
        // Only include addresses with complete data structure
        return (
          address?.shipping_city?.Title &&
          address?.shipping_city?.shipping_province?.Title
        );
      })
      .map((address) => ({
        id: address.id,
        name: `${address.FullAddress} - ${address.shipping_city.Title}, ${address.shipping_city.shipping_province.Title}`,
      }));
  }, [addresses]);

  const provinceOptions: Option[] = useMemo(
    () =>
      provinces.map((province) => ({
        id: province.id,
        name: province.attributes.Title,
      })),
    [provinces],
  );

  const cityOptions: Option[] = useMemo(
    () =>
      cities.map((city) => ({
        id: city.id,
        name: city.attributes.Title,
      })),
    [cities],
  );

  const handleAddAddress = () => {
    setIsAddAddressModalOpen(true);
  };

  const handleAddressAdded = async () => {
    // Refetch addresses to ensure we have the latest data
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

  // Auto-fill inline fields when a saved address is chosen
  useEffect(() => {
    if (!selectedAddress?.id) return;
    if (lastHydratedAddressIdRef.current === selectedAddress.id) return;

    const matched = addresses.find((addr) => addr.id === selectedAddress.id);
    if (!matched) return;

    const provinceId = matched.shipping_city?.shipping_province?.id;
    const provinceName = matched.shipping_city?.shipping_province?.Title;
    if (provinceId && provinceName) {
      setValue("province", { id: provinceId, name: provinceName });
    }
    if (!cities.find((city) => city.id === matched.shipping_city.id)) {
      setCities((prev) => [
        ...prev,
        {
          id: matched.shipping_city.id,
          attributes: {
            Title: matched.shipping_city.Title,
            Code: (matched.shipping_city as any).Code || "",
            createdAt: "",
            updatedAt: "",
            shipping_province: {
              data: {
                id: provinceId || 0,
                attributes: { Title: provinceName || "" },
              },
            },
          },
        },
      ]);
    }
    setValue("city", {
      id: matched.shipping_city.id,
      name: matched.shipping_city.Title,
    });
    setValue("postalCode", matched.PostalCode || "");
    setValue("fullAddress", matched.FullAddress || "");
    setValue("addressDescription", matched.Description || "");
    setValue("saveAddress", false);
    lastHydratedAddressIdRef.current = matched.id;
  }, [addresses, selectedAddress, setValue]);

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
          render={({ field: { onChange, value } }) => (
            <Select
              key={`address-select-${addresses.length}-${addressOptions.length}`}
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
          <span className="text-xs text-infinity-primary">افزودن آدرس</span>
          <CirculePlusIcon className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Controller
          name="province"
          control={control}
          render={({ field: { onChange, value } }) => (
            <Select
              label="استان"
              value={value}
              onChange={(val) => {
                onChange(val);
                // Reset city when province changes
                setValue("city", null);
              }}
              options={provinceOptions}
              placeholder={
                loadingProvinces ? "در حال دریافت استان‌ها..." : "استان محل سکونت را انتخاب کنید"
              }
              isLoading={loadingProvinces}
              error={errorProvinces || undefined}
              selectButtonClassName="!border-slate-200"
            />
          )}
        />

        <Controller
          name="city"
          control={control}
          render={({ field: { onChange, value } }) => (
            <Select
              label="شهر"
              value={value}
              onChange={onChange}
              options={cityOptions}
              placeholder={
                !selectedProvince
                  ? "لطفا ابتدا استان را انتخاب کنید"
                  : loadingCities
                    ? "در حال دریافت شهرها..."
                    : "شهر محل سکونت را انتخاب کنید"
              }
              isLoading={loadingCities}
              error={errorCities || undefined}
              selectButtonClassName="!border-slate-200"
            />
          )}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Input
          {...register("postalCode", {
            onChange: (e) => {
              const next = e.target.value.replace(/\D/g, "").slice(0, 10);
              setValue("postalCode", next);
            },
          })}
          name="postalCode"
          placeholder="کد پستی ۱۰ رقمی"
          label="کد پستی"
          maxLength={10}
          inputMode="numeric"
        />

        <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
          <input
            type="checkbox"
            id="saveAddress"
            className="h-4 w-4 accent-infinity-primary"
            {...register("saveAddress")}
          />
          <label htmlFor="saveAddress" className="text-sm text-neutral-700">
            ذخیره این آدرس برای خریدهای بعدی
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">آدرس کامل</label>
          <textarea
            {...register("fullAddress")}
            placeholder="آدرس کامل شامل خیابان، کوچه، پلاک و..."
            className="text-sm w-full resize-none rounded-lg border border-slate-200 p-2 text-right text-foreground-primary placeholder:text-sm lg:text-lg placeholder:text-foreground-muted focus:outline-none lg:p-3"
            rows={3}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">توضیح آدرس (اختیاری)</label>
          <textarea
            {...register("addressDescription")}
            placeholder="توضیح یا نشانه‌ای برای آدرس"
            className="text-sm w-full resize-none rounded-lg border border-slate-200 p-2 text-right text-foreground-primary placeholder:text-sm lg:text-lg placeholder:text-foreground-muted focus:outline-none lg:p-3"
            rows={2}
          />
        </div>
      </div>

      {/* Add Address Modal */}
      <AddAddress
        isOpen={isAddAddressModalOpen}
        onOpenChange={setIsAddAddressModalOpen}
        showButton={false}
        onAddressAdded={handleAddressAdded}
      />

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

      <div className="flex items-center gap-1 rounded-lg bg-infinity-primary-lighter/20 p-4 lg:p-5">
        <CirculeInformationIcon className="h-6 w-6" />
        <span className="text-sm text-infinity-primary lg:text-base">
          برای دریافت فاکتور، بعد از دریافت سفارش به حساب کاربری و صفحه جزئیات سفارش سر بزنید
        </span>
      </div>
    </div>
  );
}

export default ShoppingCartBillInformationForm;
