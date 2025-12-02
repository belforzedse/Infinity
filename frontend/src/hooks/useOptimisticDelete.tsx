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
  payloadFormatter?: (removedAt: string | null) => Record<string, unknown>;
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
  const [pendingConfirmations, setPendingConfirmations] = useAtom(pendingDeleteConfirmations);
  const [toastIds, setToastIds] = useAtom(undoToastIds);
  const [, setRefresh] = useAtom(refreshTable);

  const buildPayload = useCallback(
    (
      formatter: OptimisticDeleteOptions["payloadFormatter"],
      removedAt: string | null,
    ): Record<string, unknown> => {
      if (typeof formatter === "function") {
        return formatter(removedAt);
      }
      return {
        data: {
          removedAt,
        },
      };
    },
    [],
  );

  const confirmDeleteServer = useCallback(
    async (
      apiUrl: string,
      itemId: string,
      removedAt: string,
      payloadFormatter?: OptimisticDeleteOptions["payloadFormatter"],
    ) => {
      try {
        await apiClient.put(`${apiUrl}/${itemId}`, buildPayload(payloadFormatter, removedAt));

        const newPendingConfirmations = new Set(pendingConfirmations);
        newPendingConfirmations.add(itemId);
        setPendingConfirmations(newPendingConfirmations);

        const newDeletedItems = new Map(deletedItems);
        newDeletedItems.delete(itemId);
        setDeletedItems(newDeletedItems);

        setRefresh(true);
      } catch (error) {
        console.error("Failed to confirm deletion:", error);
        const newDeletedItems = new Map(deletedItems);
        newDeletedItems.delete(itemId);
        setDeletedItems(newDeletedItems);
        toast.error("خطا در تأیید حذف");
      }
    },
    [buildPayload, deletedItems, setDeletedItems, pendingConfirmations, setPendingConfirmations, setRefresh],
  );

  const undoDelete = useCallback(
    (itemId: string) => {
      const deletedItem = deletedItems.get(itemId);
      if (!deletedItem) return;

      if (deletedItem.undoTimeout) {
        clearTimeout(deletedItem.undoTimeout);
      }

      const newDeletedItems = new Map(deletedItems);
      newDeletedItems.delete(itemId);
      setDeletedItems(newDeletedItems);

      const newPendingConfirmations = new Set(pendingConfirmations);
      newPendingConfirmations.delete(itemId);
      setPendingConfirmations(newPendingConfirmations);

      toast.success("حذف لغو شد");
    },
    [deletedItems, setDeletedItems, pendingConfirmations, setPendingConfirmations],
  );

  const deleteItem = useCallback(
    async (options: OptimisticDeleteOptions) => {
      const { apiUrl, itemId, itemName = "Item", onSuccess, onError, payloadFormatter } = options;

      try {
        const now = new Date().toISOString();
        const newDeletedItems = new Map(deletedItems);
        newDeletedItems.set(itemId, {
          id: itemId,
          removedAt: now,
        });
        setDeletedItems(newDeletedItems);

        const undoTimeout = setTimeout(() => {
          confirmDeleteServer(apiUrl, itemId, now, payloadFormatter);
        }, UNDO_TIMEOUT_MS);

        newDeletedItems.set(itemId, {
          id: itemId,
          removedAt: now,
          undoTimeout,
        });
        setDeletedItems(newDeletedItems);

        const toastId = toast(
          (t) => (
            <div className="flex w-full items-center justify-between gap-3">
              <span className="text-sm font-medium text-foreground-primary">
                {itemName} با موفقیت حذف شد
              </span>
              <button
                onClick={() => {
                  undoDelete(itemId);
                  toast.dismiss(t.id);
                }}
                className="rounded bg-actions-primary px-3 py-1 text-xs font-semibold text-white"
              >
                لغو
              </button>
            </div>
          ),
          { duration: UNDO_TIMEOUT_MS },
        );

        const newToastIds = new Map(toastIds);
        newToastIds.set(itemId, toastId);
        setToastIds(newToastIds);

        onSuccess?.();
      } catch (error) {
        const newDeletedItems = new Map(deletedItems);
        newDeletedItems.delete(itemId);
        setDeletedItems(newDeletedItems);

        toast.error("خطا در حذف آیتم");
        const err = error instanceof Error ? error : new Error(String(error));
        onError?.(err);
      }
    },
    [deletedItems, setDeletedItems, toastIds, setToastIds, confirmDeleteServer, undoDelete],
  );

  return {
    deleteItem,
    undoDelete,
    isItemDeleted: (itemId: string) => deletedItems.has(itemId),
    deletedItems,
  };
}
