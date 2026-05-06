import Link from "next/link";
import { cn } from "@/utils/tailwind";

const tabs = [
  {
    id: "shipping",
    title: "حمل و نقل",
    href: "/super-admin/shipping",
  },
  {
    id: "province",
    title: "استان",
    href: "/super-admin/shipping/provinces",
  },
  {
    id: "city",
    title: "شهر",
    href: "/super-admin/shipping/provinces/1/cities",
  },
];

export default function ShippingTabs(props: { selectedTab: string }) {
  return (
    <div className="flex items-center gap-2">
      {tabs.map((tab) => (
        <Link
          href={tab.href}
          key={tab.id}
          className={cn(
            "text-base px-2 !leading-9 text-slate-400",
            tab.id === props.selectedTab && "border-b-2 border-actions-primary text-slate-700",
          )}
        >
          {tab.title}
        </Link>
      ))}
    </div>
  );
}
