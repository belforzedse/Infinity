import MessageIcon from "../Icons/MessageIcon";

interface WelcomNotifBarProps {
  username: string;
}

export default function WelcomNotifBar({ username }: WelcomNotifBarProps) {
  return (
    <div className="relative flex w-full items-center gap-3 rounded-lg bg-emerald-50 py-4 pr-4 border border-emerald-200">
      <div className="absolute right-0 top-0 h-full w-1 rounded-l-lg bg-[#10B981]" />

      <MessageIcon className="h-6 w-6 flex-shrink-0 text-emerald-600" />

      <div className="flex flex-col items-start gap-0.5 text-right">
        <span className="text-sm font-medium text-foreground-primary">
          <span className="text-emerald-600 font-semibold">{username}</span>
          {" "}به فروشگاه بزرگ اینفینیتی خوش اومدی!
        </span>
        <span className="text-xs text-neutral-500">پیام سیستم</span>
      </div>
    </div>
  );
}
