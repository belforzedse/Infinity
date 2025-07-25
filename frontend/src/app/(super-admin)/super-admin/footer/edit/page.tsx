"use client";

import UpsertPageContentWrapper from "@/components/SuperAdmin/UpsertPage/ContentWrapper/index";
import { config } from "./config";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Footer } from "@/types/super-admin/footer";
import { getFooter } from "@/services/super-admin/footer/get";
import { updateFooter } from "@/services/super-admin/footer/update";

// Define the nested footer type for form handling
type NestedFooter = {
  "first.header": string;
  "first.links": string;
  "second.header": string;
  "second.links": string;
  "third.header": string;
  "third.links": string;
  "contactUs.phone": string;
  "contactUs.whatsapp": string;
  "contactUs.instagram": string;
  "contactUs.telegram": string;
  customerSupport: string;
} & Footer;

export default function FooterEditPage() {
  const router = useRouter();
  const [data, setData] = useState<NestedFooter | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const footerData = await getFooter();

        // Transform the footer data to a nested format for the form
        const nestedData: NestedFooter = {
          ...footerData,
          "first.header": footerData.first.header,
          "first.links": JSON.stringify(footerData.first.links),
          "second.header": footerData.second.header,
          "second.links": JSON.stringify(footerData.second.links),
          "third.header": footerData.third.header,
          "third.links": JSON.stringify(footerData.third.links),
          "contactUs.phone": footerData.contactUs.phone,
          "contactUs.whatsapp": footerData.contactUs.whatsapp || "",
          "contactUs.instagram": footerData.contactUs.instagram || "",
          "contactUs.telegram": footerData.contactUs.telegram || "",
          customerSupport: footerData.customerSupport,
        };

        setData(nestedData);
      } catch (error) {
        toast.error("خطا در دریافت اطلاعات فوتر");
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div>در حال بارگذاری...</div>;
  }

  if (!data) {
    return <div>اطلاعات فوتر یافت نشد</div>;
  }

  return (
    <UpsertPageContentWrapper<NestedFooter>
      config={config}
      data={data}
      onSubmit={async (formData) => {
        try {
          // Transform the nested form data back to the Footer structure
          const footerData: Footer = {
            id: formData.id,
            customerSupport: formData.customerSupport,
            first: {
              header: formData["first.header"],
              links: JSON.parse(formData["first.links"]),
            },
            second: {
              header: formData["second.header"],
              links: JSON.parse(formData["second.links"]),
            },
            third: {
              header: formData["third.header"],
              links: JSON.parse(formData["third.links"]),
            },
            contactUs: {
              phone: formData["contactUs.phone"],
              whatsapp: formData["contactUs.whatsapp"] || null,
              instagram: formData["contactUs.instagram"] || null,
              telegram: formData["contactUs.telegram"] || null,
            },
            createdAt: formData.createdAt,
            updatedAt: new Date(),
          };

          await updateFooter(footerData);
          toast.success("فوتر با موفقیت بروزرسانی شد");

          // Refresh data instead of redirecting
          const updatedFooter = await getFooter();
          const updatedNestedData: NestedFooter = {
            ...updatedFooter,
            "first.header": updatedFooter.first.header,
            "first.links": JSON.stringify(updatedFooter.first.links),
            "second.header": updatedFooter.second.header,
            "second.links": JSON.stringify(updatedFooter.second.links),
            "third.header": updatedFooter.third.header,
            "third.links": JSON.stringify(updatedFooter.third.links),
            "contactUs.phone": updatedFooter.contactUs.phone,
            "contactUs.whatsapp": updatedFooter.contactUs.whatsapp || "",
            "contactUs.instagram": updatedFooter.contactUs.instagram || "",
            "contactUs.telegram": updatedFooter.contactUs.telegram || "",
            customerSupport: updatedFooter.customerSupport,
          };
          setData(updatedNestedData);
        } catch (error) {
          toast.error("خطایی رخ داده است");
          console.error(error);
        }
      }}
    />
  );
}
