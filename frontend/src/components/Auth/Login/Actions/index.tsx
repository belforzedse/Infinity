import Text from "@/components/Kits/Text";
import { Button } from "@/components/ui/Button";
import CodeIcon from "@/components/Kits/Auth/Icons/CodeIcon";
import OtpIcon from "@/components/Kits/Auth/Icons/OtpIcon";

interface LoginActionsProps {
  onForgotPassword: () => void;
  onOtpLogin: () => void;
}

export default function LoginActions({
  onForgotPassword,
  onOtpLogin,
}: LoginActionsProps) {
  return (
    <>
      <div className="mt-5 flex items-center gap-8">
        <div className="h-[1px] flex-1 bg-slate-200" />
        <Text className="text-xl text-black">یا</Text>
        <div className="h-[1px] flex-1 bg-slate-200" />
      </div>

      <div className="mt-5 flex flex-col-reverse gap-5 md:flex-row-reverse">
        <Button
          onClick={onForgotPassword}
          className="flex items-center justify-center gap-[4.5px] border border-pink-600 !bg-transparent !text-pink-600 hover:!bg-pink-50"
          size="xl"
          fullWidth
        >
          <CodeIcon className="h-5 w-5 md:h-6 md:w-6" />
          <span>فراموشی رمز عبور</span>
        </Button>

        <Button
          onClick={onOtpLogin}
          className="flex items-center justify-center gap-[4.5px] border border-pink-600 !bg-transparent !text-pink-600 hover:!bg-pink-50"
          size="xl"
          fullWidth
        >
          <OtpIcon className="h-5 w-5 md:h-6 md:w-6" />
          <span>ورود با رمز یکبار مصرف</span>
        </Button>
      </div>
    </>
  );
}
