import Text from "@/components/Kits/Text";
import AuthButton from "@/components/Kits/Auth/Button";
import CodeIcon from "@/components/Kits/Auth/Icons/CodeIcon";
import OtpIcon from "@/components/Kits/Auth/Icons/OtpIcon";

interface LoginActionsProps {
  onForgotPassword: () => void;
  onOtpLogin: () => void;
}

export default function LoginActions({ onForgotPassword, onOtpLogin }: LoginActionsProps) {
  return (
    <>
      <div className="mt-5 flex items-center gap-8">
        <div className="h-[1px] flex-1 bg-slate-200" />
        <Text className="text-xl text-black">یا</Text>
        <div className="h-[1px] flex-1 bg-slate-200" />
      </div>

      <div className="mt-5 flex flex-col-reverse gap-5 md:flex-row-reverse">
        <AuthButton
          onClick={onForgotPassword}
          className="border border-infinity-primary !bg-transparent !text-infinity-primary hover:!bg-infinity-primary-lighter/20"
          icon={<CodeIcon className="h-5 w-5 md:h-6 md:w-6" />}
        >
          فراموشی رمز عبور
        </AuthButton>

        <AuthButton
          onClick={onOtpLogin}
          className="border border-infinity-primary !bg-transparent !text-infinity-primary hover:!bg-infinity-primary-lighter/20"
          icon={<OtpIcon className="h-5 w-5 md:h-6 md:w-6" />}
        >
          ورود با رمز یکبار مصرف
        </AuthButton>
      </div>
    </>
  );
}
