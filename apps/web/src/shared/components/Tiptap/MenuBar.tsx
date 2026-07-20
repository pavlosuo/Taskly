"use client";
import { useEditorState, Editor } from "@tiptap/react";
import { menuBarStateSelector } from "./menuBarState";
import { Fragment } from "react";
import { Separator } from "@/components/tiptap-ui-primitive/separator";
import clsx from "clsx";

const BUTTONS = [
  ["B", "I", "S", "<>"],
  ["Clear marks", "Clear nodes"],
  ["¶", "H1", "H2", "H3", "H4", "H5", "H6"],
  ["• List", "1. List", "Code block", '" "'],
  ["—", "↵"],
  ["↩", "↪"],
];

const sep = (key: string) => (
  <Separator
    key={key}
    orientation="vertical"
    className="h-4 bg-gray mx-0.5"
  />
);

const btn = (
  label: string,
  onClick: () => void,
  active?: boolean,
  disabled?: boolean,
) => (
  <button
    key={label}
    onClick={onClick}
    disabled={disabled}
    className={clsx(
      "h-7 min-w-7 px-2 rounded-md text-sm font-medium transition-colors",
      active
        ? "bg-primary text-white"
        : "text-foreground hover:bg-muted",
    )}
  >
    {label}
  </button>
);

export const MenuBar = ({ editor }: { editor: Editor }) => {
  const editorState = useEditorState({
    editor,
    selector: menuBarStateSelector,
  });
  if (!editor) return null;
  return (
    <div className="flex items-center flex-wrap gap-0.5 px-2 py-1.5 border border-border bg-background">
      {btn(
        "B",
        () => editor.chain().focus().toggleBold().run(),
        editorState.isBold,
        !editorState.canBold,
      )}
      {btn(
        "I",
        () => editor.chain().focus().toggleItalic().run(),
        editorState.isItalic,
        !editorState.canItalic,
      )}
      {btn(
        "S",
        () => editor.chain().focus().toggleStrike().run(),
        editorState.isStrike,
        !editorState.canStrike,
      )}
      {btn(
        "<>",
        () => editor.chain().focus().toggleCode().run(),
        editorState.isCode,
        !editorState.canCode,
      )}
      {sep("s1")}
      {btn("Clear marks", () => editor.chain().focus().unsetAllMarks().run())}
      {btn("Clear nodes", () => editor.chain().focus().clearNodes().run())}
      {sep("s2")}
      {btn(
        "¶",
        () => editor.chain().focus().setParagraph().run(),
        editorState.isParagraph,
      )}
      {([1, 2, 3, 4, 5, 6] as const).map((level) =>
        btn(
          `H${level}`,
          () => editor.chain().focus().toggleHeading({ level }).run(),
          editorState[
            `isHeading${level}` as keyof typeof editorState
          ] as boolean,
        ),
      )}
      {sep("s3")}
      {btn(
        "• List",
        () => editor.chain().focus().toggleBulletList().run(),
        editorState.isBulletList,
      )}
      {btn(
        "1. List",
        () => editor.chain().focus().toggleOrderedList().run(),
        editorState.isOrderedList,
      )}
      {btn(
        "Code block",
        () => editor.chain().focus().toggleCodeBlock().run(),
        editorState.isCodeBlock,
      )}
      {btn(
        '" "',
        () => editor.chain().focus().toggleBlockquote().run(),
        editorState.isBlockquote,
      )}
      {sep("s4")}
      {btn("—", () => editor.chain().focus().setHorizontalRule().run())}
      {btn("↵", () => editor.chain().focus().setHardBreak().run())}
      {sep("s5")}
      {btn(
        "↩",
        () => editor.chain().focus().undo().run(),
        false,
        !editorState.canUndo,
      )}
      {btn(
        "↪",
        () => editor.chain().focus().redo().run(),
        false,
        !editorState.canRedo,
      )}
    </div>
  );
};

export const MenuBarSkeleton = () => (
  <div className="flex items-center flex-wrap gap-0.5 px-2 py-1.5 border border-border bg-background">
    {BUTTONS.map((group, gi) => (
      <Fragment key={gi}>
        {group.map((label) => (
          <button
            key={label}
            disabled
            className={clsx(
              "h-7 min-w-7 px-2 rounded-md text-sm font-medium transition-colors",
              label === "H2"
                ? "bg-gray-900 text-white"
                : "text-gray-600 hover:bg-gray-100 hover:text-foreground",
            )}
          >
            {label}
          </button>
        ))}
        {gi < BUTTONS.length - 1 && sep(`s${gi}`)}
      </Fragment>
    ))}
  </div>
);
