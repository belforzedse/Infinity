import { UpsertPageConfigType as BaseUpsertPageConfigType } from "./index";
import { ReactNode } from "react";

type StandardFieldType =
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
  | "json";

type FieldType = StandardFieldType | "province-city" | "radio-text-with-chips";

// Define basic field types similar to those in the original component
type StandardField<T> = {
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
  placeholder?: string;
  rows?: number;
};

type ProvinceCityField<T> = {
  type: "province-city";
  provinceField: keyof T;
  cityField: keyof T;
  label?: string;
  labelAction?: (data: T) => ReactNode;
  helper?: (data: T) => ReactNode;
  colSpan: number;
  mobileColSpan: number;
  readOnly?: boolean;
};

type RadioTextWithChipsField<T> = {
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

type BaseField<T> =
  | StandardField<T>
  | ProvinceCityField<T>
  | RadioTextWithChipsField<T>;

// Add the custom field type
type CustomField<T> = {
  name: keyof T;
  type: "custom";
  label?: string;
  labelAction?: (data: T) => ReactNode;
  helper?: (data: T) => ReactNode;
  colSpan: number;
  mobileColSpan: number;
  readOnly?: boolean;
  render: (props: {
    value: any;
    onChange: (value: any) => void;
    data?: T;
  }) => ReactNode;
};

export type ExtendedField<T> = BaseField<T> | CustomField<T>;

export type ExtendedUpsertPageConfigType<T> = Omit<
  BaseUpsertPageConfigType<T>,
  "config"
> & {
  config: {
    title: string | ((data: T) => string);
    iconButton?: ReactNode;
    sections: {
      header?: {
        title: string;
        iconButton?: ReactNode;
      };
      fields: ExtendedField<T>[];
    }[];
  }[];
};
