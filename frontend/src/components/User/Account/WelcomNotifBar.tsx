import MessageIcon from "../Icons/MessageIcon";

interface WelcomNotifBarProps {
  username: string;
}

export default function WelcomNotifBar({ username }: WelcomNotifBarProps) {
  return (
    <div className="bg-emerald-100 rounded-l-2xl lg:p-3 lg:pr-4 pr-3 py-2 flex items-center gap-2 lg:w-fit lg:pl-28 relative">
      <div className="bg-[#10B981] rounded-full lg:h-[78px] h-[62px] w-1 absolute right-0" />

      <MessageIcon className="lg:h-10 lg:w-10 h-6 w-6" />

      <div className="flex items-start flex-col gap-0.5">
        <span className="text-foreground-primary lg:text-lg text-base">
          <span className="text-emerald-600">{username} </span>به فروشگاه بزرگ
          اینفینیتی خوش اومدی!
        </span>
        <span className="lg:text-xs text-sm text-neutral-500">پیام سیستم</span>
      </div>
    </div>
  );
}
