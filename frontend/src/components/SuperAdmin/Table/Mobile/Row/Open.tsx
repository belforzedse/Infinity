import { ColumnDef } from "@tanstack/react-table";

type OpenMobileTableRowProps<TData> = {
  columns: ColumnDef<TData>[];
  row: TData & { attributes: any; id: string };
};

export function OpenMobileTableRow<TData>(
  props: OpenMobileTableRowProps<TData>
) {
  const { columns, row } = props;

  return columns.slice(0, columns.length - 1).map((column, index) => {
    return (
      <div
        className="bg-stone-50 w-full flex justify-between items-center rounded-[4px] px-2 py-1"
        key={index}
      >
        <span className="text-xs text-neutral-400">
          {column.header?.toString()}
        </span>

        {column?.cell ? (
          (column?.cell as any)?.({
            row: {
              original: row,
              getValue: (key: string) => {
                return row.attributes?.[key as keyof typeof row.attributes];
              },
            },
          })
        ) : (
          <span className="text-foreground-primary text-xs md:text-base">
            {(() => {
              const accessorKey = (column as any).accessorKey as string;
              if (!accessorKey) return "";

              if (accessorKey === "id") {
                return row.id;
              }

              const getNestedValue = (obj: any, path: string[]): any => {
                if (!obj || path.length === 0) return obj;

                const [current, ...rest] = path;

                if (current === "attributes" && obj.attributes) {
                  return getNestedValue(obj.attributes, rest);
                } else if (current === "data" && obj.data) {
                  return getNestedValue(obj.data, rest);
                } else if (obj[current] !== undefined) {
                  return getNestedValue(obj[current], rest);
                }

                return "";
              };

              const value = getNestedValue(row, accessorKey.split("."));
              return typeof value === "object"
                ? JSON.stringify(value)
                : String(value || "");
            })()}
          </span>
        )}
      </div>
    );
  });
}
