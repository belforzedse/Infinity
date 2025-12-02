import clsx from "clsx";

export const TransactionHeader = ({
  icon,
  title,
  showOnlyMobile = false,
}: {
  icon: React.ReactNode;
  title: string;
  showOnlyMobile?: boolean;
}) => (
  <div
    className={clsx(
      "col-span-1 items-center gap-1",
      showOnlyMobile ? "flex lg:hidden" : "hidden lg:flex",
    )}
  >
    {icon}
    <span className="text-2xl text-foreground-primary">{title}</span>
  </div>
);
