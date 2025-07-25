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
      className={`w-auto px-2 md:px-0 md:w-[26px] h-[26px] rounded-md bg-actions-primary flex gap-1 items-center justify-center ${
        variant === "primary" ? "bg-actions-primary" : "bg-slate-200"
      }`}
      onClick={onClick}
      href={path ?? "#"}
    >
      {text && <span className="text-sm text-slate-500">{text}</span>}
      {icon}
    </Link>
  );
}
