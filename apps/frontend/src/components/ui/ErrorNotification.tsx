"use client";

import { useEffect, useState } from "react";

interface ErrorNotificationProps {
  status: number;
  message?: string;
  onDismiss?: () => void;
}

/**
 * Friendly error notification component
 * Shows user-friendly messages for common HTTP errors
 * 401: Not authenticated - offer to login
 * 403: Forbidden - explain permission denied
 * Others: Generic error message
 */
export function ErrorNotification({ status, message, onDismiss }: ErrorNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);

  const getErrorInfo = (code: number) => {
    switch (code) {
      case 401:
        return {
          title: "ورود مورد نیاز",
          message: message || "شما وارد نشده‌اید. لطفاً برای ادامه وارد حساب کاربری خود شوید.",
          icon: "🔐",
          action: { label: "ورود", href: "/auth" },
        };
      case 403:
        return {
          title: "دسترسی محدود",
          message: message || "شما اجازه دسترسی به این منطقه را ندارید.",
          icon: "⛔",
          action: null,
        };
      case 404:
        return {
          title: "یافت نشد",
          message: message || "صفحه یا منبع مورد نظر وجود ندارد.",
          icon: "🔍",
          action: null,
        };
      case 500:
        return {
          title: "خطای سرور",
          message: message || "خطایی در سرور رخ داد. لطفاً بعداً دوباره تلاش کنید.",
          icon: "⚠️",
          action: null,
        };
      default:
        return {
          title: "خطا",
          message: message || "خطای نامشخصی رخ داد.",
          icon: "❌",
          action: null,
        };
    }
  };

  const { title, message: errorMessage, icon, action } = getErrorInfo(status);

  if (!isVisible) return null;

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  const handleAction = () => {
    if (action?.href) {
      window.location.href = action.href;
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[1000] max-w-sm">
      <div className="bg-white rounded-lg shadow-lg border-r-4 border-red-500 p-4">
        <div className="flex gap-3">
          <div className="text-2xl flex-shrink-0">{icon}</div>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground-primary">{title}</h3>
            <p className="text-sm text-foreground-secondary mt-1">{errorMessage}</p>
            {action && (
              <button
                onClick={handleAction}
                className="mt-3 text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {action.label} →
              </button>
            )}
          </div>
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-foreground-tertiary hover:text-foreground-primary"
            aria-label="بستن"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
