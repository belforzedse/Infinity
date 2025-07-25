"use client";
import { useState } from "react";

type Props = {
  models: {
    id: string;
    title: string;
  }[];
  onModelChange?: (modelId: string) => void;
  selectedModel?: string;
};

export default function PDPHeroInfoModel(props: Props) {
  const { models, onModelChange, selectedModel: externalSelectedModel } = props;

  const [internalSelectedModel, setInternalSelectedModel] = useState<string>(
    models[0]?.id || ""
  );

  // Use either the external selected model if provided, or the internal state
  const selectedModel =
    externalSelectedModel !== undefined
      ? externalSelectedModel
      : internalSelectedModel;

  const handleModelClick = (modelId: string) => {
    setInternalSelectedModel(modelId);
    if (onModelChange) {
      onModelChange(modelId);
    }
  };

  // If no models are available, don't render anything
  if (!models.length) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      <span className="text-foreground-primary text-xl">انتخاب مدل</span>

      <div className="flex gap-2 flex-wrap">
        {models.map((model) => (
          <button
            key={model.id}
            onClick={() => handleModelClick(model.id)}
            className={`py-1 px-4 rounded-3xl text-sm transition-colors ${
              model.id === selectedModel
                ? "bg-slate-800 text-white"
                : "border border-slate-300 text-slate-800 hover:bg-slate-100"
            }`}
          >
            {model.title}
          </button>
        ))}
      </div>
    </div>
  );
}
