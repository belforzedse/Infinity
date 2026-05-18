"use client";

import type { ReactNode } from "react";
import { Provider } from "jotai";
import { Toaster } from "react-hot-toast";
import { jotaiStore } from "@/lib/jotaiStore";
import { NetworkStatusIndicator } from "@/components/pwa/NetworkStatusIndicator";
import { PWAInstallPrompt } from "@/components/pwa/PWAInstallPrompt";
import { ServiceWorkerRegistration } from "@/components/pwa/ServiceWorkerRegistration";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <Provider store={jotaiStore}>
      {children}
      <ServiceWorkerRegistration />
      <NetworkStatusIndicator />
      <PWAInstallPrompt />
      <Toaster
        position="top-center"
        toastOptions={{
          className: "infinity-toast",
          style: { direction: "rtl" },
          duration: 4000,
          success: {
            iconTheme: { primary: "#3d4c6e", secondary: "#fff" },
          },
          error: {
            iconTheme: { primary: "#dc2626", secondary: "#fff" },
          },
        }}
      />
    </Provider>
  );
}
