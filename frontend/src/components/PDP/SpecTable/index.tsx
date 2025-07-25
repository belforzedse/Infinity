import React from "react";

interface SpecTableProps {
  specs?: {
    size: string;
    [key: string]: string;
  }[];
}

const SpecTable: React.FC<SpecTableProps> = ({ specs = [] }) => {
  // If no specs data is provided, return null
  if (!specs.length) {
    return (
      <div className="w-full text-center p-5">
        <p className="text-foreground-primary">
          راهنمای سایز برای این محصول موجود نیست.
        </p>
      </div>
    );
  }

  // Get all column keys from the first item
  const columnKeys = Object.keys(specs[0]).filter((key) => key !== "size");

  return (
    <div className="w-full overflow-x-auto">
      <table className="min-w-full bg-white border-collapse">
        <thead>
          <tr className="bg-gray-50">
            <th className="p-3 text-center border text-sm text-foreground-primary whitespace-nowrap">
              سایز
            </th>
            {columnKeys.map((key) => (
              <th
                key={key}
                className="p-3 text-center border text-sm text-foreground-primary whitespace-nowrap"
              >
                {key}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {specs.map((spec, index) => (
            <tr
              key={index}
              className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
            >
              <td className="p-3 text-right border text-sm text-gray-700">
                {spec.size}
              </td>
              {columnKeys.map((key) => (
                <td
                  key={key}
                  className="p-3 text-right border text-sm text-gray-700"
                >
                  {spec[key]}
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
