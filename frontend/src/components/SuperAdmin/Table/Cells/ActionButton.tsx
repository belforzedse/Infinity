import Link from "next/link";

type Props = {
  variant: "primary" | "secondary";
  icon: React.ReactNode;
  onClick?: () => void;
  text?: string;
  path?: string;
  disabled?: boolean;
};

export default function SuperAdminTableCellActionButton(props: Props) {
  const { variant, icon, onClick, text, path, disabled } = props;

  return (
    <Link
      className={`flex h-[26px] w-auto items-center justify-center gap-1 rounded-md px-2 transition-all ${
        disabled
          ? "opacity-50 cursor-not-allowed"
          : variant === "primary"
          ? "bg-actions-primary hover:bg-actions-primary/80"
          : "bg-slate-200 hover:bg-slate-300"
      } ${text ? "w-[auto]" : "w-[25px] px-0"}`}
      onClick={disabled ? undefined : onClick}
      href={disabled ? "#" : (path ?? "#")}
    >
      {icon}
      {text && <span className="text-xs text-slate-500">{text}</span>}
    </Link>
  );
}
