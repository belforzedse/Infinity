"use client";

import React, { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { SuperAdminTable } from "@/components/SuperAdmin/Table";
import ContentWrapper from "@/components/SuperAdmin/Layout/ContentWrapper";
import Modal from "@/components/Kits/Modal";
import {
  Search,
  Edit,
  Trash2,
  User,
  Calendar,
  Plus,
  X,
  Check,
} from "lucide-react";
import { blogService, BlogAuthor } from "@/services/blog/blog.service";
import { IMAGE_BASE_URL } from "@/constants/api";

export default function BlogAuthorsPage() {
  const [authors, setAuthors] = useState<BlogAuthor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Add/Edit form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({ Name: "", Bio: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const normalizeAuthor = useCallback((entry: any): BlogAuthor => {
    if (!entry) return entry;
    const attrs = entry.attributes || entry;
    const avatarData = attrs.Avatar?.data;
    const avatarAttrs = avatarData?.attributes || avatarData;

    return {
      id: entry.id ?? attrs.id,
      Name: attrs.Name || "",
      Bio: attrs.Bio || "",
      Email: attrs.Email,
      Avatar: avatarAttrs
        ? {
            id: avatarData?.id ?? avatarAttrs.id,
            url: avatarAttrs.url,
            alternativeText: avatarAttrs.alternativeText,
          }
        : undefined,
      users_permissions_user: attrs.users_permissions_user,
      ResolvedName: attrs.ResolvedName,
      ResolvedAuthorName: attrs.ResolvedAuthorName,
      createdAt: attrs.createdAt,
      updatedAt: attrs.updatedAt,
    };
  }, []);

  const formatPersianDate = (dateString?: string) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) {
      return "-";
    }
    return date.toLocaleDateString("fa-IR-u-ca-persian", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const fetchAuthors = useCallback(async () => {
    try {
      setLoading(true);
      const response = await blogService.getBlogAuthors();
      const normalized =
        Array.isArray(response.data) ? response.data.map((item: any) => normalizeAuthor(item)) : [];
      setAuthors(normalized);
    } catch (err) {
      console.error("Error fetching authors:", err);
      toast.error("خطا در دریافت نویسندگان");
      setAuthors([]);
    } finally {
      setLoading(false);
    }
  }, [normalizeAuthor]);

  useEffect(() => {
    fetchAuthors();
  }, [fetchAuthors]);

  const handleDelete = async (id: number) => {
    if (confirm("آیا از حذف این نویسنده اطمینان دارید؟")) {
      try {
        await blogService.deleteBlogAuthor(id);
        toast.success("نویسنده با موفقیت حذف شد");
        fetchAuthors();
      } catch (err) {
        console.error("Error deleting author:", err);
        toast.error("خطا در حذف نویسنده");
      }
    }
  };

  const handleEdit = (author: BlogAuthor) => {
    setEditingId(author.id);
    setFormData({ Name: author.Name, Bio: author.Bio || "" });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.Name.trim()) {
      toast.error("نام نویسنده الزامی است");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        await blogService.updateBlogAuthor(editingId, formData);
        toast.success("نویسنده با موفقیت بروزرسانی شد");
      } else {
        await blogService.createBlogAuthor(formData);
        toast.success("نویسنده با موفقیت ایجاد شد");
      }
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({ Name: "", Bio: "" });
      fetchAuthors();
    } catch (err) {
      console.error("Error saving author:", err);
      toast.error("خطا در ذخیره نویسنده");
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    if (isSubmitting) return;
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ Name: "", Bio: "" });
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({ Name: "", Bio: "" });
    setIsModalOpen(true);
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredAuthors = authors.filter((author) =>
    (author.Name || "").toLowerCase().includes(normalizedSearch)
  );

  const getAvatarUrl = (avatar?: { url: string }) => {
    if (!avatar?.url) return null;
    if (avatar.url.startsWith("http")) return avatar.url;
    return `${IMAGE_BASE_URL}${avatar.url}`;
  };

  const columns = [
    {
      accessorKey: "Name",
      header: "نویسنده",
      cell: ({ row }: { row: { original: BlogAuthor } }) => {
        const avatarUrl = getAvatarUrl(row.original.Avatar);
        return (
          <div className="flex items-center gap-3">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={row.original.Name}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                <User className="h-5 w-5 text-slate-500" />
              </div>
            )}
            <div>
              <div className="font-medium text-neutral-900">
                {row.original.Name || "بدون نام"}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "Bio",
      header: "بیوگرافی",
      cell: ({ row }: { row: { original: BlogAuthor } }) => (
        <span className="text-sm text-neutral-600 line-clamp-2 max-w-xs">
          {row.original.Bio || "-"}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "تاریخ ایجاد",
      cell: ({ row }: { row: { original: BlogAuthor } }) => (
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
      cell: ({ row }: { row: { original: BlogAuthor } }) => (
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
      title="مدیریت نویسندگان"
      titleSuffixComponent={
        <button
          type="button"
          onClick={openCreateModal}
          className="flex items-center gap-2 rounded-lg bg-pink-500 px-4 py-2 text-sm text-white transition-colors hover:bg-pink-600"
        >
          <Plus className="h-4 w-4" />
          نویسنده جدید
        </button>
      }
    >
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingId ? "ویرایش نویسنده" : "افزودن نویسنده جدید"}
      >
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-700">
              نام نویسنده
            </label>
            <input
              type="text"
              value={formData.Name}
              onChange={(e) => setFormData({ ...formData, Name: e.target.value })}
              placeholder="نام نویسنده را وارد کنید"
              className="w-full rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-sm text-neutral-600 placeholder:text-slate-400 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-700">
              بیوگرافی
            </label>
            <textarea
              value={formData.Bio}
              onChange={(e) => setFormData({ ...formData, Bio: e.target.value })}
              placeholder="بیوگرافی نویسنده (اختیاری)"
              rows={4}
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
            placeholder="جستجو در نویسندگان..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-xl border border-slate-100 bg-white py-2.5 pr-10 pl-4 text-sm text-neutral-600 placeholder:text-slate-400 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white">
        <SuperAdminTable
          data={filteredAuthors}
          columns={columns}
          loading={loading}
        />
      </div>
    </ContentWrapper>
  );
}
