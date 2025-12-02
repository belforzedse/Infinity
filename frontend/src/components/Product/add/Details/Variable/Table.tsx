import React from "react";
import type { ProductVariableDisplay } from "./types";
import { ProductVariableHeader } from "./Header";
import { ProductVariableRow } from "./Row";
import { ProductVariableCard } from "./Card";

interface ProductVariableTableProps {
  variables: ProductVariableDisplay[];
  selectedRows: number[];
  onSelectRow: (id: number) => void;
  onEditRow: (id: number) => void;
  onDeleteRow?: (id: number) => void;
}

export const ProductVariableTable: React.FC<ProductVariableTableProps> = ({
  variables,
  selectedRows,
  onSelectRow,
  onEditRow,
  onDeleteRow,
}) => {
  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden w-full overflow-hidden rounded-lg border border-slate-100 bg-white md:block">
        <table className="w-full table-fixed">
          <ProductVariableHeader />
          <tbody>
            {variables.map((item, index) => (
              <ProductVariableRow
                key={item.id}
                item={item}
                isLast={index === variables.length - 1}
                isSelected={selectedRows.includes(item.id)}
                onSelect={onSelectRow}
                onEdit={onEditRow}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="grid grid-cols-2 gap-3 md:hidden">
        {variables.map((item) => (
          <ProductVariableCard
            key={item.id}
            item={item}
            onEdit={() => onEditRow(item.id)}
            onDelete={() => onDeleteRow && onDeleteRow(item.id)}
          />
        ))}
      </div>
    </>
  );
};
