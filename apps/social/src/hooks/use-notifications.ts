"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  type AppNotification,
  getMyNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/services/notification.service";
import { useCurrentUser } from "@/hooks/use-current-user";

const POLL_INTERVAL_MS = 30_000;

export function useNotifications() {
  const { isAuthenticated } = useCurrentUser();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const result = await getMyNotifications(1, 25);
      setNotifications(result.data);
      setUnreadCount(result.data.filter((n) => !n.isRead).length);
    } catch {
      // swallow — silent refresh failure
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const pollUnread = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const count = await getUnreadNotificationCount();
      setUnreadCount(count);
    } catch {
      // swallow
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    load();

    pollRef.current = setInterval(pollUnread, POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current != null) clearInterval(pollRef.current);
    };
  }, [isAuthenticated, load, pollUnread]);

  const markAsRead = useCallback(
    async (id: number) => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
      try {
        await markNotificationRead(id);
      } catch {
        // revert on failure
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: false } : n)),
        );
        setUnreadCount((c) => c + 1);
      }
    },
    [],
  );

  const markAllAsRead = useCallback(async () => {
    const prev = notifications;
    setNotifications((n) => n.map((item) => ({ ...item, isRead: true })));
    setUnreadCount(0);
    try {
      await markAllNotificationsRead();
    } catch {
      setNotifications(prev);
      setUnreadCount(prev.filter((n) => !n.isRead).length);
    }
  }, [notifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    refresh: load,
  };
}
