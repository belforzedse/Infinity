"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { SuperAdminTable } from "@/components/SuperAdmin/Table";
import ContentWrapper from "@/components/SuperAdmin/Layout/ContentWrapper";
import {
  Search,
  Edit,
  Trash2,
  FolderOpen,
  Calendar,
  Plus,
  X,
  Check,
  HelpCircle,
} from "lucide-react";
import { faqService } from "@/services/faq/faq.service";
import { FAQCategory } from "@/types/faq";
import Modal from "@/components/Kits/Modal";
import {
  createFAQCategory,
  type FAQCategoryData,
} from "@/services/super-admin/faq/createCategory";
import { updateFAQCategory } from "@/services/super-admin/faq/updateCategory";
import { deleteFAQCategory } from "@/services/super-admin/faq/deleteCategory";

export default function FAQCategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<FAQCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Add/Edit form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FAQCategoryData>({
    Title: "",
    Slug: "",
    Description: "",
    Order: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatPersianDate = (dateString?: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("fa-IR-u-ca-persian", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const response = await faqService.getFAQCategories(true); // Include inactive for admin
      setCategories(response.data || []);
    } catch (err) {
      console.error("Error fetching FAQ categories:", err);
      toast.error("خطا در دریافت دسته‌بندی‌ها");
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleDelete = async (id: number) => {
    if (confirm("آیا از حذف این دسته‌بندی اطمینان دارید؟")) {
      try {
        await deleteFAQCategory(id.toString());
        toast.success("دسته‌بندی با موفقیت حذف شد");
        fetchCategories();
      } catch (err) {
        console.error("Error deleting FAQ category:", err);
        toast.error("خطا در حذف دسته‌بندی");
      }
    }
  };

  const handleEdit = (category: FAQCategory) => {
    setEditingId(category.id);
    setFormData({
      Title: category.Title || "",
      Slug: category.Slug || "",
      Description: category.Description || "",
      Order: category.Order || 0,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.Title.trim()) {
      toast.error("عنوان دسته‌بندی الزامی است");
      return;
    }

    if (!formData.Slug.trim()) {
      formData.Slug = generateSlug(formData.Title);
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        await updateFAQCategory(editingId, formData);
        toast.success("دسته‌بندی با موفقیت بروزرسانی شد");
      } else {
        await createFAQCategory(formData);
        toast.success("دسته‌بندی با موفقیت ایجاد شد");
      }
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({ Title: "", Slug: "", Description: "", Order: 0 });
      fetchCategories();
    } catch (err) {
      console.error("Error saving FAQ category:", err);
      toast.error("خطا در ذخیره دسته‌بندی");
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    if (isSubmitting) return;
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ Title: "", Slug: "", Description: "", Order: 0 });
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({ Title: "", Slug: "", Description: "", Order: 0 });
    setIsModalOpen(true);
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredCategories = categories.filter((cat) =>
    (cat.Title || "").toLowerCase().includes(normalizedSearch)
  );

  const columns = [
    {
      accessorKey: "Title",
      header: "نام دسته‌بندی",
      cell: ({ row }: { row: { original: FAQCategory } }) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
            <HelpCircle className="h-5 w-5 text-slate-500" />
          </div>
          <div>
            <div className="font-medium text-neutral-900">
              {row.original.Title || "بدون نام"}
            </div>
            <div className="text-xs text-neutral-500">
              {row.original.Slug ? `/${row.original.Slug}` : "-"}
            </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "Description",
      header: "توضیحات",
      cell: ({ row }: { row: { original: FAQCategory } }) => (
        <span className="text-sm text-neutral-600">
          {row.original.Description || "-"}
        </span>
      ),
    },
    {
      accessorKey: "faq_questions",
      header: "تعداد سوالات",
      cell: ({ row }: { row: { original: FAQCategory } }) => (
        <span className="text-sm text-neutral-600">
          {row.original.faq_questions?.length || 0}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "تاریخ ایجاد",
      cell: ({ row }: { row: { original: FAQCategory } }) => (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-slate-400" />
          <span className="text-sm text-neutral-700">
            {formatPersianDate(row.original.createdAt)}
          </span>
        </div>
      ),
    },
    {
      id: "actions",
      header: "عملیات",
      cell: ({ row }: { row: { original: FAQCategory } }) => (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => handleEdit(row.original)}
            className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200"
            title="ویرایش"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => handleDelete(row.original.id)}
            className="flex h-8 w-8 items-center justify-center rounded-md bg-red-50 text-red-600 transition-colors hover:bg-red-100"
            title="حذف"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <ContentWrapper
      title="مدیریت دسته‌بندی‌های سوالات متداول"
      titleSuffixComponent={
        <button
          type="button"
          onClick={openCreateModal}
          className="flex items-center gap-2 rounded-lg bg-infinity-primary px-4 py-2 text-sm text-white transition-colors hover:bg-infinity-primary"
        >
          <Plus className="h-4 w-4" />
          دسته‌بندی جدید
        </button>
      }
    >
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingId ? "ویرایش دسته‌بندی" : "افزودن دسته‌بندی جدید"}
      >
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-700">
              عنوان دسته‌بندی <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.Title}
              onChange={(e) => {
                const title = e.target.value;
                setFormData({
                  ...formData,
                  Title: title,
                  Slug: formData.Slug || generateSlug(title),
                });
              }}
              placeholder="عنوان دسته‌بندی را وارد کنید"
              className="w-full rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-sm text-neutral-600 placeholder:text-slate-400 focus:border-infinity-primary focus:outline-none focus:ring-1 focus:ring-infinity-primary"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-700">
              Slug (شناسه URL)
            </label>
            <input
              type="text"
              value={formData.Slug}
              onChange={(e) =>
                setFormData({ ...formData, Slug: e.target.value })
              }
              placeholder="slug"
              className="w-full rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-sm text-neutral-600 placeholder:text-slate-400 focus:border-infinity-primary focus:outline-none focus:ring-1 focus:ring-infinity-primary"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-700">
              توضیحات
            </label>
            <textarea
              value={formData.Description}
              onChange={(e) =>
                setFormData({ ...formData, Description: e.target.value })
              }
              placeholder="توضیحات دسته‌بندی (اختیاری)"
              rows={3}
              className="w-full rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-sm text-neutral-600 placeholder:text-slate-400 focus:border-infinity-primary focus:outline-none focus:ring-1 focus:ring-infinity-primary"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-700">
              ترتیب نمایش
            </label>
            <input
              type="number"
              value={formData.Order || 0}
              onChange={(e) =>
                setFormData({ ...formData, Order: parseInt(e.target.value) || 0 })
              }
              placeholder="0"
              className="w-full rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-sm text-neutral-600 placeholder:text-slate-400 focus:border-infinity-primary focus:outline-none focus:ring-1 focus:ring-infinity-primary"
            />
          </div>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={closeModal}
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
            >
              <X className="h-4 w-4" />
              انصراف
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-lg bg-infinity-primary px-4 py-2 text-sm text-white transition-colors hover:bg-infinity-primary disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              {editingId ? "بروزرسانی" : "ذخیره"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Search */}
      <div className="mb-4 rounded-2xl bg-white p-4">
        <div className="relative">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="جستجو در دسته‌بندی‌ها..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-100 bg-white py-2.5 pr-10 pl-4 text-sm text-neutral-600 placeholder:text-slate-400 focus:border-infinity-primary focus:outline-none focus:ring-1 focus:ring-infinity-primary"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white">
        <SuperAdminTable
          data={filteredCategories}
          columns={columns}
          loading={loading}
        />
      </div>
    </ContentWrapper>
  );
}
