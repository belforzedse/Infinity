"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getAdminActivityById, AdminActivityLog } from "@/services/super-admin/reports/adminActivity";
import ContentWrapper from "@/components/SuperAdmin/Layout/ContentWrapper";
import { getUserFacingErrorMessage } from "@/utils/userErrorMessage";
import { faNum } from "@/utils/faNum";

const actionTypeMap: Record<string, string> = {
  Create: "ایجاد",
  Update: "بروزرسانی",
  Delete: "حذف",
  Publish: "انتشار",
  Unpublish: "برداشتن انتشار",
  Adjust: "تنظیم",
  Other: "سایر",
};

const logTypeMap: Record<string, string> = {
  Order: "سفارش",
  Product: "محصول",
  User: "کاربر",
  Contract: "قرارداد",
  Discount: "تخفیف",
  Stock: "موجودی",
  Admin: "ادمین",
  Other: "سایر",
};

const severityMap: Record<string, { label: string; color: string }> = {
  info: { label: "اطلاعات", color: "bg-blue-100 text-blue-700" },
  success: { label: "موفق", color: "bg-green-100 text-green-700" },
  warning: { label: "هشدار", color: "bg-yellow-100 text-yellow-700" },
  error: { label: "خطا", color: "bg-red-100 text-red-700" },
};

export default function AdminActivityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id ? Number(params.id) : null;
  const [activity, setActivity] = useState<AdminActivityLog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      router.push("/super-admin/reports/admin-activity");
      return;
    }

    setLoading(true);
    getAdminActivityById(id)
      .then((data) => {
        setActivity(data);
      })
      .catch((error) => {
        console.error("Error fetching admin activity:", error);
        const friendlyError = getUserFacingErrorMessage(error, "خطا در بارگذاری فعالیت");
        alert(`خطا در بارگذاری فعالیت: ${friendlyError}`);
        router.push("/super-admin/reports/admin-activity");
      })
      .finally(() => setLoading(false));
  }, [id, router]);

  if (loading) {
    return (
      <ContentWrapper title="جزئیات فعالیت ادمین">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-pink-500"></div>
            <span className="text-neutral-600">در حال بارگذاری...</span>
          </div>
        </div>
      </ContentWrapper>
    );
  }

  if (!activity) {
    return (
      <ContentWrapper title="جزئیات فعالیت ادمین">
        <div className="rounded-2xl bg-white p-8 text-center">
          <p className="text-neutral-600">فعالیت یافت نشد</p>
          <Link
            href="/super-admin/reports/admin-activity"
            className="mt-4 inline-block text-pink-600 hover:text-pink-700 hover:underline"
          >
            بازگشت به لیست فعالیت‌ها
          </Link>
        </div>
      </ContentWrapper>
    );
  }

  const adminName = activity.PerformedByName || activity.performed_by?.username || activity.performed_by?.email || activity.performed_by?.phone || "نامشخص";
  const adminRole = activity.PerformedByRole || "-";
  const severity = activity.Severity || "info";
  const severityInfo = severityMap[severity] || severityMap.info;

  const getResourceLink = () => {
    if (!activity.ResourceId || !activity.ResourceType) return null;

    switch (activity.ResourceType) {
      case "Order":
        return `/super-admin/orders/${activity.ResourceId}`;
      case "Product":
        return `/super-admin/products/${activity.ResourceId}`;
      case "User":
        return `/super-admin/users/edit/${activity.ResourceId}`;
      default:
        return null;
    }
  };

  const resourceLink = getResourceLink();

  return (
    <ContentWrapper title="جزئیات فعالیت ادمین">
      <div className="space-y-6">
        {/* Back Button */}
        <Link
          href="/super-admin/reports/admin-activity"
          className="inline-flex items-center gap-2 text-pink-600 hover:text-pink-700 hover:underline"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          بازگشت به لیست فعالیت‌ها
        </Link>

        {/* Activity Details Card */}
        <div className="rounded-2xl bg-white p-6">
          <div className="space-y-6">
            {/* Header Section */}
            <div className="flex items-start justify-between border-b border-neutral-200 pb-4">
              <div>
                <h2 className="text-2xl font-bold text-neutral-900">{activity.Title || activity.Description || "فعالیت ادمین"}</h2>
                {activity.Message && (
                  <p className="mt-2 text-neutral-600">{activity.Message}</p>
                )}
              </div>
              <span className={`inline-block rounded-full px-4 py-2 text-sm font-medium ${severityInfo.color}`}>
                {severityInfo.label}
              </span>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-neutral-600">تاریخ و زمان</label>
                <p className="mt-1 text-neutral-900">{new Date(activity.createdAt).toLocaleString("fa-IR")}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-600">نوع فعالیت</label>
                <p className="mt-1">
                  <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                    {actionTypeMap[activity.Action] || activity.Action}
                  </span>
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-600">نوع منبع</label>
                <p className="mt-1">
                  {logTypeMap[activity.ResourceType] || activity.ResourceType}
                  {resourceLink && (
                    <Link
                      href={resourceLink}
                      className="mr-2 text-pink-600 hover:text-pink-700 hover:underline"
                    >
                      (مشاهده #{activity.ResourceId})
                    </Link>
                  )}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-600">شناسه منبع</label>
                <p className="mt-1 text-neutral-900">{activity.ResourceId || "-"}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-600">ادمین</label>
                <p className="mt-1 text-neutral-900">{adminName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-neutral-600">نقش</label>
                <p className="mt-1">
                  <span className="inline-block rounded-full bg-neutral-100 px-3 py-1 text-xs font-medium text-neutral-700">
                    {adminRole}
                  </span>
                </p>
              </div>
              {activity.IP && (
                <div>
                  <label className="text-sm font-medium text-neutral-600">آدرس IP</label>
                  <p className="mt-1 text-neutral-900 font-mono text-sm">{activity.IP}</p>
                </div>
              )}
              {activity.UserAgent && (
                <div>
                  <label className="text-sm font-medium text-neutral-600">مرورگر</label>
                  <p className="mt-1 text-neutral-900 text-sm">{activity.UserAgent}</p>
                </div>
              )}
            </div>

            {/* Changes Section */}
            {activity.Changes && Object.keys(activity.Changes).length > 0 && (
              <div className="border-t border-neutral-200 pt-6">
                <h3 className="mb-4 text-lg font-semibold text-neutral-900">جزئیات تغییرات</h3>
                <div className="space-y-4">
                  {Object.entries(activity.Changes).map(([key, change]) => (
                    <div key={key} className="rounded-lg border border-neutral-200 bg-neutral-50 p-4">
                      <h4 className="mb-2 font-medium text-neutral-900">{key}</h4>
                      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                        <div>
                          <label className="text-xs font-medium text-neutral-600">قبل:</label>
                          <pre className="mt-1 max-h-32 overflow-auto rounded bg-white p-2 text-xs text-neutral-700">
                            {JSON.stringify(change.from, null, 2)}
                          </pre>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-neutral-600">بعد:</label>
                          <pre className="mt-1 max-h-32 overflow-auto rounded bg-white p-2 text-xs text-neutral-700">
                            {JSON.stringify(change.to, null, 2)}
                          </pre>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Metadata Section */}
            {activity.Metadata && Object.keys(activity.Metadata).length > 0 && (
              <div className="border-t border-neutral-200 pt-6">
                <h3 className="mb-4 text-lg font-semibold text-neutral-900">اطلاعات اضافی</h3>
                <pre className="max-h-64 overflow-auto rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
                  {JSON.stringify(activity.Metadata, null, 2)}
                </pre>
              </div>
            )}

            {/* Description Section */}
            {activity.Description && (
              <div className="border-t border-neutral-200 pt-6">
                <h3 className="mb-2 text-lg font-semibold text-neutral-900">توضیحات</h3>
                <p className="text-neutral-600">{activity.Description}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </ContentWrapper>
  );
}



