"use client";

import { useEffect, useState } from "react";
import LogoSection from "./LogoSection";
import StoresSection from "./StoresSection";
import CustomerServiceSection from "./CustomerServiceSection";
import QuickAccessSection from "./QuickAccessSection";
import UserAccountSection from "./UserAccountSection";
import type { FooterData } from "@/services/footer";
import { getFooterData } from "@/services/footer";
import PageContainer from "@/components/layout/PageContainer";

const PLPFooter = () => {
  const [footerData, setFooterData] = useState<FooterData | null>(null);

  useEffect(() => {
    const fetchFooterData = async () => {
      try {
        const data = await getFooterData();
        setFooterData(data);
      } catch (error) {
        console.error("Failed to fetch footer data:", error);
      }
    };

    fetchFooterData();
  }, []);

  return (
    <footer className="rounded-t-3xl bg-stone-100">
      <PageContainer
        variant="wide"
        className="space-y-6 pb-10 pt-8"
      >
        <div className="hidden items-start justify-between gap-6 lg:flex lg:flex-row-reverse">
          <LogoSection />
          <StoresSection contactInfo={footerData?.ContactUs} />
          <CustomerServiceSection
            data={footerData?.Third}
            customerSupport={footerData?.CustomerSupport}
          />
          <QuickAccessSection data={footerData?.Second} />
          <UserAccountSection data={footerData?.First} />
        </div>

        <div className="flex flex-col gap-6 lg:hidden">
          <LogoSection />
          <div className="grid gap-6 md:grid-cols-2">
            <QuickAccessSection data={footerData?.Second} />
            <UserAccountSection data={footerData?.First} />
            <CustomerServiceSection
              data={footerData?.Third}
              customerSupport={footerData?.CustomerSupport}
            />
            <StoresSection contactInfo={footerData?.ContactUs} />
          </div>
        </div>
      </PageContainer>
    </footer>
  );
};

export default PLPFooter;
