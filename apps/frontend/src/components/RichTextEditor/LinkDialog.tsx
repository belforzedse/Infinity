 "use client";

import React from "react";
import Modal from "@/components/Kits/Modal";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/Button";

export interface LinkFormValues {
  href: string;
  text: string;
  openInNewTab: boolean;
  nofollow: boolean;
}

interface LinkDialogProps {
  isOpen: boolean;
  onClose: () => void;
  initialValues: LinkFormValues;
  onSubmit: (values: LinkFormValues) => void;
}

const defaultValues: LinkFormValues = {
  href: "",
  text: "",
  openInNewTab: true,
  nofollow: false,
};

const LinkDialog: React.FC<LinkDialogProps> = ({
  isOpen,
  onClose,
  initialValues,
  onSubmit,
}) => {
  const [values, setValues] = React.useState<LinkFormValues>(initialValues ?? defaultValues);
  const [errors, setErrors] = React.useState<{ href?: string }>({});

  React.useEffect(() => {
    if (isOpen) {
      setValues(initialValues ?? defaultValues);
      setErrors({});
    }
  }, [isOpen, initialValues]);

  const handleChange = (field: keyof LinkFormValues, value: string | boolean) => {
    setValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!values.href.trim()) {
      setErrors({ href: "آدرس لینک را وارد کنید" });
      return;
    }

    onSubmit({
      ...values,
      href: values.href.trim(),
      text: values.text.trim(),
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="مدیریت لینک" className="max-w-2xl">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">آدرس لینک</label>
          <Input
            value={values.href}
            onChange={(e) => handleChange("href", e.target.value)}
            placeholder="https://example.com"
            dir="ltr"
            error={errors.href}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-neutral-700">
            متن قابل نمایش (اختیاری)
          </label>
          <Textarea
            value={values.text}
            onChange={(e) => handleChange("text", e.target.value)}
            placeholder="متن لینک"
          />
          <p className="mt-1 text-xs text-neutral-500">
            در صورت خالی بودن، متن انتخاب شده در ویرایشگر استفاده می‌شود.
          </p>
        </div>

        <div className="flex flex-col gap-2 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input
              type="checkbox"
              checked={values.openInNewTab}
              onChange={(e) => handleChange("openInNewTab", e.target.checked)}
            />
            باز کردن در تب جدید
          </label>
          <label className="flex items-center gap-2 text-sm text-neutral-700">
            <input
              type="checkbox"
              checked={values.nofollow}
              onChange={(e) => handleChange("nofollow", e.target.checked)}
            />
            افزودن ویژگی nofollow
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            انصراف
          </Button>
          <Button type="submit" variant="primary">
            ثبت لینک
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default LinkDialog;
