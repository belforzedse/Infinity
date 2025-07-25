import { apiClient } from "@/services";
import { STRAPI_TOKEN } from "@/constants/api";
import { Footer } from "@/types/super-admin/footer";

export async function updateFooter(footer: Footer): Promise<void> {
  await apiClient.put(
    `/footer`,
    {
      data: {
        CustomerSupport: footer.customerSupport,
        First: {
          Header: footer.first.header,
          Links: footer.first.links.map((link) => ({
            Title: link.title,
            URL: link.url,
          })),
        },
        Second: {
          Header: footer.second.header,
          Links: footer.second.links.map((link) => ({
            Title: link.title,
            URL: link.url,
          })),
        },
        Third: {
          Header: footer.third.header,
          Links: footer.third.links.map((link) => ({
            Title: link.title,
            URL: link.url,
          })),
        },
        ContactUs: {
          Phone: footer.contactUs.phone,
          Whatsapp: footer.contactUs.whatsapp,
          Instagram: footer.contactUs.instagram,
          Telegram: footer.contactUs.telegram,
        },
      },
    },
    {
      headers: {
        Authorization: `Bearer ${STRAPI_TOKEN}`,
      },
    }
  );
}
