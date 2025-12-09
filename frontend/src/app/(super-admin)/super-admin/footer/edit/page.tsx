/*
 * Footer Management Page - DISABLED
 *
 * The footer is now managed as a frontend component with hardcoded data.
 * Footer data is located in: frontend/src/constants/footer.ts
 *
 * To update the footer, edit the FOOTER_DATA constant in that file.
 *
 * The backend footer API structure remains intact but is no longer used.
 */

// import UpsertPageContentWrapper from "@/components/SuperAdmin/UpsertPage/ContentWrapper/index";
// import { config } from "./config";
// import { toast } from "react-hot-toast";
// import { useEffect, useState } from "react";
// import type { Footer } from "@/types/super-admin/footer";
// import { getFooter } from "@/services/super-admin/footer/get";
// import { updateFooter } from "@/services/super-admin/footer/update";

// type NestedFooter = {
//   "first.header": string;
//   "first.links": string;
//   "second.header": string;
//   "second.links": string;
//   "third.header": string;
//   "third.links": string;
//   "contactUs.phone": string;
//   "contactUs.whatsapp": string;
//   "contactUs.instagram": string;
//   "contactUs.telegram": string;
//   customerSupport: string;
// } & Footer;

export default function FooterEditPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <div className="max-w-2xl rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="mb-4 text-2xl font-bold text-gray-900">Footer Management Disabled</h1>
        <p className="mb-4 text-gray-600">
          The footer is now managed as a frontend component with hardcoded data.
        </p>
        <div className="rounded-md bg-gray-50 p-4">
          <p className="mb-2 text-sm font-semibold text-gray-700">To update the footer:</p>
          <p className="text-sm text-gray-600">
            Edit the <code className="rounded bg-gray-200 px-1 py-0.5">FOOTER_DATA</code> constant
            in <code className="rounded bg-gray-200 px-1 py-0.5">frontend/src/constants/footer.ts</code>
          </p>
        </div>
        <p className="mt-4 text-sm text-gray-500">
          The backend footer API structure remains intact but is no longer used.
        </p>
      </div>
    </div>
  );
}
