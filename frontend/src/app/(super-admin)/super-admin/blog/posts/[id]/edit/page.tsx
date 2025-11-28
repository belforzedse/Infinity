"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm, FormProvider } from "react-hook-form";
import toast from "react-hot-toast";
import { Plus, ArrowRight } from "lucide-react";
import Link from "next/link";
import BlogSidebar from "@/components/SuperAdmin/Blog/Sidebar";
import RichTextEditor from "@/components/RichTextEditor";
import {
  blogService,
  BlogCategory,
  BlogTag,
  BlogPost,
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

export default function EditBlogPostPage() {
  const router = useRouter();
  const params = useParams();
  const { isStoreManager } = useCurrentUser();
  const postId = Number(params.id);

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [post, setPost] = useState<BlogPost | null>(null);

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

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = methods;

  const slugValue = watch("Slug");
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

  // Fetch post data and categories/tags
  useEffect(() => {
    const fetchData = async () => {
      setIsFetching(true);
      try {
        // Fetch post first; if this fails, bail out early
        const postRes = await blogService.getBlogPostById(postId);
        const postData = postRes.data;
        setPost(postData);

        // Set form values
        reset({
          Title: postData.Title,
          Slug: postData.Slug,
          Excerpt: postData.Excerpt || "",
          MetaTitle: postData.MetaTitle || "",
          MetaDescription: postData.MetaDescription || "",
          Keywords: postData.Keywords || "",
        });
        setIsSlugManuallyEdited(!!postData.Slug);

        // Set sidebar state
        setStatus(postData.Status);
        setContent(postData.Content || "");
        setSelectedCategory(postData.blog_category?.id);
        setSelectedTags(postData.blog_tags?.map((t) => t.id) || []);
        setFeaturedImage(
          postData.FeaturedImage
            ? { id: postData.FeaturedImage.id, url: postData.FeaturedImage.url }
            : undefined,
        );

        // Fetch categories and tags separately so a failure there doesn't block the post
        try {
          const [categoriesRes, tagsRes] = await Promise.all([
            blogService.getBlogCategories(),
            blogService.getBlogTags(),
          ]);
          setCategories(categoriesRes.data || []);
          setTags(tagsRes.data || []);
        } catch (error) {
          console.error("Error fetching categories/tags:", error);
          toast.error("خطا در دریافت دسته‌بندی/برچسب‌ها");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("خطا در دریافت اطلاعات پست");
      } finally {
        setIsFetching(false);
      }
    };

    if (postId) {
      fetchData();
    }
  }, [postId, reset]);

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
      const postData: Partial<CreateBlogPostData> = {
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
      };

      if (publishNow && post?.Status !== "Published") {
        postData.PublishedAt = new Date().toISOString();
      }

      await blogService.updateBlogPost(postId, postData);
      toast.success(publishNow ? "پست با موفقیت منتشر شد" : "پست با موفقیت بروزرسانی شد");
      router.push("/super-admin/blog/posts");
    } catch (error) {
      console.error("Error updating blog post:", error);
      toast.error("خطا در بروزرسانی پست");
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

  if (isFetching) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-pink-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="p-6" dir="rtl">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/super-admin/blog/posts"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50"
          >
            <ArrowRight className="h-5 w-5" />
          </Link>
          <h1 className="text-3xl font-normal text-[#202224]">ویرایش نوشته</h1>
        </div>
        <Link
          href="/super-admin/blog/posts/add"
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
