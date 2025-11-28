"use client";

import { useEffect, useState } from "react";

/**
 * Google Consent Mode v2 implementation
 * Handles user consent for analytics and advertising
 * Required for GDPR/CCPA compliance in EEA/UK
 */
export function ConsentManager() {
  const [consentGiven, setConsentGiven] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if consent was previously given
    const storedConsent = localStorage.getItem("analytics-consent");
    const hasConsent = storedConsent === "granted";

    // Initialize Google Consent Mode v2
    if (typeof window.gtag !== "undefined") {
      window.gtag("consent", "default", {
        ad_storage: hasConsent ? "granted" : "denied",
        ad_user_data: hasConsent ? "granted" : "denied",
        ad_personalization: hasConsent ? "granted" : "denied",
        analytics_storage: hasConsent ? "granted" : "denied",
        functionality_storage: "granted",
        personalization_storage: hasConsent ? "granted" : "denied",
        security_storage: "granted",
      });
    }

    setConsentGiven(hasConsent);
  }, []);

  const grantConsent = () => {
    if (typeof window === "undefined") return;

    localStorage.setItem("analytics-consent", "granted");
    setConsentGiven(true);

    // Update consent mode
    if (typeof window.gtag !== "undefined") {
      window.gtag("consent", "update", {
        ad_storage: "granted",
        ad_user_data: "granted",
        ad_personalization: "granted",
        analytics_storage: "granted",
        personalization_storage: "granted",
      });
    }
  };

  const denyConsent = () => {
    if (typeof window === "undefined") return;

    localStorage.setItem("analytics-consent", "denied");
    setConsentGiven(false);

    // Update consent mode
    if (typeof window.gtag !== "undefined") {
      window.gtag("consent", "update", {
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
        analytics_storage: "denied",
        personalization_storage: "denied",
      });
    }
  };

  // Only show consent banner if consent hasn't been given yet
  // For now, we'll just initialize consent mode silently
  // You can add a consent banner UI component if needed

  return null; // No UI for now - can be extended with a consent banner
}

// Extend Window interface for gtag
declare global {
  interface Window {
    gtag?: (
      command: string,
      targetId: string | Record<string, any>,
      config?: Record<string, any>
    ) => void;
  }
}



