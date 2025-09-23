import Link from "next/link";

type Props = {
  variant: "primary" | "secondary";
  icon: React.ReactNode;
  onClick?: () => void;
  text?: string;
  path?: string;
};

export default function SuperAdminTableCellActionButton(props: Props) {
  const { variant, icon, onClick, text, path } = props;

  return (
    <Link
      className={`flex h-[26px] w-auto items-center justify-center gap-1 rounded-md px-2 ${
        variant === "primary" ? "bg-actions-primary" : "bg-slate-200"
      } ${text ? "w-[auto]" : "w-[25px] px-0"}`}
      onClick={onClick}
      href={path ?? "#"}
    >
      {icon}
      {text && <span className="text-xs text-slate-500">{text}</span>}
    </Link>
  );
}
