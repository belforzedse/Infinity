import Image from "next/image";
import SmallChevronDownIcon from "../Icons/SmallChevronDownIcon";

export default function SuperAdminLayoutHeaderUserProfile() {
  return (
    <div className="flex items-center gap-2 md:gap-6">
      <div className="flex items-center gap-1 md:gap-4 cursor-pointer">
        <div className="w-11 h-11 rounded-full overflow-hidden bg-neutral-100">
          <Image
            src="/images/super-admin.png"
            alt="User Avatar"
            width={44}
            height={44}
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-col gap-1 hidden md:flex">
          <span className="text-neutral-600 text-sm !leading-none">
            مینا مخبری
          </span>
          <span className="text-neutral-600 text-xs !leading-none">ادمین</span>
        </div>
        <div className="w-[18px] h-[18px] border border-neutral-600 rounded-full flex justify-center items-center">
          <SmallChevronDownIcon />
        </div>
      </div>

      <Image
        className="cursor-pointer"
        src="/images/super-admin-notification.png"
        alt="Notification"
        width={30}
        height={30}
      />
    </div>
  );
}
