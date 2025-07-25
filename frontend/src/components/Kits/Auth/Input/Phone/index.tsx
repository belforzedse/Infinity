import AuthInput from "..";
import EditIcon from "../../Icons/EditIcon";

interface PhoneInputProps {
  value: string;
  onEdit: () => void;
}

export default function PhoneInput({ value, onEdit }: PhoneInputProps) {
  const editButton = (
    <button
      type="button"
      onClick={onEdit}
      className="flex flex-row-reverse items-center gap-1 bg-sky-600 hover:bg-sky-700 text-white px-2 py-1 rounded transition-colors"
    >
      <span className="text-sm">ویرایش</span>
      <EditIcon className="w-4 h-4" />
    </button>
  );

  // Convert English numbers to Persian
  const faValue = value.replace(
    /\d/g,
    (d) => ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"][Number(d)]
  );

  return (
    <AuthInput
      type="tel"
      value={faValue}
      readOnly
      className="bg-slate-100 border-slate-200"
      dir="ltr"
      rightElement={editButton}
    />
  );
}
