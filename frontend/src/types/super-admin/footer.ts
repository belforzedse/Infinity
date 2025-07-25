export interface FooterLink {
  title: string;
  url: string;
}

export interface FooterColumn {
  header: string;
  links: FooterLink[];
}

export interface FooterContactUs {
  phone: string;
  whatsapp: string | null;
  instagram: string | null;
  telegram: string | null;
}

export interface Footer {
  id: number;
  customerSupport: string;
  first: FooterColumn;
  second: FooterColumn;
  third: FooterColumn;
  contactUs: FooterContactUs;
  createdAt: Date;
  updatedAt: Date;
}
