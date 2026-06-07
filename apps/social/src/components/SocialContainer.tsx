import type { ReactNode } from "react";

export const SOCIAL_CONTAINER_CLASS =
  "mx-auto w-full max-w-[1360px] px-5 sm:px-6 lg:px-[60px]";

type SocialContainerProps = {
  as?: "div" | "main";
  children: ReactNode;
  className?: string;
  dir?: "ltr" | "rtl" | "auto";
};

function joinClassNames(...classNames: Array<string | undefined>): string {
  return classNames.filter(Boolean).join(" ");
}

export function SocialContainer({
  as = "div",
  children,
  className,
  dir,
}: SocialContainerProps) {
  const classes = joinClassNames(SOCIAL_CONTAINER_CLASS, className);

  if (as === "main") {
    return (
      <main className={classes} dir={dir}>
        {children}
      </main>
    );
  }

  return (
    <div className={classes} dir={dir}>
      {children}
    </div>
  );
}
