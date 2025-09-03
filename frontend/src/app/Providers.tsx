"use client";

import { ReactNode } from "react";
import { Provider } from "jotai";
import jotaiStore from "@/lib/jotaiStore";
import TopProgressBar from "@/components/ui/TopProgressBar";
import NavigationProgress from "@/components/ui/NavigationProgress";
import GlobalFetchInterceptor from "@/components/ui/GlobalFetchInterceptor";
import GlobalLoadingOverlay from "@/components/ui/GlobalLoadingOverlay";
import { Suspense } from "react";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <Provider store={jotaiStore}>
      <TopProgressBar />
      <Suspense fallback={null}>
        <NavigationProgress />
      </Suspense>
      <GlobalFetchInterceptor />
      {children}
      <GlobalLoadingOverlay />
    </Provider>
  );
}
