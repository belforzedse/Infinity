"use client";

import FooterLink from "./FooterLink";
import { useEffect, useState } from "react";
import { FooterColumn } from "@/services/footer";

interface UserAccountSectionProps {
  data?: FooterColumn;
}

const UserAccountSection = ({ data }: UserAccountSectionProps) => {
  // Fallback data in case API data is not available
  const [links, setLinks] = useState<{ title: string; url: string }[]>([
    { title: "حساب کاربری من", url: "#" },
    { title: "فروشگاه", url: "/plp" },
    { title: "سبد خرید", url: "/cart" },
    { title: "پرداخت", url: "/checkout" },
    { title: "ویدیوهای آموزشی", url: "#" },
    { title: "اینفینیتی مگ", url: "#" },
  ]);

  const [title, setTitle] = useState<string>("حساب کاربری");

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
    <div className="flex flex-col gap-2 border-b border-slate-200 pb-5 md:h-full md:min-h-[324px] md:border-b-[0px] md:border-none md:px-[65px]">
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

export default UserAccountSection;
