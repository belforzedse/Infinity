import { TabItem } from "@/types/Tabs";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import { ReactNode } from "react";

interface TabsProps {
  tabs: TabItem[];
  children: ReactNode[];
  tabsClassName?: string;
}

export default function Tabs({ tabs, children, tabsClassName }: TabsProps) {
  return (
    <div className="w-full">
      <TabGroup>
        <TabList className="grid grid-cols-3 gap-2 border-gray-200 lg:flex lg:gap-5 lg:border-b">
          {tabs.map(({ key, value }) => (
            <Tab
              key={key}
              className={({ selected }) =>
                `text-sm rounded-md py-2 font-medium lg:text-base focus:outline-none lg:rounded-b-none lg:rounded-t-lg ${tabsClassName} ${
                  selected
                    ? "border border-blue-600 bg-blue-50 text-blue-600 lg:border-b-2 lg:border-l-0 lg:border-r-0 lg:border-t-0 lg:border-pink-500 lg:bg-white lg:text-slate-700"
                    : "border border-slate-200 bg-slate-50 text-slate-400 lg:border-none lg:bg-white"
                }`
              }
            >
              {value}
            </Tab>
          ))}
        </TabList>
        <TabPanels className="mt-5 lg:mt-4">
          {children.map((child, index) => (
            <TabPanel key={tabs[index].key} className="rounded-xl">
              {child}
            </TabPanel>
          ))}
        </TabPanels>
      </TabGroup>
    </div>
  );
}
