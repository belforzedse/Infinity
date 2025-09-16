import DeleteIcon from "../Icons/DeleteIcon";
import EditIcon from "../Icons/EditIcon";

interface Props {
  address: string;
  postalCode?: string;
  description?: string;
  onEdit?: () => void;
  onDelete?: () => void;
}

const AddressCard = ({
  address,
  postalCode,
  description,
  onEdit,
  onDelete,
}: Props) => {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-3">
      <div className="flex items-center justify-between">
        <span className="text-base font-medium text-foreground-primary">
          {address}
        </span>

        <div className="flex shrink-0 gap-2">
          <button
            onClick={onEdit}
            className="rounded-lg border border-slate-200 bg-slate-50 p-2 transition-colors hover:bg-slate-100"
            aria-label="ویرایش آدرس"
          >
            <EditIcon className="h-4 w-4 text-foreground-primary lg:h-5 lg:w-5" />
          </button>

          <button
            onClick={onDelete}
            className="rounded-lg border border-slate-200 bg-slate-50 p-2 transition-colors hover:bg-slate-100"
            aria-label="حذف آدرس"
          >
            <DeleteIcon className="h-4 w-4 text-foreground-primary lg:h-5 lg:w-5" />
          </button>
        </div>
      </div>

      {(postalCode || description) && (
        <div className="text-sm flex flex-col gap-1 text-gray-500">
          {postalCode && <p>کد پستی: {postalCode}</p>}
          {description && <p>توضیحات: {description}</p>}
        </div>
      )}
    </div>
  );
};

export default AddressCard;
