"use client";

import React from "react";
import { Editor } from "@tiptap/react";
import { Button } from "@/components/ui/Button";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Subscript,
  Superscript,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code2,
  Image,
  Minus,
  Table,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Heading6,
  Palette,
  Highlighter,
  Link2,
  Link2Off,
} from "lucide-react";

interface ToolbarProps {
  editor: Editor;
}

const ToolbarButton: React.FC<{
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title?: string;
}> = ({ onClick, isActive = false, disabled = false, children, title }) => (
  <Button
    type="button"
    onClick={onClick}
    disabled={disabled}
    title={title}
    variant={isActive ? "primary" : "outline"}
    size="sm"
    className={`h-8 w-8 p-0 transition-all ${
      isActive
        ? "bg-pink-600 text-white shadow-sm hover:bg-pink-700"
        : "hover:bg-neutral-100 hover:border-neutral-300"
    } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
  >
    {children}
  </Button>
);

const Divider: React.FC = () => (
  <div className="w-px h-6 bg-neutral-200 mx-1" />
);

const RichTextToolbar: React.FC<ToolbarProps> = ({ editor }) => {
  // Force re-render when editor state changes (cursor, selection, formatting)
  // This ensures toolbar buttons reflect the current editor state in real-time
  const [, forceUpdate] = React.useReducer((x) => x + 1, 0);

  // Subscribe to editor events to trigger re-renders
  // This makes the toolbar behave like Word - updating immediately when:
  // - Cursor moves
  // - Selection changes
  // - Formatting is applied/removed
  // - Content changes
  React.useEffect(() => {
    const handleSelectionUpdate = () => {
      // Use requestAnimationFrame to batch updates and avoid excessive re-renders
      requestAnimationFrame(() => {
        forceUpdate();
      });
    };

    const handleTransaction = () => {
      // Only update on transactions that affect selection or marks
      // This prevents unnecessary re-renders on every keystroke
      if (editor.state.selection) {
        requestAnimationFrame(() => {
          forceUpdate();
        });
      }
    };

    // Subscribe to events that should trigger toolbar updates
    // selectionUpdate is the most important - fires when cursor/selection changes
    editor.on("selectionUpdate", handleSelectionUpdate);
    editor.on("transaction", handleTransaction);

    // Cleanup
    return () => {
      editor.off("selectionUpdate", handleSelectionUpdate);
      editor.off("transaction", handleTransaction);
    };
  }, [editor]);

  const addImage = () => {
    const url = window.prompt("آدرس تصویر را وارد کنید:");
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href || "";
    const url = window.prompt("آدرس لینک را وارد کنید:", previousUrl);

    if (url === null) {
      return;
    }

    const href = url.trim();

    if (!href) {
      editor.chain().focus().unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
  };

  return (
    <div className="flex flex-wrap items-center gap-1 p-3 border-b border-neutral-200 bg-white rounded-t-lg">
      {/* Headings */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive("heading", { level: 1 })}
        title="عنوان 1"
      >
        <Heading1 size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive("heading", { level: 2 })}
        title="عنوان 2"
      >
        <Heading2 size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive("heading", { level: 3 })}
        title="عنوان 3"
      >
        <Heading3 size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
        isActive={editor.isActive("heading", { level: 4 })}
        title="عنوان 4"
      >
        <Heading4 size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 5 }).run()}
        isActive={editor.isActive("heading", { level: 5 })}
        title="عنوان 5"
      >
        <Heading5 size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 6 }).run()}
        isActive={editor.isActive("heading", { level: 6 })}
        title="عنوان 6"
      >
        <Heading6 size={16} />
      </ToolbarButton>

      <Divider />

      {/* Text Formatting */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive("bold")}
        title="ضخیم"
      >
        <Bold size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive("italic")}
        title="کج"
      >
        <Italic size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        isActive={editor.isActive("underline")}
        title="زیرخط"
      >
        <Underline size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive("strike")}
        title="خط خورده"
      >
        <Strikethrough size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={editor.isActive("code")}
        title="کد"
      >
        <Code size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={setLink}
        isActive={editor.isActive("link")}
        title="افزودن لینک"
      >
        <Link2 size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().unsetLink().run()}
        disabled={!editor.isActive("link")}
        title="حذف لینک"
      >
        <Link2Off size={16} />
      </ToolbarButton>

      <Divider />

      {/* Subscript/Superscript */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleSubscript().run()}
        isActive={editor.isActive("subscript")}
        title="زیرنویس"
      >
        <Subscript size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleSuperscript().run()}
        isActive={editor.isActive("superscript")}
        title="بالانویس"
      >
        <Superscript size={16} />
      </ToolbarButton>

      <Divider />

      {/* Text Alignment */}
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
        isActive={editor.isActive({ textAlign: "left" })}
        title="چپ چین"
      >
        <AlignLeft size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
        isActive={editor.isActive({ textAlign: "center" })}
        title="وسط چین"
      >
        <AlignCenter size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
        isActive={editor.isActive({ textAlign: "right" })}
        title="راست چین"
      >
        <AlignRight size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setTextAlign("justify").run()}
        isActive={editor.isActive({ textAlign: "justify" })}
        title="تراز"
      >
        <AlignJustify size={16} />
      </ToolbarButton>

      <Divider />

      {/* Lists */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive("bulletList")}
        title="لیست نقطه‌ای"
      >
        <List size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive("orderedList")}
        title="لیست شماره‌دار"
      >
        <ListOrdered size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        isActive={editor.isActive("taskList")}
        title="لیست وظایف"
      >
        <CheckSquare size={16} />
      </ToolbarButton>

      <Divider />

      {/* Block Elements */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive("blockquote")}
        title="نقل قول"
      >
        <Quote size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        isActive={editor.isActive("codeBlock")}
        title="بلوک کد"
      >
        <Code2 size={16} />
      </ToolbarButton>

      <Divider />

      {/* Media & Elements */}
      <ToolbarButton
        onClick={addImage}
        title="افزودن تصویر"
      >
        <Image size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="خط افقی"
      >
        <Minus size={16} />
      </ToolbarButton>
      <ToolbarButton
        onClick={insertTable}
        title="افزودن جدول"
      >
        <Table size={16} />
      </ToolbarButton>

      <Divider />

      {/* Colors & Highlighting */}
      <div className="flex items-center gap-1">
        <input
          type="color"
          onInput={(event) =>
            editor.chain().focus().setColor((event.target as HTMLInputElement).value).run()
          }
          value={editor.getAttributes("textStyle").color || "#000000"}
          className="w-8 h-8 border border-neutral-200 rounded-lg cursor-pointer hover:border-pink-400 transition-colors"
          title="رنگ متن"
        />
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          isActive={editor.isActive("highlight")}
          title="هایلایت"
        >
          <Highlighter size={16} />
        </ToolbarButton>
      </div>
    </div>
  );
};

export default RichTextToolbar;
