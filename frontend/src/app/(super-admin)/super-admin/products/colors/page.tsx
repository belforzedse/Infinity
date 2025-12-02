"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import ContentWrapper from "@/components/SuperAdmin/Layout/ContentWrapper";
import { apiClient } from "@/services";
import { ENDPOINTS } from "@/constants/api";
import toast from "react-hot-toast";
import { HexColorPicker, HexColorInput } from "react-colorful";
import { Dialog, Transition } from "@headlessui/react";
import { extractErrorMessage, translateErrorMessage } from "@/lib/errorTranslations";
import { COLOR_CATEGORIES, QUICK_COLORS } from "@/lib/colorPalettes";

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
};

const INITIAL_MODAL_STATE: ModalState = {
  open: false,
  id: null,
  title: "",
  colorCode: "#000000",
};

export default function ProductColorsPage() {
  const [colors, setColors] = useState<ApiColor[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [modalState, setModalState] = useState<ModalState>({ ...INITIAL_MODAL_STATE });
  const [saving, setSaving] = useState(false);

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
      setModalState({
        open: true,
        id: color.id,
        title: color.attributes?.Title || "",
        colorCode: color.attributes?.ColorCode || "#000000",
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

    const normalizedCode = (modalState.colorCode || "#000000").startsWith("#")
      ? modalState.colorCode
      : `#${modalState.colorCode}`;

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
                    <button
                      type="button"
                      onClick={() => openModal(color)}
                      className="text-sm rounded-lg border border-slate-200 px-4 py-1.5 text-neutral-700 transition-colors hover:bg-slate-50"
                    >
                      ویرایش
                    </button>
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
                          onChange={(e) =>
                            setModalState((prev) => ({ ...prev, title: e.target.value }))
                          }
                          className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500/30"
                          placeholder="مثلاً سرمه‌ای ملایم"
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium text-neutral-700">انتخاب از پالت</label>
                        <div className="mt-3 rounded-xl border border-slate-200 p-4 bg-slate-50">
                          <HexColorPicker color={modalState.colorCode} onChange={handleColorChange} />
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

                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-medium text-neutral-600 mb-3">پیش‌نمایش رنگ</p>
                        <div className="flex items-center gap-3">
                          <span
                            className="h-16 w-16 rounded-lg border-2 border-slate-300"
                            style={{ backgroundColor: modalState.colorCode }}
                            aria-hidden="true"
                          />
                          <div className="text-sm">
                            <p className="font-semibold text-neutral-800">{modalState.colorCode.toUpperCase()}</p>
                            <p className="text-xs text-neutral-500 mt-1">رنگ انتخاب‌شده</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Color Categories */}
                    <div className="space-y-4">
                      <p className="text-sm font-medium text-neutral-700">انتخاب از دسته‌بندی</p>
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
    </ContentWrapper>
  );
}
