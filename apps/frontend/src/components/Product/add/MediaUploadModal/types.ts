export type TabType = "افزودن رسانه" | "ایجاد گالری" | "تصویر محصول";

export enum MediaViewEnum {
  UPLOAD_FILES = "بارگزاری پرونده ها",
  UPLOAD_MULTIPLE_FILES = "کتابخانه پرونده های چند رسانه ای",
  SHOW_DETAILS = "نمایش جزئیات",
}

export type MediaViewType =
  | "بارگزاری پرونده ها"
  | "کتابخانه پرونده های چند رسانه ای"
  | "نمایش جزئیات";

export interface SelectedImageDetailsSection {
  name: string;
  url: string;
  size?: string;
  date?: string;
}
