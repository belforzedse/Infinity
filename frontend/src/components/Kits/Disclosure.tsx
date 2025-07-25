import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";
import ArrowDownIcon from "../Product/Icons/ArrowDownIcon";

interface DisclosureItemProps {
  title: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
}

export default function DisclosureItem({
  title,
  children,
  defaultOpen = true,
  className = "",
}: DisclosureItemProps) {
  return (
    <div className={`w-full ${className}`}>
      <Disclosure as="div" defaultOpen={defaultOpen}>
        <DisclosureButton className="group flex w-full items-center justify-between">
          {title}
          <ArrowDownIcon className="rotate-180 group-data-[open]:rotate-0 w-6 h-6" />
        </DisclosureButton>
        <DisclosurePanel className="mt-2">{children}</DisclosurePanel>
      </Disclosure>
    </div>
  );
}
