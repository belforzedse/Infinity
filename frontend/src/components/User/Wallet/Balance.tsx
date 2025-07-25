import CirculePlusIcon from "@/components/User/Icons/CirculePlusIcon";

export default function WalletBalance() {
  return (
    <div className="flex flex-col items-end gap-3 w-full lg:w-2/5">
      <div
        className="w-full h-[199px] rounded-2xl p-5 flex flex-col items-start gap-10"
        style={{
          background: "linear-gradient(66.02deg, #EC4899 0%, #F787BF 84.01%)",
        }}
      >
        <span className="text-white text-[20px]">کیف پول اینفینیتی</span>
        <span className="text-white text-[36px]">۰ تومان</span>
      </div>

      <button className="flex items-center gap-1">
        <span className="text-base text-foreground-pink">افزایش موجودی</span>
        <CirculePlusIcon />
      </button>
    </div>
  );
}
