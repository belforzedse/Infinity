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
        }
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
        className={`flex-1 border border-neutral-200 rounded-lg py-3 px-5 text-sm`}
        disabled
        readOnly
        value={props.value}
      />

      <button
        className="flex items-center gap-1 py-3 px-3 md:px-10 bg-slate-100 rounded-lg"
        onClick={(e) => {
          e.preventDefault();
          setShowPasswordModal(true);
        }}
      >
        <span className="text-sm text-slate-500">تغییر کلمه عبور</span>

        <KeyIcon />
      </button>

      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-lg font-bold mb-4">تغییر رمز عبور</h2>
            <input
              type="password"
              placeholder="رمز عبور جدید"
              className="w-full p-2 mb-4 border rounded"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={isLoading}
            />
            <input
              type="password"
              placeholder="تکرار رمز عبور"
              className="w-full p-2 mb-4 border rounded"
              value={retryPassword}
              onChange={(e) => setRetryPassword(e.target.value)}
              disabled={isLoading}
            />
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 bg-actions-primary text-white rounded disabled:opacity-50"
                onClick={handlePasswordUpdate}
                disabled={isLoading}
              >
                {isLoading ? "در حال ذخیره..." : "ذخیره"}
              </button>
              <button
                className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
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
