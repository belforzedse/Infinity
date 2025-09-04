import UserSidebar from "@/components/User/Sidebar";
import PasswordChangeForm from "@/components/User/Password/PasswordChangeForm";

export default function PasswordPage() {
  return (
    <div
      className="container mx-auto flex min-h-[60vh] flex-col gap-1 overflow-hidden bg-white px-4 lg:flex-row lg:gap-10 lg:p-0"
      dir="rtl"
    >
      <span className="text-3xl text-foreground-primary lg:hidden">
        حساب من
      </span>

      <UserSidebar />

      <main className="flex flex-1 flex-col gap-4 overflow-y-auto lg:py-8">
        <span className="text-xl text-foreground-primary lg:text-2xl">
          تغییر کلمه عبور
        </span>

        <PasswordChangeForm />
      </main>
    </div>
  );
}
