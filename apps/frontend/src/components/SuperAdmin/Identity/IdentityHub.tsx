"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import ContentWrapper from "@/components/SuperAdmin/Layout/ContentWrapper";
import type {
  ContactNumberType,
  IdentityContactNumber,
  IdentityPhone,
  IdentitySocialLink,
  IdentityStore,
  SiteFaq,
  SiteFaqCategory,
  SiteFaqItem,
  SiteIdentity,
} from "@/types/site-identity";
import { SOCIAL_PLATFORM_OPTIONS } from "@/utils/identityIcons";
import { getSuperAdminSiteIdentity } from "@/services/super-admin/site-identity/get";
import { updateSuperAdminSiteIdentity } from "@/services/super-admin/site-identity/update";
import { getSuperAdminSiteFaq } from "@/services/super-admin/site-faq/get";
import { updateSuperAdminSiteFaq } from "@/services/super-admin/site-faq/update";
import {
  AddButton,
  Card,
  Field,
  RemoveButton,
  Select,
  TextArea,
  TextInput,
  Toggle,
} from "./fields";

const PLATFORM_OPTIONS = SOCIAL_PLATFORM_OPTIONS;

const CONTACT_TYPE_OPTIONS: { value: ContactNumberType; label: string }[] = [
  { value: "phone", label: "تلفن ثابت" },
  { value: "mobile", label: "موبایل" },
  { value: "whatsapp", label: "واتساپ" },
];

const TABS = [
  { id: "general", label: "عمومی" },
  { id: "stores", label: "فروشگاه‌ها" },
  { id: "social", label: "شبکه‌های اجتماعی" },
  { id: "contact", label: "شماره‌های تماس" },
  { id: "faq", label: "سوالات متداول" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const newPhone = (): IdentityPhone => ({ label: "", number: "" });
const newSocial = (): IdentitySocialLink => ({ platform: "instagram", url: "", label: "" });
const newContact = (): IdentityContactNumber => ({ label: "", number: "", type: "phone" });
const newStore = (): IdentityStore => ({
  name: "",
  address: "",
  phones: [],
  wazeLink: "",
  neshanLink: "",
  baladLink: "",
  googleMapsLink: "",
  showInFooter: true,
  showInAbout: false,
  socialLinks: [],
});
const newFaqItem = (): SiteFaqItem => ({ question: "", answer: "", order: 0, isActive: true });
const newFaqCategory = (): SiteFaqCategory => ({
  title: "",
  description: "",
  order: 0,
  items: [],
});

export default function IdentityHub() {
  const [identity, setIdentity] = useState<SiteIdentity | null>(null);
  const [faq, setFaq] = useState<SiteFaq | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingIdentity, setSavingIdentity] = useState(false);
  const [savingFaq, setSavingFaq] = useState(false);
  const [tab, setTab] = useState<TabId>("general");

  useEffect(() => {
    (async () => {
      try {
        const [id, fq] = await Promise.all([
          getSuperAdminSiteIdentity(),
          getSuperAdminSiteFaq(),
        ]);
        setIdentity(id);
        setFaq(fq);
      } catch (e) {
        console.error(e);
        toast.error("خطا در دریافت اطلاعات هویت سایت");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const saveIdentity = async () => {
    if (!identity) return;
    setSavingIdentity(true);
    try {
      const saved = await updateSuperAdminSiteIdentity(identity);
      setIdentity(saved);
      toast.success("اطلاعات هویت سایت ذخیره شد");
    } catch (e) {
      console.error(e);
      toast.error("خطا در ذخیره اطلاعات هویت سایت");
    } finally {
      setSavingIdentity(false);
    }
  };

  const saveFaq = async () => {
    if (!faq) return;
    setSavingFaq(true);
    try {
      const saved = await updateSuperAdminSiteFaq(faq);
      setFaq(saved);
      toast.success("سوالات متداول ذخیره شد");
    } catch (e) {
      console.error(e);
      toast.error("خطا در ذخیره سوالات متداول");
    } finally {
      setSavingFaq(false);
    }
  };

  // ---- identity mutation helpers ----
  const patch = (p: Partial<SiteIdentity>) => setIdentity((prev) => (prev ? { ...prev, ...p } : prev));
  const updateStore = (i: number, p: Partial<IdentityStore>) =>
    setIdentity((prev) =>
      prev
        ? { ...prev, stores: prev.stores.map((s, idx) => (idx === i ? { ...s, ...p } : s)) }
        : prev,
    );

  if (loading || !identity || !faq) {
    return (
      <ContentWrapper title="هویت بصری">
        <Card>
          <p className="text-sm text-slate-600">در حال بارگذاری...</p>
        </Card>
      </ContentWrapper>
    );
  }

  return (
    <ContentWrapper title="هویت بصری">
      <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-[#E8F3F4] p-6 shadow-sm">
        <span className="text-sm font-semibold text-[#4F8E92]">مرکز هویت سایت</span>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900">هویت بصری و اطلاعات تماس</h1>
        <p className="mt-1 text-sm text-slate-600">
          نام سایت، فروشگاه‌های حضوری، شبکه‌های اجتماعی، شماره‌های تماس و سوالات متداول را از اینجا
          مدیریت کنید.
        </p>
      </section>

      {/* Tabs */}
      <div className="mt-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              tab === t.id
                ? "bg-[#63A9AE] text-white"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-4">
        {tab === "general" && (
          <Card className="flex flex-col gap-4">
            <Field label="نام سایت">
              <TextInput
                value={identity.siteName}
                onChange={(v) => patch({ siteName: v })}
                placeholder="نام فروشگاه"
              />
            </Field>
            <Field label="ساعات پشتیبانی">
              <TextArea
                value={identity.supportHours ?? ""}
                onChange={(v) => patch({ supportHours: v })}
                placeholder="شنبه تا پنج‌شنبه از ساعت ۹ تا ۱۷"
              />
            </Field>
            <Toggle
              label="کسب‌وکار فروشگاه حضوری دارد"
              checked={identity.hasPhysicalStores}
              onChange={(v) => patch({ hasPhysicalStores: v })}
            />
            <Toggle
              label="کسب‌وکار بیش از یک فروشگاه حضوری دارد"
              checked={identity.hasMultipleStores}
              onChange={(v) => patch({ hasMultipleStores: v })}
            />
            <p className="text-xs text-slate-500">
              اگر فروشگاه حضوری ندارید، این گزینه را خاموش کنید؛ شماره‌های تماس و شبکه‌های اجتماعی
              همچنان در سایت نمایش داده می‌شوند.
            </p>
          </Card>
        )}

        {tab === "stores" && (
          <div className="space-y-4">
            {identity.stores.map((store, i) => (
              <Card key={i} className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-slate-800">
                    فروشگاه {i + 1}
                    {store.name ? ` — ${store.name}` : ""}
                  </h3>
                  <RemoveButton
                    onClick={() =>
                      patch({ stores: identity.stores.filter((_, idx) => idx !== i) })
                    }
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="نام / عنوان فروشگاه">
                    <TextInput value={store.name ?? ""} onChange={(v) => updateStore(i, { name: v })} />
                  </Field>
                  <Field label="آدرس">
                    <TextInput
                      value={store.address ?? ""}
                      onChange={(v) => updateStore(i, { address: v })}
                    />
                  </Field>
                </div>

                {/* phones */}
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-slate-700">شماره تلفن‌ها</span>
                  {store.phones.map((phone, pi) => (
                    <div key={pi} className="flex items-center gap-2">
                      <TextInput
                        value={phone.label ?? ""}
                        onChange={(v) =>
                          updateStore(i, {
                            phones: store.phones.map((p, idx) =>
                              idx === pi ? { ...p, label: v } : p,
                            ),
                          })
                        }
                        placeholder="عنوان (اختیاری)"
                      />
                      <TextInput
                        value={phone.number}
                        dir="ltr"
                        onChange={(v) =>
                          updateStore(i, {
                            phones: store.phones.map((p, idx) =>
                              idx === pi ? { ...p, number: v } : p,
                            ),
                          })
                        }
                        placeholder="شماره"
                      />
                      <RemoveButton
                        label=""
                        onClick={() =>
                          updateStore(i, { phones: store.phones.filter((_, idx) => idx !== pi) })
                        }
                      />
                    </div>
                  ))}
                  <AddButton
                    label="افزودن شماره"
                    onClick={() => updateStore(i, { phones: [...store.phones, newPhone()] })}
                  />
                </div>

                {/* map links */}
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="لینک ویز (Waze)">
                    <TextInput
                      value={store.wazeLink ?? ""}
                      dir="ltr"
                      onChange={(v) => updateStore(i, { wazeLink: v })}
                    />
                  </Field>
                  <Field label="لینک نشان (Neshan)">
                    <TextInput
                      value={store.neshanLink ?? ""}
                      dir="ltr"
                      onChange={(v) => updateStore(i, { neshanLink: v })}
                    />
                  </Field>
                  <Field label="لینک بلد (Balad)">
                    <TextInput
                      value={store.baladLink ?? ""}
                      dir="ltr"
                      onChange={(v) => updateStore(i, { baladLink: v })}
                    />
                  </Field>
                  <Field label="لینک گوگل مپ (Google Maps)">
                    <TextInput
                      value={store.googleMapsLink ?? ""}
                      dir="ltr"
                      onChange={(v) => updateStore(i, { googleMapsLink: v })}
                    />
                  </Field>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <Toggle
                    label="نمایش در فوتر"
                    checked={store.showInFooter}
                    onChange={(v) => updateStore(i, { showInFooter: v })}
                  />
                  <Toggle
                    label="نمایش در صفحه درباره ما"
                    checked={store.showInAbout}
                    onChange={(v) => updateStore(i, { showInAbout: v })}
                  />
                </div>

                {/* per-store social links */}
                <div className="flex flex-col gap-2">
                  <span className="text-sm font-medium text-slate-700">
                    شبکه‌های اجتماعی این فروشگاه
                  </span>
                  {store.socialLinks.map((link, li) => (
                    <div key={li} className="flex items-center gap-2">
                      <div className="w-40 shrink-0">
                        <Select
                          value={link.platform}
                          onChange={(v) =>
                            updateStore(i, {
                              socialLinks: store.socialLinks.map((l, idx) =>
                                idx === li ? { ...l, platform: v } : l,
                              ),
                            })
                          }
                          options={PLATFORM_OPTIONS}
                        />
                      </div>
                      <TextInput
                        value={link.url}
                        dir="ltr"
                        onChange={(v) =>
                          updateStore(i, {
                            socialLinks: store.socialLinks.map((l, idx) =>
                              idx === li ? { ...l, url: v } : l,
                            ),
                          })
                        }
                        placeholder="https://"
                      />
                      <RemoveButton
                        label=""
                        onClick={() =>
                          updateStore(i, {
                            socialLinks: store.socialLinks.filter((_, idx) => idx !== li),
                          })
                        }
                      />
                    </div>
                  ))}
                  <AddButton
                    label="افزودن شبکه اجتماعی"
                    onClick={() =>
                      updateStore(i, { socialLinks: [...store.socialLinks, newSocial()] })
                    }
                  />
                </div>
              </Card>
            ))}
            <AddButton
              label="افزودن فروشگاه"
              onClick={() => patch({ stores: [...identity.stores, newStore()] })}
            />
          </div>
        )}

        {tab === "social" && (
          <Card className="flex flex-col gap-3">
            <p className="text-sm text-slate-600">
              شبکه‌های اجتماعی سراسری سایت (در فوتر و صفحه تماس نمایش داده می‌شوند).
            </p>
            {identity.socialLinks.map((link, li) => (
              <div key={li} className="flex items-center gap-2">
                <div className="w-40 shrink-0">
                  <Select
                    value={link.platform}
                    onChange={(v) =>
                      patch({
                        socialLinks: identity.socialLinks.map((l, idx) =>
                          idx === li ? { ...l, platform: v } : l,
                        ),
                      })
                    }
                    options={PLATFORM_OPTIONS}
                  />
                </div>
                <TextInput
                  value={link.label ?? ""}
                  onChange={(v) =>
                    patch({
                      socialLinks: identity.socialLinks.map((l, idx) =>
                        idx === li ? { ...l, label: v } : l,
                      ),
                    })
                  }
                  placeholder="عنوان (اختیاری)"
                />
                <TextInput
                  value={link.url}
                  dir="ltr"
                  onChange={(v) =>
                    patch({
                      socialLinks: identity.socialLinks.map((l, idx) =>
                        idx === li ? { ...l, url: v } : l,
                      ),
                    })
                  }
                  placeholder="https://"
                />
                <RemoveButton
                  label=""
                  onClick={() =>
                    patch({ socialLinks: identity.socialLinks.filter((_, idx) => idx !== li) })
                  }
                />
              </div>
            ))}
            <AddButton
              label="افزودن شبکه اجتماعی"
              onClick={() => patch({ socialLinks: [...identity.socialLinks, newSocial()] })}
            />
          </Card>
        )}

        {tab === "contact" && (
          <Card className="flex flex-col gap-3">
            {identity.contactNumbers.map((contact, ci) => (
              <div key={ci} className="flex items-center gap-2">
                <div className="w-36 shrink-0">
                  <Select
                    value={contact.type ?? "phone"}
                    onChange={(v) =>
                      patch({
                        contactNumbers: identity.contactNumbers.map((c, idx) =>
                          idx === ci ? { ...c, type: v } : c,
                        ),
                      })
                    }
                    options={CONTACT_TYPE_OPTIONS}
                  />
                </div>
                <TextInput
                  value={contact.label ?? ""}
                  onChange={(v) =>
                    patch({
                      contactNumbers: identity.contactNumbers.map((c, idx) =>
                        idx === ci ? { ...c, label: v } : c,
                      ),
                    })
                  }
                  placeholder="عنوان (اختیاری)"
                />
                <TextInput
                  value={contact.number}
                  dir="ltr"
                  onChange={(v) =>
                    patch({
                      contactNumbers: identity.contactNumbers.map((c, idx) =>
                        idx === ci ? { ...c, number: v } : c,
                      ),
                    })
                  }
                  placeholder="شماره"
                />
                <RemoveButton
                  label=""
                  onClick={() =>
                    patch({
                      contactNumbers: identity.contactNumbers.filter((_, idx) => idx !== ci),
                    })
                  }
                />
              </div>
            ))}
            <AddButton
              label="افزودن شماره تماس"
              onClick={() =>
                patch({ contactNumbers: [...identity.contactNumbers, newContact()] })
              }
            />
          </Card>
        )}

        {tab === "faq" && (
          <FaqEditor faq={faq} setFaq={setFaq} />
        )}
      </div>

      {/* Sticky save bar */}
      <div className="sticky bottom-0 z-10 mt-6 flex justify-end gap-3 rounded-2xl border border-slate-200 bg-white/90 p-4 backdrop-blur">
        {tab === "faq" ? (
          <button
            type="button"
            onClick={saveFaq}
            disabled={savingFaq}
            className="rounded-xl bg-[#63A9AE] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-[#4F8E92] disabled:opacity-60"
          >
            {savingFaq ? "در حال ذخیره..." : "ذخیره سوالات متداول"}
          </button>
        ) : (
          <button
            type="button"
            onClick={saveIdentity}
            disabled={savingIdentity}
            className="rounded-xl bg-[#63A9AE] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-[#4F8E92] disabled:opacity-60"
          >
            {savingIdentity ? "در حال ذخیره..." : "ذخیره اطلاعات هویت"}
          </button>
        )}
      </div>
    </ContentWrapper>
  );
}

function FaqEditor({
  faq,
  setFaq,
}: {
  faq: SiteFaq;
  setFaq: React.Dispatch<React.SetStateAction<SiteFaq | null>>;
}) {
  const updateCategory = (ci: number, p: Partial<SiteFaqCategory>) =>
    setFaq((prev) =>
      prev
        ? {
            categories: prev.categories.map((c, idx) => (idx === ci ? { ...c, ...p } : c)),
          }
        : prev,
    );

  return (
    <div className="space-y-4">
      {faq.categories.map((category, ci) => (
        <Card key={ci} className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1">
              <TextInput
                value={category.title}
                onChange={(v) => updateCategory(ci, { title: v })}
                placeholder="عنوان دسته‌بندی"
              />
            </div>
            <RemoveButton
              onClick={() =>
                setFaq((prev) =>
                  prev
                    ? { categories: prev.categories.filter((_, idx) => idx !== ci) }
                    : prev,
                )
              }
            />
          </div>

          <Field label="توضیحات (اختیاری)">
            <TextInput
              value={category.description ?? ""}
              onChange={(v) => updateCategory(ci, { description: v })}
            />
          </Field>

          <div className="flex flex-col gap-3 border-t border-slate-100 pt-3">
            {category.items.map((item, ii) => (
              <div key={ii} className="rounded-xl border border-slate-200 p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-medium text-slate-500">سوال {ii + 1}</span>
                  <div className="flex items-center gap-3">
                    <Toggle
                      label="فعال"
                      checked={item.isActive !== false}
                      onChange={(v) =>
                        updateCategory(ci, {
                          items: category.items.map((it, idx) =>
                            idx === ii ? { ...it, isActive: v } : it,
                          ),
                        })
                      }
                    />
                    <RemoveButton
                      label=""
                      onClick={() =>
                        updateCategory(ci, {
                          items: category.items.filter((_, idx) => idx !== ii),
                        })
                      }
                    />
                  </div>
                </div>
                <div className="mt-2 flex flex-col gap-2">
                  <TextInput
                    value={item.question}
                    onChange={(v) =>
                      updateCategory(ci, {
                        items: category.items.map((it, idx) =>
                          idx === ii ? { ...it, question: v } : it,
                        ),
                      })
                    }
                    placeholder="سوال"
                  />
                  <TextArea
                    value={item.answer}
                    rows={3}
                    onChange={(v) =>
                      updateCategory(ci, {
                        items: category.items.map((it, idx) =>
                          idx === ii ? { ...it, answer: v } : it,
                        ),
                      })
                    }
                    placeholder="پاسخ (می‌تواند شامل HTML باشد)"
                  />
                </div>
              </div>
            ))}
            <AddButton
              label="افزودن سوال"
              onClick={() =>
                updateCategory(ci, { items: [...category.items, newFaqItem()] })
              }
            />
          </div>
        </Card>
      ))}
      <AddButton
        label="افزودن دسته‌بندی"
        onClick={() =>
          setFaq((prev) =>
            prev ? { categories: [...prev.categories, newFaqCategory()] } : prev,
          )
        }
      />
    </div>
  );
}
