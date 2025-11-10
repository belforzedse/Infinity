"use client";

import { useAtom } from "jotai";
import { useCallback } from "react";
import toast from "react-hot-toast";
import { apiClient } from "@/services";
import {
  optimisticallyDeletedItems,
  pendingDeleteConfirmations,
  undoToastIds,
} from "@/lib/atoms/optimisticDelete";
import { refreshTable } from "@/components/SuperAdmin/Table";

const UNDO_TIMEOUT_MS = 5000; // 5 seconds to undo

interface OptimisticDeleteOptions {
  apiUrl: string;
  itemId: string;
  itemName?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Hook for managing optimistic deletion with undo capability
 * - Immediately hides the item from the UI
 * - Shows a toast with undo button
 * - Confirms deletion after timeout unless undo is clicked
 * - Handles all error cases and rollback
 */
export function useOptimisticDelete() {
  const [deletedItems, setDeletedItems] = useAtom(optimisticallyDeletedItems);
  const [pendingConfirmations, setPendingConfirmations] = useAtom(
    pendingDeleteConfirmations
  );
  const [toastIds, setToastIds] = useAtom(undoToastIds);
  const [, setRefresh] = useAtom(refreshTable);

  const deleteItem = useCallback(
    async (options: OptimisticDeleteOptions) => {
      const { apiUrl, itemId, itemName = "Item", onSuccess, onError } =
        options;

      try {
        // Step 1: Optimistically mark as deleted in UI
        const now = new Date().toISOString();
        const newDeletedItems = new Map(deletedItems);
        newDeletedItems.set(itemId, {
          id: itemId,
          removedAt: now,
        });
        setDeletedItems(newDeletedItems);

        // Step 2: Set up undo timeout
        const undoTimeout = setTimeout(() => {
          // Timeout expired - confirm the deletion server-side
          confirmDeleteServer(apiUrl, itemId, now);
        }, UNDO_TIMEOUT_MS);

        // Update deleted items with timeout reference
        newDeletedItems.set(itemId, {
          id: itemId,
          removedAt: now,
          undoTimeout,
        });
        setDeletedItems(newDeletedItems);

        // Step 3: Show toast with undo button
        const toastId = toast.custom(
          (t) => {
            const baseClasses = "flex items-center justify-between gap-3 rounded-lg bg-green-100 px-4 py-3 text-green-800 shadow-lg transition-all duration-300";
            const visibilityClass = t.visible ? "opacity-100" : "opacity-0";
            const divClasses = baseClasses + " " + visibilityClass;
            return (
              <div className={divClasses}>
                <span className="text-sm font-medium">
                  {itemName} با موفقیت حذف شد
                </span>
                <button
                  onClick={() => {
                    undoDelete(itemId);
                    toast.dismiss(t.id);
                  }}
                  className="whitespace-nowrap rounded bg-green-600 px-3 py-1 text-xs font-semibold text-white hover:bg-green-700"
                >
                  لغو
                </button>
              </div>
            );
          },
          { duration: UNDO_TIMEOUT_MS }
        );

        // Store toast ID for reference
        const newToastIds = new Map(toastIds);
        newToastIds.set(itemId, toastId);
        setToastIds(newToastIds);

        onSuccess?.();
      } catch (error) {
        // Rollback on error
        const newDeletedItems = new Map(deletedItems);
        newDeletedItems.delete(itemId);
        setDeletedItems(newDeletedItems);

        toast.error("خطا در حذف آیتم");
        const err = error instanceof Error ? error : new Error(String(error));
        onError?.(err);
      }
    },
    [deletedItems, setDeletedItems, toastIds, setToastIds, setRefresh]
  );

  const undoDelete = useCallback(
    (itemId: string) => {
      const deletedItem = deletedItems.get(itemId);
      if (!deletedItem) return;

      // Clear the timeout
      if (deletedItem.undoTimeout) {
        clearTimeout(deletedItem.undoTimeout);
      }

      // Remove from deleted items
      const newDeletedItems = new Map(deletedItems);
      newDeletedItems.delete(itemId);
      setDeletedItems(newDeletedItems);

      // Remove from pending confirmations if exists
      const newPendingConfirmations = new Set(pendingConfirmations);
      newPendingConfirmations.delete(itemId);
      setPendingConfirmations(newPendingConfirmations);

      toast.success("حذف لغو شد");
    },
    [deletedItems, setDeletedItems, pendingConfirmations, setPendingConfirmations]
  );

  const confirmDeleteServer = useCallback(
    async (apiUrl: string, itemId: string, removedAt: string) => {
      try {
        // Make the actual API call to confirm deletion
        await apiClient.put(`${apiUrl}/${itemId}`, {
          data: {
            removedAt: removedAt,
          },
        });

        // Mark as confirmed
        const newPendingConfirmations = new Set(pendingConfirmations);
        newPendingConfirmations.add(itemId);
        setPendingConfirmations(newPendingConfirmations);

        // Trigger table refresh for consistency
        setRefresh(true);
      } catch (error) {
        console.error("Failed to confirm deletion:", error);

        // Rollback - restore the item in UI
        const newDeletedItems = new Map(deletedItems);
        newDeletedItems.delete(itemId);
        setDeletedItems(newDeletedItems);

        toast.error("خطا در تأیید حذف");
      }
    },
    [deletedItems, setDeletedItems, pendingConfirmations, setPendingConfirmations, setRefresh]
  );

  return {
    deleteItem,
    undoDelete,
    isItemDeleted: (itemId: string) => deletedItems.has(itemId),
    deletedItems,
  };
}
