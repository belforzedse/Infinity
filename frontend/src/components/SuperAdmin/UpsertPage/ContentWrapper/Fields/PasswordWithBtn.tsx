import { apiClient } from "@/services";
import { toast } from "react-hot-toast";
import { useState } from "react";
import KeyIcon from "../../Icons/KeyIcon";

type Props = {
  value: string;
  id: string;
};

export default function ContentWrapperPasswordWithBtn(props: Props) {
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [retryPassword, setRetryPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordUpdate = async () => {
    if (newPassword !== retryPassword) {
      toast.error("رمز عبور و تکرار آن مطابقت ندارند");
      return;
    }

    const accessToken = localStorage.getItem("accessToken");
    setIsLoading(true);

    try {
      await apiClient.put(
        `/user/${props.id}`,
        {
          password: newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        },
      );
      setShowPasswordModal(false);
      setNewPassword("");
      setRetryPassword("");
      toast.success("رمز عبور با موفقیت تغییر کرد");
    } catch (error) {
      toast.error("رمز عبور قوی نیست");
      console.error("Failed to update password:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="password"
        className={`text-sm flex-1 rounded-lg border border-neutral-200 px-5 py-3`}
        disabled
        readOnly
        value={props.value}
      />

      <button
        className="flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-3 md:px-10"
        onClick={(e) => {
          e.preventDefault();
          setShowPasswordModal(true);
        }}
      >
        <span className="text-sm text-slate-500">تغییر کلمه عبور</span>

        <KeyIcon />
      </button>

      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
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
    </div>
  );
}
