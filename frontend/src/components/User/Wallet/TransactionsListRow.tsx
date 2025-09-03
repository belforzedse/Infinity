import React from "react";
import moment from "moment-jalaali";
import { priceFormatter } from "@/utils/price";
import PlusIcon from "../Icons/PlusIcon";
import MinusIcon from "../Icons/MinusIcon";
import clsx from "clsx";

interface TransactionsListRowProps {
  date: string;
  amount: string;
  type: "debit" | "deposit";
}

const TransactionsListRow = ({
  type,
  date,
  amount,
}: TransactionsListRowProps) => {
  const formatDate = (dateStr: string) => {
    const today = moment().format("YYYY/MM/DD");
    const inputDate = moment(dateStr).format("YYYY/MM/DD");

    if (today === inputDate) {
      return "امروز";
    }

    return moment(dateStr)
      .format("jYYYY/jMM/jDD")
      .replace(/[0-9]/g, (d: string) =>
        String.fromCharCode(d.charCodeAt(0) + 1728),
      );
  };

  const isDeposit = type === "deposit";

  return (
    <div className="grid grid-cols-3 gap-1 py-2 lg:gap-8">
      <span className="text-sm text-slate-400">
        {isDeposit ? "واریز موفق به کیف پول" : "برداشت موفق از کیف پول"}
      </span>
      <span className="text-sm text-slate-400">{formatDate(date)}</span>
      <div
        className={clsx(
          "flex flex-nowrap items-center justify-end gap-1 text-left",
          isDeposit ? "text-blue-600" : "text-red-600",
        )}
      >
        <span className="text-base text-nowrap">
          {priceFormatter(Number(amount))} تومان
        </span>
        {isDeposit ? <PlusIcon /> : <MinusIcon />}
      </div>
    </div>
  );
};

export default TransactionsListRow;
