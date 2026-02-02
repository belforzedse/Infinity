export interface FAQCategory {
  id: number;
  Title: string;
  Slug: string;
  Description?: string;
  Order?: number;
  faq_questions?: FAQQuestion[];
  createdAt: string;
  updatedAt: string;
}

export interface FAQQuestion {
  id: number;
  Question: string;
  Answer: string;
  Order?: number;
  IsActive: boolean;
  faq_category?: FAQCategory;
  createdAt: string;
  updatedAt: string;
}
