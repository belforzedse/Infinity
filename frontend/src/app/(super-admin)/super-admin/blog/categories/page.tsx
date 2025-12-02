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
} from "lucide-react";
import { blogService, BlogCategory } from "@/services/blog/blog.service";
import Modal from "@/components/Kits/Modal";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export default function BlogCategoriesPage() {
  const router = useRouter();
  const { isStoreManager } = useCurrentUser();
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Redirect store managers away from blog pages
  useEffect(() => {
    if (isStoreManager) {
      router.replace("/super-admin");
    }
  }, [isStoreManager, router]);

  // Add/Edit form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ Name: "", Description: "" });
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

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      const response = await blogService.getBlogCategories();
      setCategories(response.data || []);
    } catch (err) {
      console.error("Error fetching categories:", err);
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
        await blogService.deleteBlogCategory(id);
        toast.success("دسته‌بندی با موفقیت حذف شد");
        fetchCategories();
      } catch (err) {
        console.error("Error deleting category:", err);
        toast.error("خطا در حذف دسته‌بندی");
      }
    }
  };

  const handleEdit = (category: BlogCategory) => {
    setEditingId(category.id);
    setFormData({
      Name: category.Name || category.Title || "",
      Description: category.Description || "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.Name.trim()) {
      toast.error("نام دسته‌بندی الزامی است");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        await blogService.updateBlogCategory(editingId, formData);
        toast.success("دسته‌بندی با موفقیت بروزرسانی شد");
      } else {
        await blogService.createBlogCategory(formData);
        toast.success("دسته‌بندی با موفقیت ایجاد شد");
      }
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({ Name: "", Description: "" });
      fetchCategories();
    } catch (err) {
      console.error("Error saving category:", err);
      toast.error("خطا در ذخیره دسته‌بندی");
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    if (isSubmitting) return;
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ Name: "", Description: "" });
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({ Name: "", Description: "" });
    setIsModalOpen(true);
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredCategories = categories.filter((cat) =>
    (cat.Name || cat.Title || "").toLowerCase().includes(normalizedSearch)
  );

  const columns = [
    {
      accessorKey: "Name",
      header: "نام دسته‌بندی",
      cell: ({ row }: { row: { original: BlogCategory } }) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
            <FolderOpen className="h-5 w-5 text-slate-500" />
          </div>
          <div>
            <div className="font-medium text-neutral-900">
              {row.original.Name || row.original.Title || "بدون نام"}
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
      cell: ({ row }: { row: { original: BlogCategory } }) => (
        <span className="text-sm text-neutral-600">
          {row.original.Description || "-"}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "تاریخ ایجاد",
      cell: ({ row }: { row: { original: BlogCategory } }) => (
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
      cell: ({ row }: { row: { original: BlogCategory } }) => (
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
      title="مدیریت دسته‌بندی‌ها"
      titleSuffixComponent={
        <button
          type="button"
          onClick={openCreateModal}
          className="flex items-center gap-2 rounded-lg bg-pink-500 px-4 py-2 text-sm text-white transition-colors hover:bg-pink-600"
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
              نام دسته‌بندی
            </label>
            <input
              type="text"
              value={formData.Name}
              onChange={(e) => setFormData({ ...formData, Name: e.target.value })}
              placeholder="نام دسته‌بندی را وارد کنید"
              className="w-full rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-sm text-neutral-600 placeholder:text-slate-400 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-700">
              توضیحات
            </label>
            <textarea
              value={formData.Description}
              onChange={(e) => setFormData({ ...formData, Description: e.target.value })}
              placeholder="توضیحات دسته‌بندی (اختیاری)"
              rows={3}
              className="w-full rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-sm text-neutral-600 placeholder:text-slate-400 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
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
              className="flex items-center gap-2 rounded-lg bg-pink-500 px-4 py-2 text-sm text-white transition-colors hover:bg-pink-600 disabled:opacity-50"
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
            className="w-full rounded-xl border border-slate-100 bg-white py-2.5 pr-10 pl-4 text-sm text-neutral-600 placeholder:text-slate-400 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
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
