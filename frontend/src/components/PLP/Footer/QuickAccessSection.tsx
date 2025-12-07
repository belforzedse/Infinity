import FooterLink from "./FooterLink";
import type { FooterLink as FooterLinkType } from "@/constants/footer";

interface QuickAccessSectionProps {
  header: string;
  links: FooterLinkType[];
}

const QuickAccessSection = ({ header, links }: QuickAccessSectionProps) => {
  return (
    <div className="flex flex-col gap-2 border-b border-slate-200 pb-[20px] md:h-full md:min-h-[324px] md:border-b-[0px] md:border-r md:px-4 lg:px-6">
      <h3 className="text-base text-neutral-900">{header}</h3>
      <div className="flex flex-row-reverse flex-wrap items-start gap-2 md:flex-col">
        {links.map((link, index) => (
          <FooterLink key={index} href={link.url}>
            {link.title}
          </FooterLink>
        ))}
      </div>
    </div>
  );
};

export default QuickAccessSection;
