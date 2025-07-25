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
    <div className="w-full bg-white rounded-lg p-5">
      <div className="lg:mb-6 mb-4">
        <h3 className="text-base text-neutral-600 text-right mb-4">
          آپشن های متا
        </h3>
      </div>
      <div className="lg:space-y-4 space-y-2">
        <Input
          id="title"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          className="w-full text-right text-slate-400 border border-slate-100"
          placeholder="عنوان"
          dir="rtl"
        />

        <Input
          id="description"
          value={description}
          onChange={(e) => handleDescriptionChange(e.target.value)}
          className="w-full text-right text-slate-400 border border-slate-100 min-h-36"
          placeholder="توضیحات"
          dir="rtl"
        />
      </div>
    </div>
  );
};

export default MetaOptions;
