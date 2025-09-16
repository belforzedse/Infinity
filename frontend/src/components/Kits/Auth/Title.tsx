interface AuthTitleProps {
  children: React.ReactNode;
  subtitle?: React.ReactNode;
}

export default function AuthTitle({ children, subtitle }: AuthTitleProps) {
  return (
    <div className="space-y-2 text-center md:space-y-3">
      <h1 className="text-4xl font-normal text-foreground-primary">
        {children}
      </h1>
      {subtitle && (
        <p className="text-base text-foreground-primary/80">{subtitle}</p>
      )}
    </div>
  );
}
