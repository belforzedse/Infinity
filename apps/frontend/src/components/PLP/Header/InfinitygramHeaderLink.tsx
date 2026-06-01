import Image from "next/image";

type InfinitygramHeaderLinkProps = {
  className?: string;
};

export default function InfinitygramHeaderLink({ className = "" }: InfinitygramHeaderLinkProps) {
  return (
    <a
      href="https://infinitygram.co"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Infinitygram"
      className={[
        "pressable flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#9A288A] via-[#CA215A] to-[#FF8D00] shadow-sm transition-all duration-200 hover:scale-105 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-[#CA215A] focus-visible:ring-offset-2 focus-visible:ring-offset-white active:scale-95",
        className,
      ].join(" ")}
    >
      <Image
        src="/images/social/infinitygram.svg"
        alt=""
        width={25}
        height={15}
        aria-hidden="true"
        className="h-[15px] w-[25px]"
      />
    </a>
  );
}
