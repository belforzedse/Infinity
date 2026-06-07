"use client";

import { createContext, useContext } from "react";
import type { SiteIdentity } from "@/types/site-identity";
import { DEFAULT_SITE_IDENTITY } from "@/services/site-identity";

const SiteIdentityContext = createContext<SiteIdentity>(DEFAULT_SITE_IDENTITY);

export function SiteIdentityProvider({
  identity,
  children,
}: {
  identity: SiteIdentity;
  children: React.ReactNode;
}) {
  return (
    <SiteIdentityContext.Provider value={identity}>{children}</SiteIdentityContext.Provider>
  );
}

export function useSiteIdentity(): SiteIdentity {
  return useContext(SiteIdentityContext);
}
