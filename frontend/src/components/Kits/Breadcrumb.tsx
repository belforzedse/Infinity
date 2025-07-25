import Link from "next/link";
import LeftArrowIcon from "./Icons/LeftArrowIcon";

type Props = {
  breadcrumbs: {
    label: string;
    href?: string;
  }[];
};

export default function Breadcrumb(props: Props) {
  const { breadcrumbs } = props;

  return (
    <div className="flex items-center gap-1">
      {breadcrumbs.map((breadcrumb, index) => (
        <div key={index} className="flex items-center gap-1">
          <Link href={breadcrumb.href ?? "#"}>
            <div
              className={`text-xs ${
                index < breadcrumbs.length - 1
                  ? "text-foreground-muted"
                  : "text-foreground-primary"
              }`}
            >
              {breadcrumb.label}
            </div>
          </Link>
          {index < breadcrumbs.length - 1 && <LeftArrowIcon />}
        </div>
      ))}
    </div>
  );
}
