import FactorIcon from "../Icons/FactorIcon";

export default function ShowFactorButton() {
  return null;

  return (
    <button className="text-sm flex items-center justify-end gap-1 rounded-lg px-3 py-1.5 text-neutral-400 hover:bg-neutral-50 lg:mr-auto">
      <FactorIcon className="h-6 w-6 text-neutral-400 lg:text-[#DB2777]" />
      <span className="text-sm text-neutral-400 underline lg:text-[#DB2777]">
        مشاهده فاکتور
      </span>
    </button>
  );
}
