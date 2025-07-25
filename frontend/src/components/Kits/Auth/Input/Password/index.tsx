import { useState } from "react";
import { InputHTMLAttributes } from "react";
import clsx from "clsx";
import Text from "../../../Text";
import EyeIcon from "../../Icons/EyeIcon";
import EyeOffIcon from "../../Icons/EyeOffIcon";
import LockIcon from "../../Icons/LockIcon";
import PasswordStrength from "./Strength";

interface AuthPasswordInputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  showStrength?: boolean;
}

export default function AuthPasswordInput({
  error,
  className,
  value = "",
  showStrength = false,
  ...props
}: AuthPasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-2">
      <div className="relative" dir="ltr">
        <input
          type={showPassword ? "text" : "password"}
          className={clsx(
            "w-full h-12 bg-background-form border border-slate-200 rounded-lg",
            "text-base  text-foreground-muted px-12 text-left",
            "focus:outline-none focus:ring-2 focus:ring-pink-400",
            error && "border-red-500",
            className
          )}
          {...props}
        />
        <LockIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-4 top-1/2 -translate-y-1/2"
        >
          {showPassword ? (
            <EyeOffIcon className="w-5 h-5 text-slate-400" />
          ) : (
            <EyeIcon className="w-5 h-5 text-slate-400" />
          )}
        </button>
      </div>
      {showStrength && typeof value === "string" && (
        <PasswordStrength password={value} />
      )}
      {error && <Text className="text-red-500">{error}</Text>}
    </div>
  );
}
