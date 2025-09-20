import React, { useState, useEffect } from "react";
import { apiClient } from "@/services";

type Option = {
  label: string;
  value: string;
};

type Province = {
  id: number;
  name: string;
  cities: Array<{
    id: number;
    name: string;
  }>;
};

type Props = {
  provinceValue: string;
  cityValue: string;
  onProvinceChange: (value: string) => void;
  onCityChange: (value: string) => void;
  readOnly?: boolean;
  provincePlaceholder?: string;
  cityPlaceholder?: string;
  formData?: any;
};

export default function ProvinceCityField({
  provinceValue,
  cityValue,
  onProvinceChange,
  onCityChange,
  readOnly,
  provincePlaceholder = "انتخاب استان",
  cityPlaceholder = "انتخاب شهر",
}: Props) {
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [provinceOptions, setProvinceOptions] = useState<Option[]>([]);
  const [cityOptions, setCityOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Fetch provinces with their cities
  const fetchProvinces = async () => {
    try {
      setLoading(true);
      const accessToken = localStorage.getItem("accessToken");
      if (!accessToken) {
        throw new Error("No access token found");
      }

      const response = await apiClient.get("/shipping/province?full=true", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = response.data as {
        total: number;
        currentPage: number;
        totalPages: number;
        posts: Province[];
      };

      return data.posts;
    } catch (error) {
      console.error("Error fetching provinces:", error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Load provinces on initial render
  useEffect(() => {
    fetchProvinces().then((fetchedProvinces) => {
      setProvinces(fetchedProvinces);

      // Create province options for dropdown
      const options = fetchedProvinces.map((province) => ({
        label: province.name,
        value: province.id.toString(),
      }));

      setProvinceOptions(options);
    });
  }, []);

  // Update city options when province changes
  useEffect(() => {
    if (provinceValue) {
      // Find the selected province
      const selectedProvince = provinces.find(
        (province) => province.id.toString() === provinceValue,
      );

      if (selectedProvince && selectedProvince.cities) {
        // Create city options from the selected province's cities
        const options = selectedProvince.cities.map((city) => ({
          label: city.name,
          value: city.id.toString(),
        }));

        setCityOptions(options);
      } else {
        setCityOptions([]);
      }
    } else {
      setCityOptions([]);
    }
  }, [provinceValue, provinces]);

  // Handle province change
  const handleProvinceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProvinceValue = e.target.value;
    onProvinceChange(newProvinceValue);

    // Reset city when province changes
    onCityChange("");
  };

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Province Dropdown */}
      <div className="w-full overflow-hidden rounded-lg border border-neutral-200">
        <div className="relative">
          <select
            className={`text-sm w-full border-l-[20px] border-transparent px-5 py-3 ${
              readOnly ? "bg-slate-100 text-slate-500" : ""
            } ${loading ? "opacity-50" : ""}`}
            disabled={readOnly || loading}
            value={provinceValue}
            onChange={handleProvinceChange}
          >
            <option value="">{provincePlaceholder}</option>
            {provinceOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* City Dropdown */}
      <div className="w-full overflow-hidden rounded-lg border border-neutral-200">
        <div className="relative">
          <select
            className={`text-sm w-full border-l-[20px] border-transparent px-5 py-3 ${
              readOnly ? "bg-slate-100 text-slate-500" : ""
            } ${loading ? "opacity-50" : ""}`}
            disabled={readOnly || !provinceValue || loading}
            value={cityValue}
            onChange={(e) => onCityChange(e.target.value)}
          >
            <option value="">{cityPlaceholder}</option>
            {cityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
