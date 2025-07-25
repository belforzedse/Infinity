interface AuthTitleProps {
  children: React.ReactNode;
  subtitle?: React.ReactNode;
}

export default function AuthTitle({ children, subtitle }: AuthTitleProps) {
  return (
    <div className="text-center space-y-2 md:space-y-3">
      <h1 className="text-4xl text-foreground-primary font-normal">
        {children}
      </h1>
      {subtitle && (
        <p className="text-base text-foreground-primary/80">{subtitle}</p>
      )}
    </div>
  );
}
