import EditIcon from "@/components/SuperAdmin/Layout/Icons/EditIcon";
import KeyIcon from "@/components/SuperAdmin/Layout/Icons/KeyIcon";
import PlusIcon from "@/components/SuperAdmin/Layout/Icons/PlusIcon";
import ShowMoreIcon from "@/components/SuperAdmin/Layout/Icons/ShowMoreIcon";
import { refreshTable } from "@/components/SuperAdmin/Table";
import SuperAdminTableCellActionButton from "@/components/SuperAdmin/Table/Cells/ActionButton";
import RemoveActionButton from "@/components/SuperAdmin/Table/Cells/RemoveActionButton";
import SuperAdminTableCellSimplePrice from "@/components/SuperAdmin/Table/Cells/SimplePrice";
import SuperAdminTableCellSwitch from "@/components/SuperAdmin/Table/Cells/Switch";
import MobileTableRowBox from "@/components/SuperAdmin/Table/Mobile/Row/Box";
import { STRAPI_TOKEN } from "@/constants/api";
import { apiClient } from "@/services";
import { ColumnDef } from "@tanstack/react-table";
import { useAtom } from "jotai";
import { useState } from "react";
import { toast } from "react-hot-toast";

// This is a sample data type. Modify according to your needs
export type User = {
  id: string;
  attributes: {
    Phone: string;
    removedAt: string;
    user_info: {
      data: {
        attributes: {
          FirstName: string;
          LastName: string;
        };
      };
    };
    user_role: {
      data: {
        attributes: {
          Title: string;
        };
      };
    };
    IsActive: boolean;
    user_wallet: {
      data: {
        id: number;
        attributes: {
          Balance: string;
        };
      };
    };
    createdAt: string;
  };
};

export const columns: ColumnDef<User>[] = [
  {
    accessorKey: "attributes.Phone",
    header: "شماره تلفن",
  },
  {
    accessorKey: "attributes.user_info.data",
    header: "نام",
    cell: ({ row }) => {
      const userInfo = row.original.attributes as {
        user_info: {
          data: {
            attributes: {
              FirstName: string;
              LastName: string;
            };
          };
        };
      };

      return userInfo &&
        userInfo.user_info.data?.attributes?.FirstName &&
        userInfo.user_info.data?.attributes?.LastName ? (
        <span className="text-sm text-neutral-800">
          {userInfo.user_info.data?.attributes?.FirstName}{" "}
          {userInfo.user_info.data?.attributes?.LastName}
        </span>
      ) : (
        "-"
      );
    },
  },
  {
    accessorKey: "attributes.user_role.data.attributes.Title",
    header: "نقش",
  },
  {
    accessorKey: "attributes",
    header: "وضعیت",
    cell: ({ row }) => {
      const [status, setStatus] = useState(
        row.original.attributes.IsActive ? "active" : "inactive",
      );
      const [isLoading, setIsLoading] = useState(false);

      const handleStatusChange = async (newStatus: "active" | "inactive") => {
        setIsLoading(true);

        try {
          await apiClient.put(
            `/local-users/${row.original.id}`,
            {
              data: {
                IsActive: newStatus === "active",
              },
            },
            {
              headers: {
                Authorization: `Bearer ${STRAPI_TOKEN}`,
              },
            },
          );

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
          onChange={() =>
            handleStatusChange(status === "active" ? "inactive" : "active")
          }
        />
      );
    },
  },
  {
    accessorKey: "attributes.user_wallet.data.attributes.Balance",
    header: "موجودی کیف پول",
    cell: ({ row }) => {
      const wallet = row.original.attributes.user_wallet.data?.attributes
        .Balance as string;
      const walletId = row.original.attributes.user_wallet.data?.id as number;

      const [isLoading, setIsLoading] = useState(false);
      const [showWalletModal, setShowWalletModal] = useState(false);
      const [newBalance, setNewBalance] = useState(wallet ? wallet : "0");
      const [, setRefresh] = useAtom(refreshTable);

      const onClick = () => {
        setShowWalletModal(true);
      };

      const handleWalletUpdate = async () => {
        setIsLoading(true);

        try {
          await apiClient.put(
            `/local-user-wallets/${walletId}`,
            {
              data: {
                Balance: newBalance,
              },
            },
            {
              headers: {
                Authorization: `Bearer ${STRAPI_TOKEN}`,
              },
            },
          );
          setShowWalletModal(false);
          toast.success("موجودی کیف پول با موفقیت بروزرسانی شد");
          setRefresh(true);
        } catch (error) {
          toast.error("خطا در بروزرسانی کیف پول");
          console.error("Failed to update wallet:", error);
        } finally {
          setIsLoading(false);
        }
      };

      return (
        <>
          <button
            className="text-sm flex items-center gap-1 rounded-lg border border-slate-400 bg-white px-3 py-1 text-slate-700 disabled:opacity-50"
            onClick={onClick}
            disabled={isLoading}
          >
            <SuperAdminTableCellSimplePrice price={wallet ? +wallet : 0} />
            <PlusIcon />
          </button>

          {showWalletModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
              <div className="w-full max-w-md rounded-lg bg-white p-6">
                <h2 className="text-xl mb-4 font-bold">تغییر موجودی کیف پول</h2>
                <div className="mb-4">
                  <label className="text-sm mb-1 block font-medium">
                    موجودی جدید
                  </label>
                  <input
                    type="number"
                    value={newBalance}
                    onChange={(e) => setNewBalance(e.target.value)}
                    className="w-full rounded-md border border-gray-300 p-2"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowWalletModal(false)}
                    className="rounded-md bg-gray-200 px-4 py-2"
                    disabled={isLoading}
                  >
                    انصراف
                  </button>
                  <button
                    onClick={handleWalletUpdate}
                    className="rounded-md bg-blue-500 px-4 py-2 text-white disabled:opacity-50"
                    disabled={isLoading}
                  >
                    {isLoading ? "در حال بروزرسانی..." : "ذخیره"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "عملیات",
    meta: {
      headerClassName: "text-left",
      cellClassName: "text-left",
    },
    cell: ({ row }) => {
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
          await apiClient.put(
            `/local-users/${row.original.id}`,
            {
              data: {
                Password: newPassword,
              },
            },
            {
              headers: {
                Authorization: `Bearer ${STRAPI_TOKEN}`,
              },
            },
          );
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

      const isRemoved = row.original.attributes.removedAt;

      return (
        <>
          <div className="flex flex-row-reverse items-center gap-3 p-1">
            <RemoveActionButton
              isRemoved={!!isRemoved}
              id={row.original.id}
              apiUrl={"/local-users"}
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
    },
  },
];

type Props = {
  data: User[] | undefined;
};

export const MobileTable = ({ data }: Props) => {
  return (
    <div className="mt-2 flex flex-col gap-2">
      {data?.map((row) => (
        <MobileTableRowBox
          key={row.id}
          columns={columns}
          row={row}
          header={
            <div className="flex w-full items-center justify-between rounded-[4px] bg-stone-50 px-2 py-1">
              <div className="flex items-center gap-1">
                <span className="text-xs text-neutral-400">
                  {row.attributes?.user_info?.data?.attributes?.FirstName}{" "}
                  {row.attributes?.user_info?.data?.attributes?.LastName}
                </span>
                <span className="text-xs text-neutral-400">|</span>
                <span className="text-xs text-yellow-600">
                  {row.attributes?.user_role?.data?.attributes?.Title}
                </span>
                <span className="text-xs text-neutral-400">|</span>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-neutral-400">
                    {row.attributes?.IsActive
                      ? "غیرفعال کردن حساب"
                      : "فعال کردن حساب"}
                  </span>
                  <SuperAdminTableCellSwitch
                    status={row.attributes?.IsActive ? "active" : "inactive"}
                  />
                </div>
              </div>

              <button className="text-xs flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1 text-slate-700 md:border-slate-400">
                <SuperAdminTableCellSimplePrice
                  price={
                    row.attributes?.user_wallet?.data?.attributes?.Balance
                      ? +row.attributes?.user_wallet?.data?.attributes?.Balance
                      : 0
                  }
                  inverse
                />
                +
              </button>
            </div>
          }
          headTitle={row.attributes?.Phone}
        />
      ))}
    </div>
  );
};
