import React, { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import CopyIcon from "../../Icons/CopyIcon";

type Category = {
  id: number;
  title: string;
  slug: string;
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  fetchCategories?: () => Promise<Category[]>;
};

// Sortable item component
function SortableItem({
  category,
  onRemove,
  readOnly,
}: {
  category: Category;
  onRemove: (id: number) => void;
  readOnly?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: category.id.toString(),
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between rounded-lg bg-slate-50 p-3"
      {...attributes}
      {...listeners}
    >
      <div className="flex flex-col">
        <span className="font-medium">{category.title}</span>
        <span className="text-xs text-slate-500">{category.slug}</span>
      </div>

      {!readOnly && (
        <button onClick={() => onRemove(category.id)} className="text-red-500">
          حذف
        </button>
      )}
    </div>
  );
}

export default function CategoriesListField({ value, onChange, readOnly, fetchCategories }: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [availableCategories, setAvailableCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  // Set up sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  // Parse the initial value
  useEffect(() => {
    try {
      if (value) {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          setCategories(parsed);
        }
      }
    } catch (e) {
      console.error("Error parsing categories:", e);
      setCategories([]);
    }
  }, [value]);

  // Fetch available categories
  useEffect(() => {
    if (fetchCategories) {
      setLoading(true);
      fetchCategories()
        .then((result) => {
          setAvailableCategories(result);
        })
        .catch((error) => {
          console.error("Error fetching categories:", error);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [fetchCategories]);

  // Handle adding a category
  const handleAddCategory = (category: Category) => {
    if (!category) return;

    // Check if already exists
    const alreadyExists = categories.some((cat) => cat.id === category.id);
    if (alreadyExists) {
      alert("این دسته بندی قبلاً در لیست وجود دارد");
      return;
    }

    // Add to categories
    const newCategories = [...categories, category];
    setCategories(newCategories);

    // Update parent component
    onChange(JSON.stringify(newCategories, null, 2));

    // Reset search
    setSearchQuery("");
    setShowDropdown(false);
  };

  // Handle removing a category
  const handleRemoveCategory = (categoryId: number) => {
    const newCategories = categories.filter((cat) => cat.id !== categoryId);
    setCategories(newCategories);
    onChange(JSON.stringify(newCategories, null, 2));
  };

  // Handle drag end for reordering
  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setCategories((items) => {
        const oldIndex = items.findIndex((item) => item.id.toString() === active.id);
        const newIndex = items.findIndex((item) => item.id.toString() === over.id);

        const newItems = arrayMove(items, oldIndex, newIndex);
        onChange(JSON.stringify(newItems, null, 2));
        return newItems;
      });
    }
  };

  // Filter available categories based on search query and exclude already selected ones
  useEffect(() => {
    const query = searchQuery.trim().toLowerCase();
    const filtered = availableCategories.filter((cat) => {
      const isNotSelected = !categories.some((selected) => selected.id === cat.id);
      if (!isNotSelected) return false;

      if (!query) return true;

      const title = (cat.title || "").toLowerCase();
      const slug = (cat.slug || "").toLowerCase();
      return title.includes(query) || slug.includes(query);
    });

    setFilteredCategories(filtered);
  }, [searchQuery, availableCategories, categories]);

  // Filter available categories to exclude already selected ones (for backward compatibility)
  const filteredAvailableCategories = availableCategories.filter(
    (cat) => !categories.some((selected) => selected.id === cat.id),
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Category Selection */}
      <div className="relative">
        <input
          type="text"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-neutral-600 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500/30"
          placeholder="جستجوی دسته بندی..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          disabled={readOnly || loading}
        />

        {showDropdown && searchQuery.trim() && filteredCategories.length > 0 && (
          <div className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg">
            {filteredCategories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => handleAddCategory(category)}
                className="flex w-full items-center justify-between px-3 py-2 text-sm text-right hover:bg-slate-100"
              >
                <div className="flex flex-col">
                  <span className="font-medium text-neutral-800">{category.title}</span>
                  <span className="text-xs text-neutral-500">{category.slug}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {showDropdown && searchQuery.trim() && filteredCategories.length === 0 && (
          <div className="absolute z-10 mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-neutral-500 shadow-lg">
            موردی یافت نشد
          </div>
        )}
      </div>

      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowDropdown(false)}
        />
      )}

      {/* Selected Categories */}
      <div className="rounded-lg border border-slate-100">
        <div className="flex w-full items-center justify-between bg-slate-50 px-5 py-2">
          <span className="text-sm text-neutral-600">دسته بندی‌های انتخاب شده</span>
          <button
            onClick={() => {
              navigator.clipboard.writeText(value);
            }}
            type="button"
          >
            <CopyIcon />
          </button>
        </div>

        <div className="p-3">
          {categories.length === 0 ? (
            <div className="py-4 text-center text-slate-500">هیچ دسته بندی انتخاب نشده است</div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={categories.map((c) => c.id.toString())}
                strategy={verticalListSortingStrategy}
              >
                <div className="flex flex-col gap-2">
                  {categories.map((category) => (
                    <SortableItem
                      key={category.id}
                      category={category}
                      onRemove={handleRemoveCategory}
                      readOnly={readOnly}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>

      {/* Helper Text */}
      <div className="text-sm text-slate-500">
        <p>• برای تغییر ترتیب، آیتم‌ها را با کشیدن جابجا کنید.</p>
        <p>• با کلیک روی &quot;حذف&quot; می‌توانید یک دسته بندی را حذف کنید.</p>
      </div>
    </div>
  );
}
