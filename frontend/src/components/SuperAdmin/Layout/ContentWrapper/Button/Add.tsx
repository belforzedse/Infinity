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
      <button className="text-sm flex w-full items-center justify-center gap-1 rounded-lg border border-slate-400 bg-white px-3 py-1 text-slate-700 md:w-auto">
        <PlusIcon />
        <span className="text-foreground-primary">{text}</span>
      </button>
    </Link>
  );
}
