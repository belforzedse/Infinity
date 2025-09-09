import CirculePlusIcon from "@/components/User/Icons/CirculePlusIcon";
import Select, { Option } from "@/components/Kits/Form/Select";
import React, { useState } from "react";

interface SizeGuideProps {
  onNewTemplate?: () => void;
}

const SizeGuide: React.FC<SizeGuideProps> = ({ onNewTemplate }) => {
  const [selectedTemplate, setSelectedTemplate] = useState<Option | null>(null);
  const [selectedSize, setSelectedSize] = useState<Option | null>(null);

  const templateOptions: Option[] = [{ id: 1, name: "راهنمای سایز (قالب ۱)" }];

  const sizeOptions: Option[] = [{ id: 1, name: "سایز" }];

  return (
    <div className="rounded-xl bg-white p-5">
      <h2 className="text-lg mb-4 text-right text-neutral-600">راهنمای سایز</h2>

      <div className="rounded-lg border border-slate-100 bg-white p-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 flex flex-col gap-1 lg:col-span-1">
            <label htmlFor="size" className="text-base text-neutral-600">
              ویژگی
            </label>
            <Select
              value={selectedSize}
              onChange={setSelectedSize}
              options={sizeOptions}
              placeholder="سایز"
            />
          </div>
          <div className="relative col-span-2 flex flex-col gap-1 lg:col-span-1">
            <label htmlFor="template" className="text-base text-neutral-600">
              قالب
            </label>
            <Select
              value={selectedTemplate}
              onChange={setSelectedTemplate}
              options={templateOptions}
              placeholder="راهنمای سایز (قالب ۱)"
            />

            <div
              className="absolute left-0 top-1 flex cursor-pointer items-center gap-1 text-pink-500"
              onClick={onNewTemplate}
            >
              <span className="text-sm">قالب جدید</span>
              <CirculePlusIcon className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SizeGuide;
