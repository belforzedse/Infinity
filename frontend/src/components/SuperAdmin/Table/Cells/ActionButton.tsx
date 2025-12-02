import Link from "next/link";
import clsx from "clsx";

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

  const className = clsx(
    "flex h-[26px] items-center justify-center gap-1 rounded-md px-2 transition-all",
    text ? "w-auto" : "w-[25px] px-0",
    disabled
      ? "cursor-not-allowed opacity-50"
      : variant === "primary"
        ? "bg-actions-primary hover:bg-actions-primary/80"
        : "bg-slate-200 hover:bg-slate-300",
  );

  if (path && !disabled) {
    return (
      <Link className={className} href={path} onClick={onClick}>
        {icon}
        {text && <span className="text-xs text-slate-500">{text}</span>}
      </Link>
    );
  }

  return (
    <button
      type="button"
      className={className}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
    >
      {icon}
      {text && <span className="text-xs text-slate-500">{text}</span>}
    </button>
  );
}
