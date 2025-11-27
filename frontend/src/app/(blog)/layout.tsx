import React from "react";
import Link from "next/link";
import { FileText, Home } from "lucide-react";

interface BlogLayoutProps {
  children: React.ReactNode;
}

export default function BlogLayout({ children }: BlogLayoutProps) {
  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      {/* Blog Header */}
      <header className="border-b border-slate-100 bg-white">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link href="/blog" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-pink-500">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-neutral-900">وبلاگ اینفینیتی</span>
          </Link>

          <nav className="flex items-center gap-4">
            <Link
              href="/"
              className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm text-neutral-600 transition-colors hover:bg-slate-50"
            >
              <Home className="h-4 w-4" />
              صفحه اصلی
            </Link>
          </nav>
        </div>
      </header>

      {/* Blog Content */}
      <main>{children}</main>

      {/* Blog Footer */}
      <footer className="border-t border-slate-100 bg-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-neutral-500">
            © {new Date().getFullYear()} فروشگاه اینفینیتی - تمامی حقوق محفوظ است
          </p>
        </div>
      </footer>
    </div>
  );
}
