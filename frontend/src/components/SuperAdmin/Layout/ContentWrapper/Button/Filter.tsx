import SuperAdminTableSelect from "@/components/SuperAdmin/Table/Select";
import FilterIcon from "../../Icons/FilterIcon";
import FilterCloseIcon from "../../Icons/FilterCloseIcon";
import TrashIcon from "../../Icons/TrashIcon";
import WhitePlusIcon from "../../Icons/WhitePlusIcon";
import { Input } from "@/components/ui/Input";
import { useQueryState } from "nuqs";

type FilterItem = {
  value: string;
  field: string;
  operator: string;
};

type Props = {
  isFilterOpen: boolean;
  options: {
    id: number | string;
    title: string;
  }[];
  setFilterIsOpen: (isFilterOpen: boolean) => void;
  filter?: FilterItem[];
  setFilter?: (filter: FilterItem[] | ((prev: FilterItem[]) => FilterItem[])) => void;
};

export default function SuperAdminLayoutContentWrapperButtonFilter(props: Props) {
  const { isFilterOpen, setFilterIsOpen, options } = props;

  const [filter, setFilter] = useQueryState<
    {
      value: string;
      field: string;
      operator: string;
    }[]
  >("filter", {
    defaultValue: [],
    parse: (value) => JSON.parse(decodeURIComponent(value || "[]")),
    serialize: (value) => encodeURIComponent(JSON.stringify(value || [])),
  });

  return (
    <button
      className="text-sm relative flex w-full items-center justify-center gap-1 rounded-lg border border-slate-400 bg-white px-3 py-1 text-slate-700 md:w-auto"
      onClick={() => {
        setFilterIsOpen(!isFilterOpen);
      }}
    >
      <FilterIcon />
      <span className="text-foreground-primary">فیلتر پیشرفته</span>
      {isFilterOpen && (
        <div
          className="absolute left-0 top-full z-10 flex w-[368px] cursor-auto flex-col gap-3 rounded-lg border border-slate-100 bg-white p-3"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <div className="flex flex-col gap-1.5">
            {/* <div className="flex gap-2 items-center">
              <Input
                placeholder="کلمه مدنظرتو سرچ کن"
                className="h-8 !text-xs"
                parentClassName="flex-1 w-full"
                variant="auth"
                size="sm"
              />

              <button className="w-8 h-8 bg-actions-primary flex items-center justify-center rounded-md">
                <WhiteSearchIcon />
              </button>
            </div> */}

            {filter.map((item, index) => (
              <div key={index} className="flex items-center gap-1.5">
                <div className="flex-1">
                  <Input
                    placeholder="مقدار"
                    className="!text-xs h-8"
                    parentClassName="flex-1 w-full"
                    value={item.value}
                    onChange={(e) => {
                      setFilter((prev) =>
                        prev.map((filterItem, i) =>
                          i === index ? { ...filterItem, value: e.target.value } : filterItem,
                        ),
                      );
                    }}
                    variant="auth"
                    size="sm"
                  />
                </div>
                <div className="flex-1">
                  <SuperAdminTableSelect
                    buttonClassName="!p-1.5"
                    iconClassName="!w-5 !h-5"
                    selectedOption={item.operator}
                    options={[
                      { id: 0, title: "عملگر" },
                      { id: "$lt", title: "کوچکتر از" },
                      { id: "$gt", title: "بیشتر از" },
                      { id: "$eq", title: "برابر با" },
                      { id: "$ne", title: "متفاوت از" },
                      { id: "$contains", title: "شامل" },
                      { id: "$notContains", title: "شامل نباشد" },
                      { id: "$startsWith", title: "شروع با" },
                      { id: "$endsWith", title: "پایان با" },
                      { id: "$null", title: "خالی" },
                      { id: "$notNull", title: "غیر خالی" },
                    ]}
                    onOptionSelect={(id) => {
                      setFilter((prev) =>
                        prev.map((filterItem, i) =>
                          i === index ? { ...filterItem, operator: id.toString() } : filterItem,
                        ),
                      );
                    }}
                  />
                </div>
                <div className="flex-1">
                  <SuperAdminTableSelect
                    buttonClassName="!p-1.5"
                    iconClassName="!w-5 !h-5"
                    selectedOption={item.field}
                    options={[
                      {
                        id: "",
                        title: "فیلد",
                      },
                      ...options,
                    ]}
                    onOptionSelect={(id) => {
                      setFilter((prev) =>
                        prev.map((filterItem, i) =>
                          i === index ? { ...filterItem, field: id.toString() } : filterItem,
                        ),
                      );
                    }}
                  />
                </div>

                <button
                  className="flex h-5 w-5 items-center justify-center"
                  onClick={() => {
                    setFilter((prev) => prev.filter((_, i) => i !== index));
                  }}
                >
                  <FilterCloseIcon />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between">
            <button
              className="flex items-center gap-0.5"
              onClick={() => {
                setFilter([]);
              }}
            >
              <TrashIcon />

              <span className="text-xs text-actions-primary">حذف همه فیلترها</span>
            </button>

            <button
              className="flex h-8 items-center justify-center gap-1 rounded-md bg-actions-primary px-2"
              onClick={() => {
                if ((filter.length && filter.at(-1)?.value) || !filter.length) {
                  setFilter((prev) => [
                    ...prev,
                    {
                      value: "",
                      field: "",
                      operator: "",
                    },
                  ]);
                }
              }}
            >
              <WhitePlusIcon />

              <span className="text-xs text-white">افزودن فیلتر</span>
            </button>
          </div>
        </div>
      )}
    </button>
  );
}
