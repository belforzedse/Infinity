"use client";

import { SubmitOrderStep } from "@/types/Order";

interface CheckoutProgressProps {
  currentStep: SubmitOrderStep;
  steps?: string[];
}

/**
 * Shows visual progress bar for checkout
 * Example: Step 1 of 3: Information [████░░░░░]
 */
export function CheckoutProgress({ currentStep }: CheckoutProgressProps) {
  // Map enum values to step numbers for progress calculation
  const stepMap: Record<SubmitOrderStep, number> = {
    [SubmitOrderStep.Bill]: 1,
    [SubmitOrderStep.Table]: 2,
    [SubmitOrderStep.Success]: 3,
    [SubmitOrderStep.Failure]: 3,
  };

  const stepNames: Record<SubmitOrderStep, string> = {
    [SubmitOrderStep.Bill]: "Information",
    [SubmitOrderStep.Table]: "Delivery",
    [SubmitOrderStep.Success]: "Success",
    [SubmitOrderStep.Failure]: "Error",
  };

  const currentStepNumber = stepMap[currentStep];
  const currentStepName = stepNames[currentStep];
  const steps = ["Information", "Delivery", "Success"];
  const progress = (currentStepNumber / steps.length) * 100;

  return (
    <div className="mb-8">
      {/* Step counter */}
      <div className="text-sm mb-2 font-medium">
        مرحلة {currentStepNumber} از {steps.length}: {currentStepName}
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full rounded-full bg-gray-200">
        <div
          className="h-2 rounded-full bg-blue-600 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step indicators */}
      <div className="mt-4 flex justify-between">
        {steps.map((step, index) => (
          <div
            key={index}
            className={`flex flex-col items-center ${
              index < currentStepNumber - 1
                ? "opacity-50"
                : index === currentStepNumber - 1
                  ? "opacity-100"
                  : "opacity-50"
            }`}
          >
            {/* Step circle */}
            <div
              className={`text-sm flex h-8 w-8 items-center justify-center rounded-full font-bold ${
                index < currentStepNumber - 1
                  ? "bg-green-600 text-white"
                  : index === currentStepNumber - 1
                    ? "bg-blue-600 text-white"
                    : "bg-gray-300 text-gray-600"
              }`}
            >
              {index < currentStepNumber - 1 ? "✓" : index + 1}
            </div>
            {/* Step label */}
            <span className="text-xs mt-2">{step}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
