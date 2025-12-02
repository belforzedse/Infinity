import React from "react";
import DepositIcon from "../Icons/DepositIcon";
import { TransactionSection } from "./TransactionSection";
interface Transaction {
  date: string;
  amount: string;
}

interface TransactionsListProps {
  depositList: Transaction[];
}

const TransactionsList = ({ depositList }: TransactionsListProps) => {
  return (
    <div className="w-full rounded-xl border border-slate-100 bg-white lg:p-5">
      <TransactionSection
        title="واریز"
        icon={<DepositIcon />}
        transactions={depositList}
        type="deposit"
      />
    </div>
  );
};

export default TransactionsList;
