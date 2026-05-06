export interface NavigationCategory {
  id: number;
  title: string;
  slug: string;
}

export interface Navigation {
  id: number;
  product_categories: NavigationCategory[];
  createdAt: Date;
  updatedAt: Date;
}
