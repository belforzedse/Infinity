export default function SuperAdminTableCellFullDate({ date }: { date: Date }) {
  return (
    <span className="text-xs text-neutral-400 md:text-base md:text-foreground-primary">
      {date.toLocaleString("fa-IR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })}
    </span>
  );
}
