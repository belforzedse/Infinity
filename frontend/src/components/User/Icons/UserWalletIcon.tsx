import Image from "next/image";

interface IconProps {
  className?: string;
}

export default function UserWalletIcon({ className }: IconProps) {
  return (
    <div className={className}>
      <Image
        src="/images/cart/wallet.svg"
        alt="Wallet"
        width={24}
        height={24}
        className="h-full w-full"
      />
    </div>
  );
}
