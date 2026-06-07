"use client";

import LogoSection from "./LogoSection";
import StoresSection from "./StoresSection";
import CustomerServiceSection from "./CustomerServiceSection";
import QuickAccessSection from "./QuickAccessSection";
import UserAccountSection from "./UserAccountSection";
import { FOOTER_DATA } from "@/constants/footer";
import PageContainer from "@/components/layout/PageContainer";
import { useSiteIdentity } from "@/components/providers/SiteIdentityProvider";

const PLPFooter = () => {
  const identity = useSiteIdentity();
  const footerStores = (identity.stores ?? []).filter((s) => s.showInFooter);
  const supportHours = identity.supportHours ?? FOOTER_DATA.customerSupport;

  return (
    <footer className="rounded-t-3xl bg-stone-100">
      <PageContainer className="space-y-6 pb-10 pt-8">
        <div className="hidden items-start justify-between gap-4 lg:flex lg:flex-row-reverse">
          <LogoSection />
          <StoresSection
            stores={footerStores}
            showStores={identity.hasPhysicalStores}
            socialLinks={identity.socialLinks}
            contactNumbers={identity.contactNumbers}
          />
          <CustomerServiceSection
            header={FOOTER_DATA.third.header}
            links={FOOTER_DATA.third.links}
            customerSupport={supportHours}
          />
          <QuickAccessSection
            header={FOOTER_DATA.second.header}
            links={FOOTER_DATA.second.links}
          />
          <UserAccountSection
            header={FOOTER_DATA.first.header}
            links={FOOTER_DATA.first.links}
          />
        </div>

        <div className="flex flex-col gap-6 lg:hidden">
          <LogoSection />
          <div className="grid gap-6 md:grid-cols-2">
            <QuickAccessSection
              header={FOOTER_DATA.second.header}
              links={FOOTER_DATA.second.links}
            />
            <UserAccountSection
              header={FOOTER_DATA.first.header}
              links={FOOTER_DATA.first.links}
            />
            <CustomerServiceSection
              header={FOOTER_DATA.third.header}
              links={FOOTER_DATA.third.links}
              customerSupport={supportHours}
            />
            <StoresSection
              stores={footerStores}
              showStores={identity.hasPhysicalStores}
              socialLinks={identity.socialLinks}
              contactNumbers={identity.contactNumbers}
            />
          </div>
        </div>
      </PageContainer>
    </footer>
  );
};

export default PLPFooter;
