import { apiClient } from "@/services";
import RecycleIcon from "../../Layout/Icons/RecycleIcon";
import UndoIcon from "../../Layout/Icons/UndoIcon";
import SuperAdminTableCellActionButton from "./ActionButton";
import toast from "react-hot-toast";
import { useAtom } from "jotai";
import { refreshTable } from "..";
import { useOptimisticDelete } from "@/hooks/useOptimisticDelete";
import { useState } from "react";
import type { FC } from "react";

type Props = {
  isRemoved: boolean;
  id: string;
  apiUrl: string;
  itemName?: string;
};

export default function RemoveActionButton(props: Props) {
  const { isRemoved, id, apiUrl, itemName = "محصول" } = props;
  const [, setRefresh] = useAtom(refreshTable);
  const { deleteItem, undoDelete, isItemDeleted } = useOptimisticDelete();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (isRemoved) {
      // Restore (undo) action
      try {
        setIsDeleting(true);
        await apiClient.put(`${apiUrl}/${id}`, {
          data: {
            removedAt: null,
          },
        });
        setRefresh(true);
        toast.success("با موفقیت بازیابی شد");
      } catch (error) {
        toast.error("خطا در بازیابی");
        console.error("Failed to restore item:", error);
      } finally {
        setIsDeleting(false);
      }
    } else {
      // Delete action with optimistic update
      setIsDeleting(true);
      await deleteItem({
        apiUrl,
        itemId: id,
        itemName,
        onSuccess: () => setIsDeleting(false),
        onError: () => setIsDeleting(false),
      });
    }
  };

  return (
    <SuperAdminTableCellActionButton
      variant="primary"
      icon={isRemoved ? <UndoIcon /> : <RecycleIcon />}
      onClick={handleDelete}
      disabled={isDeleting}
    />
  );
}
