import { ReactNode } from "react";

export type StandardFieldType =
  | "text"
  | "dropdown"
  | "multiline-text"
  | "password-with-btn"
  | "copy-text"
  | "date"
  | "password"
  | "checkbox"
  | "tag-text"
  | "terms"
  | "json"
  | "categories-list";

export type StandardField<T> = {
  name: keyof T;
  type: StandardFieldType;
  label?: string;
  labelAction?: (data: T) => ReactNode;
  helper?: (data: T) => ReactNode;
  colSpan: number;
  mobileColSpan: number;
  readOnly?: boolean;
  options?: Array<{
    label: string;
    value: string;
  }>;
  fetchTerms?: (
    searchTerm: string,
    category: string
  ) => Promise<
    Array<{
      label: string;
      value: string;
    }>
  >;
  fetchOptions?: (
    searchTerm: string,
    formData?: any
  ) => Promise<
    Array<{
      label: string;
      value: string;
    }>
  >;
  placeholder?: string;
  termTags?: Array<{
    label: string;
    value: string;
  }>;
  rows?: number;
};

export type ProvinceCityField<T> = {
  type: "province-city";
  provinceField: keyof T;
  cityField: keyof T;
  label?: string;
  labelAction?: (data: T) => ReactNode;
  helper?: (data: T) => ReactNode;
  colSpan: number;
  mobileColSpan: number;
  readOnly?: boolean;
  provincePlaceholder?: string;
  cityPlaceholder?: string;
};

export type RadioTextWithChipsField<T> = {
  name: keyof T;
  chipsName: keyof T;
  textName: keyof T;
  descriptionPlaceholder: string;
  type: "radio-text-with-chips";
  label: string;
  colSpan: number;
  mobileColSpan: number;
  options: Array<{
    label: string;
    value: string;
    chips?: Array<{
      label: string;
      value: string;
    }>;
  }>;
};

export type CategoriesListField<T> = {
  name: keyof T;
  type: "categories-list";
  label?: string;
  labelAction?: (data: T) => ReactNode;
  helper?: (data: T) => ReactNode;
  colSpan: number;
  mobileColSpan: number;
  readOnly?: boolean;
  fetchCategories?: () => Promise<
    Array<{
      id: number;
      title: string;
      slug: string;
    }>
  >;
};

export type Field<T> =
  | StandardField<T>
  | ProvinceCityField<T>
  | RadioTextWithChipsField<T>
  | CategoriesListField<T>;

export function isStandardField<T>(field: Field<T>): field is StandardField<T> {
  return (
    field.type !== "province-city" &&
    field.type !== "radio-text-with-chips" &&
    field.type !== "categories-list"
  );
}

export function isRadioTextWithChips<T>(
  field: Field<T>
): field is RadioTextWithChipsField<T> {
  return field.type === "radio-text-with-chips";
}

export function isProvinceCityField<T>(
  field: Field<T>
): field is ProvinceCityField<T> {
  return field.type === "province-city";
}

export function isCategoriesListField<T>(
  field: Field<T>
): field is CategoriesListField<T> {
  return field.type === "categories-list";
}
