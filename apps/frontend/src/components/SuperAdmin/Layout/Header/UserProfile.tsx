import Image from "next/image";
import SmallChevronDownIcon from "../Icons/SmallChevronDownIcon";

export default function SuperAdminLayoutHeaderUserProfile() {
  return (
    <div className="flex items-center gap-2 md:gap-6">
      <div className="flex cursor-pointer items-center gap-1 md:gap-4">
        <div className="h-11 w-11 overflow-hidden rounded-full bg-neutral-100">
          <Image
            src="/images/super-admin.png"
            alt="User Avatar"
            width={44}
            height={44}
            sizes="44px"
            className="h-full w-full object-cover"
          />
        </div>

        <div className="hidden flex-col gap-1 md:flex">
          <span className="text-sm !leading-none text-neutral-600">مینا مخبری</span>
          <span className="text-xs !leading-none text-neutral-600">ادمین</span>
        </div>
        <div className="flex h-[18px] w-[18px] items-center justify-center rounded-full border border-neutral-600">
          <SmallChevronDownIcon />
        </div>
      </div>

      <Image
        className="cursor-pointer"
        src="/images/super-admin-notification.png"
        alt="Notification"
        width={30}
        height={30}
        sizes="30px"
      />
    </div>
  );
}
