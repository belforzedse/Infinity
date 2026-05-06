import React from "react";

interface ReportTableSkeletonProps {
  columns?: number;
  rows?: number;
}

export default function ReportTableSkeleton({ columns = 5, rows = 5 }: ReportTableSkeletonProps) {
  return (
    <>
      {[...Array(rows)].map((_, i) => (
        <tr key={i} className="animate-pulse">
          {[...Array(columns)].map((_, j) => (
            <td key={j} className="p-4">
              <div className="h-4 w-3/4 rounded bg-gray-200" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
