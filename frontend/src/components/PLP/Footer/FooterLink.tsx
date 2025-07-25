import Link from "next/link";

interface FooterLinkProps {
  href: string;
  children: React.ReactNode;
}

const FooterLink = ({ href, children }: FooterLinkProps) => {
  return (
    <Link
      href={href}
      className="text-neutral-600 hover:text-pink-600 text-sm flex items-center gap-1 justify-start md:justify-end transition-colors group flex-[49%] md:flex-none"
    >
      <span className="w-1 h-1 rounded-full bg-neutral-300 group-hover:bg-pink-600" />
      {children}
    </Link>
  );
};

export default FooterLink;
