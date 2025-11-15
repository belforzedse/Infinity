"use client";

import Footer from "@/components/PLP/Footer";
import Header from "@/components/User/Header";
import dynamic from "next/dynamic";
import { useCart } from "@/contexts/CartContext";
import { useAccountFreshData } from "@/hooks/useAccountFreshData";
import useUser from "@/hooks/useUser";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const CartDrawer = dynamic(() => import("@/components/ShoppingCart/Drawer"), {
  ssr: false,
});

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  // Enable automatic data refresh for account pages (15 second debounce)
  // This applies to /orders, /wallet, /addresses, /account, etc.
  useAccountFreshData();
  const { isDrawerOpen } = useCart();
  const { userData, isLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [isHydrated, setIsHydrated] = useState(false);

  // Mark component as hydrated after first render to prevent hydration mismatches
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    // Only run auth redirect logic after hydration is complete
    if (!isHydrated) return;

    if (!isLoading && !userData) {
      const target = `/auth?redirect=${encodeURIComponent(pathname)}`;
      router.replace(target);
    }
  }, [isHydrated, isLoading, userData, router, pathname]);

  // During initial render (server + hydration), render the layout structure
  // to prevent hydration mismatch. The useEffect above will handle redirects
  // if the user is not authenticated after hydration.
  // Only return null after we've confirmed no user (after hydration + effects run)
  if (isHydrated && !isLoading && !userData) {
    return null;
  }
  return (
    <div className="public-layout bg-white pt-5">
      <div className="container mx-auto px-4 lg:p-0">
        <Header />

        {children}

        <footer>
          <Footer />
        </footer>
      </div>

      {/* Cart Drawer */}
      {isDrawerOpen && <CartDrawer />}
    </div>
  );
}
