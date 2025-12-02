import { Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/react";

type Props = {
  title: string;
  content: string;
};

export default function PDPHeroInfoFAQItem(props: Props) {
  const { title, content } = props;

  return (
    <Disclosure as="div" className="w-full">
      <DisclosureButton className="group flex w-full items-center justify-between border-b pb-2 text-right text-neutral-800">
        {title}

        <div>
          <span className="text-lg text-foreground-primary group-data-[open]:hidden">+</span>
          <span className="text-lg hidden text-foreground-primary group-data-[open]:block">-</span>
        </div>
      </DisclosureButton>

      <div className="overflow-hidden py-2">
        <DisclosurePanel
          transition
          className="origin-top text-neutral-500 transition duration-200 ease-out data-[closed]:-translate-y-6 data-[closed]:opacity-0"
        >
          {content}
        </DisclosurePanel>
      </div>
    </Disclosure>
  );
}
