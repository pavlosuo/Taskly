"use client";
import { useMemo } from "react";
import { TextStyleKit } from "@tiptap/extension-text-style";
import { EditorContent, useEditor, EditorEvents } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { MenuBar, MenuBarSkeleton } from "./MenuBar";
import parse from "html-react-parser";
const EXTENSIONS = [TextStyleKit, StarterKit];

export const Tiptap = ({
  value,
  onUpdate,
}: {
  value: string;
  onUpdate: (props: EditorEvents["update"]) => void;
}) => {
  const editor = useEditor({
    extensions: EXTENSIONS,
    content: value,
    immediatelyRender: false,
    onUpdate,
  });
  const parsedContent = useMemo(() => (value ? parse(value) : null), [value]);
  return (
    <div className="tiptap-wrapper text-wrapper">
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
