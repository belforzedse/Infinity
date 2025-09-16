"use client";
import { useState } from "react";

type Props = {
  models: {
    id: string;
    title: string;
  }[];
  onModelChange?: (modelId: string) => void;
  selectedModel?: string;
  disabledModelIds?: string[];
};

export default function PDPHeroInfoModel(props: Props) {
  const {
    models,
    onModelChange,
    selectedModel: externalSelectedModel,
    disabledModelIds = [],
  } = props;

  const [internalSelectedModel, setInternalSelectedModel] = useState<string>(
    models[0]?.id || "",
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
      <span className="text-xl text-foreground-primary">انتخاب مدل</span>

      <div className="flex flex-wrap gap-2">
        {models.map((model) => {
          const isSelected = model.id === selectedModel;
          const isDisabled = disabledModelIds.includes(model.id);

          return (
            <button
              key={model.id}
              onClick={() =>
                isDisabled ? undefined : handleModelClick(model.id)
              }
              className={`text-sm rounded-3xl px-4 py-1 transition-colors ${
                isSelected
                  ? "bg-slate-800 text-white"
                  : "border border-slate-300 text-slate-800 hover:bg-slate-100"
              } ${isDisabled ? "cursor-not-allowed opacity-50" : ""}`}
              disabled={isDisabled}
              aria-disabled={isDisabled}
              title={isDisabled ? "ناموجود" : model.title}
            >
              {model.title}
            </button>
          );
        })}
      </div>
    </div>
  );
}
