import React from "react";
import { normalizeSizeGuideData, type SizeGuideRow } from "@/utils/sizeGuide";

interface SpecTableProps {
  specs?: SizeGuideRow[];
}

const SpecTable: React.FC<SpecTableProps> = ({ specs = [] }) => {
  const { rows, headers } = normalizeSizeGuideData(specs);

  if (!rows.length || headers.length === 0) {
    return (
      <div className="w-full p-5 text-center">
        <p className="text-foreground-primary">راهنمای سایز برای این محصول موجود نیست.</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto">
      <table className="min-w-full border-collapse bg-white">
        <thead>
          <tr className="bg-gray-50">
            <th className="text-sm whitespace-nowrap border p-3 text-center text-foreground-primary">
              سایز
            </th>
            {headers.map((header) => (
              <th
                key={header}
                className="text-sm whitespace-nowrap border p-3 text-center text-foreground-primary"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((spec, index) => (
            <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
              <td className="text-sm border p-3 text-right text-gray-700">{spec.size}</td>
              {headers.map((header) => (
                <td key={header} className="text-sm border p-3 text-right text-gray-700">
                  {spec[header] || "-"}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SpecTable;
