export interface FooterLink {
  title: string;
  url: string;
}

export interface FooterColumn {
  header: string;
  links: FooterLink[];
}

export interface ContactInfo {
  phone: string;
  whatsapp: string | null;
  instagram: string | null;
  telegram: string | null;
}

export interface FooterData {
  customerSupport: string;
  first: FooterColumn;
  second: FooterColumn;
  third: FooterColumn;
  contactUs: ContactInfo;
  storeLocations: string;
}

export const FOOTER_DATA: FooterData = {
  customerSupport: "شنبه تا پنج شنبه (غیر از روزهای تعطیل) از ساعت9 صبح الی 17 پاسخگوی شما هستیم.",
  first: {
    header: "حساب کاربری",
    links: [
      { title: "حساب کاربری من", url: "/account" },
      { title: "فروشگاه", url: "/plp" },
      { title: "سبد خرید", url: "/cart" },
      // { title: "ویدیوهای آموزشی", url: "https://new.infinitycolor.co/videos/" },
      { title: "اینفینیتی مگ", url: "https://new.infinitycolor.co/blog/" },
    ],
  },
  second: {
    header: "دسترسی سریع",
    links: [
      { title: "خرید بافت", url: "/plp/category/پلیور-و-بافت" },
      { title: "خرید پیراهن زنانه", url: "/plp/category/shirt" },
      {
        title: "خرید شال و روسری",
        url: "/plp/category/shawls-and-scarves",
      },
      {
        title: "خرید شومیز",
        url: "/plp/category/paperback-and-tonic",
      },
      {
        title: "خرید مانتو",
        url: "/plp/category/coat-and-mantle",
      },
    ],
  },
  third: {
    header: "خدمات مشتریان",
    links: [
      { title: "درباره ما", url: "/about" },
      { title: "تماس با ما", url: "/contact" },
      { title: "سوالات متداول", url: "/faq" },
      // {
      //   title: "شرایط و مقررات تعویض و مرجوع",
      //   url: "https://new.infinitycolor.co/شرایط-و-مقررات-تعویض-و-مرجوع/",
      // },
    ],
  },
  contactUs: {
    phone: "017-325-304-39",
    whatsapp: "0901-655-25-30",
    instagram: "infinity.color_boutique",
    telegram: "InfinityColorShop",
  },
  storeLocations: "گرگان، بلوار ناهارخوران نبش عدالت 68، گنبد کاووس، ابتدای بلوار دانشجو",
};
