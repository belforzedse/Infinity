import UserSidebar from "@/components/User/Sidebar";
import PasswordChangeForm from "@/components/User/Password/PasswordChangeForm";

export default function PasswordPage() {
  return (
    <div
      className="flex lg:flex-row flex-col min-h-[60vh] bg-white overflow-hidden container mx-auto lg:gap-10 gap-1 lg:p-0 px-4"
      dir="rtl"
    >
      <span className="text-3xl text-foreground-primary lg:hidden">
        حساب من
      </span>

      <UserSidebar />

      <main className="flex-1 overflow-y-auto flex flex-col gap-4 lg:py-8">
        <span className="lg:text-2xl text-xl text-foreground-primary">
          تغییر کلمه عبور
        </span>

        <PasswordChangeForm />
      </main>
    </div>
  );
}
