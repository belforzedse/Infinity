"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Save, Image as ImageIcon, ArrowRightLeft } from "lucide-react";
import ContentWrapper from "@/components/SuperAdmin/Layout/ContentWrapper";
import CategoriesListField from "@/components/SuperAdmin/UpsertPage/ContentWrapper/Fields/CategoriesListField";
import ImageUploadField from "@/components/SuperAdmin/UpsertPage/ContentWrapper/Fields/ImageUploadField";
import FeaturedImagePanel from "@/components/SuperAdmin/Blog/Sidebar/FeaturedImagePanel";
import { blogService, type BlogCategory } from "@/services/blog/blog.service";
import { getSuperAdminSettings } from "@/services/super-admin/settings/get";
import { updateSuperAdminSettings } from "@/services/super-admin/settings/update";
import {
  type BlogCategoryBannerOrderItem,
  type SuperAdminSettings,
  defaultSettings,
  normalizeBlogCategoryBannerOrder,
} from "@/types/super-admin/settings";
import { sortBlogCategoriesByBannerOrder } from "@/utils/blogCategoryBanners";
import { useCurrentUser } from "@/hooks/useCurrentUser";

const trimmed = (value?: string) => (typeof value === "string" ? value.trim() : "");

const makeOrderItem = (category: BlogCategory): BlogCategoryBannerOrderItem => ({
  id: category.id,
  title: trimmed(category.Title) || trimmed(category.Name) || "",
  slug: category.Slug,
});

const sortCategoriesAlphabetically = (categories: BlogCategory[]) =>
  [...categories].sort((a, b) => {
    const titleA = trimmed(a.Title) || trimmed(a.Name) || trimmed(a.Slug);
    const titleB = trimmed(b.Title) || trimmed(b.Name) || trimmed(b.Slug);
    return titleA.localeCompare(titleB, "fa");
  });

const serializeOrder = (order: BlogCategoryBannerOrderItem[]) => JSON.stringify(order, null, 2);

function parseOrderValue(raw: string): BlogCategoryBannerOrderItem[] {
  if (!trimmed(raw)) return [];

  try {
    return normalizeBlogCategoryBannerOrder(JSON.parse(raw));
  } catch {
    return [];
  }
}

function BannerField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: "text" | "color";
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm text-slate-700">{label}</label>
      <input
        type={type}
        value={value || ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-pink-400"
      />
    </div>
  );
}

export default function BlogCategoryBannersPage() {
  const router = useRouter();
  const { isStoreManager } = useCurrentUser();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [settings, setSettings] = useState<SuperAdminSettings>(defaultSettings());
  const [orderValue, setOrderValue] = useState("[]");

  useEffect(() => {
    if (isStoreManager) {
      router.replace("/super-admin");
    }
  }, [isStoreManager, router]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [categoriesResponse, settingsResponse] = await Promise.all([
        blogService.getBlogCategories(),
        getSuperAdminSettings(),
      ]);

      const loadedCategories = (categoriesResponse.data || []).filter((category) =>
        Boolean(trimmed(category.Slug)),
      );
      setCategories(loadedCategories);
      setSettings(settingsResponse);

      const fallbackOrder = sortCategoriesAlphabetically(loadedCategories).map(makeOrderItem);
      const loadedOrder = settingsResponse.blogCategoryBannerOrder;

      if (loadedOrder.length > 0) {
        const resolvedCategories = sortBlogCategoriesByBannerOrder(loadedCategories, loadedOrder);
        setOrderValue(serializeOrder(resolvedCategories.map(makeOrderItem)));
      } else {
        setOrderValue(serializeOrder(fallbackOrder));
      }
    } catch (error) {
      console.error(error);
      toast.error("خطا در دریافت اطلاعات بنرها");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const parsedOrder = useMemo(() => parseOrderValue(orderValue), [orderValue]);

  const orderedCategories = useMemo(
    () => sortBlogCategoriesByBannerOrder(categories, parsedOrder),
    [categories, parsedOrder],
  );

  const fetchCategoriesForOrder = useCallback(async () => {
    return categories.map((category) => ({
      id: category.id,
      title: trimmed(category.Title) || trimmed(category.Name) || "بدون عنوان",
      slug: category.Slug,
    }));
  }, [categories]);

  const updateCategoryField = useCallback(
    <K extends keyof BlogCategory>(id: number, key: K, value: BlogCategory[K]) => {
      setCategories((current) =>
        current.map((category) => (category.id === id ? { ...category, [key]: value } : category)),
      );
    },
    [],
  );

  const handleSave = async () => {
    const normalizedOrder = parsedOrder;
    if (normalizedOrder.length === 0 && categories.length > 0) {
      toast.error("ترتیب دسته‌بندی‌ها نامعتبر است. لطفاً آن را اصلاح کنید.");
      return;
    }

    setSaving(true);
    try {
      await Promise.all(
        categories.map((category) =>
          blogService.updateBlogCategory(category.id, {
            BannerTitle: trimmed(category.BannerTitle),
            BannerSubtitle: trimmed(category.BannerSubtitle),
            BannerTitleColor: trimmed(category.BannerTitleColor),
            BannerSubtitleColor: trimmed(category.BannerSubtitleColor),
            BannerLinkText: trimmed(category.BannerLinkText),
            BannerLinkColor: trimmed(category.BannerLinkColor),
            FeaturedImage: category.FeaturedImage?.id ?? null,
          }),
        ),
      );

      const saved = await updateSuperAdminSettings({
        blogCategoryBannerOrder: normalizedOrder,
        blogDefaultBannerImage: trimmed(settings.blogDefaultBannerImage),
        blogDefaultBannerTitle: trimmed(settings.blogDefaultBannerTitle),
        blogDefaultBannerSubtitle: trimmed(settings.blogDefaultBannerSubtitle),
        blogDefaultBannerTitleColor: trimmed(settings.blogDefaultBannerTitleColor),
        blogDefaultBannerSubtitleColor: trimmed(settings.blogDefaultBannerSubtitleColor),
        blogDefaultBannerLinkText: trimmed(settings.blogDefaultBannerLinkText),
        blogDefaultBannerLinkColor: trimmed(settings.blogDefaultBannerLinkColor),
      });

      toast.success("بنرهای بلاگ با موفقیت ذخیره شدند");
      setSettings(saved ?? (await getSuperAdminSettings()));
    } catch (error) {
      console.error(error);
      toast.error("خطا در ذخیره بنرهای بلاگ");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div>در حال بارگذاری...</div>;
  }

  return (
    <ContentWrapper
      title="بنرهای دسته‌بندی بلاگ"
      titleSuffixComponent={
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-pink-500 px-4 py-2 text-sm text-white transition-colors hover:bg-pink-600 disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {saving ? "در حال ذخیره..." : "ذخیره همه تغییرات"}
        </button>
      }
    >
      <div className="space-y-4">
        <section className="rounded-2xl bg-white p-4">
          <div className="mb-3 flex items-center gap-2 text-slate-800">
            <ArrowRightLeft className="h-4 w-4" />
            <h2 className="text-sm font-semibold">ترتیب نمایش دسته‌بندی‌ها در /blog</h2>
          </div>
          <CategoriesListField
            value={orderValue}
            onChange={setOrderValue}
            fetchCategories={fetchCategoriesForOrder}
          />
        </section>

        <section className="rounded-2xl bg-white p-4">
          <div className="mb-4 flex items-center gap-2 text-slate-800">
            <ImageIcon className="h-4 w-4" />
            <h2 className="text-sm font-semibold">بنر پیش‌فرض انتهای صفحه بلاگ</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <ImageUploadField
                value={settings.blogDefaultBannerImage}
                onChange={(value) =>
                  setSettings((prev) => ({ ...prev, blogDefaultBannerImage: value }))
                }
              />
            </div>
            <BannerField
              label="عنوان"
              value={settings.blogDefaultBannerTitle}
              onChange={(value) =>
                setSettings((prev) => ({ ...prev, blogDefaultBannerTitle: value }))
              }
              placeholder="همه مقالات اینفینیتی مگ"
            />
            <BannerField
              label="متن لینک"
              value={settings.blogDefaultBannerLinkText}
              onChange={(value) =>
                setSettings((prev) => ({ ...prev, blogDefaultBannerLinkText: value }))
              }
              placeholder="مشاهده همه مقالات"
            />
            <div className="md:col-span-2">
              <div className="flex flex-col gap-2">
                <label className="text-sm text-slate-700">زیرعنوان</label>
                <textarea
                  value={settings.blogDefaultBannerSubtitle}
                  onChange={(event) =>
                    setSettings((prev) => ({
                      ...prev,
                      blogDefaultBannerSubtitle: event.target.value,
                    }))
                  }
                  placeholder="تمامی مقالات و محتوای آموزشی ما را مشاهده کنید"
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-pink-400"
                />
              </div>
            </div>
            <BannerField
              label="رنگ عنوان"
              value={settings.blogDefaultBannerTitleColor}
              onChange={(value) =>
                setSettings((prev) => ({ ...prev, blogDefaultBannerTitleColor: value }))
              }
              placeholder="#FFFFFF"
            />
            <BannerField
              label="رنگ زیرعنوان"
              value={settings.blogDefaultBannerSubtitleColor}
              onChange={(value) =>
                setSettings((prev) => ({ ...prev, blogDefaultBannerSubtitleColor: value }))
              }
              placeholder="#CBD5E1"
            />
            <BannerField
              label="رنگ لینک"
              value={settings.blogDefaultBannerLinkColor}
              onChange={(value) =>
                setSettings((prev) => ({ ...prev, blogDefaultBannerLinkColor: value }))
              }
              placeholder="#FFFFFF"
            />
          </div>
        </section>

        {orderedCategories.map((category) => (
          <section key={category.id} className="rounded-2xl bg-white p-4">
            <div className="mb-4 flex flex-col gap-1">
              <h3 className="text-base font-semibold text-slate-900">
                {trimmed(category.Title) || trimmed(category.Name) || "بدون عنوان"}
              </h3>
              <span className="text-xs text-slate-500">/{category.Slug}</span>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <FeaturedImagePanel
                  featuredImage={
                    category.FeaturedImage
                      ? { id: category.FeaturedImage.id, url: category.FeaturedImage.url }
                      : undefined
                  }
                  onFeaturedImageChange={(value) => {
                    updateCategoryField(
                      category.id,
                      "FeaturedImage",
                      value
                        ? {
                            id: value.id || 0,
                            url: value.url || "",
                          }
                        : undefined,
                    );
                  }}
                />
              </div>

              <BannerField
                label="عنوان بنر"
                value={category.BannerTitle}
                onChange={(value) => updateCategoryField(category.id, "BannerTitle", value)}
                placeholder={trimmed(category.Title) || trimmed(category.Name) || "عنوان دسته‌بندی"}
              />
              <BannerField
                label="متن لینک"
                value={category.BannerLinkText}
                onChange={(value) => updateCategoryField(category.id, "BannerLinkText", value)}
                placeholder="مشاهده دسته بندی"
              />

              <div className="md:col-span-2">
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-slate-700">زیرعنوان</label>
                  <textarea
                    value={category.BannerSubtitle || ""}
                    onChange={(event) =>
                      updateCategoryField(category.id, "BannerSubtitle", event.target.value)
                    }
                    placeholder="توضیح کوتاه برای بنر این دسته‌بندی"
                    rows={3}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-pink-400"
                  />
                </div>
              </div>

              <BannerField
                label="رنگ عنوان"
                value={category.BannerTitleColor}
                onChange={(value) => updateCategoryField(category.id, "BannerTitleColor", value)}
                placeholder="#FFFFFF"
              />
              <BannerField
                label="رنگ زیرعنوان"
                value={category.BannerSubtitleColor}
                onChange={(value) => updateCategoryField(category.id, "BannerSubtitleColor", value)}
                placeholder="#CBD5E1"
              />
              <BannerField
                label="رنگ لینک"
                value={category.BannerLinkColor}
                onChange={(value) => updateCategoryField(category.id, "BannerLinkColor", value)}
                placeholder="#FFFFFF"
              />
            </div>
          </section>
        ))}
      </div>
    </ContentWrapper>
  );
}
