"use client";

import UpsertPageContentWrapper from "@/components/SuperAdmin/UpsertPage/ContentWrapper/index";
import { config } from "./config";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createUser } from "@/services/super-admin/user/create";
import { refreshTable } from "@/components/SuperAdmin/Table";
import { useSetAtom } from "jotai";
import { apiCache } from "@/lib/api-cache";
import toast from "react-hot-toast";
import type { User } from "../edit/[id]/page";

export default function AddUserPage() {
  const router = useRouter();
  const setRefresh = useSetAtom(refreshTable);
  const [isLoading, setIsLoading] = useState(false);

  // Initial empty user data
  const initialUserData: User = {
    id: "",
    firstname: "",
    lastname: "",
    phone: "",
    role: "",
    password: "",
    birthDate: new Date(),
    nationalCode: "",
    gender: "",
    bio: "",
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
  };

  const handleSubmit = async (data: User) => {
    try {
      setIsLoading(true);

      // Format birthdate as YYYY-MM-DD string if provided
      let birthDateString: string | undefined;
      if (data.birthDate && data.birthDate instanceof Date) {
        const year = data.birthDate.getFullYear();
        const month = String(data.birthDate.getMonth() + 1).padStart(2, "0");
        const day = String(data.birthDate.getDate()).padStart(2, "0");
        birthDateString = `${year}-${month}-${day}`;
      }

      const result = await createUser({
        firstName: data.firstname,
        lastName: data.lastname,
        password: data.password,
        phone: data.phone,
        birthDate: birthDateString,
        nationalCode: data.nationalCode || undefined,
        bio: data.bio || undefined,
        role: data.role ? Number(data.role) : undefined,
      });

      if (result.success && result.data) {
        // Clear user-related cache entries
        apiCache.clearByPattern(/\/api\/users/i);

        // Get the user ID from the response
      const userId = result.data.id || (result.data as any)?.user?.id;

        if (userId) {
          // Trigger table refresh
          setRefresh(true);
          toast.success("کاربر با موفقیت ایجاد شد");
          router.push(`/super-admin/users/edit/${userId}`);
        } else {
          // Fallback to users list
          setRefresh(true);
          toast.success("کاربر با موفقیت ایجاد شد");
          router.push("/super-admin/users");
          router.refresh();
        }
      }
    } catch (error) {
      console.error("Error creating user:", error);
      toast.error("خطا در ایجاد کاربر");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <UpsertPageContentWrapper
      config={config}
      data={initialUserData}
      onSubmit={handleSubmit}
    />
  );
}
