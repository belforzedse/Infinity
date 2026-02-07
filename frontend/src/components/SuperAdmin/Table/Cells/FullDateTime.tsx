import { formatFaRelativeDateTime } from "@/utils/formatFaRelativeDateTime";

export default function SuperAdminTableCellFullDateTime({ date }: { date: Date }) {
  return (
    <span className="text-xs text-neutral-400 md:text-base md:text-foreground-primary">
      {formatFaRelativeDateTime(date)}
    </span>
  );
}
