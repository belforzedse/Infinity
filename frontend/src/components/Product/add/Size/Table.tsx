import React, { useState } from "react";

interface SizeTableProps {
  data: any[];
  columns: { key: string; title: string }[];
  title?: string;
  onEdit?: (newData: any[]) => void;
}

const SizeTable: React.FC<SizeTableProps> = ({
  data,
  columns,
  title,
  onEdit,
}) => {
  // Ensure data is always an array
  const [localData, setLocalData] = useState<any[]>(
    Array.isArray(data) ? data : [],
  );
  const [editingCell, setEditingCell] = useState<{
    rowIndex: number;
    column: string;
  } | null>(null);

  // Update local data when props change
  React.useEffect(() => {
    if (Array.isArray(data)) {
      setLocalData(data);
    }
  }, [data]);

  const handleCellClick = (rowIndex: number, column: string) => {
    setEditingCell({ rowIndex, column });
  };

  const handleCellChange = (value: string) => {
    if (!editingCell) return;

    const newData = [...localData];
    newData[editingCell.rowIndex] = {
      ...newData[editingCell.rowIndex],
      [editingCell.column]: value,
    };
    setLocalData(newData);
    if (onEdit) {
      onEdit(newData);
    }
  };

  const handleCellBlur = () => {
    setEditingCell(null);
  };

  if (!Array.isArray(localData) || localData.length === 0) {
    return (
      <div className="py-8 text-center text-neutral-500">
        هیچ داده‌ای موجود نیست
      </div>
    );
  }

  return (
    <div className="w-full rounded-xl bg-white p-5">
      {title && (
        <h3 className="text-lg mb-4 font-medium text-neutral-800">{title}</h3>
      )}
      <div className="overflow-x-auto">
        <table className="w-full rounded-lg border border-slate-100 bg-white">
          <thead className="bg-stone-50">
            <tr>
              <th className="text-sm border-l border-slate-100 p-3 font-medium text-neutral-800">
                سایز
              </th>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="text-sm border-l border-slate-100 p-3 font-medium text-neutral-800"
                >
                  {column.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {localData.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={rowIndex !== 0 ? "border-t border-slate-100" : ""}
              >
                <td className="border-l border-slate-100 p-3">
                  {editingCell?.rowIndex === rowIndex &&
                  editingCell?.column === "size" ? (
                    <input
                      type="text"
                      value={row.size || ""}
                      onChange={(e) => handleCellChange(e.target.value)}
                      onBlur={handleCellBlur}
                      className="focus:ring-primary w-full rounded border border-slate-200 p-1.5 focus:outline-none focus:ring-1"
                      autoFocus
                    />
                  ) : (
                    <div
                      onClick={() => handleCellClick(rowIndex, "size")}
                      className="cursor-pointer rounded p-1.5 hover:bg-slate-50"
                    >
                      {row.size}
                    </div>
                  )}
                </td>
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className="border-l border-slate-100 p-3"
                  >
                    {editingCell?.rowIndex === rowIndex &&
                    editingCell?.column === column.key ? (
                      <input
                        type="text"
                        value={row[column.key] || ""}
                        onChange={(e) => handleCellChange(e.target.value)}
                        onBlur={handleCellBlur}
                        className="focus:ring-primary w-full rounded border border-slate-200 p-1.5 focus:outline-none focus:ring-1"
                        autoFocus
                      />
                    ) : (
                      <div
                        onClick={() => handleCellClick(rowIndex, column.key)}
                        className="cursor-pointer rounded p-1.5 hover:bg-slate-50"
                      >
                        {row[column.key]}
                      </div>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SizeTable;
