import { apiClient } from "@/services";
import { STRAPI_TOKEN } from "@/constants/api";
import { Footer } from "@/types/super-admin/footer";

export async function getFooter(): Promise<Footer> {
  const response = await apiClient.get(
    "/footer?populate[0]=First.Links&populate[1]=Second.Links&populate[2]=Third.Links&populate[3]=ContactUs",
    {
      headers: {
        Authorization: `Bearer ${STRAPI_TOKEN}`,
      },
    }
  );

  const footerData = (response as any).data.attributes;

  return {
    id: 1,
    customerSupport: footerData.CustomerSupport || "",
    first: {
      header: footerData.First?.Header || "",
      links:
        footerData.First?.Links?.map(
          (link: { Title: string; URL: string }) => ({
            title: link.Title || "",
            url: link.URL || "",
          })
        ) || [],
    },
    second: {
      header: footerData.Second?.Header || "",
      links:
        footerData.Second?.Links?.map(
          (link: { Title: string; URL: string }) => ({
            title: link.Title || "",
            url: link.URL || "",
          })
        ) || [],
    },
    third: {
      header: footerData.Third?.Header || "",
      links:
        footerData.Third?.Links?.map(
          (link: { Title: string; URL: string }) => ({
            title: link.Title || "",
            url: link.URL || "",
          })
        ) || [],
    },
    contactUs: {
      phone: footerData.ContactUs?.Phone || "",
      whatsapp: footerData.ContactUs?.Whatsapp || "",
      instagram: footerData.ContactUs?.Instagram || "",
      telegram: footerData.ContactUs?.Telegram || "",
    },
    createdAt: new Date(footerData.createdAt || Date.now()),
    updatedAt: new Date(footerData.updatedAt || Date.now()),
  };
}
