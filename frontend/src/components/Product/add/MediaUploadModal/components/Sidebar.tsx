import { TabType } from "../types";
import TabItem from "./TabItem";

interface SidebarProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const tabs: TabType[] = ["افزودن رسانه", "ایجاد گالری", "تصویر محصول"];

  return (
    <div className="col-span-1 flex flex-col gap-1">
      {tabs.map((tab) => (
        <TabItem key={tab} isActive={activeTab === tab} onClick={() => onTabChange(tab)}>
          {tab}
        </TabItem>
      ))}
    </div>
  );
}
