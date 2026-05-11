"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSetAtom } from "jotai";
import { ChevronRight, Save } from "lucide-react";
import toast from "react-hot-toast";
import { HTTP_STATUS } from "@repo/api/config";
import type { ApiError } from "@repo/api/types";
import Text from "@/components/Kits/Text";
import { Button } from "@/components/ui/Button";
import { SocialTextField } from "@/components/ui/SocialTextField";
import { currentUserAtom } from "@/lib/atoms/auth";
import UserService from "@/services/user";
import { getAccessTokenFromStorage, normalizePhoneNumber } from "@/utils/auth";
import { getUserFacingErrorMessage } from "@/utils/userErrorMessage";

export function ProfileAccountForm() {
  const router = useRouter();
  const setCurrentUser = useSetAtom(currentUserAtom);
  const [loadState, setLoadState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!getAccessTokenFromStorage()) {
      router.replace("/auth?redirect=/profile");
      return;
    }

    let cancelled = false;
    setLoadState("loading");

    (async () => {
      try {
        const user = await UserService.me();
        if (cancelled) return;
        setFirstName(typeof user.FirstName === "string" ? user.FirstName : "");
        setLastName(typeof user.LastName === "string" ? user.LastName : "");
        setPhone(typeof user.Phone === "string" ? user.Phone : "");
        setLoadState("ready");
      } catch (error: unknown) {
        if (cancelled) return;
        const err = error as ApiError;
        if (err.status === HTTP_STATUS.UNAUTHORIZED) {
          router.replace("/auth?redirect=/profile");
          return;
        }
        setLoadState("error");
        toast.error(
          getUserFacingErrorMessage(error, "بارگذاری پروفایل ناموفق بود. دوباره تلاش کنید"),
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    if (!trimmedFirst) {
      toast.error("نام را وارد کنید.");
      return;
    }
    if (!trimmedLast) {
      toast.error("نام خانوادگی را وارد کنید.");
      return;
    }

    setIsSaving(true);
    try {
      const updated = await UserService.updateMe({
        FirstName: trimmedFirst,
        LastName: trimmedLast,
        Phone: phone.trim() ? normalizePhoneNumber(phone.trim()) : "",
      });
      setCurrentUser(updated);
      toast.success("تغییرات ذخیره شد.");
    } catch (error: unknown) {
      toast.error(
        getUserFacingErrorMessage(error, "ذخیره اطلاعات ناموفق بود. دوباره تلاش کنید"),
      );
    } finally {
      setIsSaving(false);
    }
  };

  const disableForm = loadState !== "ready" || isSaving;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="hidden size-9 shrink-0 items-center justify-center rounded-sm bg-white text-zinc-700 shadow-[0_0_14.7px_rgba(0,0,0,0.04)] transition-colors hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/70 lg:inline-flex"
          aria-label="بازگشت"
        >
          <ChevronRight className="size-5 stroke-[1.5]" aria-hidden />
        </button>
        <h1 className="font-peyda text-lg font-semibold text-zinc-800">
          اطلاعات حساب کاربری
        </h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="profile-first-name" className="block text-right">
            <Text variant="label" className="!text-sm !text-zinc-600">
              نام
            </Text>
          </label>
          <SocialTextField
            id="profile-first-name"
            name="firstName"
            autoComplete="given-name"
            value={firstName}
            onEdit={setFirstName}
            disabled={disableForm}
            placeholder="نام"
            className="w-full"
          />
        </div>
        <div className="space-y-2">
          <label htmlFor="profile-last-name" className="block text-right">
            <Text variant="label" className="!text-sm !text-zinc-600">
              نام خانوادگی
            </Text>
          </label>
          <SocialTextField
            id="profile-last-name"
            name="lastName"
            autoComplete="family-name"
            value={lastName}
            onEdit={setLastName}
            disabled={disableForm}
            placeholder="نام خانوادگی"
            className="w-full"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="profile-phone" className="block text-right">
            <Text variant="label" className="!text-sm !text-zinc-600">
              شماره همراه
            </Text>
          </label>
          <SocialTextField
            id="profile-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            value={phone}
            readOnly
            disabled={disableForm}
            placeholder="۰۹۱۲۲۰۳۲۱۱۴"
            className="w-full"
            aria-label="شماره همراه (غیرقابل ویرایش)"
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          type="submit"
          variant="blue"
          disabled={disableForm}
          icon={<Save className="size-[22px]" aria-hidden />}
          className="font-peyda"
        >
          ذخیره تغییرات
        </Button>
      </div>
    </form>
  );
}
