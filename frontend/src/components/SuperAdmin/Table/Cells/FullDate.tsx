export default function SuperAdminTableCellFullDate({ date }: { date: Date }) {
  return (
    <span className="text-neutral-400 md:text-foreground-primary text-xs md:text-base">
      {date.toLocaleString("fa-IR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })}
    </span>
  );
}
