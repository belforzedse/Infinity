import LogoSection from "./LogoSection";
import StoresSection from "./StoresSection";
import CustomerServiceSection from "./CustomerServiceSection";
import QuickAccessSection from "./QuickAccessSection";
import UserAccountSection from "./UserAccountSection";
import { FOOTER_DATA } from "@/constants/footer";
import PageContainer from "@/components/layout/PageContainer";

const PLPFooter = () => {
  return (
    <footer className="rounded-t-3xl bg-stone-100">
      <PageContainer
        variant="wide"
        className="space-y-6 pb-10 pt-8"
      >
        <div className="hidden items-start justify-between gap-4 lg:flex lg:flex-row-reverse">
          <LogoSection />
          <StoresSection
            contactInfo={FOOTER_DATA.contactUs}
            storeLocations={FOOTER_DATA.storeLocations}
          />
          <CustomerServiceSection
            header={FOOTER_DATA.third.header}
            links={FOOTER_DATA.third.links}
            customerSupport={FOOTER_DATA.customerSupport}
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
              customerSupport={FOOTER_DATA.customerSupport}
            />
            <StoresSection
              contactInfo={FOOTER_DATA.contactUs}
              storeLocations={FOOTER_DATA.storeLocations}
            />
          </div>
        </div>
      </PageContainer>
    </footer>
  );
};

export default PLPFooter;
