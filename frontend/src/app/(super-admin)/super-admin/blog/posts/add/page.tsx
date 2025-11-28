"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import toast from "react-hot-toast";
import { Plus } from "lucide-react";
import Link from "next/link";
import BlogSidebar from "@/components/SuperAdmin/Blog/Sidebar";
import RichTextEditor from "@/components/RichTextEditor";
import {
  blogService,
  BlogCategory,
  BlogTag,
  CreateBlogPostData,
} from "@/services/blog/blog.service";
import { useCurrentUser } from "@/hooks/useCurrentUser";

interface BlogPostFormData {
  Title: string;
  Slug: string;
  Content: string;
  Excerpt: string;
  MetaTitle: string;
  MetaDescription: string;
  Keywords: string;
}

const slugify = (input: string) =>
  input
    .toLowerCase()
    .trim()
    .replace(/[\s\u200C]+/g, "-")
    .replace(/[^\w\u0600-\u06FF-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

export default function AddBlogPostPage() {
  const router = useRouter();
  const { isStoreManager } = useCurrentUser();
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [tags, setTags] = useState<BlogTag[]>([]);

  // Redirect store managers away from blog pages
  useEffect(() => {
    if (isStoreManager) {
      router.replace("/super-admin");
    }
  }, [isStoreManager, router]);

  // Sidebar state
  const [status, setStatus] = useState<"Draft" | "Published" | "Scheduled">("Draft");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>();
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [featuredImage, setFeaturedImage] = useState<{ id?: number; url?: string } | undefined>();
  const [content, setContent] = useState("");
  const [isSlugManuallyEdited, setIsSlugManuallyEdited] = useState(false);

  const methods = useForm<BlogPostFormData>({
    defaultValues: {
      Title: "",
      Slug: "",
      Content: "",
      Excerpt: "",
      MetaTitle: "",
      MetaDescription: "",
      Keywords: "",
    },
  });

  const { register, handleSubmit, watch, setValue, formState: { errors } } = methods;

  const slugValue = watch("Slug");

  // Auto-generate slug from title
  const title = watch("Title");
  useEffect(() => {
    register("Slug", { required: "اسلاگ الزامی است" });
  }, [register]);

  useEffect(() => {
    if (!title) {
      if (!isSlugManuallyEdited) {
        setValue("Slug", "");
      }
      return;
    }

    if (!isSlugManuallyEdited) {
      setValue("Slug", slugify(title));
    }
  }, [title, isSlugManuallyEdited, setValue]);

  const handleSlugChange = (value: string) => {
    setIsSlugManuallyEdited(true);
    setValue("Slug", slugify(value), { shouldDirty: true, shouldValidate: true });
  };

  const handleUseGeneratedSlug = () => {
    const generated = slugify(title || "");
    setIsSlugManuallyEdited(false);
    setValue("Slug", generated, { shouldDirty: true, shouldValidate: true });
  };

  // Fetch categories and tags
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesRes, tagsRes] = await Promise.all([
          blogService.getBlogCategories(),
          blogService.getBlogTags(),
        ]);
        setCategories(categoriesRes.data || []);
        setTags(tagsRes.data || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  const handleAddCategory = async (name: string) => {
    try {
      const response = await blogService.createBlogCategory({ Name: name });
      setCategories((prev) => [...prev, response.data]);
      setSelectedCategory(response.data.id);
      toast.success("دسته‌بندی با موفقیت ایجاد شد");
    } catch (error) {
      toast.error("خطا در ایجاد دسته‌بندی");
      throw error;
    }
  };

  const handleAddTag = async (name: string) => {
    try {
      const response = await blogService.createBlogTag({ Name: name });
      setTags((prev) => [...prev, response.data]);
      setSelectedTags((prev) => [...prev, response.data.id]);
      toast.success("برچسب با موفقیت ایجاد شد");
    } catch (error) {
      toast.error("خطا در ایجاد برچسب");
      throw error;
    }
  };

  const onSubmit = async (data: BlogPostFormData, publishNow: boolean = false) => {
    setIsLoading(true);
    try {
      const postData: CreateBlogPostData = {
        Title: data.Title,
        Slug: data.Slug,
        Content: content,
        Excerpt: data.Excerpt,
        Status: publishNow ? "Published" : status,
        MetaTitle: data.MetaTitle,
        MetaDescription: data.MetaDescription,
        Keywords: data.Keywords,
        blog_category: selectedCategory,
        blog_tags: selectedTags,
        FeaturedImage: featuredImage?.id,
        PublishedAt: publishNow ? new Date().toISOString() : undefined,
      };

      await blogService.createBlogPost(postData);
      toast.success(publishNow ? "پست با موفقیت منتشر شد" : "پست با موفقیت ذخیره شد");
      router.push("/super-admin/blog/posts");
    } catch (error) {
      console.error("Error creating blog post:", error);
      toast.error("خطا در ایجاد پست");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublish = () => {
    handleSubmit((data) => onSubmit(data, true))();
  };

  const handleSaveDraft = () => {
    handleSubmit((data) => onSubmit(data, false))();
  };

  const handlePreview = () => {
    if (slugValue) {
      window.open(`/${slugValue}`, "_blank");
    }
  };

  return (
    <div className="p-6" dir="rtl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-normal text-[#202224]">افزودن نوشته جدید</h1>
        <Link
          href="/super-admin/blog/posts"
          className="flex items-center gap-2 rounded-lg border border-slate-400 px-3 py-1.5 text-sm text-slate-700 transition-colors hover:bg-slate-50"
        >
          <Plus className="h-4 w-4" />
          <span>افزودن نوشته جدید</span>
        </Link>
      </div>

      <FormProvider {...methods}>
        <form onSubmit={(e) => e.preventDefault()}>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
            {/* Main Content */}
            <div className="lg:col-span-3 space-y-6">
              {/* Title */}
              <div className="rounded-2xl bg-white p-5">
                <input
                  type="text"
                  {...register("Title", { required: "عنوان الزامی است" })}
                  placeholder="عنوان نوشته اینجا قرار میگیرد"
                  className="w-full border-0 bg-transparent text-2xl font-normal text-[#202224] placeholder:text-slate-400 focus:outline-none focus:ring-0"
                />
                {errors.Title && (
                  <p className="mt-2 text-sm text-red-500">{errors.Title.message}</p>
                )}
              </div>

              {/* Content Editor */}
              <div className="rounded-2xl bg-white p-5">
                <label className="mb-3 block text-sm font-medium text-neutral-800">
                  محتوای پست
                </label>
                <RichTextEditor
                  content={content}
                  onChange={setContent}
                  placeholder="محتوای پست را اینجا بنویسید..."
                />
              </div>

              {/* Excerpt */}
              <div className="rounded-2xl bg-white p-5">
                <label className="mb-3 block text-sm font-medium text-neutral-800">
                  خلاصه پست
                </label>
                <textarea
                  {...register("Excerpt")}
                  rows={3}
                  placeholder="خلاصه‌ای از پست برای نمایش در لیست‌ها..."
                  className="w-full rounded-xl border border-slate-100 bg-white px-4 py-3 text-sm text-neutral-600 placeholder:text-slate-400 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
                />
              </div>

              {/* SEO Settings */}
              <div className="rounded-2xl bg-white p-5">
                <h3 className="mb-4 text-lg font-medium text-neutral-800">تنظیمات سئو</h3>
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-neutral-800">
                      عنوان متا
                    </label>
                    <input
                      type="text"
                      {...register("MetaTitle")}
                      placeholder="عنوان برای موتورهای جستجو"
                      className="w-full rounded-xl border border-slate-100 bg-white px-4 py-3 text-sm text-neutral-600 placeholder:text-slate-400 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
                    />
                    <p className="mt-1 text-xs text-slate-400">حداکثر 60 کاراکتر</p>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-neutral-800">
                      توضیحات متا
                    </label>
                    <textarea
                      {...register("MetaDescription")}
                      rows={2}
                      placeholder="توضیحات برای موتورهای جستجو"
                      className="w-full rounded-xl border border-slate-100 bg-white px-4 py-3 text-sm text-neutral-600 placeholder:text-slate-400 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
                    />
                    <p className="mt-1 text-xs text-slate-400">حداکثر 160 کاراکتر</p>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-neutral-800">
                      کلمات کلیدی
                    </label>
                    <input
                      type="text"
                      {...register("Keywords")}
                      placeholder="کلمات کلیدی را با کاما جدا کنید"
                      className="w-full rounded-xl border border-slate-100 bg-white px-4 py-3 text-sm text-neutral-600 placeholder:text-slate-400 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <BlogSidebar
                slug={slugValue}
                slugError={errors.Slug?.message}
                onSlugChange={handleSlugChange}
                onUseSuggestedSlug={handleUseGeneratedSlug}
                status={status}
                onStatusChange={setStatus}
                visibility={visibility}
                onVisibilityChange={setVisibility}
                onPublish={handlePublish}
                onSaveDraft={handleSaveDraft}
                onPreview={handlePreview}
                isLoading={isLoading}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                categories={categories}
                onAddCategory={handleAddCategory}
                featuredImage={featuredImage}
                onFeaturedImageChange={setFeaturedImage}
                selectedTags={selectedTags}
                onTagsChange={setSelectedTags}
                tags={tags}
                onAddTag={handleAddTag}
              />
            </div>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}
