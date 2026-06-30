"use client";
import { useMemo } from "react";
import { TextStyleKit } from "@tiptap/extension-text-style";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { MenuBar, MenuBarSkeleton } from "./MenuBar";
import parse from "html-react-parser";
import { useData } from "@/providers/Data";

const EXTENSIONS = [TextStyleKit, StarterKit];

export const Tiptap = () => {
  const { data, setData } = useData();
  const content = data?.policyContent;
  const editor = useEditor({
    extensions: EXTENSIONS,
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      setData((prev) => ({
        ...prev,
        policyContent: editor.getHTML(),
      }));
    },
  });
  const parsedContent = useMemo(
    () => (content ? parse(content) : null),
    [content],
  );
  return (
    <div className="tiptap-wrapper">
      {editor ? (
        <>
          <MenuBar editor={editor} />
          <EditorContent editor={editor} />
        </>
      ) : (
        <>
          <MenuBarSkeleton />
          <div className="tiptap">{parsedContent}</div>
        </>
      )}
    </div>
  );
};
