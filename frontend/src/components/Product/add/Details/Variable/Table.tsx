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
  editingVariationId?: number | null;
}

export const ProductVariableTable: React.FC<ProductVariableTableProps> = ({
  variables,
  selectedRows,
  onSelectRow,
  onEditRow,
  onDeleteRow,
  editingVariationId,
}) => {
  return (
    <>
      {/* Desktop Table View */}
      <div className="hidden w-full overflow-hidden rounded-lg border border-slate-100 bg-white md:block">
        <table className="w-full table-fixed">
          <ProductVariableHeader showDelete={!!onDeleteRow} />
          <tbody>
            {variables.map((item, index) => (
              <ProductVariableRow
                key={item.id}
                item={item}
                isLast={index === variables.length - 1}
                isSelected={selectedRows.includes(item.id)}
                isEditing={editingVariationId === item.id}
                onSelect={onSelectRow}
                onEdit={onEditRow}
                onDelete={onDeleteRow}
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
            isEditing={editingVariationId === item.id}
            onEdit={() => onEditRow(item.id)}
            onDelete={onDeleteRow ? () => onDeleteRow(item.id) : undefined}
          />
        ))}
      </div>
    </>
  );
};
