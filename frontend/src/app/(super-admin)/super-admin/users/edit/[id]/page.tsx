"use client";

import UpsertPageContentWrapper from "@/components/SuperAdmin/UpsertPage/ContentWrapper/index";
import { config } from "./config";
import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useState } from "react";
import UserService from "@/services/user";
import { apiClient } from "@/services";

export type User = {
  id: string;
  firstname: string;
  lastname: string;
  phone: string;
  role: string;
  password: string;
  birthDate: Date;
  nationalCode: string;
  gender: string;
  bio: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  legacyRoleId?: string | null;
};

export default function Page() {
  const { id } = useParams<{ id: string }>();
  const [userData, setUserData] = useState<User | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revalidate, setRevalidate] = useState(0);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        // Fetch user data from API
        const _user = await UserService.getDetails(id);

        const userInfo = _user.user_info || {};

        const formattedData: User = {
          id: _user.id.toString(),
          bio: userInfo.Bio || "",
          birthDate: userInfo.BirthDate ? new Date(userInfo.BirthDate) : new Date(),
          createdAt: _user.createdAt ? new Date(_user.createdAt) : new Date(),
          gender: userInfo.Sex ? "male" : "female",
          firstname: userInfo.FirstName || "",
          lastname: userInfo.LastName || "",
          password: "",
          phone: _user.phone || "",
          role: _user.role?.id ? _user.role.id.toString() : "",
          updatedAt: _user.updatedAt ? new Date(_user.updatedAt) : new Date(),
          nationalCode: userInfo.NationalCode || "",
          isActive: _user.IsActive ?? false,
          legacyRoleId: _user.user_role?.id ? _user.user_role.id.toString() : null,
        };

        setUserData(formattedData);
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError("Failed to load user data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchUserData();
    }
  }, [id, revalidate]);

  if (isLoading) {
    return <div className="p-8 text-center">Loading user data...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }

  return (
    <UpsertPageContentWrapper
      config={config}
      data={userData}
      onSubmit={async (data) => {
        const localPayload = {
          firstName: data.firstname,
          lastName: data.lastname,
          birthDate: data.birthDate,
          gender: data.gender === "male",
          bio: data.bio,
          isActive: data.isActive,
          nationalCode: data.nationalCode,
          role: userData?.legacyRoleId ?? undefined,
        };

        try {
          setIsLoading(true);
          await Promise.all([
            apiClient.put(`/users/${id}`, {
              ...(data.role ? { role: Number(data.role) } : {}),
              IsActive: data.isActive,
            }),
            apiClient.put(`/sp/local-users/${id}`, localPayload),
          ]);
          setRevalidate((prev) => prev + 1);
        } catch (err) {
          console.error("Failed to update user:", err);
          setError("خطا در بروزرسانی اطلاعات کاربر");
        } finally {
          setIsLoading(false);
        }
      }}
    />
  );
}
