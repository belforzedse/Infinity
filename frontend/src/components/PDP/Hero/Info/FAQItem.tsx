import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from "@headlessui/react";

type Props = {
  title: string;
  content: string;
};

export default function PDPHeroInfoFAQItem(props: Props) {
  const { title, content } = props;

  return (
    <Disclosure as="div" className="w-full">
      <DisclosureButton className=" text-neutral-800 w-full border-b pb-2 text-right flex items-center justify-between group">
        {title}

        <div>
          <span className=" text-foreground-primary text-lg  group-data-[open]:hidden">
            +
          </span>
          <span className="text-foreground-primary text-lg  group-data-[open]:block hidden">
            -
          </span>
        </div>
      </DisclosureButton>

      <div className="overflow-hidden py-2  ">
        <DisclosurePanel
          transition
          className=" text-neutral-500 origin-top transition duration-200 ease-out data-[closed]:-translate-y-6 data-[closed]:opacity-0"
        >
          {content}
        </DisclosurePanel>
      </div>
    </Disclosure>
  );
}
