import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const MetaOptions: React.FC = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleTitleChange = (value: string) => {
    setTitle(value);
  };

  const handleDescriptionChange = (value: string) => {
    setDescription(value);
  };

  return (
    <div className="w-full rounded-lg bg-white p-5">
      <div className="mb-4 lg:mb-6">
        <h3 className="text-base mb-4 text-right text-neutral-600">
          آپشن های متا
        </h3>
      </div>
      <div className="space-y-2 lg:space-y-4">
        <Input
          id="title"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          className="w-full border border-slate-100 text-right text-slate-400"
          placeholder="عنوان"
          dir="rtl"
        />

        <Input
          id="description"
          value={description}
          onChange={(e) => handleDescriptionChange(e.target.value)}
          className="min-h-36 w-full border border-slate-100 text-right text-slate-400"
          placeholder="توضیحات"
          dir="rtl"
        />
      </div>
    </div>
  );
};

export default MetaOptions;
