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

interface RichTextEditorProps {
  content?: string;
  onChange?: (content: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  className?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  content = "",
  onChange,
  placeholder = "شروع به نوشتن کنید...",
  readOnly = false,
  className = "",
}) => {
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
          rel: "noopener noreferrer nofollow",
          target: "_blank",
        },
        validate: (href) => /^https?:\/\//i.test(href) || href.startsWith("/"),
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
    ],
    content,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      if (onChange) {
        onChange(editor.getHTML());
      }
    },
    editorProps: {
      attributes: {
        class: `prose prose-sm max-w-none focus:outline-none ${className} ${readOnly ? "text-slate-500" : ""}`,
        dir: "rtl",
      },
    },
  });

  React.useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="w-full border border-neutral-200 rounded-lg overflow-hidden bg-white">
      {!readOnly && <RichTextToolbar editor={editor} />}
      <div className="min-h-[200px] p-5">
        <EditorContent
          editor={editor}
          className="min-h-[150px] focus-within:outline-none text-sm"
          placeholder={placeholder}
        />
      </div>
    </div>
  );
};

export default RichTextEditor;
