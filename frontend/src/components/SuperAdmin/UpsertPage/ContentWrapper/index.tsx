"use client";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import CalendarIcon from "../Icons/CalendarIcon";
import AddButton from "../../Layout/ContentWrapper/Button/Add";
import ActiveBox from "./ActiveBox";
import FieldRenderer from "./FieldRenderer";
import { useRouter } from "next/navigation";
import logger from "@/utils/logger";
import type { Field } from "./types";
import { isStandardField, isRadioTextWithChips, isCategoriesListField } from "./types";
import { PanelLeftClose, PanelRight } from "lucide-react";
import CustomizationEditorPanel from "../../CustomizationEditorPanel";

type ActionButtonsProps = {
  onSubmit: () => void;
  onCancel: () => void;
  isLoading: boolean;
};

export type UpsertPageConfigType<T> = {
  headTitle: string;
  showTimestamp?: boolean;
  addButton?: {
    text: string;
    path?: string;
  };
  isActiveBox?: {
    key: keyof T;
    header: string;
    label: (value: boolean) => ReactNode;
  };
  config: {
    title: string | ((data: T) => string);
    iconButton?: ReactNode;
    sections: {
      header?: {
        title: string;
        iconButton?: ReactNode;
      };
      fields: Field<T>[];
    }[];
  }[];
  actionButtons: (props: ActionButtonsProps) => ReactNode;
};

type Props<T> = {
  config: UpsertPageConfigType<T>;
  data?: T extends { id: string | number } ? T : T & { id: string | number };
  footer?: ReactNode | ((data: T) => ReactNode);
  customSidebar?: ReactNode;
  onSubmit?: (data: T) => Promise<void>;
  /** When true and footer is set, preview is on the left and form is in a collapsible panel (hero-style). */
  usePanelLayout?: boolean;
};

const mobileColSpan = {
  1: "col-span-1",
  2: "col-span-2",
  3: "col-span-3",
  4: "col-span-4",
  5: "col-span-5",
  6: "col-span-6",
  7: "col-span-7",
  8: "col-span-8",
  9: "col-span-9",
  10: "col-span-10",
  11: "col-span-11",
  12: "col-span-12",
} as const;

const desktopColSpan = {
  1: "md:col-span-1",
  2: "md:col-span-2",
  3: "md:col-span-3",
  4: "md:col-span-4",
  5: "md:col-span-5",
  6: "md:col-span-6",
  7: "md:col-span-7",
  8: "md:col-span-8",
  9: "md:col-span-9",
  10: "md:col-span-10",
  11: "md:col-span-11",
  12: "md:col-span-12",
} as const;

export default function UpsertPageContentWrapper<T extends { createdAt: Date; updatedAt: Date }>(
  props: Props<T>,
) {
  const { config, data, footer, onSubmit: onSubmitProp, usePanelLayout } = props;

  const router = useRouter();

  const [formData, setFormData] = useState<T>(data ?? ({} as T));
  const [isLoading, setIsLoading] = useState(false);
  const [panelCollapsed, setPanelCollapsed] = useState(false);

  useEffect(() => {
    if (data) {
      setFormData(data);
    }
  }, [data]);

  const onSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();

    if (onSubmitProp) {
      setIsLoading(true);
      await onSubmitProp(formData);
      setIsLoading(false);
      return;
    }
  };

  const onCancel = () => {
    router.back();
  };

  const updateFormData = (fieldName: keyof T, value: any) => {
    if (process.env.NODE_ENV !== "production") {
      logger.info(`Updating field ${String(fieldName)} with value`, { value });
    }
    setFormData((prevData) => ({
      ...prevData,
      [fieldName]: value,
    }));
  };

  const isPanel = Boolean(usePanelLayout && footer);
  const formGridClass = isPanel ? "grid-cols-1" : "grid-cols-12";
  const formMainClass = isPanel ? "col-span-1" : "col-span-12 md:col-span-9";
  const formSidebarClass = isPanel ? "col-span-1 mt-3" : "col-span-12 mt-3 flex flex-col gap-3 md:col-span-3 md:mt-0";
  const formTimestampStickyClass = isPanel ? "" : "md:sticky md:top-5";
  const formActionsVisibleClass = isPanel ? "flex" : "hidden md:grid";
  const sectionGridClass = isPanel ? "grid-cols-1" : "grid-cols-12";
  const getFieldColClass = (field: Field<T>) =>
    isPanel
      ? "col-span-1 min-w-0"
      : `${mobileColSpan[field.mobileColSpan as keyof typeof mobileColSpan]} ${desktopColSpan[field.colSpan as keyof typeof desktopColSpan]}`;

  const formElement = (
    <form className={`mt-3 w-full md:mt-0 ${isPanel ? "min-w-0 max-w-full overflow-hidden" : "min-w-0"}`} onSubmit={onSubmit}>
        <div className={`grid w-full min-w-0 gap-3 ${formGridClass}`}>
          {/* Form Section */}
          <div className={`min-w-0 ${formMainClass}`}>
            {config.config.map((item, index) => (
              <div key={index} className={`mb-3 rounded-2xl bg-white p-3 md:p-5 ${isPanel ? "min-w-0" : ""}`}>
                <div className={`flex flex-col gap-4 ${isPanel ? "min-w-0" : ""}`}>
                  {/* Header Section */}
                  <div className="flex items-center justify-between">
                    <span className="text-xl text-neutral-600">
                      {typeof item.title === "function"
                        ? item.title(data ?? ({} as T))
                        : item.title}
                    </span>

                    {item.iconButton}
                  </div>

                  {/* Fields Section */}
                  {item.sections.map((section, sectionIndex) => (
                    <div
                      key={sectionIndex}
                      className={`grid min-w-0 auto-rows-auto gap-5 rounded-2xl border border-slate-100 p-3 md:p-5 ${sectionGridClass}`}
                    >
                      {section.header && (
                        <div className={`flex items-center justify-between ${isPanel ? "col-span-1" : "col-span-12"}`}>
                          <span className="text-xl text-foreground-primary">
                            {section.header.title}
                          </span>

                          {section.header.iconButton}
                        </div>
                      )}
                      {section.fields.map((field) => (
                        <div
                          key={
                            isStandardField(field)
                              ? String(field.name)
                              : isRadioTextWithChips(field)
                                ? String(field.name)
                                : isCategoriesListField(field)
                                  ? String(field.name)
                                  : `${String(field.provinceField)}-${String(field.cityField)}`
                          }
                          className={`${getFieldColClass(field)} flex min-w-0 flex-col gap-1`}
                        >
                          {field.label && (
                            <div className="flex items-center justify-between">
                              <span className="text-base text-neutral-600">{field.label}</span>

                              {isStandardField(field) &&
                                field.labelAction &&
                                field.labelAction(data ?? ({} as T))}
                            </div>
                          )}

                          <FieldRenderer
                            field={field}
                            formData={formData}
                            data={data}
                            updateFormData={updateFormData}
                          />
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Mobile Action Buttons (hidden in panel; panel uses the single action row below) */}
          <div className={`flex w-full ${isPanel ? "hidden" : "col-span-12 md:hidden"}`}>
            <div className="flex w-full items-center gap-2">
              {config.actionButtons({
                onSubmit: onSubmit,
                onCancel: onCancel,
                isLoading,
              })}
            </div>
          </div>

          {/* Timestamp Section */}
          <div className={`flex min-w-0 flex-col gap-3 ${formSidebarClass}`}>
            {config.showTimestamp && (
              <div className={`flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-5 ${formTimestampStickyClass}`}>
                {/* Create At Section */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <CalendarIcon />

                    <span className="text-base text-neutral-600">تاریخ ایجاد</span>
                  </div>

                  <span className="text-sm text-slate-500">
                    {data?.createdAt?.toLocaleString("fa-IR", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                    }) ?? "—"}
                  </span>
                </div>

                {/* Divider */}
                <div className="h-[1px] w-full bg-slate-100" />

                {/* Update At Section */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <CalendarIcon />

                    <span className="text-base text-neutral-600">تاریخ آخرین ویرایش</span>
                  </div>

                  <span className="text-sm text-slate-500">
                    {data?.updatedAt?.toLocaleString("fa-IR", {
                      year: "numeric",
                      month: "2-digit",
                      day: "2-digit",
                    }) ?? "—"}
                  </span>
                </div>
              </div>
            )}

            {config.isActiveBox && (
              <ActiveBox
                title={config.isActiveBox.header}
                label={config.isActiveBox.label(formData[config.isActiveBox.key] as boolean)}
                status={formData[config.isActiveBox.key] as boolean}
                onChange={(checked) => {
                  setFormData({
                    ...formData,
                    [config.isActiveBox!.key]: checked,
                  });
                }}
              />
            )}

            {/* Custom Sidebar */}
            {props.customSidebar && props.customSidebar}
          </div>
        </div>

        {/* Desktop / Panel Action Buttons */}
        <div className={`mt-4 w-full ${formActionsVisibleClass} ${isPanel ? "flex flex-col" : "grid-cols-12 md:grid"}`}>
          <div className={isPanel ? "w-full" : "col-span-9"}>
            <div className="flex w-full flex-wrap items-center justify-end gap-2">
              {config.actionButtons({
                onSubmit: onSubmit,
                onCancel: onCancel,
                isLoading,
              })}
            </div>
          </div>
        </div>
      </form>
  );

  if (usePanelLayout && footer) {
    return (
      <div className="mt-0 flex flex-col gap-2 md:mt-7 md:gap-4">
        <div className="flex items-center justify-between">
          <span className="text-3xl text-foreground-primary">{config.headTitle}</span>
          {config.addButton && (
            <AddButton text={config.addButton.text} path={config.addButton.path ?? "#"} />
          )}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setPanelCollapsed((p) => !p)}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
            title={panelCollapsed ? "نمایش پنل ویرایش" : "بستن پنل ویرایش"}
            aria-label={panelCollapsed ? "نمایش پنل ویرایش" : "بستن پنل ویرایش"}
          >
            {panelCollapsed ? (
              <PanelRight className="h-4 w-4" aria-hidden />
            ) : (
              <PanelLeftClose className="h-4 w-4" aria-hidden />
            )}
          </button>
        </div>
        <div className="flex flex-col gap-4 overflow-x-hidden xl:flex-row">
          <div className="min-w-0 flex-1">
            {typeof footer === "function" ? footer(formData) : footer}
          </div>
          <CustomizationEditorPanel isCollapsed={panelCollapsed}>
            {formElement}
          </CustomizationEditorPanel>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-0 flex flex-col gap-2 md:mt-7 md:gap-4">
      <div className="flex items-center justify-between">
        <span className="text-3xl text-foreground-primary">{config.headTitle}</span>
        {config.addButton && (
          <AddButton text={config.addButton.text} path={config.addButton.path ?? "#"} />
        )}
      </div>
      {formElement}
      <div className="mt-9 grid grid-cols-12">
        <div className="col-span-12 md:col-span-9">
          {typeof footer === "function" ? footer(formData) : footer}
        </div>
      </div>
    </div>
  );
}
