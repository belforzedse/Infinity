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
    <div className="bg-white rounded-xl p-5">
      <h2 className="text-right mb-4 text-lg text-neutral-600">راهنمای سایز</h2>

      <div className="bg-white rounded-lg border border-slate-100 p-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1 lg:col-span-1 col-span-2">
            <label htmlFor="size" className="text-neutral-600 text-base">
              ویژگی
            </label>
            <Select
              value={selectedSize}
              onChange={setSelectedSize}
              options={sizeOptions}
              placeholder="سایز"
            />
          </div>
          <div className="flex flex-col gap-1 relative lg:col-span-1 col-span-2">
            <label htmlFor="template" className="text-neutral-600 text-base">
              قالب
            </label>
            <Select
              value={selectedTemplate}
              onChange={setSelectedTemplate}
              options={templateOptions}
              placeholder="راهنمای سایز (قالب ۱)"
            />

            <div
              className="flex items-center gap-1 text-pink-500 cursor-pointer absolute top-1 left-0"
              onClick={onNewTemplate}
            >
              <span className="text-sm">قالب جدید</span>
              <CirculePlusIcon className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SizeGuide;
