import { Fragment } from "react";
import { Listbox, Transition } from "@headlessui/react";
import ArrowDownIcon from "@/components/Product/Icons/ArrowDownIcon";
import classNames from "classnames";

export interface Option {
  id: number | string;
  name: string;
}

interface SelectProps {
  label?: string;
  value: Option | null;
  onChange: (value: Option) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
  selectButtonClassName?: string;
  isLoading?: boolean;
  error?: string;
}

export default function Select({
  label,
  value,
  onChange,
  options,
  placeholder = "انتخاب کنید",
  className = "",
  selectButtonClassName,
  isLoading = false,
  error,
}: SelectProps) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label className="lg:text-lg text-base text-foreground-primary">
          {label}
        </label>
      )}
      <Listbox value={value} onChange={onChange} disabled={isLoading}>
        <div className="relative">
          <Listbox.Button
            className={classNames(
              "relative w-full p-3 text-right rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500",
              {
                "border-red-500": error,
                "border-slate-100": !error,
                "cursor-not-allowed opacity-75": isLoading,
              },
              selectButtonClassName
            )}
          >
            <span className="block truncate text-neutral-600">
              {isLoading ? "در حال بارگیری..." : value?.name || placeholder}
            </span>
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2">
              {isLoading ? (
                <svg
                  className="animate-spin h-5 w-5 text-gray-400"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : (
                <ArrowDownIcon />
              )}
            </span>
          </Listbox.Button>

          {error && <p className="mt-1 text-sm text-red-500">{error}</p>}

          <Transition
            as={Fragment}
            leave="transition ease-in duration-100"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <Listbox.Options className="absolute z-[60] mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none sm:text-sm">
              {options.length === 0 ? (
                <div className="relative cursor-default select-none py-2 px-4 text-gray-500">
                  هیچ آدرسی یافت نشد
                </div>
              ) : (
                options.map((option) => (
                  <Listbox.Option
                    key={option.id}
                    value={option}
                    className={({ active }) =>
                      `relative cursor-pointer select-none py-2 px-4 text-gray-900 ${
                        active ? "bg-primary-50" : ""
                      }`
                    }
                  >
                    {({ selected }) => (
                      <span
                        className={`block truncate ${
                          selected ? "font-medium" : "font-normal"
                        }`}
                      >
                        {option.name}
                      </span>
                    )}
                  </Listbox.Option>
                ))
              )}
            </Listbox.Options>
          </Transition>
        </div>
      </Listbox>
    </div>
  );
}
