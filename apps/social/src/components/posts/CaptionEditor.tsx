"use client";

/**
 * Lean RTL caption editor for the create-post flow. Uses TipTap (`@tiptap/react`)
 * with a deliberately small extension set: bold / italic / underline / lists /
 * blockquote / link. Heavier features from the storefront `RichTextEditor`
 * (tables, images, code-blocks, syntax highlighting, product shortcodes) are
 * intentionally omitted — post captions don't need them, and skipping them
 * keeps the editor cold-start cheap and the dep footprint small.
 *
 * Emits sanitized HTML via `onChange`. The backend `Description` field is
 * `richtext`, so HTML stays the wire format.
 */

import {
  Bold,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  Underline as UnderlineIcon,
  Unlink,
} from "lucide-react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";

function cx(...parts: (string | false | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

const DEFAULT_PLACEHOLDER = "کپشن خود را اینجا بنویسید...";

const safeHrefPrefixes = ["http://", "https://", "mailto:", "tel:"];
function isSafeHref(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return false;
  if (normalized.startsWith("javascript:") || normalized.startsWith("data:")) return false;
  return safeHrefPrefixes.some((prefix) => normalized.startsWith(prefix));
}

export type CaptionEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  disabled?: boolean;
};

export function CaptionEditor({ value, onChange, placeholder, disabled }: CaptionEditorProps) {
  const editor = useEditor({
    extensions: [
      // `Underline` and `Link` are bundled in `@tiptap/starter-kit@3.x` —
      // registering them separately would duplicate the extension and trigger
      // a runtime warning. Configure them through StarterKit instead.
      StarterKit.configure({
        heading: false,
        codeBlock: false,
        horizontalRule: false,
        link: {
          openOnClick: false,
          autolink: true,
          defaultProtocol: "https",
          HTMLAttributes: {
            rel: "noopener noreferrer",
            target: "_blank",
          },
        },
      }),
      Placeholder.configure({
        placeholder: placeholder ?? DEFAULT_PLACEHOLDER,
        emptyEditorClass: "is-editor-empty",
      }),
    ],
    content: value,
    editable: !disabled,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        dir: "rtl",
        class:
          "tiptap-caption min-h-[160px] w-full px-4 py-3 text-sm leading-7 text-zinc-800 focus:outline-none",
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
  });

  if (!editor) {
    return (
      <div className="min-h-[200px] w-full animate-pulse rounded-2xl bg-white shadow-[0_0_14.7px_rgba(0,0,0,0.04)]" />
    );
  }

  return (
    <div
      className={cx(
        "flex w-full flex-col overflow-hidden rounded-2xl bg-white shadow-[0_0_14.7px_rgba(0,0,0,0.04)]",
        disabled && "opacity-60",
      )}
    >
      <CaptionToolbar editor={editor} disabled={disabled} />
      <EditorContent editor={editor} />
    </div>
  );
}

type CaptionToolbarProps = {
  editor: Editor;
  disabled?: boolean;
};

const buttonBaseClass = cx(
  "inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border-0",
  "bg-transparent text-zinc-500 transition-colors hover:bg-zinc-100",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400/70",
  "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent",
);

const buttonActiveClass = "bg-[rgba(140,174,236,0.18)] text-[#3D4C6E] hover:bg-[rgba(140,174,236,0.28)]";

function CaptionToolbar({ editor, disabled }: CaptionToolbarProps) {
  const setLink = () => {
    const previous = editor.getAttributes("link").href as string | undefined;
    const next = typeof window === "undefined" ? null : window.prompt("آدرس لینک:", previous ?? "");
    if (next === null) return;
    if (next === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    if (!isSafeHref(next)) {
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: next }).run();
  };

  return (
    <div
      dir="ltr"
      className="flex flex-row items-center gap-1 border-b border-zinc-200 px-2 py-2"
    >
      <ToolbarButton
        active={editor.isActive("bold")}
        disabled={disabled}
        aria-label="پررنگ"
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="size-4 stroke-[1.8]" aria-hidden />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("italic")}
        disabled={disabled}
        aria-label="کج"
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="size-4 stroke-[1.8]" aria-hidden />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("underline")}
        disabled={disabled}
        aria-label="زیرخط"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <UnderlineIcon className="size-4 stroke-[1.8]" aria-hidden />
      </ToolbarButton>

      <span className="mx-1 h-5 w-px bg-zinc-200" aria-hidden />

      <ToolbarButton
        active={editor.isActive("bulletList")}
        disabled={disabled}
        aria-label="فهرست نقطه‌ای"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="size-4 stroke-[1.8]" aria-hidden />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("orderedList")}
        disabled={disabled}
        aria-label="فهرست شماره‌دار"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="size-4 stroke-[1.8]" aria-hidden />
      </ToolbarButton>
      <ToolbarButton
        active={editor.isActive("blockquote")}
        disabled={disabled}
        aria-label="نقل قول"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote className="size-4 stroke-[1.8]" aria-hidden />
      </ToolbarButton>

      <span className="mx-1 h-5 w-px bg-zinc-200" aria-hidden />

      <ToolbarButton
        active={editor.isActive("link")}
        disabled={disabled}
        aria-label={editor.isActive("link") ? "ویرایش لینک" : "افزودن لینک"}
        onClick={setLink}
      >
        <LinkIcon className="size-4 stroke-[1.8]" aria-hidden />
      </ToolbarButton>
      <ToolbarButton
        disabled={disabled || !editor.isActive("link")}
        aria-label="حذف لینک"
        onClick={() => editor.chain().focus().unsetLink().run()}
      >
        <Unlink className="size-4 stroke-[1.8]" aria-hidden />
      </ToolbarButton>
    </div>
  );
}

type ToolbarButtonProps = {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  "aria-label": string;
  children: React.ReactNode;
};

function ToolbarButton({ active, disabled, onClick, children, ...rest }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cx(buttonBaseClass, active && buttonActiveClass)}
      aria-pressed={active}
      {...rest}
    >
      {children}
    </button>
  );
}
