import { apiClient } from "@/services";
import RecycleIcon from "../../Layout/Icons/RecycleIcon";
import UndoIcon from "../../Layout/Icons/UndoIcon";
import SuperAdminTableCellActionButton from "./ActionButton";
import { STRAPI_TOKEN } from "@/constants/api";
import toast from "react-hot-toast";
import { useAtom } from "jotai";
import { refreshTable } from "..";

type Props = {
  isRemoved: boolean;
  id: string;
  apiUrl: string;
};

export default function RemoveActionButton(props: Props) {
  const { isRemoved, id, apiUrl } = props;
  const [, setRefresh] = useAtom(refreshTable);

  return (
    <SuperAdminTableCellActionButton
      variant="primary"
      icon={isRemoved ? <UndoIcon /> : <RecycleIcon />}
      onClick={async () => {
        try {
          await apiClient.put(
            `${apiUrl}/${id}`,
            {
              data: {
                removedAt: isRemoved ? null : new Date().toISOString(),
              },
            },
            {
              headers: {
                Authorization: `Bearer ${STRAPI_TOKEN}`,
              },
            }
          );
          setRefresh(true);
          toast.success(
            isRemoved ? "با موفقیت بازیابی شد" : "با موفقیت حذف شد"
          );
        } catch (error) {
          toast.error(isRemoved ? "خطا در بازیابی" : "خطا در حذف");
          console.error("Failed to delete user:", error);
        }
      }}
    />
  );
}
