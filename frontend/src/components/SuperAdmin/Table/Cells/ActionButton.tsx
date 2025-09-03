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
      className={`flex h-[26px] w-auto items-center justify-center gap-1 rounded-md bg-actions-primary px-2 md:w-[26px] md:px-0 ${
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
