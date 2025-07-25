import React from "react";
import DebitIcon from "../Icons/DebitIcon";
import DepositIcon from "../Icons/DepositIcon";
import { TransactionHeader } from "./TransactionHeader";
import { TransactionSection } from "./TransactionSection";
interface Transaction {
  date: string;
  amount: string;
}

interface TransactionsListProps {
  debbitList: Transaction[];
  depositList: Transaction[];
}

const TransactionsList = ({
  debbitList,
  depositList,
}: TransactionsListProps) => {
  return (
    <div className="w-full rounded-xl bg-white lg:border border-slate-100 lg:p-5 grid lg:grid-cols-2 grid-cols-1 gap-3">
      <TransactionHeader icon={<DepositIcon />} title="واریز" />
      <TransactionHeader icon={<DebitIcon />} title="برداشت" />

      <div className="col-span-2 bg-slate-100 h-px lg:flex hidden" />

      <TransactionSection
        title="واریز"
        icon={<DepositIcon />}
        transactions={depositList}
        type="deposit"
        showOnlyMobile
      />
      <TransactionSection
        title="برداشت"
        icon={<DebitIcon />}
        transactions={debbitList}
        type="debit"
        showOnlyMobile
      />
    </div>
  );
};

export default TransactionsList;
