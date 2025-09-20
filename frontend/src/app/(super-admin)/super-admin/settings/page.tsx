"use client";

import UpsertPageContentWrapper from "@/components/SuperAdmin/UpsertPage/ContentWrapper";
import { config } from "./config";
import { useEffect, useState } from "react";
import { getSuperAdminSettings } from "@/services/super-admin/settings/get";
import { updateSuperAdminSettings } from "@/services/super-admin/settings/update";
import { SuperAdminSettings } from "@/types/super-admin/settings";
import { toast } from "react-hot-toast";

export default function SettingsPage() {
  const [data, setData] = useState<SuperAdminSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      try {
        const s = await getSuperAdminSettings();
        setData(s);
      } catch (e) {
        console.error(e);
        toast.error("خطا در دریافت تنظیمات");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) return <div>در حال بارگذاری...</div>;
  if (!data) return <div>تنظیمات یافت نشد</div>;

  return (
    <UpsertPageContentWrapper
      config={config}
      data={data}
      onSubmit={async (formData) => {
        try {
          await updateSuperAdminSettings({
            filterPublicProductsByTitle: Boolean(formData.filterPublicProductsByTitle),
          });
          toast.success("تنظیمات با موفقیت بروزرسانی شد");
          const refreshed = await getSuperAdminSettings();
          setData(refreshed);
        } catch (e) {
          console.error(e);
          toast.error("خطا در ذخیره تنظیمات");
        }
      }}
    />
  );
}
