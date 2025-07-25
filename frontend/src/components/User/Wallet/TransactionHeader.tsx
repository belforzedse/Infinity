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
      "items-center gap-1 col-span-1",
      showOnlyMobile ? "flex lg:hidden" : "lg:flex hidden"
    )}
  >
    {icon}
    <span className="text-foreground-primary text-2xl">{title}</span>
  </div>
);
