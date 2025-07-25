"use client";

import FooterLink from "./FooterLink";
import { useEffect, useState } from "react";
import { FooterColumn } from "@/services/footer";

interface QuickAccessSectionProps {
  data?: FooterColumn;
}

const QuickAccessSection = ({ data }: QuickAccessSectionProps) => {
  // Fallback data in case API data is not available
  const [links, setLinks] = useState<{ title: string; url: string }[]>([
    { title: "oppsi", url: "#" },
    { title: "خرید بافت", url: "#" },
    { title: "خرید پیراهن زنانه", url: "#" },
    { title: "خرید شال و روسری", url: "#" },
    { title: "خرید شومیز", url: "#" },
    { title: "خرید مانتو", url: "#" },
    { title: "خرید پیراهن زنانه", url: "#" },
  ]);

  const [title, setTitle] = useState<string>("دسترسی سریع");

  useEffect(() => {
    if (data) {
      setTitle(data.Header);
      if (data.Links && data.Links.length > 0) {
        setLinks(
          data.Links.map((link) => ({
            title: link.Title,
            url: link.URL,
          }))
        );
      }
    }
  }, [data]);

  return (
    <div className="flex flex-col gap-2 md:px-[65px] md:border-r md:border-b-[0px] border-b pb-[20px] border-slate-200 md:h-full md:min-h-[324px]">
      <h3 className="text-neutral-900 text-base">{title}</h3>
      <div className="flex flex-row-reverse md:flex-col flex-wrap items-start gap-2">
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
