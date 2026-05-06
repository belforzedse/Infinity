import React from "react";

interface SizeTableProps {
  data: any[];
  columns: { key: string; title: string }[];
  title?: string;
}

const SizeTable: React.FC<SizeTableProps> = ({ data, columns, title }) => {
  const hasData = Array.isArray(data) && data.length > 0 && columns.length > 0;

  if (!hasData) {
    return <div className="py-8 text-center text-neutral-500">راهنمای سایز ثبت نشده است</div>;
  }

  return (
    <div className="w-full rounded-xl bg-white p-5">
      {title && <h3 className="text-lg mb-4 font-medium text-neutral-800">{title}</h3>}
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
            {data.map((row, rowIndex) => (
              <tr key={rowIndex} className={rowIndex !== 0 ? "border-t border-slate-100" : ""}>
                <td className="border-l border-slate-100 p-3">{row.size || "-"}</td>
                {columns.map((column) => (
                  <td key={column.key} className="border-l border-slate-100 p-3">
                    {row[column.key] || "-"}
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
