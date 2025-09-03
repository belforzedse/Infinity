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
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: category.id.toString() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
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

export default function CategoriesListField({
  value,
  onChange,
  readOnly,
  fetchCategories,
}: Props) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [availableCategories, setAvailableCategories] = useState<Category[]>(
    []
  );
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Set up sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
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
  const handleAddCategory = () => {
    if (!selectedCategory) return;

    try {
      const categoryToAdd = JSON.parse(selectedCategory);

      // Check if already exists
      const alreadyExists = categories.some(
        (cat) => cat.id === categoryToAdd.id
      );
      if (alreadyExists) {
        alert("این دسته بندی قبلاً در لیست وجود دارد");
        return;
      }

      // Add to categories
      const newCategories = [...categories, categoryToAdd];
      setCategories(newCategories);

      // Update parent component
      onChange(JSON.stringify(newCategories, null, 2));

      // Reset selection
      setSelectedCategory("");
    } catch (e) {
      console.error("Error adding category:", e);
    }
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
        const oldIndex = items.findIndex(
          (item) => item.id.toString() === active.id
        );
        const newIndex = items.findIndex(
          (item) => item.id.toString() === over.id
        );

        const newItems = arrayMove(items, oldIndex, newIndex);
        onChange(JSON.stringify(newItems, null, 2));
        return newItems;
      });
    }
  };

  // Filter available categories to exclude already selected ones
  const filteredAvailableCategories = availableCategories.filter(
    (cat) => !categories.some((selected) => selected.id === cat.id)
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Category Selection */}
      <div className="flex gap-2">
        <select
          className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-neutral-600"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          disabled={readOnly || loading}
        >
          <option value="">انتخاب دسته بندی</option>
          {filteredAvailableCategories.map((category) => (
            <option key={category.id} value={JSON.stringify(category)}>
              {category.title} ({category.slug})
            </option>
          ))}
        </select>

        <button
          onClick={handleAddCategory}
          disabled={!selectedCategory || readOnly}
          className="px-4 py-2 bg-green-500 text-white rounded-lg disabled:opacity-50"
          type="button"
        >
          افزودن
        </button>
      </div>

      {/* Selected Categories */}
      <div className="border border-slate-100 rounded-lg">
        <div className="w-full bg-slate-50 py-2 px-5 flex items-center justify-between">
          <span className="text-sm text-neutral-600">
            دسته بندی‌های انتخاب شده
          </span>
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
            <div className="text-center py-4 text-slate-500">
              هیچ دسته بندی انتخاب نشده است
            </div>
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
