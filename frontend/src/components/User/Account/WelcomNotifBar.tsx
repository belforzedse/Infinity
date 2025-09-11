import MessageIcon from "../Icons/MessageIcon";

interface WelcomNotifBarProps {
  username: string;
}

export default function WelcomNotifBar({ username }: WelcomNotifBarProps) {
  return (
    <div className="relative flex items-center gap-2 rounded-l-2xl bg-emerald-100 py-2 pr-3 lg:w-fit lg:p-3 lg:pl-28 lg:pr-4">
      <div className="absolute right-0 h-[62px] w-1 rounded-full bg-[#10B981] lg:h-[78px]" />

      <MessageIcon className="h-6 w-6 lg:h-10 lg:w-10" />

      <div className="flex flex-col items-start gap-0.5">
        <span className="text-base text-foreground-primary lg:text-lg">
          <span className="text-emerald-600">{username} </span>به فروشگاه بزرگ
          اینفینیتی خوش اومدی!
        </span>
        <span className="text-sm text-neutral-500 lg:text-xs">پیام سیستم</span>
      </div>
    </div>
  );
}
