import Text from "@/components/Kits/Text";
import AuthButton from "@/components/Kits/Auth/Button";
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
        <div className="h-[1px] bg-slate-200 flex-1" />
        <Text className="text-xl text-black">یا</Text>
        <div className="h-[1px] bg-slate-200 flex-1" />
      </div>

      <div className="mt-5 flex gap-5 flex-col-reverse md:flex-row-reverse">
        <AuthButton
          onClick={onForgotPassword}
          className="!bg-transparent !text-pink-600 border border-pink-600 hover:!bg-pink-50"
          icon={<CodeIcon className="w-5 h-5 md:w-6 md:h-6" />}
        >
          فراموشی رمز عبور
        </AuthButton>

        <AuthButton
          onClick={onOtpLogin}
          className="!bg-transparent !text-pink-600 border border-pink-600 hover:!bg-pink-50"
          icon={<OtpIcon className="w-5 h-5 md:w-6 md:h-6" />}
        >
          ورود با رمز یکبار مصرف
        </AuthButton>
      </div>
    </>
  );
}
