import { useEffect, useRef, useState, type ReactNode } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { Color } from "@tiptap/extension-color";
import { TextStyle } from "@tiptap/extension-text-style";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import MentionAutocomplete from "@/features/mention/components/MentionAutocomplete";
import { useMentionSearch } from "@/features/mention/hooks/useMentionSearch";
import type { MentionUser } from "@/features/mention/utils/mention";
import {
  extractMentionPayloadFromHtml,
  getMentionQueryAtCursor,
  isMentionAllSearchUser,
  MENTION_ALL_DATA_ID,
  MENTION_ALL_TOKEN,
} from "@/features/mention/utils/mention";
import { MentionMark } from "@/features/mention/extensions/mention-mark";
import type { SearchUser } from "@/features/search/types/search.type";
import {
  Bold,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Link2,
  List,
  ListOrdered,
  Palette,
  Redo2,
  Strikethrough,
  Underline as UnderlineIcon,
  Undo2,
} from "lucide-react";
import "@/features/new-feed/styles/rich-text.css";
import { useTranslation } from "react-i18next";

type RichTextEditorProps = {
  value: string;
  onChange: (html: string) => void;
  onMentionedUserIdsChange?: (ids: number[]) => void;
  mentionCandidates?: MentionUser[];
  excludeMentionUserId?: number;
  allowMentionAll?: boolean;
  onMentionAllChange?: (mentionAll: boolean) => void;
  placeholder?: string;
  minRows?: number;
  className?: string;
};

const TEXT_COLORS = [
  { key: "default", value: "" },
  { key: "red", value: "#dc2626" },
  { key: "orange", value: "#ea580c" },
  { key: "yellow", value: "#ca8a04" },
  { key: "green", value: "#16a34a" },
  { key: "blue", value: "#2563eb" },
  { key: "purple", value: "#9333ea" },
];

const RichTextEditor = ({
  value,
  onChange,
  onMentionedUserIdsChange,
  mentionCandidates,
  excludeMentionUserId,
  allowMentionAll = true,
  onMentionAllChange,
  placeholder,
  minRows = 3,
  className = "",
}: RichTextEditorProps) => {
  const { t } = useTranslation();
  const effectivePlaceholder = placeholder ?? t("pages.posts.creatorPlaceholder");
  const [colorOpen, setColorOpen] = useState(false);
  const [headingOpen, setHeadingOpen] = useState(false);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionActiveIndex, setMentionActiveIndex] = useState(0);
  const colorRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLDivElement>(null);
  const editorWrapRef = useRef<HTMLDivElement>(null);
  const { users: mentionUsers, loading: mentionLoading } = useMentionSearch(
    mentionQuery,
    mentionQuery != null,
    {
      candidates: mentionCandidates,
      excludeUserId: excludeMentionUserId,
      allowMentionAll,
    },
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      TextStyle,
      Color,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          rel: "noopener noreferrer",
          target: "_blank",
        },
      }),
      MentionMark,
      Placeholder.configure({ placeholder: effectivePlaceholder }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class:
          "tiptap-editor prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[inherit] text-slate-900 dark:text-slate-100",
      },
    },
    onUpdate: ({ editor: ed }) => {
      const html = ed.getHTML();
      onChange(html);
      const payload = extractMentionPayloadFromHtml(html);
      onMentionedUserIdsChange?.(payload.mentionedUserIds);
      onMentionAllChange?.(payload.mentionAll);

      const { from } = ed.state.selection;
      const textBefore = ed.state.doc.textBetween(
        Math.max(0, from - 50),
        from,
        "\n",
        "\0",
      );
      const mentionInfo = getMentionQueryAtCursor(textBefore, textBefore.length);
      setMentionQuery(mentionInfo ? mentionInfo.query : null);
    },
  });

  useEffect(() => {
    setMentionActiveIndex(0);
  }, [mentionUsers]);

  const insertMentionAll = () => {
    if (!editor) return;

    const { from } = editor.state.selection;
    const textBefore = editor.state.doc.textBetween(
      Math.max(0, from - 50),
      from,
      "\n",
      "\0",
    );
    const mentionInfo = getMentionQueryAtCursor(textBefore, textBefore.length);
    const deleteFrom = mentionInfo ? from - (mentionInfo.query.length + 1) : from;

    editor
      .chain()
      .focus()
      .deleteRange({ from: deleteFrom, to: from })
      .insertContent([
        {
          type: "text",
          text: MENTION_ALL_TOKEN,
          marks: [
            {
              type: "mention",
              attrs: { userId: MENTION_ALL_DATA_ID },
            },
          ],
        },
        { type: "text", text: " " },
      ])
      .run();

    setMentionQuery(null);
  };

  const insertMention = (user: SearchUser) => {
    if (isMentionAllSearchUser(user)) {
      insertMentionAll();
      return;
    }

    if (!editor) return;

    const { from } = editor.state.selection;
    const textBefore = editor.state.doc.textBetween(
      Math.max(0, from - 50),
      from,
      "\n",
      "\0",
    );
    const mentionInfo = getMentionQueryAtCursor(textBefore, textBefore.length);
    const deleteFrom = mentionInfo ? from - (mentionInfo.query.length + 1) : from;

    editor
      .chain()
      .focus()
      .deleteRange({ from: deleteFrom, to: from })
      .insertContent([
        {
          type: "text",
          text: `@${user.fullName}`,
          marks: [
            {
              type: "mention",
              attrs: { userId: String(user.id) },
            },
          ],
        },
        { type: "text", text: " " },
      ])
      .run();

    setMentionQuery(null);
  };

  useEffect(() => {
    if (!editor) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (mentionQuery == null || mentionUsers.length === 0) {
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setMentionActiveIndex((prev) => (prev + 1) % mentionUsers.length);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setMentionActiveIndex(
          (prev) => (prev - 1 + mentionUsers.length) % mentionUsers.length,
        );
      } else if (event.key === "Enter" || event.key === "Tab") {
        event.preventDefault();
        insertMention(mentionUsers[mentionActiveIndex]);
      } else if (event.key === "Escape") {
        event.preventDefault();
        setMentionQuery(null);
      }
    };

    const dom = editor.view.dom;
    dom.addEventListener("keydown", handleKeyDown);
    return () => dom.removeEventListener("keydown", handleKeyDown);
  }, [editor, mentionActiveIndex, mentionQuery, mentionUsers]);

  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    const next = value || "";
    if (current !== next && !editor.isFocused) {
      editor.commands.setContent(next, { emitUpdate: false });
    }
  }, [editor, value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (colorRef.current && !colorRef.current.contains(e.target as Node)) {
        setColorOpen(false);
      }
      if (
        headingRef.current &&
        !headingRef.current.contains(e.target as Node)
      ) {
        setHeadingOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const minHeight = minRows * 24 + 32;

  if (!editor) return null;

  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt(t("pages.editor.enterUrl"), previousUrl || "https://");

    if (url === null) return;

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const activeHeading = editor.isActive("heading", { level: 1 })
    ? "H1"
    : editor.isActive("heading", { level: 2 })
      ? "H2"
      : editor.isActive("heading", { level: 3 })
        ? "H3"
        : t("pages.editor.paragraph");

  return (
    <div
      className={`rounded-xl border border-slate-200/80 dark:border-slate-700/80 overflow-hidden ${className}`}
    >
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-slate-200/80 dark:border-slate-700/80 bg-slate-100/60 dark:bg-slate-800/40">
        <ToolbarButton
          title={t("pages.editor.undo")}
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Undo2 size={16} />
        </ToolbarButton>
        <ToolbarButton
          title={t("pages.editor.redo")}
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Redo2 size={16} />
        </ToolbarButton>

        <span className="w-px h-5 bg-slate-300 dark:bg-slate-600 mx-0.5" />

        <div ref={headingRef} className="relative">
          <ToolbarButton
            title={t("pages.editor.heading")}
            active={editor.isActive("heading")}
            onClick={() => setHeadingOpen((o) => !o)}
            className="min-w-13 text-xs font-semibold"
          >
            {activeHeading}
          </ToolbarButton>
          {headingOpen && (
            <div className="absolute left-0 top-full mt-1 z-30 flex flex-col min-w-30 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg">
              <HeadingMenuItem
                label={t("pages.editor.paragraph")}
                icon={<span className="text-xs">P</span>}
                active={editor.isActive("paragraph")}
                onClick={() => {
                  editor.chain().focus().setParagraph().run();
                  setHeadingOpen(false);
                }}
              />
              <HeadingMenuItem
                label={t("pages.editor.heading1")}
                icon={<Heading1 size={16} />}
                active={editor.isActive("heading", { level: 1 })}
                onClick={() => {
                  editor.chain().focus().toggleHeading({ level: 1 }).run();
                  setHeadingOpen(false);
                }}
              />
              <HeadingMenuItem
                label={t("pages.editor.heading2")}
                icon={<Heading2 size={16} />}
                active={editor.isActive("heading", { level: 2 })}
                onClick={() => {
                  editor.chain().focus().toggleHeading({ level: 2 }).run();
                  setHeadingOpen(false);
                }}
              />
              <HeadingMenuItem
                label={t("pages.editor.heading3")}
                icon={<Heading3 size={16} />}
                active={editor.isActive("heading", { level: 3 })}
                onClick={() => {
                  editor.chain().focus().toggleHeading({ level: 3 }).run();
                  setHeadingOpen(false);
                }}
              />
            </div>
          )}
        </div>

        <ToolbarButton
          title={t("pages.editor.bold")}
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold size={16} />
        </ToolbarButton>
        <ToolbarButton
          title={t("pages.editor.italic")}
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic size={16} />
        </ToolbarButton>
        <ToolbarButton
          title={t("pages.editor.underline")}
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon size={16} />
        </ToolbarButton>
        <ToolbarButton
          title={t("pages.editor.strikethrough")}
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough size={16} />
        </ToolbarButton>

        <div ref={colorRef} className="relative">
          <ToolbarButton
            title={t("pages.editor.textColor")}
            active={colorOpen}
            onClick={() => setColorOpen((o) => !o)}
          >
            <Palette size={16} />
          </ToolbarButton>
          {colorOpen && (
            <div className="absolute left-0 top-full mt-1 z-30 flex flex-wrap gap-1.5 p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg w-[180px]">
              {TEXT_COLORS.map((color) => (
                <button
                  key={color.key}
                  type="button"
                  title={t(`pages.editor.colors.${color.key}`)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    if (!color.value) {
                      editor.chain().focus().unsetColor().run();
                    } else {
                      editor.chain().focus().setColor(color.value).run();
                    }
                    setColorOpen(false);
                  }}
                  className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${
                    color.value
                      ? "border-slate-200 dark:border-slate-600"
                      : "border-dashed border-slate-400 bg-white dark:bg-slate-700"
                  }`}
                  style={
                    color.value ? { backgroundColor: color.value } : undefined
                  }
                />
              ))}
            </div>
          )}
        </div>

        <span className="w-px h-5 bg-slate-300 dark:bg-slate-600 mx-0.5" />

        <ToolbarButton
          title={t("pages.editor.bulletList")}
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List size={16} />
        </ToolbarButton>
        <ToolbarButton
          title={t("pages.editor.orderedList")}
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered size={16} />
        </ToolbarButton>
        <ToolbarButton
          title={t("pages.editor.link")}
          active={editor.isActive("link")}
          onClick={setLink}
        >
          <Link2 size={16} />
        </ToolbarButton>
      </div>

      <div
        ref={editorWrapRef}
        className="bg-slate-50 dark:bg-slate-800/50 rounded-b-xl focus-within:ring-2 focus-within:ring-blue-500/20 p-4 text-sm transition-all overflow-y-auto relative"
        style={{ minHeight }}
      >
        <EditorContent editor={editor} />
        {mentionQuery != null && (
          <MentionAutocomplete
            users={mentionUsers}
            loading={mentionLoading}
            activeIndex={mentionActiveIndex}
            onSelect={insertMention}
            className="left-4 bottom-4"
          />
        )}
      </div>
    </div>
  );
};

type ToolbarButtonProps = {
  title: string;
  onClick?: () => void;
  disabled?: boolean;
  active?: boolean;
  className?: string;
  children: ReactNode;
};

const ToolbarButton = ({
  title,
  onClick,
  disabled,
  active,
  className = "",
  children,
}: ToolbarButtonProps) => (
  <button
    type="button"
    title={title}
    disabled={disabled}
    onMouseDown={(e) => e.preventDefault()}
    onClick={onClick}
    className={`p-2 rounded-lg transition-colors disabled:opacity-40 ${className} ${
      active
        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
        : "text-slate-600 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700/80"
    }`}
  >
    {children}
  </button>
);

type HeadingMenuItemProps = {
  label: string;
  icon: ReactNode;
  active?: boolean;
  onClick: () => void;
};

const HeadingMenuItem = ({
  label,
  icon,
  active,
  onClick,
}: HeadingMenuItemProps) => (
  <button
    type="button"
    onMouseDown={(e) => e.preventDefault()}
    onClick={onClick}
    className={`flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-slate-100 dark:hover:bg-slate-700 ${
      active ? "text-blue-600 dark:text-blue-400 font-medium" : ""
    }`}
  >
    {icon}
    {label}
  </button>
);

export default RichTextEditor;
