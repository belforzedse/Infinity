"use client";

import UpsertPageContentWrapper from "@/components/SuperAdmin/UpsertPage/ContentWrapper/index";
import { config } from "./config";
import { useEffect, useRef } from "react";
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

        // Handle potentially null user_info and user_role
        const { user_info, user_role, ...user } = _user.attributes;

        // Default values in case data is null
        const userInfo = user_info?.data?.attributes || {};
        const roleId = user_role?.data?.id || null;

        // Convert string dates to Date objects
        const formattedData: User = {
          id: _user.id.toString(),
          bio: userInfo.Bio || "",
          birthDate: userInfo.BirthDate
            ? new Date(userInfo.BirthDate)
            : new Date(),
          createdAt: new Date(user.createdAt),
          gender: userInfo.Sex ? "male" : "female",
          firstname: userInfo.FirstName,
          lastname: userInfo.LastName,
          password: "1234",
          phone: user.Phone,
          role: roleId?.toString() || "",
          updatedAt: new Date(user.updatedAt),
          nationalCode: userInfo.NationalCode || "",
          isActive: user.IsActive,
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
        const body = {
          firstName: data.firstname,
          lastName: data.lastname,
          birthDate: data.birthDate,
          gender: data.gender === "male" ? true : false,
          bio: data.bio,
          isActive: data.isActive,
          nationalCode: data.nationalCode,
          role: data.role,
        };

        setIsLoading(true);
        await apiClient.put(`/sp/local-users/${id}`, body, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        });
        setIsLoading(false);
        setRevalidate(revalidate + 1);
      }}
    />
  );
}
