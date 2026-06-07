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
  HelpCircle,
  Calendar,
  Plus,
  X,
  Check,
  Filter,
} from "lucide-react";
import { faqService } from "@/services/faq/faq.service";
import { FAQQuestion, FAQCategory } from "@/types/faq";
import Modal from "@/components/Kits/Modal";
import {
  createFAQQuestion,
  type FAQQuestionData,
} from "@/services/super-admin/faq/createQuestion";
import { updateFAQQuestion } from "@/services/super-admin/faq/updateQuestion";
import { deleteFAQQuestion } from "@/services/super-admin/faq/deleteQuestion";

export default function FAQQuestionsPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<FAQQuestion[]>([]);
  const [categories, setCategories] = useState<FAQCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);

  // Add/Edit form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<FAQQuestionData>({
    Question: "",
    Answer: "",
    Order: 0,
    IsActive: true,
    faq_category: null,
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

  const fetchCategories = useCallback(async () => {
    try {
      const response = await faqService.getFAQCategories(true);
      setCategories(response.data || []);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  }, []);

  const fetchQuestions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await faqService.getFAQQuestions(
        selectedCategoryId || undefined
      );
      setQuestions(response.data || []);
    } catch (err) {
      console.error("Error fetching FAQ questions:", err);
      toast.error("خطا در دریافت سوالات");
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCategoryId]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleDelete = async (id: number) => {
    if (confirm("آیا از حذف این سوال اطمینان دارید؟")) {
      try {
        await deleteFAQQuestion(id.toString());
        toast.success("سوال با موفقیت حذف شد");
        fetchQuestions();
      } catch (err) {
        console.error("Error deleting FAQ question:", err);
        toast.error("خطا در حذف سوال");
      }
    }
  };

  const handleEdit = (question: FAQQuestion) => {
    setEditingId(question.id);
    setFormData({
      Question: question.Question || "",
      Answer: question.Answer || "",
      Order: question.Order || 0,
      IsActive: question.IsActive !== undefined ? question.IsActive : true,
      faq_category: question.faq_category?.id || null,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.Question.trim()) {
      toast.error("متن سوال الزامی است");
      return;
    }

    if (!formData.Answer.trim()) {
      toast.error("متن پاسخ الزامی است");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        await updateFAQQuestion(editingId, formData);
        toast.success("سوال با موفقیت بروزرسانی شد");
      } else {
        await createFAQQuestion(formData);
        toast.success("سوال با موفقیت ایجاد شد");
      }
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({
        Question: "",
        Answer: "",
        Order: 0,
        IsActive: true,
        faq_category: null,
      });
      fetchQuestions();
    } catch (err) {
      console.error("Error saving FAQ question:", err);
      toast.error("خطا در ذخیره سوال");
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    if (isSubmitting) return;
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({
      Question: "",
      Answer: "",
      Order: 0,
      IsActive: true,
      faq_category: null,
    });
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({
      Question: "",
      Answer: "",
      Order: 0,
      IsActive: true,
      faq_category: selectedCategoryId || null,
    });
    setIsModalOpen(true);
  };

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredQuestions = questions.filter((q) => {
    const matchesSearch =
      q.Question.toLowerCase().includes(normalizedSearch) ||
      q.Answer.toLowerCase().includes(normalizedSearch);
    return matchesSearch;
  });

  const columns = [
    {
      accessorKey: "Question",
      header: "سوال",
      cell: ({ row }: { row: { original: FAQQuestion } }) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
            <HelpCircle className="h-5 w-5 text-slate-500" />
          </div>
          <div className="max-w-md">
            <div className="font-medium text-neutral-900">
              {row.original.Question || "بدون سوال"}
            </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: "faq_category",
      header: "دسته‌بندی",
      cell: ({ row }: { row: { original: FAQQuestion } }) => (
        <span className="text-sm text-neutral-600">
          {row.original.faq_category?.Title || "-"}
        </span>
      ),
    },
    {
      accessorKey: "Order",
      header: "ترتیب",
      cell: ({ row }: { row: { original: FAQQuestion } }) => (
        <span className="text-sm text-neutral-600">
          {row.original.Order || 0}
        </span>
      ),
    },
    {
      accessorKey: "IsActive",
      header: "وضعیت",
      cell: ({ row }: { row: { original: FAQQuestion } }) => (
        <span
          className={`rounded-full px-2 py-1 text-xs ${
            row.original.IsActive
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-700"
          }`}
        >
          {row.original.IsActive ? "فعال" : "غیرفعال"}
        </span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "تاریخ ایجاد",
      cell: ({ row }: { row: { original: FAQQuestion } }) => (
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
      cell: ({ row }: { row: { original: FAQQuestion } }) => (
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
      title="مدیریت سوالات متداول"
      titleSuffixComponent={
        <button
          type="button"
          onClick={openCreateModal}
          className="flex items-center gap-2 rounded-lg bg-infinity-primary px-4 py-2 text-sm text-white transition-colors hover:bg-infinity-primary"
        >
          <Plus className="h-4 w-4" />
          سوال جدید
        </button>
      }
    >
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={editingId ? "ویرایش سوال" : "افزودن سوال جدید"}
      >
        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-700">
              دسته‌بندی
            </label>
            <select
              value={formData.faq_category || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  faq_category: e.target.value ? parseInt(e.target.value) : null,
                })
              }
              className="w-full rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-sm text-neutral-600 focus:border-infinity-primary focus:outline-none focus:ring-1 focus:ring-infinity-primary"
            >
              <option value="">انتخاب دسته‌بندی</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.Title}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-700">
              سوال <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.Question}
              onChange={(e) =>
                setFormData({ ...formData, Question: e.target.value })
              }
              placeholder="متن سوال را وارد کنید"
              className="w-full rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-sm text-neutral-600 placeholder:text-slate-400 focus:border-infinity-primary focus:outline-none focus:ring-1 focus:ring-infinity-primary"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-neutral-700">
              پاسخ <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.Answer}
              onChange={(e) =>
                setFormData({ ...formData, Answer: e.target.value })
              }
              placeholder="متن پاسخ را وارد کنید"
              rows={6}
              className="w-full rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-sm text-neutral-600 placeholder:text-slate-400 focus:border-infinity-primary focus:outline-none focus:ring-1 focus:ring-infinity-primary"
            />
          </div>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="mb-2 block text-sm font-medium text-neutral-700">
                ترتیب نمایش
              </label>
              <input
                type="number"
                value={formData.Order || 0}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    Order: parseInt(e.target.value) || 0,
                  })
                }
                placeholder="0"
                className="w-full rounded-xl border border-slate-100 bg-white px-4 py-2.5 text-sm text-neutral-600 placeholder:text-slate-400 focus:border-infinity-primary focus:outline-none focus:ring-1 focus:ring-infinity-primary"
              />
            </div>
            <div className="flex items-center gap-2 pt-8">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.IsActive}
                onChange={(e) =>
                  setFormData({ ...formData, IsActive: e.target.checked })
                }
                className="h-4 w-4 rounded border-slate-300 text-infinity-primary focus:ring-infinity-primary"
              />
              <label
                htmlFor="isActive"
                className="text-sm font-medium text-neutral-700"
              >
                فعال
              </label>
            </div>
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

      {/* Filters and Search */}
      <div className="mb-4 space-y-4 rounded-2xl bg-white p-4">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="جستجو در سوالات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-100 bg-white py-2.5 pr-10 pl-4 text-sm text-neutral-600 placeholder:text-slate-400 focus:border-infinity-primary focus:outline-none focus:ring-1 focus:ring-infinity-primary"
            />
          </div>
          <div className="relative w-full md:w-48">
            <Filter className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select
              value={selectedCategoryId || ""}
              onChange={(e) =>
                setSelectedCategoryId(
                  e.target.value ? parseInt(e.target.value) : null
                )
              }
              className="w-full rounded-xl border border-slate-100 bg-white py-2.5 pr-10 pl-4 text-sm text-neutral-600 focus:border-infinity-primary focus:outline-none focus:ring-1 focus:ring-infinity-primary"
            >
              <option value="">همه دسته‌بندی‌ها</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.Title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white">
        <SuperAdminTable
          data={filteredQuestions}
          columns={columns}
          loading={loading}
        />
      </div>
    </ContentWrapper>
  );
}
