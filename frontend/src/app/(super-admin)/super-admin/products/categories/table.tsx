"use client";

import ChevronRightIcon from "@/components/SuperAdmin/Layout/Icons/ChevronRightIcon";
import EditIcon from "@/components/SuperAdmin/Layout/Icons/EditIcon";
import Modal from "@/components/Kits/Modal";
import resolveAssetUrl from "@/utils/resolveAssetUrl";
import Link from "next/link";
import { useState } from "react";
import type { ColumnDef } from "@tanstack/react-table";

const CATEGORY_IMAGE_PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Crect width='120' height='120' rx='24' fill='%23f1f5f9'/%3E%3Cpath d='M35 45h50v35H35z' fill='%23e2e8f0'/%3E%3Cpath d='M45 70l10-12 8 9 7-6 12 15H45z' fill='%23cbd5f5'/%3E%3Ccircle cx='50' cy='55' r='5' fill='%2394a3b8'/%3E%3C/svg%3E";

type CategoryImageFormats = {
  thumbnail?: { url?: string };
  small?: { url?: string };
  medium?: { url?: string };
  large?: { url?: string };
};

type CategoryImageAttributes = {
  url?: string;
  alternativeText?: string | null;
  formats?: CategoryImageFormats | null;
};

type CategoryImageField = {
  data?: {
    attributes?: CategoryImageAttributes;
  } | null;
};

type CategoryChild = {
  id: number;
  attributes: {
    Title?: string;
    Slug?: string;
    Parent?: string | null;
    Color?: string | null;
    Image?: CategoryImageField;
    parent?: {
      data: {
        id: number;
        attributes: {
          Title?: string;
        };
      } | null;
    };
    children?: {
      data?: CategoryChild[];
    };
    createdAt?: string;
  };
};

export type Category = {
  id: string;
  attributes: {
    Title?: string;
    Slug?: string;
    Parent?: string | null;
    Color?: string | null;
    Image?: CategoryImageField;
    parent?: {
      data: {
        id: number;
        attributes: {
          Title?: string;
        };
      } | null;
    };
    children?: {
      data?: CategoryChild[];
    };
    createdAt?: string;
  };
};

const getChildCategories = (category?: Category) => category?.attributes?.children?.data ?? [];

const resolveCategoryImageSrc = (image?: CategoryImageField | null) => {
  const imageAttributes = image?.data?.attributes;
  const imageUrl =
    imageAttributes?.formats?.thumbnail?.url ||
    imageAttributes?.formats?.small?.url ||
    imageAttributes?.url;

  return imageUrl ? resolveAssetUrl(imageUrl) : CATEGORY_IMAGE_PLACEHOLDER;
};

const normalizeHexColor = (value?: string | null): string | null => {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(trimmed)) return trimmed;
  if (/^([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(trimmed)) return `#${trimmed}`;
  return null;
};

const hexToRgba = (hex: string, alpha: number) => {
  const safeHex = hex.replace("#", "");
  const normalized =
    safeHex.length === 3
      ? safeHex
          .split("")
          .map((c) => `${c}${c}`)
          .join("")
      : safeHex;
  const num = Number.parseInt(normalized, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const ChildCategoryCard = ({ child }: { child: CategoryChild }) => {
  const colorValue = normalizeHexColor(child.attributes?.Color);
  const imageSrc = resolveCategoryImageSrc(child.attributes?.Image);
  const imageAlt =
    child.attributes?.Image?.data?.attributes?.alternativeText ||
    child.attributes?.Title ||
    "Category image";

  return (
    <article className="relative w-full">
      <div className="flex h-[116px] flex-row gap-2 rounded-2xl border border-slate-200 bg-white p-2 transition-all duration-300 hover:border-pink-100 hover:shadow-md">
        <div
          className="relative h-[100px] w-24 overflow-hidden rounded-xl"
          style={{ backgroundColor: colorValue ? hexToRgba(colorValue, 0.16) : "#f8fafc" }}
        >
          <img
            src={imageSrc}
            alt={imageAlt}
            className="h-full w-full object-contain p-2"
            loading="lazy"
          />
          <div className="absolute bottom-1 right-1 flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] text-slate-500 shadow-sm">
            <span
              className={`h-2.5 w-2.5 rounded-full border ${colorValue ? "border-slate-200" : "border-dashed border-slate-300"}`}
              style={{ backgroundColor: colorValue || "transparent" }}
              aria-hidden="true"
            />
            <span className="font-mono">{colorValue || "بدون رنگ"}</span>
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-between py-0.5 text-right">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate font-mono text-[10px] text-slate-400">
              {child.attributes?.Slug || "بدون نامک"}
            </p>
            <Link
              href={`/super-admin/products/categories/edit/${child.id}`}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
              aria-label="ویرایش دسته‌بندی فرزند"
            >
              <EditIcon />
            </Link>
          </div>

          <div className="min-w-0">
            <h4 className="truncate text-xs font-semibold text-slate-900">
              {child.attributes?.Title || "Unnamed"}
            </h4>
            <span className="text-[10px] text-slate-400">فرزند دسته‌بندی</span>
          </div>

          <div className="flex items-center justify-between rounded-lg bg-stone-100 px-2 py-1">
            <span className="text-[10px] text-slate-500">ویرایش سریع</span>
            <Link
              href={`/super-admin/products/categories/edit/${child.id}`}
              className="text-[10px] font-semibold text-pink-600"
            >
              ویرایش
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
};

const ParentCategoryCard = ({ category }: { category: Category }) => {
  const [isChildrenModalOpen, setIsChildrenModalOpen] = useState(false);
  const childCategories = getChildCategories(category);
  const hasChildren = childCategories.length > 0;
  const colorValue = normalizeHexColor(category.attributes?.Color);
  const imageSrc = resolveCategoryImageSrc(category.attributes?.Image);
  const imageAlt =
    category.attributes?.Image?.data?.attributes?.alternativeText ||
    category.attributes?.Title ||
    "Category image";

  return (
    <>
      <div className="interactive-card pressable group relative flex h-full w-full flex-col rounded-3xl border border-pink-50 bg-white p-1 transition-all duration-300 hover:border-pink-100 hover:shadow-lg md:mx-auto md:w-[258px]">
        <div className="flex h-full flex-col rounded-[20px] bg-white p-3">
          <div
            className="relative aspect-[4/5] overflow-hidden rounded-[20px] md:aspect-auto md:h-[270px]"
            style={{ backgroundColor: colorValue ? hexToRgba(colorValue, 0.16) : "#f8fafc" }}
          >
            <div className="h-full w-full">
              <img
                src={imageSrc}
                alt={imageAlt}
                className="h-full w-full object-contain p-4"
                loading="lazy"
              />
            </div>

            {hasChildren && (
              <span className="absolute left-2 top-2 rounded-full bg-pink-50 px-2 py-1 text-[11px] font-semibold text-pink-700 shadow-sm">
                {childCategories.length} فرزند
              </span>
            )}

            <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[11px] text-slate-500 shadow-sm">
              <span
                className={`h-3.5 w-3.5 rounded-full border ${colorValue ? "border-slate-200" : "border-dashed border-slate-300"}`}
                style={{ backgroundColor: colorValue || "transparent" }}
                aria-hidden="true"
              />
              <span className="font-mono">{colorValue || "بدون رنگ"}</span>
            </div>
          </div>

          <div className="mt-4 text-right">
            <p className="truncate font-mono text-xs text-slate-500">
              {category.attributes?.Slug || "بدون نامک"}
            </p>
            <h3 className="mt-1 truncate text-base font-semibold text-slate-900">
              {category.attributes?.Title || "Unnamed"}
            </h3>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-full bg-slate-50 px-3 py-2">
            <button
              type="button"
              onClick={() => setIsChildrenModalOpen(true)}
              disabled={!hasChildren}
              className={`text-xs font-semibold ${hasChildren ? "text-pink-700" : "text-slate-400"}`}
            >
              {hasChildren ? "مشاهده فرزندان" : "بدون فرزند"}
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsChildrenModalOpen(true)}
                disabled={!hasChildren}
                className={`flex h-8 w-8 items-center justify-center rounded-xl border transition ${hasChildren ? "border-slate-200 bg-white text-slate-600 hover:bg-slate-50" : "cursor-not-allowed border-slate-100 bg-white text-slate-300"}`}
                aria-label={hasChildren ? "نمایش فرزندان" : "بدون فرزند"}
              >
                <ChevronRightIcon />
              </button>
              <Link
                href={`/super-admin/products/categories/edit/${category.id}`}
                className="flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50"
                aria-label="ویرایش دسته‌بندی"
              >
                <EditIcon />
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isChildrenModalOpen}
        onClose={() => setIsChildrenModalOpen(false)}
        title={`فرزندان ${category.attributes?.Title || "دسته‌بندی"}`}
        className="max-w-4xl"
      >
        {hasChildren ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {childCategories.map((child) => (
              <ChildCategoryCard key={child.id} child={child} />
            ))}
          </div>
        ) : (
          <div className="text-sm text-slate-500">فرزندی برای نمایش وجود ندارد.</div>
        )}
      </Modal>
    </>
  );
};

export const getCategoryColumns = (): ColumnDef<Category>[] => [
  {
    accessorKey: "attributes.Title",
    header: "دسته‌بندی",
    meta: {
      cellClassName: "p-0",
    },
    cell: ({ row }) => {
      return <ParentCategoryCard category={row.original} />;
    },
  },
];

type Props = {
  data: Category[] | undefined;
};

export const MobileTable = ({ data }: Props) => {
  return (
    <div className="space-y-4">
      {data?.map((row) => {
        return <ParentCategoryCard key={row.id} category={row} />;
      })}
    </div>
  );
};
