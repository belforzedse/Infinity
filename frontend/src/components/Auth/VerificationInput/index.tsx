"use client";

import { useEffect, useRef, useState } from "react";

interface VerificationInputProps {
  length?: number;
  onChange: (code: string) => void;
}

export default function VerificationInput({
  length = 6,
  onChange,
}: VerificationInputProps) {
  const [code, setCode] = useState<string[]>(Array(length).fill(""));
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const processInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    slot: number
  ) => {
    const num = e.target.value;
    if (/[^0-9]/.test(num)) return;

    const newCode = [...code];
    newCode[slot] = num;
    setCode(newCode);

    const combinedCode = newCode.join("");
    onChange(combinedCode);

    if (slot !== 0 && num) {
      inputs.current[slot - 1]?.focus();
    }
  };

  const onKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    slot: number
  ) => {
    if (e.key === "Backspace" && !code[slot] && slot !== length - 1) {
      e.preventDefault();
      const newCode = [...code];
      newCode[slot + 1] = "";
      setCode(newCode);
      inputs.current[slot + 1]?.focus();
    } else if (e.key === "ArrowRight" && slot > 0) {
      e.preventDefault();
      inputs.current[slot - 1]?.focus();
    } else if (e.key === "ArrowLeft" && slot < length - 1) {
      e.preventDefault();
      inputs.current[slot + 1]?.focus();
    }
  };

  // Handle paste event
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").slice(0, length);
    if (!/^\d+$/.test(pastedData)) return;

    const newCode = [...code];
    pastedData.split("").forEach((char, index) => {
      if (index < length) newCode[length - 1 - index] = char;
    });
    setCode(newCode);
    onChange(newCode.join(""));

    // Focus the next empty input or the first one
    const nextEmptyIndex = newCode.findIndex((c) => !c);
    const focusIndex = nextEmptyIndex === -1 ? 0 : nextEmptyIndex;
    inputs.current[focusIndex]?.focus();
  };

  useEffect(() => {
    // Focus last input on mount
    inputs.current[length - 1]?.focus();
  }, [length]);

  return (
    <div className="flex gap-3 w-full">
      {code.map((digit, index) => (
        <input
          key={index}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={digit}
          autoComplete="one-time-code"
          onChange={(e) => processInput(e, index)}
          onKeyDown={(e) => onKeyDown(e, index)}
          onPaste={handlePaste}
          ref={(el) => {
            inputs.current[index] = el;
          }}
          className="w-[18%] aspect-square bg-slate-200 rounded-[10px] text-center text-2xl focus:outline-none focus:ring-2 focus:ring-pink-400 transition-all
                     hover:bg-slate-100 focus:bg-slate-100"
          style={{
            caretColor: "transparent",
            direction: "ltr",
          }}
        />
      ))}
    </div>
  );
}
