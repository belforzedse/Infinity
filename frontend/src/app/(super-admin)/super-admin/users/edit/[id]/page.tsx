"use client";

import UpsertPageContentWrapper from "@/components/SuperAdmin/UpsertPage/ContentWrapper/index";
import { config } from "./config";
import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useState } from "react";
import UserService from "@/services/user";
import { apiClient } from "@/services";
import { getUserActivities, UserActivity } from "@/services/user-activity";
import Link from "next/link"; 

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
  const [userActivities, setUserActivities] = useState<UserActivity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        // Fetch user data from API
        const _user = await UserService.getDetails(id);

        const userInfo = (_user.user_info || {}) as Record<string, any>;

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

  // Fetch user activities
  useEffect(() => {
    const fetchActivities = async () => {
      if (!id) return;
      try {
        setActivitiesLoading(true);
        const response = await getUserActivities(Number(id), { page: 1, pageSize: 20 });
        setUserActivities(response.data || []);
      } catch (err) {
        console.error("Error fetching user activities:", err);
      } finally {
        setActivitiesLoading(false);
      }
    };
    fetchActivities();
  }, [id]);

  if (isLoading) {
    return <div className="p-8 text-center">Loading user data...</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-6">
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

      {/* User Activities Section */}
      <div className="rounded-2xl bg-white p-6">
        <h2 className="mb-4 text-xl font-bold text-neutral-900">فعالیت‌های کاربر</h2>
        {activitiesLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-pink-500"></div>
          </div>
        ) : userActivities.length === 0 ? (
          <p className="py-8 text-center text-neutral-500">فعالیتی یافت نشد</p>
        ) : (
          <div className="space-y-3">
            {userActivities.map((activity) => (
              <div
                key={activity.id}
                className="rounded-lg border border-neutral-200 bg-neutral-50 p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {activity.Icon && <span className="text-xl">{activity.Icon}</span>}
                      <h3 className="font-medium text-neutral-900">{activity.Title}</h3>
                    </div>
                    <p className="mt-1 text-sm text-neutral-600">{activity.Message}</p>
                    <p className="mt-2 text-xs text-neutral-500">
                      {new Date(activity.createdAt).toLocaleString("fa-IR")}
                    </p>
                  </div>
                  {activity.ResourceType === "order" && activity.ResourceId && (
                    <Link
                      href={`/super-admin/orders/${activity.ResourceId}`}
                      className="text-sm text-pink-600 hover:text-pink-700 hover:underline"
                    >
                      مشاهده سفارش
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
