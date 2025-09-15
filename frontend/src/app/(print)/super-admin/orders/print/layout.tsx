// app/(super-admin)/super-admin/orders/print/layout.tsx
import "./print.css";

export default function PrintLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Full-viewport overlay to hide the rest of the app UI while on print routes
    <div className="print-layout-overlay">
      <div className="print-wrapper">{children}</div>
    </div>
  );
}
