"use client";

import { useCurrentUser } from "@/hooks/useCurrentUser";
import { X } from "lucide-react";
import { useState } from "react";

export default function EditorNotice() {
  const { roleName } = useCurrentUser();
  const normalizedRole = (roleName ?? "").toLowerCase();
  const [isDismissed, setIsDismissed] = useState(false);

  // Only show for editor role
  if (normalizedRole !== "editor" || isDismissed) {
    return null;
  }

  return (
    <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4 shadow-sm" dir="rtl">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="mb-1 text-sm font-semibold text-blue-900">
            دسترسی محدود - ویرایشگر وبلاگ
          </h3>
          <p className="text-sm text-blue-800">
            شما به عنوان ویرایشگر وبلاگ دسترسی دارید. دسترسی شما محدود به بخش‌های وبلاگ است.
          </p>
        </div>
        <button
          onClick={() => setIsDismissed(true)}
          className="flex-shrink-0 rounded p-1 text-blue-600 hover:bg-blue-100 transition-colors"
          aria-label="بستن اعلان"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}


