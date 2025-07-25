import SuperAdminTableSelect from "@/components/SuperAdmin/Table/Select";
import FilterIcon from "../../Icons/FilterIcon";
import FilterCloseIcon from "../../Icons/FilterCloseIcon";
import TrashIcon from "../../Icons/TrashIcon";
import WhitePlusIcon from "../../Icons/WhitePlusIcon";
import AuthInput from "@/components/Kits/Auth/Input";
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
  setFilter?: (
    filter: FilterItem[] | ((prev: FilterItem[]) => FilterItem[])
  ) => void;
};

export default function SuperAdminLayoutContentWrapperButtonFilter(
  props: Props
) {
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
      className="text-sm text-slate-700 flex items-center justify-center gap-1 py-1 px-3 border border-slate-400 bg-white rounded-lg relative w-full md:w-auto"
      onClick={() => {
        setFilterIsOpen(!isFilterOpen);
      }}
    >
      <FilterIcon />
      <span className="text-foreground-primary">فیلتر پیشرفته</span>
      {isFilterOpen && (
        <div
          className="absolute top-full w-[368px] bg-white p-3 rounded-lg border border-slate-100 left-0 cursor-auto flex gap-3 flex-col z-10"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <div className="flex gap-1.5 flex-col">
            {/* <div className="flex gap-2 items-center">
              <AuthInput
                placeholder="کلمه مدنظرتو سرچ کن"
                className="h-8 !text-xs"
                parentClassNames="flex-1 w-full"
              />

              <button className="w-8 h-8 bg-actions-primary flex items-center justify-center rounded-md">
                <WhiteSearchIcon />
              </button>
            </div> */}

            {filter.map((item, index) => (
              <div key={index} className="flex gap-1.5 items-center">
                <div className="flex-1">
                  <AuthInput
                    placeholder="مقدار"
                    className="h-8 !text-xs"
                    parentClassNames="flex-1 w-full"
                    value={item.value}
                    onChange={(e) => {
                      setFilter((prev) =>
                        prev.map((filterItem, i) =>
                          i === index
                            ? { ...filterItem, value: e.target.value }
                            : filterItem
                        )
                      );
                    }}
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
                          i === index
                            ? { ...filterItem, operator: id.toString() }
                            : filterItem
                        )
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
                          i === index
                            ? { ...filterItem, field: id.toString() }
                            : filterItem
                        )
                      );
                    }}
                  />
                </div>

                <button
                  className="w-5 h-5 flex items-center justify-center"
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
              className="flex gap-0.5 items-center"
              onClick={() => {
                setFilter([]);
              }}
            >
              <TrashIcon />

              <span className="text-actions-primary text-xs">
                حذف همه فیلترها
              </span>
            </button>

            <button
              className="h-8 bg-actions-primary flex gap-1 items-center justify-center rounded-md px-2"
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

              <span className="text-white text-xs">افزودن فیلتر</span>
            </button>
          </div>
        </div>
      )}
    </button>
  );
}
