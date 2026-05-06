import { apiClient } from "@/services";
import RecycleIcon from "../../Layout/Icons/RecycleIcon";
import UndoIcon from "../../Layout/Icons/UndoIcon";
import TrashIcon from "../../Layout/Icons/TrashIcon";
import SuperAdminTableCellActionButton from "./ActionButton";
import toast from "react-hot-toast";
import { useAtom } from "jotai";
import { refreshTable } from "..";
import { useState } from "react";
import ConfirmDialog from "@/components/Kits/ConfirmDialog";
import { useCurrentUser } from "@/hooks/useCurrentUser";

type Props = {
  isRemoved: boolean;
  id: string;
  apiUrl: string;
  itemName?: string;
  payloadFormatter?: (removedAt: string | null) => Record<string, unknown>;
};

export default function RemoveActionButton(props: Props) {
  const { isRemoved, id, apiUrl, itemName = "محصول", payloadFormatter } = props;
  const [, setRefresh] = useAtom(refreshTable);
  const { isStoreManager } = useCurrentUser();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [showPermanentDeleteConfirm, setShowPermanentDeleteConfirm] = useState(false);
  const [showPermissionDenied, setShowPermissionDenied] = useState(false);

  const buildPayload = (removedAt: string | null) => {
    if (payloadFormatter) return payloadFormatter(removedAt);
    return {
      data: {
        removedAt,
      },
    };
  };

  const handleRestore = async () => {
    try {
      setIsDeleting(true);
      await apiClient.put(`${apiUrl}/${id}`, buildPayload(null));
      setRefresh(true);
      toast.success("با موفقیت بازیابی شد");
    } catch (error) {
      toast.error("خطا در بازیابی");
      console.error("Failed to restore item:", error);
    } finally {
      setIsDeleting(false);
      setShowActionDialog(false);
    }
  };

  const handlePermanentDelete = async () => {
    try {
      setIsDeleting(true);
      await apiClient.delete(`${apiUrl}/${id}`);
      setRefresh(true);
      toast.success(`${itemName} به طور دائمی حذف شد`);
    } catch (error) {
      toast.error(`خطا در حذف دائمی ${itemName}`);
      console.error("Failed to permanently delete item:", error);
    } finally {
      setIsDeleting(false);
      setShowPermanentDeleteConfirm(false);
      setShowActionDialog(false);
    }
  };

  const handleDelete = async () => {
    // Soft delete action - directly call API
    try {
      setIsDeleting(true);
      const now = new Date().toISOString();
      await apiClient.put(`${apiUrl}/${id}`, buildPayload(now));
      setRefresh(true);
      toast.success(`${itemName} با موفقیت حذف شد`);
    } catch (error) {
      toast.error(`خطا در حذف ${itemName}`);
      console.error("Failed to delete item:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePermanentDeleteClick = () => {
    // Check if user is store manager - deny permanent delete
    if (isStoreManager) {
      setShowPermissionDenied(true);
      return;
    }
    setShowPermanentDeleteConfirm(true);
  };

  // When item is removed, show both restore and permanent delete buttons
  if (isRemoved) {
    return (
      <>
        <div className="flex flex-row-reverse items-center gap-2">
          <SuperAdminTableCellActionButton
            variant="primary"
            icon={<UndoIcon />}
            onClick={handleRestore}
            disabled={isDeleting}
          />
          <SuperAdminTableCellActionButton
            variant="secondary"
            icon={<TrashIcon />}
            onClick={handlePermanentDeleteClick}
            disabled={isDeleting}
          />
        </div>

        {/* Confirmation dialog for permanent delete */}
        <ConfirmDialog
          isOpen={showPermanentDeleteConfirm}
          title="حذف دائمی"
          description={`آیا از حذف دائمی این ${itemName} مطمئن هستید؟ این عملیات غیرقابل برگشت است.`}
          confirmText="بله، حذف کن"
          cancelText="انصراف"
          onConfirm={handlePermanentDelete}
          onCancel={() => setShowPermanentDeleteConfirm(false)}
        />

        {/* Permission denied dialog for store managers */}
        <ConfirmDialog
          isOpen={showPermissionDenied}
          title="عدم دسترسی"
          description="شما دسترسی مورد نظر برای این عمل رو ندارید"
          confirmText="باشه"
          cancelText={undefined}
          onConfirm={() => setShowPermissionDenied(false)}
          onCancel={() => setShowPermissionDenied(false)}
        />
      </>
    );
  }

  // When item is not removed, show only the soft delete button
  return (
    <SuperAdminTableCellActionButton
      variant="primary"
      icon={<RecycleIcon />}
      onClick={handleDelete}
      disabled={isDeleting}
    />
  );
}
