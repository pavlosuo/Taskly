"use client";
import { useMemo } from "react";
import { TextStyleKit } from "@tiptap/extension-text-style";
import { EditorContent, useEditor, EditorEvents } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { MenuBar, MenuBarSkeleton } from "./MenuBar";
import parseSafeHtml from "@/utils/parseSafeHtml";
import clsx from "clsx";

export const Tiptap = ({
  value,
  onUpdate,
  error,
}: {
  value: string;
  onUpdate: (props: EditorEvents["update"]) => void;
  error?: string;
}) => {
  const editor = useEditor({
    extensions: [TextStyleKit, StarterKit],
    content: value,
    immediatelyRender: false,
    onUpdate,
  });
  const parsedContent = useMemo(
    () => (value ? parseSafeHtml(value) : null),
    [value],
  );
  return (
    <div
      className={clsx(
        "flex flex-col gap-1 text-wrapper",
        error && "tiptap-error",
      )}
    >
      {editor ? (
        <>
          <MenuBar editor={editor} />
          <EditorContent editor={editor} />
        </>
      ) : (
        <>
          <MenuBarSkeleton />
          <div className={clsx("tiptap")}>{parsedContent}</div>
        </>
      )}
    </div>
  );
};
