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
  X,
  ShoppingBag,
} from "lucide-react";
import LinkDialog, { type LinkFormValues } from "./LinkDialog";
import ImageDialog, { type ImageFormValues } from "./ImageDialog";
import type { UploadedImage } from "@/services/super-admin/files/upload";
import TableBuilderDialog from "./TableBuilderDialog";
import ProductShortcodeModal from "./ProductShortcodeModal";

interface ToolbarProps {
  editor: Editor;
  simplified?: boolean;
}

const ToolbarButton: React.FC<{
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  title?: string;
  className?: string;
}> = ({ onClick, isActive = false, disabled = false, children, title, className }) => (
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
    } ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className ?? ""}`}
  >
    {children}
  </Button>
);

const Divider: React.FC = () => (
  <div className="w-px h-6 bg-neutral-200 mx-1" />
);

const RichTextToolbar: React.FC<ToolbarProps> = ({ editor, simplified = false }) => {
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

  const [showLinkDialog, setShowLinkDialog] = React.useState(false);
  const [linkDefaults, setLinkDefaults] = React.useState<LinkFormValues>({
    href: "",
    text: "",
    openInNewTab: true,
    nofollow: false,
  });
  const [showImageDialog, setShowImageDialog] = React.useState(false);
  const [showTableBuilder, setShowTableBuilder] = React.useState(false);
  const [showProductShortcodeModal, setShowProductShortcodeModal] = React.useState(false);
  const [imageDefaults, setImageDefaults] = React.useState<ImageFormValues>({
    src: "",
    alt: "",
    title: "",
    width: "",
    height: "",
  });

  const colorPalette = React.useMemo(
    () => ["#0f172a", "#dc2626", "#ea580c", "#16a34a", "#2563eb", "#7e22ce", "#d97706", "#0891b2"],
    [],
  );

  const openLinkDialog = () => {
    const attrs = editor.getAttributes("link");
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, " ");

    setLinkDefaults({
      href: attrs.href || "",
      text: selectedText || "",
      openInNewTab: attrs.target ? attrs.target === "_blank" : true,
      nofollow: (attrs.rel || "").includes("nofollow"),
    });
    setShowLinkDialog(true);
  };

  const openImageDialog = () => {
    const attrs = editor.getAttributes("image");
    setImageDefaults({
      src: attrs.src || "",
      alt: attrs.alt || "",
      title: attrs.title || "",
      width: attrs.width ? String(attrs.width) : "",
      height: attrs.height ? String(attrs.height) : "",
    });
    setShowImageDialog(true);
  };

  const handleLinkSubmit = (values: LinkFormValues) => {
    const relBase = values.openInNewTab ? "noopener noreferrer" : "noreferrer";
    const rel = values.nofollow ? `${relBase} nofollow`.trim() : relBase;

    editor
      .chain()
      .focus()
      .extendMarkRange("link")
      .setLink({
        href: values.href,
        target: values.openInNewTab ? "_blank" : "_self",
        rel,
      })
      .run();

    if (values.text && editor.state.selection.empty) {
      editor.chain().focus().insertContent(values.text).run();
    }
  };

  const handleImageSubmit = (values: ImageFormValues, _media?: UploadedImage | null) => {
    editor
      .chain()
      .focus()
      .setImage({
        src: values.src,
        alt: values.alt,
        title: values.title,
        width: values.width ? Number(values.width) : undefined,
        height: values.height ? Number(values.height) : undefined,
      })
      .run();
  };

  const handleTableInsert = (html: string) => {
    editor.chain().focus().insertContent(html).run();
    setShowTableBuilder(false);
  };

  const handleProductShortcodeInsert = (shortcode: string) => {
    editor.chain().focus().insertContent(shortcode).run();
    setShowProductShortcodeModal(false);
  };

  return (
    <>
      <div className={`${simplified ? "" : "sticky top-4 z-30"} mb-4 flex ${simplified ? "justify-start border-b border-slate-200" : "justify-center"}`}>
        <div className={`flex w-fit max-w-full flex-wrap items-center ${simplified ? "justify-end" : "justify-center"} gap-1 ${simplified ? "": "rounded-3xl border border-slate-200"} bg-white/10 px-4 py-2.5 ${simplified ? "" : "shadow-lg"} backdrop-blur-lg transition-all`}>
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
      {!simplified && (
        <>
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
        </>
      )}

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
      {!simplified && (
        <>
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
          <ToolbarButton onClick={openLinkDialog} isActive={editor.isActive("link")} title="افزودن لینک">
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
          <ToolbarButton onClick={openImageDialog} title="افزودن تصویر">
            <Image size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            title="خط افقی"
          >
            <Minus size={16} />
          </ToolbarButton>
          <ToolbarButton onClick={() => setShowTableBuilder(true)} title="افزودن جدول">
            <Table size={16} />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => setShowProductShortcodeModal(true)}
            title="افزودن کاروسل محصولات"
          >
            <ShoppingBag size={16} />
          </ToolbarButton>

          <Divider />
        </>
      )}

      {/* Colors & Highlighting */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <input
            type="color"
            onInput={(event) =>
              editor.chain().focus().setColor((event.target as HTMLInputElement).value).run()
            }
            value={editor.getAttributes("textStyle").color || "#000000"}
            className="h-8 w-8 cursor-pointer rounded-lg border border-neutral-200 transition-colors hover:border-pink-400"
            title="انتخاب رنگ دلخواه"
          />
          {!simplified && (
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHighlight().run()}
              isActive={editor.isActive("highlight")}
              title="هایلایت"
            >
              <Highlighter size={16} />
            </ToolbarButton>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-1 rounded-lg border border-neutral-200 bg-neutral-50 px-2 py-1">
          <Palette size={16} className="text-neutral-500" />
          {colorPalette.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => editor.chain().focus().setColor(color).run()}
              className="h-5 w-5 rounded-full border border-white shadow-sm transition hover:scale-105"
              style={{ backgroundColor: color }}
              title={`انتخاب ${color}`}
            />
          ))}
          <button
            type="button"
            onClick={() => editor.chain().focus().unsetColor().run()}
            className="ml-1 flex h-6 w-6 items-center justify-center rounded-full border border-neutral-300 text-neutral-500 transition hover:border-pink-400 hover:text-pink-600"
            title="حذف رنگ"
          >
            <X size={12} />
          </button>
        </div>
      </div>
      </div>
      </div>
      <LinkDialog
        isOpen={showLinkDialog}
        initialValues={linkDefaults}
        onClose={() => setShowLinkDialog(false)}
        onSubmit={handleLinkSubmit}
      />
      <ImageDialog
        isOpen={showImageDialog}
        initialValues={imageDefaults}
        onClose={() => setShowImageDialog(false)}
        onSubmit={handleImageSubmit}
      />
      <TableBuilderDialog
        isOpen={showTableBuilder}
        onClose={() => setShowTableBuilder(false)}
        onInsert={handleTableInsert}
      />
      <ProductShortcodeModal
        isOpen={showProductShortcodeModal}
        onClose={() => setShowProductShortcodeModal(false)}
        onInsert={handleProductShortcodeInsert}
      />
    </>
  );
};

export default RichTextToolbar;
