export default function PLPLayout({ children }: { children: React.ReactNode }) {
  return (
    <section className="py-2 px-4 md:py-8 md:px-10">
      <div className="max-w-[1440px] mx-auto">{children}</div>
    </section>
  );
}
