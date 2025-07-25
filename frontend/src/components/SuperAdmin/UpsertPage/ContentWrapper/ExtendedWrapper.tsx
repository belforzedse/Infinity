"use client";

import { ReactNode, useState } from "react";
import UpsertPageContentWrapper from "./index";
import { ExtendedUpsertPageConfigType, ExtendedField } from "./ExtendedTypes";

type Props<T> = {
  config: ExtendedUpsertPageConfigType<T>;
  data?: T extends { id: string | number } ? T : T & { id: string | number };
  footer?: ReactNode | ((data: T) => ReactNode);
  customSidebar?: ReactNode;
  onSubmit?: (data: T) => Promise<void>;
};

function isCustomField<T>(
  field: ExtendedField<T>
): field is ExtendedField<T> & { type: "custom" } {
  return field.type === "custom";
}

export default function ExtendedUpsertPageContentWrapper<
  T extends { createdAt: Date; updatedAt: Date }
>(props: Props<T>) {
  const { config, data, onSubmit } = props;

  // Convert the extended config to the base config by handling custom fields
  const baseConfig = {
    ...config,
    config: config.config.map((section) => ({
      ...section,
      sections: section.sections.map((subsection) => ({
        ...subsection,
        fields: subsection.fields.filter(
          (field) => !isCustomField(field)
        ) as any,
      })),
    })),
  };

  // State to manage form data
  const [formData, setFormData] = useState<T>(data ?? ({} as T));

  // Handle custom field changes
  const handleCustomFieldChange = (fieldName: keyof T, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  return (
    <div>
      {/* Render custom fields */}
      {config.config.map((section, sectionIndex) => (
        <div key={`section-${sectionIndex}`}>
          {section.sections.map((subsection, subsectionIndex) => (
            <div key={`subsection-${sectionIndex}-${subsectionIndex}`}>
              {subsection.fields
                .filter((field) => isCustomField(field))
                .map((field, fieldIndex) => {
                  if (isCustomField(field)) {
                    return (
                      <div
                        key={`custom-field-${String(field.name)}-${fieldIndex}`}
                        className="mb-6"
                      >
                        {field.label && (
                          <label className="block text-sm font-medium mb-2">
                            {field.label}
                          </label>
                        )}
                        {field.render({
                          value: formData[field.name],
                          onChange: (value: any) =>
                            handleCustomFieldChange(field.name, value),
                          data: formData,
                        })}
                        {field.helper && (
                          <div className="mt-1">
                            {typeof field.helper === "function"
                              ? field.helper(formData)
                              : field.helper}
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                })}
            </div>
          ))}
        </div>
      ))}

      {/* Render the base UpsertPageContentWrapper with non-custom fields */}
      <UpsertPageContentWrapper
        {...props}
        config={baseConfig as any}
        data={formData as any}
        onSubmit={async (updatedData) => {
          // Merge the updated standard fields with custom fields
          const mergedData = {
            ...updatedData,
            ...formData,
          };

          if (onSubmit) {
            await onSubmit(mergedData as T);
          }
        }}
      />
    </div>
  );
}
