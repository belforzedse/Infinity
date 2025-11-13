import { atom } from "jotai";

export interface ErrorNotificationState {
  id: string;
  status: number;
  message?: string;
  timestamp: number;
}

/**
 * Queue of error notifications to display
 * Each error is auto-removed after 5 seconds or on user dismiss
 */
export const errorNotificationsAtom = atom<ErrorNotificationState[]>([]);

/**
 * Add an error notification
 * Usage:
 *   jotaiStore.set(errorNotificationsAtom, prev => [
 *     ...prev,
 *     { id: Date.now().toString(), status: 403, message: "Custom message" }
 *   ])
 */
export const addErrorNotification = (
  status: number,
  message?: string
): ErrorNotificationState => ({
  id: `${Date.now()}-${Math.random()}`,
  status,
  message,
  timestamp: Date.now(),
});

/**
 * Remove error notification by ID
 */
export const removeErrorNotification = (id: string): void => {
  // This will be called from the notification display component
};
