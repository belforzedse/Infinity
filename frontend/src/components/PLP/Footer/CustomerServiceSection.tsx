"use client";

import FooterLink from "./FooterLink";
import { useEffect, useState } from "react";
import { FooterColumn } from "@/services/footer";

interface CustomerServiceSectionProps {
  data?: FooterColumn;
  customerSupport?: string;
}

const CustomerServiceSection = ({
  data,
  customerSupport,
}: CustomerServiceSectionProps) => {
  // Fallback data in case API data is not available
  const [links, setLinks] = useState<{ title: string; url: string }[]>([
    { title: "سوالات متداول", url: "#" },
    { title: "شرایط و مقررات تعویض و مرجوع", url: "#" },
  ]);

  const [title, setTitle] = useState<string>("خدمات مشتریان");
  const [supportText, setSupportText] = useState<string>(
    "شنبه تا پنج شنبه (غیر از روزهای تعطیل) از ساعت9 صبح الی 17 پاسخگوی شما هستیم.",
  );

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

    if (customerSupport) {
      setSupportText(customerSupport);
    }
  }, [data, customerSupport]);

  return (
    <div className="relative flex flex-col gap-6 border-b border-slate-200 pb-5 md:h-full md:min-h-[324px] md:border-b-[0px] md:border-r md:px-[65px]">
      <div className="flex flex-col gap-2 border-b border-slate-200 pb-6">
        <h3 className="text-base text-neutral-900">{title}</h3>
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
        <p className="text-sm text-right text-neutral-500 md:max-w-[233px]">
          {supportText}
        </p>
      </div>
    </div>
  );
};

export default CustomerServiceSection;
