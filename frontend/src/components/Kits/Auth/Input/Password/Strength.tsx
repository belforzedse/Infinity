import clsx from "clsx";
import Text from "../../../Text";

interface PasswordStrengthProps {
  password: string;
}

export default function PasswordStrength({ password }: PasswordStrengthProps) {
  const getStrengthLevel = () => {
    if (!password) return 0;
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    return strength;
  };

  const getStrengthColor = (index: number, level: number) => {
    if (index >= level) return "bg-slate-200";
    if (level === 4) return "bg-green-700";
    if (level === 3) return "bg-green-500";
    return "bg-pink-500";
  };

  const getHelperText = () => {
    const level = getStrengthLevel();
    switch (level) {
      case 0:
        return "پسورد شامل عدد و حروف بزرگ و کوچک باشد";
      case 1:
        return "پسورد ضعیف است";
      case 2:
        return "پسورد متوسط است";
      case 3:
        return "پسورد قوی است";
      case 4:
        return "پسورد بسیار قوی است";
      default:
        return "";
    }
  };

  const getHelperTextColor = () => {
    const level = getStrengthLevel();
    if (level === 0 || level === 1) return "text-red-500";
    if (level === 2) return "text-yellow-600";
    if (level === 3) return "text-green-500";
    if (level === 4) return "text-green-700";
    return "";
  };

  const strengthLevel = getStrengthLevel();

  return (
    <div className="flex w-full flex-col justify-between gap-2 md:flex-row md:items-center md:gap-0">
      <div className="flex w-full flex-row justify-center gap-2 md:w-auto md:justify-end">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className={clsx(
              "h-1 w-[23%] rounded-full transition-colors md:w-[46px]",
              getStrengthColor(index, strengthLevel),
            )}
          />
        ))}
      </div>
      <Text variant="helper" className={getHelperTextColor()}>
        {getHelperText()}
      </Text>
    </div>
  );
}
