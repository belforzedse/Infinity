"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getAdminActivity, AdminActivityLog } from "@/services/super-admin/reports/adminActivity";
import { DatePicker } from "zaman";
import ContentWrapper from "@/components/SuperAdmin/Layout/ContentWrapper";
import { faNum } from "@/utils/faNum";
import { getUserFacingErrorMessage } from "@/utils/userErrorMessage";

// Translation helpers for Persian
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

const descriptionMap: Record<string, string> = {
  // Orders
  "Order created": "سفارش ایجاد شد",
  "Order updated": "سفارش بروزرسانی شد",
  "Order deleted": "سفارش حذف شد",
  // Products
  "Product created": "محصول ایجاد شد",
  "Product updated": "محصول بروزرسانی شد",
  "Product deleted": "محصول حذف شد",
  // Users
  "Local user created": "کاربر ایجاد شد",
  "Local user updated": "کاربر بروزرسانی شد",
  "Local user deleted": "کاربر حذف شد",
  // Contracts
  "Contract created": "قرارداد ایجاد شد",
  "Contract updated": "قرارداد بروزرسانی شد",
  "Contract deleted": "قرارداد حذف شد",
};

function translateDescription(description: string): string {
  return descriptionMap[description] || description;
}

export default function AdminActivityReportPage() {
  const [start, setStart] = useState<Date>(new Date(Date.now() - 30 * 86400000));
  const [end, setEnd] = useState<Date>(new Date());
  const [activities, setActivities] = useState<AdminActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [selectedActionType, setSelectedActionType] = useState<string>("");
  const [selectedLogType, setSelectedLogType] = useState<string>("All");
  const [adminUsers, setAdminUsers] = useState<string[]>([]);
  const [showSystemActivities, setShowSystemActivities] = useState(false);

  // Excel export function
  const exportToExcel = useCallback(async (data: AdminActivityLog[], startDate: Date, endDate: Date) => {
    if (!data || data.length === 0) {
      alert("داده‌ای برای خروجی وجود ندارد");
      return;
    }

    try {
      let XLSX;
      try {
        XLSX = await import("xlsx");
      } catch {
        try {
          XLSX = (await import("xlsx")).default;
        } catch {
          throw new Error("xlsx package not found");
        }
      }

      // Prepare data for Excel export
      const exportData = data.map((row, index) => ({
        رتبه: index + 1,
        "نام ادمین": row.PerformedByName || row.performed_by?.username || row.performed_by?.email || row.performed_by?.phone || "نامشخص",
        "نقش ادمین": row.PerformedByRole || "نامشخص",
        "نوع گزارش": logTypeMap[row.ResourceType] || row.ResourceType || "نامشخص",
        "نوع فعالیت": actionTypeMap[row.Action] || row.Action || "نامشخص",
        "عنوان": row.Title || translateDescription(row.Description || ""),
        "آدرس IP": row.IP || "",
        "تاریخ و زمان": new Date(row.createdAt).toLocaleString("fa-IR"),
      }));

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Set column widths
      ws["!cols"] = [
        { wch: 8 },   // رتبه
        { wch: 20 },  // نام ادمین
        { wch: 15 },  // نقش ادمین
        { wch: 15 },  // نوع گزارش
        { wch: 15 },  // نوع فعالیت
        { wch: 30 },  // توضیحات
        { wch: 18 },  // آدرس IP
        { wch: 20 },  // تاریخ و زمان
      ];

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "گزارش فعالیت ادمین");

      // Add metadata sheet
      const metaData = [
        { شرح: "تاریخ شروع", مقدار: startDate.toLocaleDateString("fa-IR") },
        { شرح: "تاریخ پایان", مقدار: endDate.toLocaleDateString("fa-IR") },
        {
          شرح: "تاریخ تهیه گزارش",
          مقدار: new Date().toLocaleDateString("fa-IR"),
        },
        { شرح: "تعداد فعالیت‌ها", مقدار: String(data.length) },
      ];

      const metaWs = XLSX.utils.json_to_sheet(metaData);
      metaWs["!cols"] = [{ wch: 20 }, { wch: 30 }];
      XLSX.utils.book_append_sheet(wb, metaWs, "اطلاعات گزارش");

      // Generate filename
      const filename = `گزارش-فعالیت-ادمین-${startDate.toLocaleDateString("fa-IR").replace(/\//g, "-")}-تا-${endDate.toLocaleDateString("fa-IR").replace(/\//g, "-")}.xlsx`;

      // Download file
      XLSX.writeFile(wb, filename);

      alert("فایل Excel با موفقیت ایجاد شد!");
    } catch (error: unknown) {
      console.error("Error exporting to Excel:", error);

      if (error instanceof Error && error.message.includes("xlsx package not found")) {
        alert("پکیج xlsx یافت نشد. لطفاً دستور زیر را اجرا کنید:\nnpm install xlsx");
      } else {
        const friendlyError = getUserFacingErrorMessage(error, "خطا در ایجاد فایل Excel");
        alert(`خطا در ایجاد فایل Excel: ${friendlyError}`);
      }
    }
  }, []);

  const isValid = (d: Date) => d instanceof Date && !isNaN(d.getTime());
  const toISO = useCallback(
    (d: Date, fallback: Date) => (isValid(d) ? d.toISOString() : fallback.toISOString()),
    [],
  );
  const startISO = useMemo(
    () => toISO(start, new Date(Date.now() - 30 * 86400000)),
    [start, toISO],
  );
  const endISO = useMemo(() => toISO(end, new Date()), [end, toISO]);

  const normalizeDateInput = (d: any, prev: Date): Date => {
    if (d instanceof Date) return d;
    if (d && d.value instanceof Date) return d.value;
    const nd = new Date(d);
    return isValid(nd) ? nd : prev;
  };

  // Fetch data
  useEffect(() => {
    setLoading(true);
    getAdminActivity({
      startDate: startISO,
      endDate: endISO,
      performedBy: selectedUser ? Number(selectedUser) : undefined,
      logType: selectedLogType !== "All" ? selectedLogType : undefined,
      actionType: selectedActionType || undefined,
      page: 1,
      pageSize: 100,
    })
      .then((response) => {
        setActivities(response.data || []);
        // Extract unique admin users
        const users = Array.from(
          new Set(
            (response.data || [])
              .map((a) => getAdminName(a))
              .filter((name): name is string => !!name && name !== "System")
          )
        ).sort();
        setAdminUsers(users);
      })
      .catch((error) => {
        console.error("Error fetching admin activity:", error);
        const friendlyError = getUserFacingErrorMessage(error, "خطا در بارگذاری گزارش");
        alert(`خطا در بارگذاری گزارش: ${friendlyError}`);
      })
      .finally(() => setLoading(false));
  }, [startISO, endISO, selectedUser, selectedActionType, selectedLogType]);

  const getAdminName = (activity: any) =>
    activity.PerformedByName ||
    activity.adminUsername ||
    activity.performed_by?.username ||
    activity.performed_by?.email ||
    activity.performed_by?.phone ||
    null;

  const filteredActivities = useMemo(
    () =>
      showSystemActivities
        ? activities
        : activities.filter((activity) => {
            const name = getAdminName(activity);
            return !!name && name !== "System";
          }),
    [activities, showSystemActivities]
  );

  const uniqueAdmins = new Set(
    filteredActivities.map((a) => getAdminName(a) || "Unknown")
  ).size;
  const createActions = filteredActivities.filter(
    (a) => a.Action === "Create"
  ).length;
  const updateActions = filteredActivities.filter(
    (a) => a.Action === "Update"
  ).length;
  const deleteActions = filteredActivities.filter(
    (a) => a.Action === "Delete"
  ).length;

  const visibleCount = filteredActivities.length;

  return (
    <ContentWrapper title="گزارش ادمین ها">
      <div className="space-y-6">
        {/* Filters Section */}
        <div className="rounded-2xl bg-white p-5">
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-medium text-neutral-700">فیلترها</h3>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-neutral-600">تاریخ شروع</label>
                <DatePicker
                  inputClass="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                  defaultValue={start}
                  onChange={(d: any) => setStart(normalizeDateInput(d, start))}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-neutral-600">تاریخ پایان</label>
                <DatePicker
                  inputClass="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                  defaultValue={end}
                  onChange={(d: any) => setEnd(normalizeDateInput(d, end))}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-neutral-600">نوع فعالیت</label>
                <select
                  value={selectedActionType}
                  onChange={(e) => setSelectedActionType(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                >
                  <option value="">همه</option>
                  <option value="Create">{actionTypeMap["Create"]}</option>
                  <option value="Update">{actionTypeMap["Update"]}</option>
                  <option value="Delete">{actionTypeMap["Delete"]}</option>
                  <option value="Publish">{actionTypeMap["Publish"]}</option>
                  <option value="Unpublish">{actionTypeMap["Unpublish"]}</option>
                  <option value="Adjust">{actionTypeMap["Adjust"]}</option>
                  <option value="Other">{actionTypeMap["Other"]}</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-neutral-600">نوع گزارش</label>
                <select
                  value={selectedLogType}
                  onChange={(e) => setSelectedLogType(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                >
                  <option value="All">همه</option>
                  <option value="Order">{logTypeMap["Order"]}</option>
                  <option value="Product">{logTypeMap["Product"]}</option>
                  <option value="User">{logTypeMap["User"]}</option>
                  <option value="Contract">{logTypeMap["Contract"]}</option>
                  <option value="Discount">{logTypeMap["Discount"]}</option>
                  <option value="Stock">{logTypeMap["Stock"]}</option>
                  <option value="Admin">{logTypeMap["Admin"]}</option>
                  <option value="Other">{logTypeMap["Other"]}</option>
                </select>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-neutral-600">نمایش</label>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex flex-col">
                  {adminUsers.length > 0 && (
                    <select
                      value={selectedUser}
                      onChange={(e) => setSelectedUser(e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent transition-all"
                    >
                      <option value="">همه ادمین‌ها</option>
                      {adminUsers.map((user) => (
                        <option key={user} value={user}>
                          {user}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <label className="inline-flex items-center gap-2 text-sm text-neutral-600">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-neutral-300 text-pink-600 focus:ring-pink-500"
                    checked={showSystemActivities}
                    onChange={(e) => setShowSystemActivities(e.target.checked)}
                  />
                  نمایش فعالیت‌های سیستمی
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="rounded-2xl bg-white p-5">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex items-center gap-3">
                <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-pink-500"></div>
                <span className="text-neutral-600">در حال بارگذاری...</span>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50 to-cyan-50 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg mb-2 font-medium text-neutral-700">کل فعالیت‌ها</h3>
                      <p className="text-2xl font-bold text-blue-600">{faNum(visibleCount)}</p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                      <svg
                        className="h-6 w-6 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-green-100 bg-gradient-to-r from-green-50 to-emerald-50 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg mb-2 font-medium text-neutral-700">ادمین‌های فعال</h3>
                      <p className="text-2xl font-bold text-green-600">{faNum(uniqueAdmins)}</p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                      <svg
                        className="h-6 w-6 text-green-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4.354a4 4 0 110 5.292M15 19H9a6 6 0 016-6v0a6 6 0 016 6v0a2 2 0 01-2 2H7a2 2 0 01-2-2v0a6 6 0 016-6z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-purple-100 bg-gradient-to-r from-purple-50 to-violet-50 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg mb-2 font-medium text-neutral-700">ایجادها</h3>
                      <p className="text-2xl font-bold text-purple-600">{faNum(createActions)}</p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                      <svg
                        className="h-6 w-6 text-purple-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 4v16m8-8H4"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-orange-100 bg-gradient-to-r from-orange-50 to-amber-50 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg mb-2 font-medium text-neutral-700">تغییرات</h3>
                      <p className="text-2xl font-bold text-orange-600">
                        {faNum(updateActions + deleteActions)}
                      </p>
                    </div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
                      <svg
                        className="h-6 w-6 text-orange-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Export Button */}
              <div className="flex justify-end">
                <button
                  onClick={() => exportToExcel(filteredActivities, start, end)}
                  className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700 transition-colors"
                >
                  <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  خروجی Excel
                </button>
              </div>

              {/* Activities Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-neutral-200 bg-neutral-50">
                      <th className="px-6 py-3 text-right text-sm font-medium text-neutral-700">تاریخ و زمان</th>
                      <th className="px-6 py-3 text-right text-sm font-medium text-neutral-700">ادمین</th>
                      <th className="px-6 py-3 text-right text-sm font-medium text-neutral-700">نقش</th>
                      <th className="px-6 py-3 text-right text-sm font-medium text-neutral-700">نوع گزارش</th>
                      <th className="px-6 py-3 text-right text-sm font-medium text-neutral-700">فعالیت</th>
                      <th className="px-6 py-3 text-right text-sm font-medium text-neutral-700">توضیحات</th>
                      <th className="px-6 py-3 text-right text-sm font-medium text-neutral-700">IP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredActivities.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-neutral-500">
                          فعالیتی یافت نشد
                        </td>
                      </tr>
                    ) : (
                      filteredActivities.map((activity) => {
                        const adminName = getAdminName(activity) || "نامشخص";
                        const adminRole = activity.PerformedByRole || activity.adminRole || "-";
                        const title = activity.Title || translateDescription(activity.Description || "");
                        const severity = activity.Severity || "info";
                        const timestamp = activity.timestamp || activity.createdAt;
                        const severityColors = {
                          info: "bg-blue-100 text-blue-700",
                          success: "bg-green-100 text-green-700",
                          warning: "bg-yellow-100 text-yellow-700",
                          error: "bg-red-100 text-red-700",
                        };

                        return (
                          <tr key={activity.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                            <td className="px-6 py-3 text-sm text-neutral-600">
                              {new Date(timestamp).toLocaleString("fa-IR")}
                            </td>
                            <td className="px-6 py-3 text-sm font-medium text-neutral-700">
                              {adminName}
                            </td>
                            <td className="px-6 py-3 text-sm">
                              <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
                                {adminRole}
                              </span>
                            </td>
                            <td className="px-6 py-3 text-sm text-neutral-600">
                              {logTypeMap[activity.ResourceType] || activity.ResourceType}
                            </td>
                            <td className="px-6 py-3 text-sm">
                              <span
                                className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                                  activity.Action === "Create"
                                    ? "bg-green-100 text-green-700"
                                    : activity.Action === "Update"
                                      ? "bg-yellow-100 text-yellow-700"
                                      : "bg-red-100 text-red-700"
                                }`}
                              >
                                {actionTypeMap[activity.Action] || activity.Action}
                              </span>
                            </td>
                            <td className="px-6 py-3 text-sm text-neutral-600">
                              <Link
                                href={`/super-admin/reports/admin-activity/${activity.id}`}
                                className="text-pink-600 hover:text-pink-700 hover:underline font-medium"
                              >
                                {title}
                              </Link>
                            </td>
                            <td className="px-6 py-3 text-xs text-neutral-500">
                              {activity.IP || "-"}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </ContentWrapper>
  );
}
