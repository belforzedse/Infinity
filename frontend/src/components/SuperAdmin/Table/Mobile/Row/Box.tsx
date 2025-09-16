import { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import { OpenMobileTableRow } from "./Open";
import ShowMoreIcon from "@/components/SuperAdmin/Layout/Icons/ShowMoreIcon";

export default function MobileTableRowBox<TData>({
  row,
  columns,
  header,
  headTitle,
}: {
  columns: ColumnDef<TData>[];
  row: TData & { attributes: any; id: string };
  header: React.ReactNode;
  headTitle: string;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex min-h-[76px] w-full items-center gap-2 rounded-lg bg-white p-3">
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex w-full items-center justify-between">
          <div className="flex gap-2">
            <input type="checkbox" className="h-5 w-5" />

            <span className="text-sm text-neutral-800">{headTitle}</span>
          </div>

          <button
            className={`flex h-6 w-6 items-center justify-center rounded-full border border-neutral-600 ${
              isOpen ? "rotate-180" : ""
            }`}
            onClick={() => setIsOpen(!isOpen)}
          >
            <ShowMoreIcon />
          </button>
        </div>

        {!isOpen ? (
          <>{header}</>
        ) : (
          <OpenMobileTableRow columns={columns} row={row} />
        )}
      </div>
    </div>
  );
}
