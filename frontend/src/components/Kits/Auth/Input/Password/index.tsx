import { useState } from "react";
import { InputHTMLAttributes } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
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
        <Input
          type={showPassword ? "text" : "password"}
          className={cn(
            "h-12 bg-background-form",
            "text-base px-12 text-left text-foreground-muted",
            "focus:outline-none focus:ring-2 focus:ring-pink-400",
            error && "border-red-500",
            className,
          )}
          {...props}
        />
        <LockIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-transparent border-0 p-0"
        >
          {showPassword ? (
            <EyeOffIcon className="h-5 w-5 text-slate-400" />
          ) : (
            <EyeIcon className="h-5 w-5 text-slate-400" />
          )}
        </Button>
      </div>
      {showStrength && typeof value === "string" && (
        <PasswordStrength password={value} />
      )}
      {error && <Text className="text-red-500">{error}</Text>}
    </div>
  );
}
