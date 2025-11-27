"use client";

import React, { useState } from "react";
import { Tag, Plus, X } from "lucide-react";
import type { BlogTag } from "@/services/blog/blog.service";

interface TagsPanelProps {
  selectedTags: number[];
  onTagsChange: (tagIds: number[]) => void;
  tags: BlogTag[];
  onAddTag?: (name: string) => Promise<void>;
}

export default function TagsPanel({
  selectedTags,
  onTagsChange,
  tags,
  onAddTag,
}: TagsPanelProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const selectedTagObjects = tags.filter((tag) => selectedTags.includes(tag.id));

  const handleRemoveTag = (tagId: number) => {
    onTagsChange(selectedTags.filter((id) => id !== tagId));
  };

  const handleAddExistingTag = (tagId: number) => {
    if (!selectedTags.includes(tagId)) {
      onTagsChange([...selectedTags, tagId]);
    }
  };

  const handleAddNewTag = async () => {
    if (!newTagName.trim() || !onAddTag) return;

    setIsAdding(true);
    try {
      await onAddTag(newTagName.trim());
      setNewTagName("");
      setShowAddForm(false);
    } catch (error) {
      console.error("Error adding tag:", error);
    } finally {
      setIsAdding(false);
    }
  };

  const availableTags = tags.filter((tag) => !selectedTags.includes(tag.id));

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-white p-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-100">
            <Tag className="h-4 w-4 text-slate-500" />
          </div>
          <span className="text-sm font-medium text-neutral-800">برچسب</span>
        </div>
      </div>

      {/* Selected Tags */}
      {selectedTagObjects.length > 0 && (
        <div className="rounded-xl border border-slate-100 p-3">
          <div className="flex flex-wrap gap-2">
            {selectedTagObjects.map((tag) => (
              <span
                key={tag.id}
                className="flex items-center gap-1 rounded bg-slate-100 px-3 py-1 text-xs text-slate-500"
              >
                <span>{tag.Name}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag.id)}
                  className="flex h-4 w-4 items-center justify-center rounded-full hover:bg-slate-200"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Available Tags Dropdown */}
      {availableTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {availableTags.slice(0, 10).map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => handleAddExistingTag(tag.id)}
              className="rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 transition-colors hover:border-pink-300 hover:bg-pink-50"
            >
              + {tag.Name}
            </button>
          ))}
        </div>
      )}

      {/* Add New Tag Form */}
      {showAddForm && onAddTag && (
        <div className="flex gap-2">
          <input
            type="text"
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            placeholder="نام برچسب جدید"
            className="flex-1 rounded-xl border border-slate-100 bg-white px-3 py-2 text-sm text-neutral-600 placeholder:text-slate-400 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddNewTag();
              }
            }}
          />
          <button
            type="button"
            onClick={handleAddNewTag}
            disabled={isAdding || !newTagName.trim()}
            className="flex items-center justify-center rounded-xl bg-pink-500 px-3 text-white transition-colors hover:bg-pink-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isAdding ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </button>
        </div>
      )}

      {/* Add Tag Link */}
      {onAddTag && !showAddForm && (
        <button
          type="button"
          onClick={() => setShowAddForm(true)}
          className="flex items-center justify-end gap-1 text-xs text-pink-500 hover:text-pink-600"
        >
          <Plus className="h-4 w-4" />
          <span>افزودن برچسب جدید</span>
        </button>
      )}
    </div>
  );
}


