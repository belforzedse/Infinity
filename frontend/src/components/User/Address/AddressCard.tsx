import DeleteIcon from "../Icons/DeleteIcon";
import EditIcon from "../Icons/EditIcon";

interface Props {
  id: number;
  address: string;
  postalCode?: string;
  description?: string;
  onEdit?: () => void;
  onDelete?: () => void;
}

const AddressCard = ({
  id,
  address,
  postalCode,
  description,
  onEdit,
  onDelete,
}: Props) => {
  return (
    <div className="flex flex-col p-3 rounded-lg border border-slate-200 bg-white gap-2">
      <div className="flex items-center justify-between">
        <span className="text-foreground-primary font-medium text-base">
          {address}
        </span>

        <div className="flex gap-2 shrink-0">
          <button
            onClick={onEdit}
            className="p-2 rounded-lg bg-slate-50 transition-colors border border-slate-200 hover:bg-slate-100"
            aria-label="ویرایش آدرس"
          >
            <EditIcon className="text-foreground-primary lg:w-5 lg:h-5 w-4 h-4" />
          </button>

          <button
            onClick={onDelete}
            className="p-2 rounded-lg bg-slate-50 transition-colors border border-slate-200 hover:bg-slate-100"
            aria-label="حذف آدرس"
          >
            <DeleteIcon className="text-foreground-primary w-4 h-4 lg:w-5 lg:h-5" />
          </button>
        </div>
      </div>

      {(postalCode || description) && (
        <div className="flex flex-col gap-1 text-sm text-gray-500">
          {postalCode && <p>کد پستی: {postalCode}</p>}
          {description && <p>توضیحات: {description}</p>}
        </div>
      )}
    </div>
  );
};

export default AddressCard;
