import { ReactNode } from "react";
import {
  TextField,
  DropdownField,
  MultilineTextField,
  PasswordWithBtn,
  PasswordField,
  CopyTextField,
  DateField,
  JsonField,
  CheckboxField,
  TagTextField,
  RadioTextWithChips,
  TermsField,
  ProvinceCityField,
  CategoriesListField,
} from "./Fields";
import {
  Field,
  isStandardField,
  isRadioTextWithChips,
  isProvinceCityField,
  isCategoriesListField,
} from "./types";

type FieldRendererProps<T> = {
  field: Field<T>;
  formData: T;
  data?: T & { id?: string | number };
  updateFormData: (fieldName: keyof T, value: any) => void;
};

export default function FieldRenderer<T>({
  field,
  formData,
  data,
  updateFormData,
}: FieldRendererProps<T>) {
  const isReadOnly = isStandardField(field)
    ? field.readOnly
    : isProvinceCityField(field)
    ? field.readOnly
    : false;

  const fieldRenderers: Record<string, () => React.ReactNode> = {
    text: () => {
      if (!isStandardField(field) || field.type !== "text") return null;
      return (
        <TextField
          value={formData[field.name] as string}
          onChange={(value) => updateFormData(field.name, value)}
          readOnly={isReadOnly}
        />
      );
    },
    dropdown: () => {
      if (!isStandardField(field) || field.type !== "dropdown") return null;
      return (
        <DropdownField
          value={formData[field.name] as string}
          onChange={(value) => updateFormData(field.name, value)}
          options={field.options || []}
          readOnly={isReadOnly}
          fetchOptions={field.fetchOptions}
          placeholder={field.placeholder}
          formData={formData}
          name={field.name as string}
        />
      );
    },
    "multiline-text": () => {
      if (!isStandardField(field) || field.type !== "multiline-text")
        return null;
      return (
        <MultilineTextField
          value={formData[field.name] as string}
          onChange={(value) => updateFormData(field.name, value)}
          readOnly={isReadOnly}
          rows={field.rows}
        />
      );
    },
    "password-with-btn": () => {
      if (!isStandardField(field) || field.type !== "password-with-btn")
        return null;
      return (
        <PasswordWithBtn
          id={data?.id as string}
          value={formData[field.name] as string}
        />
      );
    },
    password: () => {
      if (!isStandardField(field) || field.type !== "password") return null;
      return (
        <PasswordField
          value={formData[field.name] as string}
          onChange={(value) => updateFormData(field.name, value)}
          readOnly={isReadOnly}
        />
      );
    },
    "copy-text": () => {
      if (!isStandardField(field) || field.type !== "copy-text") return null;
      return (
        <CopyTextField
          value={formData[field.name] as string}
          onChange={(value) => updateFormData(field.name, value)}
          readOnly={isReadOnly}
        />
      );
    },
    date: () => {
      if (!isStandardField(field) || field.type !== "date") return null;
      return (
        <DateField
          value={formData[field.name] as Date}
          onChange={(date) => updateFormData(field.name, date)}
          readOnly={isReadOnly}
        />
      );
    },
    json: () => {
      if (!isStandardField(field) || field.type !== "json") return null;
      return (
        <JsonField
          value={formData[field.name] as string}
          onChange={(value) => updateFormData(field.name, value)}
          readOnly={isReadOnly}
          rows={field.rows || 10}
        />
      );
    },
    checkbox: () => {
      if (!isStandardField(field) || field.type !== "checkbox") return null;
      return (
        <CheckboxField
          value={formData[field.name] as string[]}
          onChange={(value) => updateFormData(field.name, value)}
          options={field.options || []}
        />
      );
    },
    "tag-text": () => {
      if (!isStandardField(field) || field.type !== "tag-text") return null;
      return (
        <TagTextField
          value={formData[field.name] as string[]}
          onChange={(value) => updateFormData(field.name, value)}
          options={field.options}
        />
      );
    },
    terms: () => {
      if (!isStandardField(field) || field.type !== "terms") return null;
      return (
        <TermsField
          value={
            formData[field.name] as {
              category: string;
              tags: string[];
            }[]
          }
          onChange={(value) => updateFormData(field.name, value)}
          options={field.options || []}
          termTags={field.termTags || []}
          helper={field.helper ? field.helper(data ?? ({} as T)) : undefined}
          readOnly={isReadOnly}
          fetchTerms={field.fetchTerms}
        />
      );
    },
    "categories-list": () => {
      if (!isCategoriesListField(field)) return null;
      return (
        <CategoriesListField
          value={formData[field.name] as string}
          onChange={(value: string) => updateFormData(field.name, value)}
          readOnly={isReadOnly}
          fetchCategories={field.fetchCategories}
        />
      );
    },
    "radio-text-with-chips": () => {
      if (!isRadioTextWithChips(field)) return null;
      return (
        <RadioTextWithChips
          name={field.name as string}
          value={formData[field.name] as string}
          chipsValue={formData[field.chipsName] as string}
          textValue={formData[field.textName] as string}
          descriptionPlaceholder={field.descriptionPlaceholder}
          options={field.options}
          onValueChange={(value) => updateFormData(field.name, value)}
          onChipsChange={(value) => updateFormData(field.chipsName, value)}
          onTextChange={(value) => updateFormData(field.textName, value)}
        />
      );
    },
    "province-city": () => {
      if (!isProvinceCityField(field)) return null;
      return (
        <ProvinceCityField
          provinceValue={formData[field.provinceField] as string}
          cityValue={formData[field.cityField] as string}
          onProvinceChange={(value) => {
            updateFormData(field.provinceField, value);
          }}
          onCityChange={(value) => {
            updateFormData(field.cityField, value);
          }}
          readOnly={field.readOnly}
          provincePlaceholder={field.provincePlaceholder}
          cityPlaceholder={field.cityPlaceholder}
          formData={formData}
        />
      );
    },
  };

  return fieldRenderers[field.type]?.() || null;
}
