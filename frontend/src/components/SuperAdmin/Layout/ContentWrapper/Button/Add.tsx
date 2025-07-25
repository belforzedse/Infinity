import Link from "next/link";
import PlusIcon from "../../Icons/PlusIcon";

export default function SuperAdminLayoutContentWrapperButtonAdd({
  text,
  path,
}: {
  text: string;
  path?: string;
}) {
  return (
    <Link href={path ?? "#"}>
      <button className="text-sm text-slate-700 flex items-center gap-1 py-1 px-3 border border-slate-400 bg-white rounded-lg w-full md:w-auto justify-center">
        <PlusIcon />
        <span className="text-foreground-primary">{text}</span>
      </button>
    </Link>
  );
}
