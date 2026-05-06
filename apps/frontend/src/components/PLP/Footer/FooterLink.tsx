import Link from "next/link";

interface FooterLinkProps {
  href: string;
  children: React.ReactNode;
}

const FooterLink = ({ href, children }: FooterLinkProps) => {
  return (
    <Link
      href={href}
      className="group text-sm flex flex-[49%] items-center justify-start gap-1 text-neutral-600 transition-colors hover:text-pink-600 md:flex-none md:justify-end"
    >
      <span className="h-1 w-1 rounded-full bg-neutral-300 group-hover:bg-pink-600" />
      {children}
    </Link>
  );
};

export default FooterLink;
