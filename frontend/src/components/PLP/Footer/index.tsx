"use client";

import { useEffect, useState } from "react";
import LogoSection from "./LogoSection";
import StoresSection from "./StoresSection";
import CustomerServiceSection from "./CustomerServiceSection";
import QuickAccessSection from "./QuickAccessSection";
import UserAccountSection from "./UserAccountSection";
import { FooterData, getFooterData } from "@/services/footer";

const PLPFooter = () => {
  const [footerData, setFooterData] = useState<FooterData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchFooterData = async () => {
      try {
        const data = await getFooterData();
        setFooterData(data);
      } catch (error) {
        console.error("Failed to fetch footer data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFooterData();
  }, []);

  return (
    <footer className="bg-stone-100 rounded-t-3xl p-3 md:px-10 md:py-6">
      <div className="md:block hidden">
        <div className="flex flex-row-reverse justify-between items-start max-w-[1440px] mx-auto relative">
          <LogoSection />
          <StoresSection contactInfo={footerData?.ContactUs} />
          <CustomerServiceSection
            data={footerData?.Third}
            customerSupport={footerData?.CustomerSupport}
          />
          <QuickAccessSection data={footerData?.Second} />
          <UserAccountSection data={footerData?.First} />
        </div>
      </div>

      <div className="md:hidden">
        <div className="flex flex-col gap-3">
          <LogoSection />
          <QuickAccessSection data={footerData?.Second} />
          <UserAccountSection data={footerData?.First} />
          <CustomerServiceSection
            data={footerData?.Third}
            customerSupport={footerData?.CustomerSupport}
          />
          <StoresSection contactInfo={footerData?.ContactUs} />
        </div>
      </div>
    </footer>
  );
};

export default PLPFooter;
