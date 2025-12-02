"use client";

type Props = {
  title?: string;
  description?: string;
};

export default function StoreManagerNotice({
  title = "دسترسی فقط برای مشاهده",
  description = "شما با نقش مدیر فروشگاه فقط می‌توانید این بخش را مشاهده کنید.",
}: Props) {
  return (
    <div className="rounded-2xl border border-dashed border-neutral-200 bg-white/60 p-6 text-center">
      <p className="text-xl font-semibold text-neutral-800">{title}</p>
      <p className="mt-2 text-sm text-neutral-500">{description}</p>
    </div>
  );
}
