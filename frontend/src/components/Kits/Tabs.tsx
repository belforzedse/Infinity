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
        <TabList className="lg:flex grid grid-cols-3 lg:gap-5 gap-2 lg:border-b border-gray-200">
          {tabs.map(({ key, value }) => (
            <Tab
              key={key}
              className={({ selected }) =>
                `lg:rounded-t-lg lg:rounded-b-none rounded-md py-2 lg:text-base text-sm font-medium focus:outline-none ${tabsClassName} ${
                  selected
                    ? "lg:border-b-2 lg:border-t-0 lg:border-l-0 lg:border-r-0 lg:border-pink-500 lg:bg-white bg-blue-50 border border-blue-600 lg:text-slate-700 text-blue-600"
                    : "text-slate-400 lg:bg-white bg-slate-50 lg:border-none border border-slate-200"
                }`
              }
            >
              {value}
            </Tab>
          ))}
        </TabList>
        <TabPanels className="lg:mt-4 mt-5">
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
