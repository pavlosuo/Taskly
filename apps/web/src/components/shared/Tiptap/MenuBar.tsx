"use client";
import { useEditorState, Editor } from "@tiptap/react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { menuBarStateSelector } from "./menuBarState";
import { Fragment } from "react";
import { Separator } from "@/components/tiptap-ui-primitive/separator";
import clsx from "clsx";

const BUTTONS = [
  ["bold", "italic", "strike", "code"],
  ["clearMarks", "clearNodes"],
  ["paragraph", "h1", "h2", "h3", "h4", "h5", "h6"],
  ["bulletList", "orderedList", "codeBlock", "blockquote"],
  ["horizontalRule", "hardBreak"],
  ["undo", "redo"],
];

const SYMBOLS: Record<string, string> = {
  bold: "B",
  italic: "I",
  strike: "S",
  code: "<>",
  paragraph: "¶",
  h1: "H1",
  h2: "H2",
  h3: "H3",
  h4: "H4",
  h5: "H5",
  h6: "H6",
  blockquote: '" "',
  horizontalRule: "—",
  hardBreak: "↵",
  undo: "↩",
  redo: "↪",
};

const sep = (key: string) => (
  <Separator key={key} orientation="vertical" className="h-4 bg-grey mx-0.5" />
);

const btn = (
  t: TFunction,
  id: string,
  onClick: () => void,
  active?: boolean,
  disabled?: boolean,
) => {
  const text = t(`editor.${id}`);
  return (
    <button
      key={id}
      onClick={onClick}
      disabled={disabled}
      type="button"
      title={text}
      aria-label={text}
      className={clsx(
        "h-7 min-w-7 px-2 rounded-md text-sm font-medium transition-colors",
        active
          ? "bg-primary text-white"
          : "text-grey hover:text-foreground hover:bg-muted",
      )}
    >
      {SYMBOLS[id] ?? text}
    </button>
  );
};

export const MenuBar = ({ editor }: { editor: Editor }) => {
  const { t } = useTranslation("common");
  const editorState = useEditorState({
    editor,
    selector: menuBarStateSelector,
  });
  if (!editor) return null;
  return (
    <div
      role="toolbar"
      className="flex items-center flex-wrap gap-0.5 px-2 py-1.5 border border-border bg-background"
    >
      {btn(
        t,
        "bold",
        () => editor.chain().focus().toggleBold().run(),
        editorState.isBold,
        !editorState.canBold,
      )}
      {btn(
        t,
        "italic",
        () => editor.chain().focus().toggleItalic().run(),
        editorState.isItalic,
        !editorState.canItalic,
      )}
      {btn(
        t,
        "strike",
        () => editor.chain().focus().toggleStrike().run(),
        editorState.isStrike,
        !editorState.canStrike,
      )}
      {btn(
        t,
        "code",
        () => editor.chain().focus().toggleCode().run(),
        editorState.isCode,
        !editorState.canCode,
      )}
      {sep("s1")}
      {btn(t, "clearMarks", () => editor.chain().focus().unsetAllMarks().run())}
      {btn(t, "clearNodes", () => editor.chain().focus().clearNodes().run())}
      {sep("s2")}
      {btn(
        t,
        "paragraph",
        () => editor.chain().focus().setParagraph().run(),
        editorState.isParagraph,
      )}
      {([1, 2, 3, 4, 5, 6] as const).map((level) =>
        btn(
          t,
          `h${level}`,
          () => editor.chain().focus().toggleHeading({ level }).run(),
          editorState[
            `isHeading${level}` as keyof typeof editorState
          ] as boolean,
        ),
      )}
      {sep("s3")}
      {btn(
        t,
        "bulletList",
        () => editor.chain().focus().toggleBulletList().run(),
        editorState.isBulletList,
      )}
      {btn(
        t,
        "orderedList",
        () => editor.chain().focus().toggleOrderedList().run(),
        editorState.isOrderedList,
      )}
      {btn(
        t,
        "codeBlock",
        () => editor.chain().focus().toggleCodeBlock().run(),
        editorState.isCodeBlock,
      )}
      {btn(
        t,
        "blockquote",
        () => editor.chain().focus().toggleBlockquote().run(),
        editorState.isBlockquote,
      )}
      {sep("s4")}
      {btn(t, "horizontalRule", () =>
        editor.chain().focus().setHorizontalRule().run(),
      )}
      {btn(t, "hardBreak", () => editor.chain().focus().setHardBreak().run())}
      {sep("s5")}
      {btn(
        t,
        "undo",
        () => editor.chain().focus().undo().run(),
        false,
        !editorState.canUndo,
      )}
      {btn(
        t,
        "redo",
        () => editor.chain().focus().redo().run(),
        false,
        !editorState.canRedo,
      )}
    </div>
  );
};

export const MenuBarSkeleton = () => {
  const { t } = useTranslation("common");
  return (
    <div className="flex items-center flex-wrap gap-0.5 px-2 py-1.5 border border-border bg-background">
      {BUTTONS.map((group, gi) => (
        <Fragment key={gi}>
          {group.map((id) => {
            const text = t(`editor.${id}`);
            return (
              <button
                key={id}
                type="button"
                disabled
                title={text}
                aria-label={text}
                className={clsx(
                  "h-7 min-w-7 px-2 rounded-md text-sm font-medium transition-colors",
                  id === "paragraph"
                    ? "bg-primary text-white"
                    : "text-foreground hover:bg-muted",
                )}
              >
                {SYMBOLS[id] ?? text}
              </button>
            );
          })}
          {gi < BUTTONS.length - 1 && sep(`s${gi}`)}
        </Fragment>
      ))}
    </div>
  );
};
