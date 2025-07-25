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
    Array.isArray(data) ? data : []
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
      <div className="text-center py-8 text-neutral-500">
        هیچ داده‌ای موجود نیست
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-xl p-5">
      {title && (
        <h3 className="text-lg font-medium text-neutral-800 mb-4">{title}</h3>
      )}
      <div className="overflow-x-auto">
        <table className="w-full bg-white rounded-lg border border-slate-100">
          <thead className="bg-stone-50">
            <tr>
              <th className="p-3 text-sm font-medium text-neutral-800 border-l border-slate-100">
                سایز
              </th>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="p-3 text-sm font-medium text-neutral-800 border-l border-slate-100"
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
                <td className="p-3 border-l border-slate-100">
                  {editingCell?.rowIndex === rowIndex &&
                  editingCell?.column === "size" ? (
                    <input
                      type="text"
                      value={row.size || ""}
                      onChange={(e) => handleCellChange(e.target.value)}
                      onBlur={handleCellBlur}
                      className="w-full p-1.5 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                      autoFocus
                    />
                  ) : (
                    <div
                      onClick={() => handleCellClick(rowIndex, "size")}
                      className="cursor-pointer hover:bg-slate-50 p-1.5 rounded"
                    >
                      {row.size}
                    </div>
                  )}
                </td>
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className="p-3 border-l border-slate-100"
                  >
                    {editingCell?.rowIndex === rowIndex &&
                    editingCell?.column === column.key ? (
                      <input
                        type="text"
                        value={row[column.key] || ""}
                        onChange={(e) => handleCellChange(e.target.value)}
                        onBlur={handleCellBlur}
                        className="w-full p-1.5 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-primary"
                        autoFocus
                      />
                    ) : (
                      <div
                        onClick={() => handleCellClick(rowIndex, column.key)}
                        className="cursor-pointer hover:bg-slate-50 p-1.5 rounded"
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
