export default function PLPLayout({ children }: { children: React.ReactNode }) {
  return (
    <section className="px-4 py-2 md:px-10 md:py-8">
      <div className="mx-auto max-w-[1440px]">{children}</div>
    </section>
  );
}
