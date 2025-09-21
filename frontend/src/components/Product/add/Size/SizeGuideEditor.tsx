import React, { useState } from "react";

interface SizeGuideEditorProps {
  onSave: (data: any[]) => void;
  initialData?: any[];
  columns: { key: string; title: string }[];
  onColumnTitleEdit: (columnKey: string, newTitle: string) => void;
}

const SizeGuideEditor: React.FC<SizeGuideEditorProps> = ({
  onSave,
  initialData = [],
  columns,
  onColumnTitleEdit,
}) => {
  const [data, setData] = useState<any[]>(initialData.length > 0 ? initialData : [{ size: "" }]);
  const [editingColumnTitle, setEditingColumnTitle] = useState<string | null>(null);
  const [localColumns, setLocalColumns] = useState<{ key: string; title: string }[]>(columns);

  // Update local columns when props change
  React.useEffect(() => {
    setLocalColumns(columns);
  }, [columns]);

  const addRow = () => {
    const newRow: any = { size: "" };
    localColumns.forEach((col) => {
      newRow[col.key] = "";
    });
    setData([...data, newRow]);
  };

  const removeRow = (index: number) => {
    setData(data.filter((_, i) => i !== index));
  };

  const addColumn = () => {
    const columnName = prompt("نام ستون را وارد کنید:");
    if (columnName) {
      // Generate a unique key for the column

      // Create new column
      const newColumn = { key: columnName, title: columnName };

      // Update local columns state
      setLocalColumns([...localColumns, newColumn]);

      // Update the data with the new column
      setData(data.map((row) => ({ ...row, [columnName]: "" })));

      // Notify parent component about the new column
      onColumnTitleEdit(columnName, columnName);
    }
  };

  const removeColumn = (columnKey: string) => {
    // Remove column from local columns state
    setLocalColumns(localColumns.filter((col) => col.key !== columnKey));

    // Update the data by removing the column
    setData(
      data.map((row) => {
        const newRow = { ...row };
        delete newRow[columnKey];
        return newRow;
      }),
    );

    // Notify parent component about the removed column
    onColumnTitleEdit(columnKey, "");
  };

  const updateCell = (rowIndex: number, column: string, value: string) => {
    const newData = [...data];
    newData[rowIndex] = { ...newData[rowIndex], [column]: value };
    setData(newData);
  };

  const handleSave = () => {
    // Validate data
    if (data.some((row) => !row.size)) {
      alert("لطفا تمام مقادیر سایز را پر کنید");
      return;
    }
    if (localColumns.length === 0) {
      alert("لطفا حداقل یک ستون اندازه‌گیری اضافه کنید");
      return;
    }
    if (data.some((row) => localColumns.some((col) => !row[col.key]))) {
      alert("لطفا تمام مقادیر اندازه‌گیری را پر کنید");
      return;
    }
    onSave(data);
  };

  const handleColumnTitleClick = (columnKey: string) => {
    setEditingColumnTitle(columnKey);
  };

  const handleColumnTitleChange = (columnKey: string, newTitle: string) => {
    // Keep the exact title as typed by the user
    onColumnTitleEdit(columnKey, newTitle);

    // Update local columns state
    setLocalColumns(
      localColumns.map((col) => (col.key === columnKey ? { ...col, title: newTitle } : col)),
    );

    setEditingColumnTitle(null);
  };

  return (
    <div className="w-full rounded-xl bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-medium text-neutral-800">ویرایش راهنمای سایز</h3>
        <div className="flex gap-2">
          <button
            onClick={addColumn}
            className="text-sm flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-white shadow-sm hover:bg-blue-700"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            افزودن ستون
          </button>
          <button
            onClick={addRow}
            className="text-sm flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-white shadow-sm hover:bg-green-700"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            افزودن سطر
          </button>
          <button
            onClick={handleSave}
            className="hover:bg-primary/90 text-sm rounded-lg bg-actions-primary px-3 py-1.5 text-white shadow-sm"
          >
            ذخیره راهنما
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full rounded-lg border border-slate-100 bg-white">
          <thead className="bg-stone-50">
            <tr>
              <th className="text-sm border-l border-slate-100 p-3 font-medium text-neutral-800">
                سایز
              </th>
              {localColumns.map((column) => (
                <th
                  key={column.key}
                  className="group text-sm relative border-l border-slate-100 p-3 font-medium text-neutral-800"
                >
                  <div className="flex items-center justify-between">
                    {editingColumnTitle === column.key ? (
                      <input
                        type="text"
                        defaultValue={column.title}
                        onBlur={(e) => handleColumnTitleChange(column.key, e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            handleColumnTitleChange(column.key, e.currentTarget.value);
                          }
                        }}
                        className="focus:ring-primary w-full rounded border border-slate-200 p-1 focus:outline-none focus:ring-1"
                        autoFocus
                      />
                    ) : (
                      <span
                        onClick={() => handleColumnTitleClick(column.key)}
                        className="hover:text-primary cursor-pointer"
                      >
                        {column.title}
                      </span>
                    )}
                    <button
                      onClick={() => removeColumn(column.key)}
                      className="text-red-500 opacity-0 group-hover:opacity-100 hover:text-red-600"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </th>
              ))}
              <th className="text-sm w-10 p-3 font-medium text-neutral-800"></th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={rowIndex} className={rowIndex !== 0 ? "border-t border-slate-100" : ""}>
                <td className="border-l border-slate-100 p-3">
                  <input
                    type="text"
                    value={row.size}
                    onChange={(e) => updateCell(rowIndex, "size", e.target.value)}
                    className="focus:ring-primary w-full rounded border border-slate-200 p-1.5 focus:outline-none focus:ring-1"
                    placeholder="سایز"
                  />
                </td>
                {localColumns.map((column) => (
                  <td key={column.key} className="border-l border-slate-100 p-3">
                    <input
                      type="text"
                      value={row[column.key] || ""}
                      onChange={(e) => updateCell(rowIndex, column.key, e.target.value)}
                      className="focus:ring-primary w-full rounded border border-slate-200 p-1.5 focus:outline-none focus:ring-1"
                      placeholder="مقدار"
                    />
                  </td>
                ))}
                <td className="p-3">
                  <button
                    onClick={() => removeRow(rowIndex)}
                    className="text-red-500 hover:text-red-600"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SizeGuideEditor;
