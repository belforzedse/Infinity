import { STRAPI_TOKEN } from "@/constants/api";
import { apiClient } from "@/services";
import { Switch } from "@headlessui/react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function SuperAdminTableCellSwitch({
  status: initialStatus,
  onChange,
  disabled = false,
  apiUrl,
}: {
  status: "active" | "inactive";
  onChange?: (checked: boolean) => void;
  apiUrl?: string;
  disabled?: boolean;
}) {
  const [status, setStatus] = useState(initialStatus);

  useEffect(() => {
    setStatus(initialStatus);
  }, [initialStatus]);

  return (
    <div dir="ltr">
      <Switch
        checked={status === "active"}
        onChange={
          apiUrl
            ? (checked) => {
                apiClient
                  .put(
                    apiUrl,
                    {
                      data: {
                        IsActive: checked,
                      },
                    },
                    {
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${STRAPI_TOKEN}`,
                      },
                    }
                  )
                  .then(() => {
                    setStatus(checked ? "active" : "inactive");
                    toast.success("وضعیت تغییر کرد");
                  })
                  .catch(() => {
                    toast.error("مشکلی در تغییر وضعیت رخ داد");
                  });
              }
            : onChange
        }
        disabled={disabled}
        className={`group inline-flex w-6 h-4 md:h-6 md:w-11 items-center rounded-full transition ${
          disabled
            ? "bg-gray-300 cursor-not-allowed"
            : "bg-gray-200 data-[checked]:bg-green-500"
        }`}
      >
        <span
          className={`size-3 md:size-4 translate-x-0.5 md:translate-x-1 rounded-full transition ${
            disabled ? "bg-gray-400" : "bg-white"
          } group-data-[checked]:translate-x-2.5 md:group-data-[checked]:translate-x-6`}
        />
      </Switch>
    </div>
  );
}
