import EditIcon from "@/components/SuperAdmin/Layout/Icons/EditIcon";
import KeyIcon from "@/components/SuperAdmin/Layout/Icons/KeyIcon";
import { refreshTable } from "@/components/SuperAdmin/Table";
import SuperAdminTableCellActionButton from "@/components/SuperAdmin/Table/Cells/ActionButton";
import RemoveActionButton from "@/components/SuperAdmin/Table/Cells/RemoveActionButton";
import SuperAdminTableCellSimplePrice from "@/components/SuperAdmin/Table/Cells/SimplePrice";
import SuperAdminTableCellSwitch from "@/components/SuperAdmin/Table/Cells/Switch";
import MobileTableRowBox from "@/components/SuperAdmin/Table/Mobile/Row/Box";
import { apiClient } from "@/services";
import { translatePluginRoleLabel } from "@/constants/roleLabels";
import type { ColumnDef, Row } from "@tanstack/react-table";
import { useAtom } from "jotai";
import { useState } from "react";
import { toast } from "react-hot-toast";

export type UserInfo = {
  id: number;
  FirstName?: string | null;
  LastName?: string | null;
  NationalCode?: string | null;
  BirthDate?: string | null;
  Sex?: boolean | null;
  Bio?: string | null;
};

export type LocalUserRole = {
  id: number;
  Title?: string | null;
};

import type { PluginRoleInfo } from "@/services/user/getDetails";

export type UserWallet = {
  id: number;
  Balance?: string | number | null;
};

export type User = {
  id: string;
  attributes: any;
  username?: string | null;
  email?: string | null;
  phone?: string | null;
  confirmed?: boolean;
  blocked?: boolean;
  IsActive?: boolean;
  IsVerified?: boolean;
  removedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  user_info?: UserInfo | null;
  user_role?: LocalUserRole | null;
  role?: PluginRoleInfo | null;
  user_wallet?: UserWallet | null;
};

const deriveFullName = (user: User) => {
  const firstName = user.user_info?.FirstName ?? "";
  const lastName = user.user_info?.LastName ?? "";
  if (!firstName && !lastName) return "";
  return `${firstName} ${lastName}`.trim();
};

const StatusCell = ({ row }: { row: Row<User> }) => {
  const [status, setStatus] = useState(row.original.IsActive ? "active" : "inactive");
  const [isLoading, setIsLoading] = useState(false);

  const handleStatusChange = async (newStatus: "active" | "inactive") => {
    setIsLoading(true);

    try {
      await apiClient.put(`/users/${row.original.id}`, {
        IsActive: newStatus === "active",
      });

      toast.success("وضعیت کاربر با موفقیت تغییر کرد");
      setStatus(newStatus);
    } catch (error) {
      toast.error("خطا در تغییر وضعیت کاربر");
      console.error("Failed to update user status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SuperAdminTableCellSwitch
      status={status as "active" | "inactive"}
      disabled={isLoading}
      onChange={() => handleStatusChange(status === "active" ? "inactive" : "active")}
    />
  );
};

const WalletCell = ({ row }: { row: Row<User> }) => {
  const walletData = row.original.user_wallet ?? null;
  const walletBalance = Number(walletData?.Balance ?? 0);

  return (
    <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-1">
      <SuperAdminTableCellSimplePrice price={walletBalance} />
    </div>
  );
};

const ActionsCell = ({ row }: { row: Row<User> }) => {
  const [, setRefresh] = useAtom(refreshTable);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [retryPassword, setRetryPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordUpdate = async () => {
    if (newPassword !== retryPassword) {
      toast.error("رمز عبور و تکرار آن مطابقت ندارند");
      return;
    }

    setIsLoading(true);

    try {
      await apiClient.put(`/users/${row.original.id}`, {
        password: newPassword,
      });
      setShowPasswordModal(false);
      setNewPassword("");
      setRetryPassword("");
      setRefresh(true);
      toast.success("رمز عبور با موفقیت تغییر کرد");
    } catch (error) {
      toast.error("رمز عبور قوی نیست");
      console.error("Failed to update password:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const isRemoved = row.original.removedAt;

  return (
    <>
      <div className="flex flex-row-reverse items-center gap-3 p-1">
        <RemoveActionButton
          isRemoved={!!isRemoved}
          id={row.original.id.toString()}
          apiUrl={"/users"}
          payloadFormatter={(removedAt) => ({ removedAt })}
        />

        <SuperAdminTableCellActionButton
          variant="secondary"
          icon={<EditIcon />}
          path={`/super-admin/users/edit/${row.original.id}`}
        />

        <SuperAdminTableCellActionButton
          variant="secondary"
          icon={<KeyIcon />}
          onClick={() => setShowPasswordModal(true)}
        />
      </div>

      {showPasswordModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-96 rounded-lg bg-white p-6">
            <h2 className="text-lg mb-4 font-bold">تغییر رمز عبور</h2>
            <input
              type="password"
              placeholder="رمز عبور جدید"
              className="mb-4 w-full rounded border p-2"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={isLoading}
            />
            <input
              type="password"
              placeholder="تکرار رمز عبور"
              className="mb-4 w-full rounded border p-2"
              value={retryPassword}
              onChange={(e) => setRetryPassword(e.target.value)}
              disabled={isLoading}
            />
            <div className="flex justify-end gap-2">
              <button
                className="rounded bg-actions-primary px-4 py-2 text-white disabled:opacity-50"
                onClick={handlePasswordUpdate}
                disabled={isLoading}
              >
                {isLoading ? "در حال ذخیره..." : "ذخیره"}
              </button>
              <button
                className="rounded bg-gray-200 px-4 py-2 disabled:opacity-50"
                onClick={() => setShowPasswordModal(false)}
                disabled={isLoading}
              >
                انصراف
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export const columns: ColumnDef<User>[] = [
  {
    accessorKey: "phone",
    header: "شماره تلفن",
    cell: ({ row }) => row.original.phone ?? "-",
  },
  {
    accessorKey: "user_info",
    header: "نام",
    cell: ({ row }) => {
      const fullName = deriveFullName(row.original);
      return fullName ? <span className="text-sm text-neutral-800">{fullName}</span> : "-";
    },
  },
  {
    accessorKey: "user_role",
    header: "نقش",
    cell: ({ row }) => getRoleLabel(row.original),
  },
  {
    accessorKey: "IsActive",
    header: "وضعیت",
    cell: ({ row }) => <StatusCell row={row} />,
  },
  {
    accessorKey: "user_wallet",
    header: "موجودی کیف پول",
    cell: ({ row }) => <WalletCell row={row} />,
  },
  {
    accessorKey: "createdAt",
    header: "عملیات",
    meta: {
      headerClassName: "text-left",
      cellClassName: "text-left",
    },
    cell: ({ row }) => <ActionsCell row={row} />,
  },
];

type Props = {
  data: User[] | undefined;
};

export const MobileTable = ({ data }: Props) => {
  return (
    <div className="mt-2 flex flex-col gap-2">
      {data?.map((row) => {
        const rowWithStringId: User = {
          ...row,
          id: String(row.id),
        };
        return (
        <MobileTableRowBox
          key={row.id}
          columns={columns}
          row={rowWithStringId}
          header={
            <div className="flex w-full items-center justify-between rounded-[4px] bg-stone-50 px-2 py-1">
              <div className="flex items-center gap-1">
                <span className="text-xs text-neutral-400">
                  {deriveFullName(row) || row.username || "-"}
                </span>
                <span className="text-xs text-neutral-400">|</span>
                <span className="text-xs text-yellow-600">{getRoleLabel(row)}</span>
                <span className="text-xs text-neutral-400">|</span>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-neutral-400">
                    {row.IsActive ? "غیرفعال کردن حساب" : "فعال کردن حساب"}
                  </span>
                  <SuperAdminTableCellSwitch status={row.IsActive ? "active" : "inactive"} />
                </div>
              </div>

              <div className="text-xs flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1 text-slate-700">
                <SuperAdminTableCellSimplePrice
                  price={Number(row.user_wallet?.Balance ?? 0)}
                  inverse
                />
              </div>
            </div>
          }
          headTitle={row.phone || "-"}
        />
        );
      })}
    </div>
  );
};
const getRoleLabel = (user: User) => {
  if (user.user_role?.Title) return user.user_role.Title;
  return translatePluginRoleLabel(user.role?.name) || "-";
};
