import { useState, useEffect } from "react";
import Modal from "@/components/Kits/Modal";
import Select from "@/components/Kits/Form/Select";
import CirculePlusIcon from "../Icons/CirculePlusIcon";
import { Option } from "@/components/Kits/Form/Select";
import SaveIcon from "../Icons/SaveIcon";
import UserService from "@/services/user";
import { MeResponse } from "@/services/user/me";
import { AddAddressRequest } from "@/services/user/addresses";
import { getProvinces, getCities, Province, City } from "@/services/location";
import { toast } from "react-hot-toast";

interface Props {
  onAddressAdded?: () => void;
}

export default function AddAddress({ onAddressAdded }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProvince, setSelectedProvince] = useState<Option | null>(null);
  const [selectedCity, setSelectedCity] = useState<Option | null>(null);
  const [postalCode, setPostalCode] = useState("");
  const [details, setDetails] = useState("");
  const [fullAddress, setFullAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState<MeResponse | null>(null);

  // State for province and city data
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);
  const [errorProvinces, setErrorProvinces] = useState<string | null>(null);
  const [errorCities, setErrorCities] = useState<string | null>(null);

  // Fetch user info when the component mounts
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const userInfo = await UserService.me();
        setUserInfo(userInfo);
      } catch (err) {
        console.error("Failed to fetch user info:", err);
      }
    };

    fetchUserInfo();
  }, []);

  // Fetch provinces when the component mounts
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
      if (!selectedProvince) {
        setCities([]);
        return;
      }

      try {
        setLoadingCities(true);
        setErrorCities(null);
        const citiesData = await getCities(Number(selectedProvince.id), {
          sort: "Title:asc",
        });
        setCities(citiesData);
      } catch (err) {
        console.error("Failed to fetch cities:", err);
        setErrorCities("خطا در دریافت شهرها");
      } finally {
        setLoadingCities(false);
      }
    };

    fetchCities();
  }, [selectedProvince]);

  // Convert provinces to select options
  const provinceOptions: Option[] = provinces.map((province) => ({
    id: province.id,
    name: province.attributes.Title,
  }));

  // Convert cities to select options
  const cityOptions: Option[] = cities.map((city) => ({
    id: city.id,
    name: city.attributes.Title,
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCity) {
      toast.error("لطفا شهر را انتخاب کنید");
      return;
    }

    if (!postalCode) {
      toast.error("لطفا کد پستی را وارد کنید");
      return;
    }

    if (!fullAddress) {
      toast.error("لطفا آدرس دقیق را وارد کنید");
      return;
    }

    const addressData: AddAddressRequest = {
      shipping_city: Number(selectedCity.id),
      PostalCode: postalCode,
      FullAddress: fullAddress,
      Description: details || undefined,
    };

    try {
      setLoading(true);
      await UserService.addresses.add(addressData);
      toast.success("آدرس با موفقیت اضافه شد");

      // Reset form fields
      setSelectedProvince(null);
      setSelectedCity(null);
      setPostalCode("");
      setDetails("");
      setFullAddress("");

      // Close modal
      setIsOpen(false);

      // Callback to refresh addresses list
      if (onAddressAdded) {
        onAddressAdded();
      }
    } catch (error: any) {
      console.error("Failed to add address:", error);
      toast.error(error.message || "خطا در اضافه کردن آدرس");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1 text-sm lg:text-base text-primary-600 font-medium"
      >
        <span className="text-sm lg:text-base text-foreground-pink">
          افزودن آدرس
        </span>
        <CirculePlusIcon className="w-5 h-5" />
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <form
          onSubmit={handleSubmit}
          className="grid lg:grid-cols-2 grid-cols-1 gap-3"
        >
          <span className="lg:col-span-2 text-lg lg:text-2xl text-foreground-primary mb-1">
            افزودن آدرس
          </span>

          {/* User Info Display */}
          {userInfo && (
            <div className="col-span-2 flex flex-col lg:flex-row gap-3 bg-slate-50 p-3 rounded-lg mb-2">
              <div className="flex-1">
                <span className="text-sm text-gray-500">
                  نام و نام خانوادگی:
                </span>
                <p className="text-sm font-medium">{`${userInfo.FirstName} ${userInfo.LastName}`}</p>
              </div>
              <div className="flex-1">
                <span className="text-sm text-gray-500">شماره تماس:</span>
                <p className="text-sm font-medium">{userInfo.Phone}</p>
              </div>
            </div>
          )}

          <Select
            label="استان"
            value={selectedProvince}
            onChange={(province) => {
              setSelectedProvince(province);
              setSelectedCity(null);
            }}
            options={provinceOptions}
            placeholder={
              loadingProvinces
                ? "در حال دریافت استان‌ها..."
                : "استان محل سکونت خود را انتخاب نمایید"
            }
            isLoading={loadingProvinces}
            error={errorProvinces || undefined}
            className="col-span-2 lg:col-span-1"
          />

          <Select
            label="شهر"
            value={selectedCity}
            onChange={setSelectedCity}
            options={cityOptions}
            isLoading={loadingCities}
            placeholder={
              !selectedProvince
                ? "لطفا ابتدا استان را انتخاب کنید"
                : loadingCities
                ? "در حال دریافت شهرها..."
                : "شهر محل سکونت خود را انتخاب نمایید"
            }
            error={errorCities || undefined}
            className="col-span-2 lg:col-span-1"
          />

          <div className="flex flex-col gap-1 col-span-2 lg:col-span-1">
            <label className="lg:text-lg text-base text-foreground-primary">
              جزئیات آدرس (اختیاری)
            </label>
            <input
              type="text"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="جزئیات آدرس"
              className="w-full p-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>

          <div className="flex flex-col gap-1 col-span-2 lg:col-span-1">
            <label className="lg:text-lg text-base text-foreground-primary">
              کد پستی
            </label>
            <input
              type="text"
              value={postalCode}
              onChange={(e) =>
                setPostalCode(e.target.value.replace(/\D/g, "").slice(0, 10))
              }
              placeholder="کد پستی ۱۰ رقمی"
              pattern="[0-9]{10}"
              maxLength={10}
              required
              className="w-full p-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
            <span className="text-xs text-gray-500">
              کد پستی باید ۱۰ رقم باشد
            </span>
          </div>

          <div className="flex flex-col gap-1 col-span-2">
            <label className="lg:text-lg text-base text-foreground-primary">
              آدرس دقیق محل سکونت
            </label>
            <textarea
              rows={3}
              value={fullAddress}
              onChange={(e) => setFullAddress(e.target.value)}
              placeholder="آدرس کامل شامل خیابان، کوچه، پلاک و..."
              required
              className="w-full p-3 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 resize-none"
            />
          </div>

          <div className="flex justify-end col-span-2 mt-3">
            <button
              type="submit"
              disabled={loading || !selectedCity}
              className={`bg-foreground-pink text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors flex items-center gap-2 px-8 py-2 lg:w-fit w-full justify-center ${
                loading || !selectedCity ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              <SaveIcon className="w-5 h-5" />
              <span className="lg:text-sm text-base">
                {loading ? "در حال ذخیره..." : "ذخیره آدرس"}
              </span>
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
