"use client";

import React from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import TextAlign from "@tiptap/extension-text-align";
import { Table, TableRow, TableCell, TableHeader } from "@tiptap/extension-table";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { TextStyle } from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import { Placeholder } from "@tiptap/extensions";
import { CharacterCount } from "@tiptap/extensions";
import { createLowlight } from "lowlight";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import css from "highlight.js/lib/languages/css";
import xml from "highlight.js/lib/languages/xml";
import json from "highlight.js/lib/languages/json";
import bash from "highlight.js/lib/languages/bash";
import python from "highlight.js/lib/languages/python";
import sql from "highlight.js/lib/languages/sql";
import markdown from "highlight.js/lib/languages/markdown";
import { useDebouncedCallback } from "use-debounce";

// Create lowlight instance and register common languages
const lowlight = createLowlight();

// Register languages for syntax highlighting
lowlight.register("javascript", javascript);
lowlight.register("typescript", typescript);
lowlight.register("js", javascript);
lowlight.register("ts", typescript);
lowlight.register("css", css);
lowlight.register("html", xml);
lowlight.register("xml", xml);
lowlight.register("json", json);
lowlight.register("bash", bash);
lowlight.register("sh", bash);
lowlight.register("python", python);
lowlight.register("py", python);
lowlight.register("sql", sql);
lowlight.register("markdown", markdown);
lowlight.register("md", markdown);

import RichTextToolbar from "./Toolbar";

const isSafeHref = (href: string): boolean => {
  if (!href) {
    return false;
  }

  const trimmed = href.trim();
  const normalized = trimmed.toLowerCase();

  if (normalized.startsWith("javascript:") || normalized.startsWith("data:")) {
    return false;
  }

  if (
    normalized.startsWith("http://") ||
    normalized.startsWith("https://") ||
    normalized.startsWith("mailto:") ||
    normalized.startsWith("tel:") ||
    normalized.startsWith("sms:")
  ) {
    return true;
  }

  if (
    normalized.startsWith("/") ||
    normalized.startsWith("./") ||
    normalized.startsWith("../") ||
    normalized.startsWith("#") ||
    normalized.startsWith("//")
  ) {
    return true;
  }

  return false;
};

interface RichTextEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
  simplified?: boolean;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content = "",
  onChange,
  placeholder = "شروع به نوشتن کنید...",
  readOnly = false,
  className = "",
  simplified = false,
}) => {
  const [viewMode, setViewMode] = React.useState<"visual" | "code">("visual");
  const [codeValue, setCodeValue] = React.useState(content || "");
  const [stats, setStats] = React.useState({ words: 0, characters: 0 });
  const debouncedOnChange = useDebouncedCallback(
    (value: string) => {
      if (onChange) {
        onChange(value);
      }
    },
    300,
  );
  const editor = useEditor({
    immediatelyRender: false, // Prevent SSR hydration mismatches
    extensions: [
      StarterKit.configure({
        codeBlock: false, // We'll use CodeBlockLowlight instead
      }),
      Underline,
      Subscript,
      Superscript,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
          rel: "noopener noreferrer",
          class: "text-blue-600 underline hover:text-blue-700",
        },
        validate: (href) => isSafeHref(href),
      }),
      Image.configure({
        HTMLAttributes: {
          class: "max-w-full h-auto rounded-lg",
        },
      }),
      TextStyle,
      Color,
      Highlight.configure({
        multicolor: true,
      }),
      HorizontalRule,
      Placeholder.configure({
        placeholder,
        emptyEditorClass: "is-editor-empty",
        showOnlyWhenEditable: true,
        showOnlyCurrent: false,
        includeChildren: true,
      }),
      CharacterCount.configure(),
    ],
    content,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setCodeValue(html);
      debouncedOnChange(html);
    },
    editorProps: {
      attributes: {
        class: `tiptap prose prose-base prose-headings:font-semibold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-h4:text-base prose-h5:text-sm prose-a:text-blue-600 prose-a:underline hover:prose-a:text-blue-700 max-w-none focus:outline-none ${className} ${
          readOnly ? "text-slate-500" : ""
        }`,
        dir: "rtl",
      },
    },
  });

  React.useEffect(() => {
    return () => {
      debouncedOnChange.cancel();
    };
  }, [debouncedOnChange]);

  React.useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
    setCodeValue(content || "");
  }, [content, editor]);

  React.useEffect(() => {
    if (viewMode === "visual" && editor && codeValue !== editor.getHTML()) {
      editor.commands.setContent(codeValue);
    }
  }, [viewMode, codeValue, editor]);

  React.useEffect(() => {
    if (readOnly && viewMode === "code") {
      setViewMode("visual");
    }
  }, [readOnly, viewMode]);

  React.useEffect(() => {
    if (!editor) {
      return;
    }

    const updateStats = () => {
      const characterCount = editor.storage.characterCount?.characters?.() ?? 0;
      const wordCount = editor.storage.characterCount?.words?.() ?? 0;
      setStats({
        characters: characterCount,
        words: wordCount,
      });
    };

    updateStats();
    editor.on("update", updateStats);
    editor.on("selectionUpdate", updateStats);

    return () => {
      editor.off("update", updateStats);
      editor.off("selectionUpdate", updateStats);
    };
  }, [editor]);

  const handleCodeChange = (value: string) => {
    setCodeValue(value);
    debouncedOnChange(value);
  };

  if (!editor) {
    return null;
  }

  return (
    <div className="w-full border border-neutral-200 rounded-lg bg-white">
      {!readOnly && (
        <div className="flex items-center justify-between border-b border-neutral-200 px-3 py-2">
          <div className="flex gap-2 text-xs">
            <button
              type="button"
              onClick={() => setViewMode("visual")}
              className={`rounded-md px-3 py-1 ${
                viewMode === "visual" ? "bg-pink-100 text-pink-600" : "text-neutral-500"
              }`}
            >
              دیداری
            </button>
            <button
              type="button"
              onClick={() => setViewMode("code")}
              className={`rounded-md px-3 py-1 ${
                viewMode === "code" ? "bg-pink-100 text-pink-600" : "text-neutral-500"
              }`}
            >
              کد
            </button>
          </div>
        </div>
      )}

      <div className="relative">
        {!readOnly && viewMode === "visual" && <RichTextToolbar editor={editor} simplified={simplified} />}

        <div className="min-h-[200px] p-5">
        {viewMode === "visual" ? (
          <EditorContent
            editor={editor}
            className="tiptap min-h-[150px] focus-within:outline-none text-sm"
          />
        ) : (
          <textarea
            value={codeValue}
            onChange={(e) => handleCodeChange(e.target.value)}
            dir="ltr"
            className="min-h-[150px] w-full rounded-md border border-neutral-200 bg-neutral-50 p-3 font-mono text-xs text-neutral-700 focus:border-pink-500 focus:outline-none focus:ring-1 focus:ring-pink-500"
            disabled={readOnly}
            placeholder="<p>...</p>"
          />
        )}
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-neutral-200 bg-neutral-50 px-4 py-2 text-xs text-neutral-500">
        <span>کلمات: {stats.words.toLocaleString("fa-IR")}</span>
        <span>حروف: {stats.characters.toLocaleString("fa-IR")}</span>
      </div>
    </div>
  );
};

export default RichTextEditor;
