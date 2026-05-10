import { StorefrontLogo } from "@repo/brand";

const LogoSection = () => {
  return (
    <div className="relative flex w-full items-center justify-center md:h-full md:min-h-[324px] md:w-auto md:border-r md:border-slate-200 md:px-4 lg:px-6">
      <StorefrontLogo />
    </div>
  );
};

export default LogoSection;
