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
    <div className="p-3 bg-white rounded-lg w-full min-h-[76px] flex items-center gap-2">
      <div className="flex flex-col gap-2 flex-1">
        <div className="flex justify-between items-center w-full">
          <div className="flex gap-2">
            <input type="checkbox" className="w-5 h-5" />

            <span className="text-sm text-neutral-800">{headTitle}</span>
          </div>

          <button
            className={`flex items-center justify-center rounded-full border border-neutral-600 w-6 h-6 ${
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
