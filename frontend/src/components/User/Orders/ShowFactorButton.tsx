import FactorIcon from "../Icons/FactorIcon";

export default function ShowFactorButton() {
  return null;

  return (
    <button className="lg:mr-auto flex items-center justify-end gap-1 rounded-lg px-3 py-1.5 text-sm text-neutral-400 hover:bg-neutral-50">
      <FactorIcon className="w-6 h-6 text-neutral-400 lg:text-[#DB2777]" />
      <span className="text-sm lg:text-[#DB2777] text-neutral-400 underline">
        مشاهده فاکتور
      </span>
    </button>
  );
}
