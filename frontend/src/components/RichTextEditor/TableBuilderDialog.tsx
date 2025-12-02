"use client";

import { useEffect, useMemo, useState } from "react";
import Modal from "@/components/Kits/Modal";

interface ColumnConfig {
  key: string;
  title: string;
}

interface TableRow {
  id: string;
  label: string;
  [key: string]: string;
}

interface TableBuilderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert: (html: string) => void;
}

const defaultColumns: ColumnConfig[] = [
  { key: "column_1", title: "ستون ۱" },
  { key: "column_2", title: "ستون ۲" },
  { key: "column_3", title: "ستون ۳" },
];

const generateRowId = () => {
  if (typeof globalThis !== "undefined" && typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `row-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const createRow = (label: string, id?: string): TableRow => ({
  id: id ?? generateRowId(),
  label,
});

const createDefaultRows = (): TableRow[] => [createRow("ردیف ۱"), createRow("ردیف ۲"), createRow("ردیف ۳")];

const createHtmlTable = (rows: TableRow[], columns: ColumnConfig[]): string => {
  const headerCells = [
    "<th class=\"px-3 py-2 bg-slate-100 text-right font-medium text-sm text-slate-600\">عنوان ردیف</th>",
    ...columns.map(
      (column) =>
        `<th class="px-3 py-2 bg-slate-100 text-right font-medium text-sm text-slate-600">${column.title}</th>`,
    ),
  ].join("");

  const bodyRows = rows
    .map((row) => {
      const cells = [
        `<td class="px-3 py-2 border-t border-l text-sm font-medium text-slate-600 bg-slate-100">${row.label}</td>`,
        ...columns.map(
          (column) =>
            `<td class="px-3 py-2 border-t border-l text-sm text-slate-600">${row[column.key] || ""}</td>`,
        ),
      ].join("");
      return `<tr>${cells}</tr>`;
    })
    .join("");

  return `<table class="w-full border border-slate-200 rounded-lg text-right" dir="rtl"><thead><tr>${headerCells}</tr></thead><tbody>${bodyRows}</tbody></table>`;
};

const TableBuilderDialog: React.FC<TableBuilderDialogProps> = ({ isOpen, onClose, onInsert }) => {
  const [columns, setColumns] = useState<ColumnConfig[]>(() => [...defaultColumns]);
  const [rows, setRows] = useState<TableRow[]>(() => createDefaultRows());
  const [editingColumn, setEditingColumn] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setColumns([...defaultColumns]);
      setRows(createDefaultRows());
      setEditingColumn(null);
    }
  }, [isOpen]);

  const columnTitleMap = useMemo(
    () =>
      columns.reduce<Record<string, string>>((acc, column) => {
        acc[column.key] = column.title;
        return acc;
      }, {}),
    [columns],
  );

  const addRow = () => {
    const nextIndex = rows.length + 1;
    setRows([...rows, createRow(`ردیف ${nextIndex}`)]);
  };

  const removeRow = (index: number) => {
    setRows(rows.filter((_, idx) => idx !== index));
  };

  const updateRowValue = (index: number, field: string, value: string) => {
    const next = [...rows];
    next[index] = { ...next[index], [field]: value };
    setRows(next);
  };

  const addColumn = () => {
    const title = window.prompt("عنوان ستون را وارد کنید:");
    if (!title) return;

    const key = `column_${Date.now()}`;
    setColumns([...columns, { key, title }]);
    setRows(rows.map((row) => ({ ...row, [key]: row[key] || "" })));
  };

  const removeColumn = (key: string) => {
    setColumns(columns.filter((column) => column.key !== key));
    setRows(
      rows.map((row) => {
        const nextRow = { ...row };
        delete nextRow[key];
        return nextRow;
      }),
    );
  };

  const updateColumnTitle = (key: string, title: string) => {
    setColumns(columns.map((column) => (column.key === key ? { ...column, title } : column)));
    setEditingColumn(null);
  };

  const handleSave = () => {
    if (!rows.length || columns.length === 0) {
      window.alert("لطفاً حداقل یک ردیف و یک ستون ایجاد کنید");
      return;
    }

    if (rows.some((row) => !row.label.trim())) {
      window.alert("عنوان هر ردیف را وارد کنید");
      return;
    }

    const html = createHtmlTable(rows, columns);
    onInsert(html);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="ایجاد جدول" className="max-w-5xl">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-3">
            <button
              onClick={addRow}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm text-white hover:bg-green-700"
            >
              افزودن ردیف
            </button>
            <button
              onClick={addColumn}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
            >
              افزودن ستون
            </button>
          </div>
          <button
            onClick={handleSave}
            className="rounded-lg bg-pink-600 px-4 py-2 text-sm text-white hover:bg-pink-700"
          >
            درج در محتوا
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse rounded-lg border border-slate-100">
            <thead>
              <tr className="bg-slate-100">
                <th className="w-40 border-b border-slate-100 px-4 py-3 text-right text-sm font-medium text-slate-600">
                  عنوان ردیف
                </th>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className="border-b border-l border-slate-100 px-4 py-3 text-right text-sm font-medium text-slate-600"
                  >
                    <div className="flex items-center justify-between gap-2">
                      {editingColumn === column.key ? (
                        <input
                          className="w-full rounded border border-slate-300 px-2 py-1 text-sm focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
                          defaultValue={column.title}
                          autoFocus
                          onBlur={(e) => updateColumnTitle(column.key, e.target.value.trim() || column.title)}
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => setEditingColumn(column.key)}
                          className="text-right text-sm text-slate-600 hover:text-pink-600"
                        >
                          {columnTitleMap[column.key]}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => removeColumn(column.key)}
                        className="text-xs text-slate-400 hover:text-red-500"
                      >
                        حذف
                      </button>
                    </div>
                  </th>
                ))}
                <th className="w-12 border-b border-slate-100 px-2 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={row.id} className="border-t border-slate-100">
                  <td className="bg-slate-100 px-4 py-3 text-slate-600">
                    <input
                      value={row.label}
                      onChange={(e) => updateRowValue(rowIndex, "label", e.target.value)}
                      className="w-full rounded border border-slate-200 px-2 py-1 text-sm focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
                      placeholder="عنوان ردیف"
                    />
                  </td>
                  {columns.map((column) => (
                    <td key={`${column.key}-${rowIndex}`} className="px-4 py-3">
                      <input
                        value={row[column.key] || ""}
                        onChange={(e) => updateRowValue(rowIndex, column.key, e.target.value)}
                        className="w-full rounded border border-slate-200 px-2 py-1 text-sm focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
                        placeholder="مقدار"
                      />
                    </td>
                  ))}
                  <td className="px-2 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => removeRow(rowIndex)}
                      className="text-xs text-slate-400 hover:text-red-500"
                    >
                      حذف
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  );
};

export default TableBuilderDialog;
