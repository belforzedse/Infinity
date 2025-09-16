"use client";

import { ReactNode } from "react";
import { Provider } from "jotai";
import jotaiStore from "@/lib/jotaiStore";
import TopProgressBar from "@/components/ui/TopProgressBar";
import PreloadBlur from "@/components/ui/PreloadBlur";
import NavigationProgress from "@/components/ui/NavigationProgress";
import GlobalFetchInterceptor from "@/components/ui/GlobalFetchInterceptor";
import GlobalLoadingOverlay from "@/components/ui/GlobalLoadingOverlay";
import ImageEffects from "@/components/ui/ImageEffects";
import { Suspense } from "react";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <Provider store={jotaiStore}>
      {/*
       * Global UI helpers are registered here so that pages throughout the app
       * can rely on shared behavior without needing to include these components
       * individually. The order of these components generally reflects the
       * desired rendering priority for visual elements.
       */}
      <PreloadBlur />
      <TopProgressBar />
      {/* Navigation progress relies on Suspense to avoid blocking the initial render */}
      <Suspense fallback={null}>
        <NavigationProgress />
      </Suspense>
      {/* Intercepts fetch calls to show global error/loading states */}
      <GlobalFetchInterceptor />
      <ImageEffects />
      {children}
      <GlobalLoadingOverlay />
    </Provider>
  );
}
