import clsx from "clsx";
import { TransactionHeader } from "./TransactionHeader";
import { EmptyState } from "./EmptyState";
import TransactionsListRow from "./TransactionsListRow";

interface Transaction {
  date: string;
  amount: string;
}

interface TransactionSectionProps {
  title: string;
  icon: React.ReactNode;
  transactions: Transaction[];
  type: "deposit" | "debit";
  showOnlyMobile?: boolean;
}

export const TransactionSection = ({
  title,
  icon,
  transactions,
  type,
  showOnlyMobile = false,
}: TransactionSectionProps) => (
  <div className="flex flex-col gap-1 rounded-xl border border-slate-100 p-3 lg:border-none lg:p-0">
    <TransactionHeader icon={icon} title={title} showOnlyMobile={showOnlyMobile} />

    {transactions.length > 0 ? (
      <div
        className={clsx(
          "divide-y divide-slate-100 rounded-xl border border-slate-100 px-4 py-3 lg:px-5",
          type === "deposit" && "lg:min-h-[50vh]",
          // transactions.length === 0 && "lg:border border-none"
        )}
      >
        {transactions.map((item, index) => (
          <TransactionsListRow
            key={item.date + index}
            type={type}
            date={item.date}
            amount={item.amount}
          />
        ))}
      </div>
    ) : (
      <EmptyState />
    )}
  </div>
);
