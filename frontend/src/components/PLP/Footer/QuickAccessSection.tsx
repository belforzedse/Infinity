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
    { title: "oppsi", url: "https://infinitycolor.co/محصولات-زده-دار/" },
    { title: "خرید بافت", url: "https://infinitycolor.co/shop/پلیور-و-بافت/" },
    { title: "خرید پیراهن زنانه", url: "https://infinitycolor.co/shop/shirt/" },
    {
      title: "خرید شال و روسری",
      url: "https://infinitycolor.co/shop/shawls-and-scarves/",
    },
    {
      title: "خرید شومیز",
      url: "https://infinitycolor.co/shop/paperback-and-tonic/",
    },
    {
      title: "خرید مانتو",
      url: "https://infinitycolor.co/shop/coat-and-mantle/",
    },
    //    { title: "خرید پیراهن زنانه", url: "#" },
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
          })),
        );
      }
    }
  }, [data]);

  return (
    <div className="flex flex-col gap-2 border-b border-slate-200 pb-[20px] md:h-full md:min-h-[324px] md:border-b-[0px] md:border-r md:px-[65px]">
      <h3 className="text-base text-neutral-900">{title}</h3>
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
