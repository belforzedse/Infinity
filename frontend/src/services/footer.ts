import { API_BASE_URL, STRAPI_TOKEN } from "@/constants/api";

export interface FooterLink {
  Title: string;
  URL: string;
}

export interface FooterColumn {
  Header: string;
  Links: FooterLink[];
}

export interface ContactInfo {
  Phone: string;
  Whatsapp: string | null;
  Instagram: string | null;
  Telegram: string | null;
}

export interface FooterData {
  CustomerSupport: string;
  First: FooterColumn;
  Second: FooterColumn;
  Third: FooterColumn;
  ContactUs: ContactInfo;
}

export async function getFooterData(): Promise<FooterData> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/footer?populate[0]=First.Links&populate[1]=Second.Links&populate[2]=Third.Links&populate[3]=ContactUs`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${STRAPI_TOKEN}`,
        },
      },
    );

    // Gracefully handle missing footer (404) by returning empty structure
    if (response.status === 404) {
      return {
        CustomerSupport: "",
        First: { Header: "", Links: [] },
        Second: { Header: "", Links: [] },
        Third: { Header: "", Links: [] },
        ContactUs: {
          Phone: "",
          Whatsapp: null,
          Instagram: null,
          Telegram: null,
        },
      };
    }

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const result = await response.json();
    return result.data.attributes;
  } catch (error) {
    // Be quiet in production for footer; return safe defaults
    console.warn("Footer data unavailable:", error);
    return {
      CustomerSupport: "",
      First: { Header: "", Links: [] },
      Second: { Header: "", Links: [] },
      Third: { Header: "", Links: [] },
      ContactUs: { Phone: "", Whatsapp: null, Instagram: null, Telegram: null },
    };
  }
}
