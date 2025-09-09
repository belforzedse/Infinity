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
      <div className="w-full p-5 text-center">
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
      <table className="min-w-full border-collapse bg-white">
        <thead>
          <tr className="bg-gray-50">
            <th className="text-sm whitespace-nowrap border p-3 text-center text-foreground-primary">
              سایز
            </th>
            {columnKeys.map((key) => (
              <th
                key={key}
                className="text-sm whitespace-nowrap border p-3 text-center text-foreground-primary"
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
              <td className="text-sm border p-3 text-right text-gray-700">
                {spec.size}
              </td>
              {columnKeys.map((key) => (
                <td
                  key={key}
                  className="text-sm border p-3 text-right text-gray-700"
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
