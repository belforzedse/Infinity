"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ContentWrapper from "@/components/SuperAdmin/Layout/ContentWrapper";
import { apiClient } from "@/services";
import { ENDPOINTS } from "@/constants/api";
import toast from "react-hot-toast";
import { HexColorPicker, HexColorInput } from "react-colorful";
import { Dialog, Transition } from "@headlessui/react";
import { extractErrorMessage, translateErrorMessage } from "@/lib/errorTranslations";
import { COLOR_CATEGORIES, QUICK_COLORS } from "@/lib/colorPalettes";
import { useCurrentUser } from "@/hooks/useCurrentUser";

type ApiColor = {
  id: number;
  attributes: {
    Title: string;
    ColorCode: string;
    external_id?: string | null;
  };
};

type ModalState = {
  open: boolean;
  id: number | null;
  title: string;
  colorCode: string;
  noColor: boolean;
};

const INITIAL_MODAL_STATE: ModalState = {
  open: false,
  id: null,
  title: "",
  colorCode: "#000000",
  noColor: false,
};

export default function ProductColorsPage() {
  const router = useRouter();
  const { roleName, isStoreManager, isAdmin } = useCurrentUser();
  const canDeleteColors = isStoreManager || isAdmin;
  const [colors, setColors] = useState<ApiColor[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [modalState, setModalState] = useState<ModalState>({ ...INITIAL_MODAL_STATE });
  const [saving, setSaving] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Redirect editors away from product pages
  useEffect(() => {
    const normalizedRole = (roleName ?? "").toLowerCase().trim();
    if (normalizedRole === "editor") {
      router.replace("/super-admin/blog");
    }
  }, [roleName, router]);

  const fetchColors = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get<{ data: ApiColor[] }>(
        `${ENDPOINTS.PRODUCT.COLORS}?pagination[pageSize]=400&sort=Title:asc`,
      );
      const data = ((response as any)?.data ?? []) as ApiColor[];
      setColors(data);
    } catch (error) {
      console.error(error);
      toast.error("خطا در بارگذاری رنگ‌ها");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchColors();
  }, [fetchColors]);

  const filteredColors = useMemo(() => {
    if (!searchTerm.trim()) {
      return colors;
    }

    const term = searchTerm.toLowerCase();
    return colors.filter((color) => {
      const title = color.attributes?.Title?.toLowerCase() || "";
      const code = color.attributes?.ColorCode?.toLowerCase() || "";
      return title.includes(term) || code.includes(term);
    });
  }, [colors, searchTerm]);

  const openModal = (color?: ApiColor) => {
    if (color) {
      const colorCode = color.attributes?.ColorCode || "#000000";
      setModalState({
        open: true,
        id: color.id,
        title: color.attributes?.Title || "",
        colorCode: colorCode,
        noColor: colorCode.toLowerCase() === "#ffffff",
      });
      return;
    }

    setModalState({ ...INITIAL_MODAL_STATE, open: true });
  };

  const closeModal = () => {
    setModalState({ ...INITIAL_MODAL_STATE });
  };

  const handleColorChange = (value: string) => {
    if (!value) return;
    const normalized = value.startsWith("#") ? value : `#${value}`;
    setModalState((prev) => ({ ...prev, colorCode: normalized.toLowerCase() }));
  };

  const handleSaveColor = async () => {
    const title = modalState.title.trim();
    if (!title) {
      toast.error("نام رنگ را وارد کنید");
      return;
    }

    // If "No Color" is checked, use pure white #FFFFFF
    const colorToSave = modalState.noColor ? "#ffffff" : modalState.colorCode;

    const normalizedCode = (colorToSave || "#000000").startsWith("#")
      ? colorToSave
      : `#${colorToSave}`;

    if (!/^#[0-9a-fA-F]{6}$/.test(normalizedCode)) {
      toast.error("کد رنگ معتبر نیست");
      return;
    }

    setSaving(true);
    try {
      if (modalState.id) {
        await apiClient.put(`${ENDPOINTS.PRODUCT.COLORS}/${modalState.id}`, {
          data: { Title: title, ColorCode: normalizedCode.toLowerCase() },
        });
        toast.success("رنگ به‌روزرسانی شد");
      } else {
        await apiClient.post(ENDPOINTS.PRODUCT.COLORS, {
          data: { Title: title, ColorCode: normalizedCode.toLowerCase() },
        });
        toast.success("رنگ جدید ثبت شد");
      }

      closeModal();
      fetchColors();
    } catch (error: any) {
      const rawErrorMessage = extractErrorMessage(error);
      const message = translateErrorMessage(rawErrorMessage, "خطا در ذخیره رنگ");
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteColor = (color: ApiColor) => {
    if (!canDeleteColors) {
      toast.error("شما مجوز حذف رنگ را ندارید");
      return;
    }
    setDeleteId(color.id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;

    if (!canDeleteColors) {
      toast.error("شما مجوز حذف رنگ را ندارید");
      setDeleteConfirmOpen(false);
      setDeleteId(null);
      return;
    }

    setDeleting(true);
    try {
      await apiClient.delete(`${ENDPOINTS.PRODUCT.COLORS}/${deleteId}`);

      // Update local state
      setColors((prev) => prev.filter((c) => c.id !== deleteId));
      setDeleteConfirmOpen(false);
      setDeleteId(null);
      toast.success("رنگ با موفقیت حذف شد");
    } catch (error: any) {
      console.error("Error deleting color:", error);
      const rawErrorMessage = extractErrorMessage(error);
      const message = translateErrorMessage(rawErrorMessage, "خطا در حذف رنگ");
      toast.error(message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <ContentWrapper
      title="مدیریت رنگ‌ها"
      titleSuffixComponent={
        <button
          type="button"
          onClick={() => openModal()}
          className="text-sm rounded-xl bg-pink-500 px-4 py-2 text-white transition-colors hover:bg-pink-600"
        >
          افزودن رنگ جدید
        </button>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجو بر اساس نام یا کد رنگ"
            className="text-sm w-full rounded-lg border border-slate-200 px-3 py-2 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500/30"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={fetchColors}
              className="text-sm rounded-lg border border-slate-200 px-4 py-2 text-neutral-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
            >
              بروزرسانی
            </button>
            <span className="text-xs text-neutral-500">
              {filteredColors.length} رنگ ثبت شده
            </span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 p-4">
          {loading ? (
            <div className="py-12 text-center text-sm text-neutral-500">در حال بارگذاری...</div>
          ) : filteredColors.length === 0 ? (
            <div className="py-12 text-center text-sm text-neutral-500">
              رنگی مطابق با جستجو یافت نشد
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredColors.map((color) => (
                <div
                  key={color.id}
                  className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="h-14 w-14 rounded-xl border border-slate-200"
                      style={{ backgroundColor: color.attributes?.ColorCode || "#f5f5f5" }}
                    />
                    <div>
                      <p className="text-base font-semibold text-neutral-800">{color.attributes?.Title}</p>
                      <p className="text-xs text-neutral-500">
                        {(color.attributes?.ColorCode || "").toUpperCase() || "—"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-neutral-500">
                    <span>
                      کد خارجی: {color.attributes?.external_id?.trim() || "ثبت نشده"}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openModal(color)}
                        className="text-sm rounded-lg border border-slate-200 px-4 py-1.5 text-neutral-700 transition-colors hover:bg-slate-50"
                      >
                        ویرایش
                      </button>
                      {canDeleteColors && (
                        <button
                          type="button"
                          onClick={() => handleDeleteColor(color)}
                          className="text-sm rounded-lg border border-red-200 bg-red-50 px-4 py-1.5 text-red-700 transition-colors hover:bg-red-100"
                        >
                          حذف
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Transition appear show={modalState.open} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => (!saving ? closeModal() : null)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/30" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-5xl rounded-2xl bg-white p-8 shadow-xl max-h-[90vh] overflow-y-auto">
                  <Dialog.Title className="text-xl font-semibold text-neutral-900">
                    {modalState.id ? "ویرایش رنگ" : "افزودن رنگ جدید"}
                  </Dialog.Title>

                  <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-2">
                    {/* Left Column: Color Picker and Input */}
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-neutral-700">نام رنگ</label>
                        <input
                          type="text"
                          value={modalState.title}
                          onChange={(e) => {
                            const newTitle = e.target.value;
                            // Auto-check "No Color" if title contains " کد" or starts with "کد"
                            const shouldAutoCheck = newTitle.includes(" کد") || newTitle.startsWith("کد");

                            if (process.env.NODE_ENV === "development") {
                              console.log("Title changed:", newTitle, "| Should auto-check:", shouldAutoCheck);
                            }

                            setModalState((prev) => ({
                              ...prev,
                              title: newTitle,
                              noColor: shouldAutoCheck ? true : prev.noColor,
                              colorCode: shouldAutoCheck ? "#ffffff" : prev.colorCode,
                            }));
                          }}
                          className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500/30"
                          placeholder="مثلاً سرمه‌ای ملایم"
                        />
                      </div>

                      {/* No Color Checkbox */}
                      <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <input
                          type="checkbox"
                          id="noColorCheckbox"
                          checked={modalState.noColor}
                          onChange={(e) =>
                            setModalState((prev) => ({
                              ...prev,
                              noColor: e.target.checked,
                              colorCode: e.target.checked ? "#ffffff" : prev.colorCode
                            }))
                          }
                          className="h-4 w-4 rounded border-slate-300 text-pink-600 focus:ring-pink-500"
                        />
                        <label htmlFor="noColorCheckbox" className="text-sm text-neutral-700 cursor-pointer">
                          بدون رنگ
                        </label>
                      </div>

                      {!modalState.noColor ? (
                        <>
                          <div>
                            <label className="text-sm font-medium text-neutral-700">انتخاب از پالت</label>
                            <div className="mt-3 rounded-xl border border-slate-200 p-4 bg-slate-50">
                              <HexColorPicker
                                color={modalState.colorCode}
                                onChange={handleColorChange}
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-sm font-medium text-neutral-700">کد HEX</label>
                            <HexColorInput
                              prefixed
                              color={modalState.colorCode}
                              onChange={handleColorChange}
                              aria-label="کد رنگ"
                              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm uppercase focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500/30"
                            />
                          </div>
                        </>
                      ) : (
                        <div className="mt-3 rounded-xl border border-slate-300 bg-slate-100 p-8">
                          <div className="flex flex-col items-center justify-center text-center">
                            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-slate-200">
                              <svg className="h-8 w-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                              </svg>
                            </div>
                            <p className="text-sm font-medium text-slate-600">
                              برای تعیین رنگ گزینه بدون رنگ را خاموش کنید
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-medium text-neutral-600 mb-3">پیش‌نمایش رنگ</p>
                        <div className="flex items-center gap-3">
                          <span
                            className="h-16 w-16 rounded-lg border-2 border-slate-300"
                            style={{ backgroundColor: modalState.noColor ? "#ffffff" : modalState.colorCode }}
                            aria-hidden="true"
                          />
                          <div className="text-sm">
                            <p className="font-semibold text-neutral-800">
                              {modalState.noColor ? "#FFFFFF" : modalState.colorCode.toUpperCase()}
                            </p>
                            <p className="text-xs text-neutral-500 mt-1">
                              {modalState.noColor ? "بدون رنگ" : "رنگ انتخاب‌شده"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Color Categories */}
                    <div className="space-y-4">
                      <p className="text-sm font-medium text-neutral-700">انتخاب از دسته‌بندی</p>
                      {!modalState.noColor ? (
                        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                          {Object.entries(COLOR_CATEGORIES).map(([key, category]) => (
                            <div key={key}>
                              <p className="text-xs font-semibold text-neutral-600 mb-2">{category.label}</p>
                              <div className="grid grid-cols-10 gap-1.5">
                                {category.colors.map((color) => (
                                  <button
                                    type="button"
                                    key={color}
                                    onClick={() => handleColorChange(color)}
                                    className={`h-8 w-8 rounded-lg border-2 transition-all ${
                                      modalState.colorCode.toLowerCase() === color.toLowerCase()
                                        ? "border-pink-500 ring-2 ring-pink-300 ring-offset-1"
                                        : "border-slate-200 hover:border-slate-300"
                                    }`}
                                    style={{ backgroundColor: color }}
                                    aria-label={`انتخاب رنگ ${color}`}
                                    title={color}
                                  />
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="rounded-xl border border-slate-300 bg-slate-100 p-8 h-[500px] flex items-center justify-center">
                          <div className="flex flex-col items-center justify-center text-center">
                            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-slate-200">
                              <svg className="h-8 w-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                              </svg>
                            </div>
                            <p className="text-sm font-medium text-slate-600">
                              برای تعیین رنگ گزینه بدون رنگ را خاموش کنید
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-8 flex justify-end gap-3 border-t border-slate-200 pt-6">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="rounded-lg border border-slate-200 px-6 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-slate-50"
                      disabled={saving}
                    >
                      انصراف
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveColor}
                      disabled={saving}
                      className={`rounded-lg px-6 py-2 text-sm font-medium text-white transition-colors ${
                        saving ? "bg-pink-300 cursor-not-allowed" : "bg-pink-600 hover:bg-pink-700"
                      }`}
                    >
                      {saving ? "در حال ذخیره..." : "ذخیره"}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Delete Confirmation Modal */}
      <Transition appear show={deleteConfirmOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => (!deleting ? setDeleteConfirmOpen(false) : null)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/30" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                  <Dialog.Title className="text-xl font-semibold text-neutral-900">
                    حذف رنگ
                  </Dialog.Title>

                  <div className="mt-4">
                    <p className="text-sm text-neutral-600">
                      آیا از حذف این رنگ اطمینان دارید؟ این عمل قابل بازگشت نیست.
                    </p>
                    {deleteId && (
                      <div className="mt-4 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <span
                          className="h-10 w-10 rounded-lg border border-slate-200"
                          style={{
                            backgroundColor:
                              colors.find((c) => c.id === deleteId)?.attributes?.ColorCode || "#f5f5f5",
                          }}
                        />
                        <div>
                          <p className="text-sm font-medium text-neutral-800">
                            {colors.find((c) => c.id === deleteId)?.attributes?.Title}
                          </p>
                          <p className="text-xs text-neutral-500">
                            {(colors.find((c) => c.id === deleteId)?.attributes?.ColorCode || "").toUpperCase()}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteConfirmOpen(false);
                        setDeleteId(null);
                      }}
                      disabled={deleting}
                      className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
                    >
                      انصراف
                    </button>
                    <button
                      type="button"
                      onClick={confirmDelete}
                      disabled={deleting}
                      className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors ${
                        deleting
                          ? "bg-red-300 cursor-not-allowed"
                          : "bg-red-600 hover:bg-red-700"
                      }`}
                    >
                      {deleting ? "در حال حذف..." : "حذف"}
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </ContentWrapper>
  );
}
