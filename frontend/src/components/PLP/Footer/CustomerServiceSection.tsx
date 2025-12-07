import FooterLink from "./FooterLink";
import type { FooterLink as FooterLinkType } from "@/constants/footer";

interface CustomerServiceSectionProps {
  header: string;
  links: FooterLinkType[];
  customerSupport: string;
}

const CustomerServiceSection = ({
  header,
  links,
  customerSupport,
}: CustomerServiceSectionProps) => {
  return (
    <div className="relative flex flex-col gap-6 border-b border-slate-200 pb-5 md:h-full md:min-h-[324px] md:border-b-[0px] md:border-r md:px-4 lg:px-6">
      <div className="flex flex-col gap-2 border-b border-slate-200 pb-6">
        <h3 className="text-base text-neutral-900">{header}</h3>
        <div className="flex flex-col items-start gap-2">
          {links.map((link, index) => (
            <FooterLink key={index} href={link.url}>
              {link.title}
            </FooterLink>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-base text-neutral-900">پشتیبانی مشتریان</h3>
        <p className="text-sm text-right text-neutral-500 md:max-w-[280px]">{customerSupport}</p>
      </div>
    </div>
  );
};

export default CustomerServiceSection;
