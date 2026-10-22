import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Image from "@tiptap/extension-image";
import { TextStyle } from "@tiptap/extension-text-style";
import TextAlign from "@tiptap/extension-text-align";
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
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  ImageIcon,
  Italic,
  Loader2,
  Link2,
  List,
  ListOrdered,
  Minus,
  Palette,
  Quote,
  Redo2,
  RemoveFormatting,
  SquareCode,
  Strikethrough,
  Underline as UnderlineIcon,
  Undo2,
} from "lucide-react";
import "@/features/new-feed/styles/rich-text.css";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

type UploadedEditorImage = {
  src: string;
  fileKey: string;
  alt?: string;
};

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
  /** Extra formatting used by the task description, matching the task form toolbar. */
  extended?: boolean;
  /** Upload a picked or pasted image and return the URL stored in the description. */
  uploadImage?: (file: File) => Promise<UploadedEditorImage>;
  onUploadingChange?: (uploading: boolean) => void;
};

const DescriptionImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      fileKey: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute("data-file-key"),
        renderHTML: (attributes: { fileKey?: string | null }) => {
          if (!attributes.fileKey) return {};
          return { "data-file-key": attributes.fileKey };
        },
      },
    };
  },
}).configure({
  HTMLAttributes: {
    class: "max-w-full h-auto rounded-lg",
  },
});

function isImageFile(file: File) {
  return (
    file.type.startsWith("image/") || /\.(png|jpe?g|webp|gif)$/i.test(file.name)
  );
}

function imageFilesFromList(list: FileList | null | undefined) {
  return Array.from(list ?? []).filter(isImageFile);
}

function imageFilesFromClipboard(data: DataTransfer | null) {
  const fromFiles = imageFilesFromList(data?.files);
  if (fromFiles.length > 0) return fromFiles;
  const fromItems: File[] = [];
  for (const item of Array.from(data?.items ?? [])) {
    if (item.kind !== "file" || !item.type.startsWith("image/")) continue;
    const file = item.getAsFile();
    if (file) fromItems.push(file);
  }
  return fromItems;
}

type ToolbarMenu = "heading" | "color" | "highlight" | "align";

const TEXT_COLORS = [
  { key: "default", value: "" },
  { key: "red", value: "#dc2626" },
  { key: "orange", value: "#ea580c" },
  { key: "yellow", value: "#ca8a04" },
  { key: "green", value: "#16a34a" },
  { key: "blue", value: "#2563eb" },
  { key: "purple", value: "#9333ea" },
];

const HIGHLIGHT_COLORS = [
  { key: "default", value: "" },
  { key: "yellow", value: "#fef08a" },
  { key: "orange", value: "#fed7aa" },
  { key: "green", value: "#bbf7d0" },
  { key: "blue", value: "#bfdbfe" },
  { key: "purple", value: "#e9d5ff" },
  { key: "red", value: "#fecaca" },
];

function isSafeHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

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
  extended = false,
  uploadImage,
  onUploadingChange,
}: RichTextEditorProps) => {
  const { t } = useTranslation();
  const effectivePlaceholder = placeholder ?? t("pages.posts.creatorPlaceholder");
  const [openMenu, setOpenMenu] = useState<ToolbarMenu | null>(null);
  const [mentionQuery, setMentionQuery] = useState<string | null>(null);
  const [mentionActiveIndex, setMentionActiveIndex] = useState(0);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const editorWrapRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const uploadImageRef = useRef(uploadImage);
  const onUploadingChangeRef = useRef(onUploadingChange);
  const insertImagesRef = useRef<(files: File[]) => Promise<void>>(async () => {});
  const [imageUploading, setImageUploading] = useState(false);
  uploadImageRef.current = uploadImage;
  onUploadingChangeRef.current = onUploadingChange;
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
      ...(extended
        ? [
            Highlight.configure({ multicolor: true }),
            TextAlign.configure({
              types: ["heading", "paragraph"],
            }),
            DescriptionImage,
          ]
        : []),
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
      handlePaste: (_view, event) => {
        if (!uploadImageRef.current) return false;
        const files = imageFilesFromClipboard(event.clipboardData);
        if (files.length === 0) return false;
        event.preventDefault();
        void insertImagesRef.current(files);
        return true;
      },
      handleDrop: (_view, event) => {
        if (!uploadImageRef.current) return false;
        const files = imageFilesFromList(event.dataTransfer?.files);
        if (files.length === 0) return false;
        event.preventDefault();
        void insertImagesRef.current(files);
        return true;
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

  useEffect(() => {
    onUploadingChangeRef.current?.(imageUploading);
  }, [imageUploading]);

  useEffect(() => {
    insertImagesRef.current = async (files: File[]) => {
      const upload = uploadImageRef.current;
      if (!editor || !upload || files.length === 0) return;
      setImageUploading(true);
      try {
        for (const file of files) {
          const uploaded = await upload(file);
          editor
            .chain()
            .focus()
            .insertContent({
              type: "image",
              attrs: {
                src: uploaded.src,
                alt: uploaded.alt ?? file.name,
                fileKey: uploaded.fileKey,
              },
            })
            .run();
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "";
        toast.error(message || t("pages.editor.imageUploadFailed"));
      } finally {
        setImageUploading(false);
      }
    };
  }, [editor, t]);

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
    const handleClickOutside = (event: MouseEvent) => {
      if (
        toolbarRef.current &&
        !toolbarRef.current.contains(event.target as Node)
      ) {
        setOpenMenu(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleMenu = (menu: ToolbarMenu) => {
    setOpenMenu((current) => (current === menu ? null : menu));
  };

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

  const setImage = () => {
    if (uploadImageRef.current) {
      imageInputRef.current?.click();
      return;
    }
    const url = window.prompt(t("pages.editor.enterImageUrl"), "https://");
    if (!url?.trim()) return;

    if (!isSafeHttpUrl(url.trim())) {
      window.alert(t("pages.editor.invalidImageUrl"));
      return;
    }

    editor.chain().focus().setImage({ src: url.trim() }).run();
  };

  const textAlign = editor.isActive({ textAlign: "center" })
    ? "center"
    : editor.isActive({ textAlign: "right" })
      ? "right"
      : editor.isActive({ textAlign: "justify" })
        ? "justify"
        : "left";

  const AlignIcon =
    textAlign === "center"
      ? AlignCenter
      : textAlign === "right"
        ? AlignRight
        : textAlign === "justify"
          ? AlignJustify
          : AlignLeft;

  const activeHeading = editor.isActive("heading", { level: 1 })
    ? "H1"
    : editor.isActive("heading", { level: 2 })
      ? "H2"
      : editor.isActive("heading", { level: 3 })
        ? "H3"
        : t("pages.editor.paragraph");

  const onPickImages = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    void insertImagesRef.current(files);
  };

  return (
    <div
      className={`rounded-xl border border-slate-200/80 dark:border-slate-700/80 ${className}`}
    >
      <input
        ref={imageInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={onPickImages}
      />
      <div
        ref={toolbarRef}
        className={`relative z-10 flex items-center gap-0.5 px-2 py-1.5 rounded-t-xl border-b border-slate-200/80 dark:border-slate-700/80 bg-slate-100/60 dark:bg-slate-800/40 ${extended ? "flex-nowrap" : "flex-wrap"}`}
      >
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

        <ToolbarDivider />

        <div className="relative">
          <ToolbarButton
            title={t("pages.editor.heading")}
            active={editor.isActive("heading") || openMenu === "heading"}
            onClick={() => toggleMenu("heading")}
            className="min-w-13 text-xs font-semibold"
          >
            {activeHeading}
          </ToolbarButton>
          {openMenu === "heading" && (
            <div className="absolute left-0 top-full mt-1 z-30 flex flex-col min-w-30 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg">
              <HeadingMenuItem
                label={t("pages.editor.paragraph")}
                icon={<span className="text-xs">P</span>}
                active={editor.isActive("paragraph")}
                onClick={() => {
                  editor.chain().focus().setParagraph().run();
                  setOpenMenu(null);
                }}
              />
              <HeadingMenuItem
                label={t("pages.editor.heading1")}
                icon={<Heading1 size={16} />}
                active={editor.isActive("heading", { level: 1 })}
                onClick={() => {
                  editor.chain().focus().toggleHeading({ level: 1 }).run();
                  setOpenMenu(null);
                }}
              />
              <HeadingMenuItem
                label={t("pages.editor.heading2")}
                icon={<Heading2 size={16} />}
                active={editor.isActive("heading", { level: 2 })}
                onClick={() => {
                  editor.chain().focus().toggleHeading({ level: 2 }).run();
                  setOpenMenu(null);
                }}
              />
              <HeadingMenuItem
                label={t("pages.editor.heading3")}
                icon={<Heading3 size={16} />}
                active={editor.isActive("heading", { level: 3 })}
                onClick={() => {
                  editor.chain().focus().toggleHeading({ level: 3 }).run();
                  setOpenMenu(null);
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

        <div className="relative">
          <ToolbarButton
            title={t("pages.editor.textColor")}
            active={openMenu === "color" || Boolean(editor.getAttributes("textStyle").color)}
            onClick={() => toggleMenu("color")}
          >
            <Palette size={16} />
          </ToolbarButton>
          {openMenu === "color" && (
            <ColorSwatches
              colors={TEXT_COLORS}
              label={(key) => t(`pages.editor.colors.${key}`)}
              onPick={(value) => {
                if (!value) {
                  editor.chain().focus().unsetColor().run();
                } else {
                  editor.chain().focus().setColor(value).run();
                }
                setOpenMenu(null);
              }}
            />
          )}
        </div>

        {extended && (
          <div className="relative">
            <ToolbarButton
              title={t("pages.editor.highlight")}
              active={openMenu === "highlight" || editor.isActive("highlight")}
              onClick={() => toggleMenu("highlight")}
            >
              <Highlighter size={16} />
            </ToolbarButton>
            {openMenu === "highlight" && (
              <ColorSwatches
                colors={HIGHLIGHT_COLORS}
                label={(key) => t(`pages.editor.colors.${key}`)}
                onPick={(value) => {
                  if (!value) {
                    editor.chain().focus().unsetHighlight().run();
                  } else {
                    editor.chain().focus().setHighlight({ color: value }).run();
                  }
                  setOpenMenu(null);
                }}
              />
            )}
          </div>
        )}

        <ToolbarDivider />

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

        {extended && (
          <div className="relative">
            <ToolbarButton
              title={t("pages.editor.align")}
              active={openMenu === "align" || textAlign !== "left"}
              onClick={() => toggleMenu("align")}
            >
              <AlignIcon size={16} />
            </ToolbarButton>
            {openMenu === "align" && (
              <div className="absolute left-0 top-full mt-1 z-30 flex flex-col min-w-36 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg">
                <HeadingMenuItem
                  label={t("pages.editor.alignLeft")}
                  icon={<AlignLeft size={16} />}
                  active={textAlign === "left"}
                  onClick={() => {
                    editor.chain().focus().setTextAlign("left").run();
                    setOpenMenu(null);
                  }}
                />
                <HeadingMenuItem
                  label={t("pages.editor.alignCenter")}
                  icon={<AlignCenter size={16} />}
                  active={textAlign === "center"}
                  onClick={() => {
                    editor.chain().focus().setTextAlign("center").run();
                    setOpenMenu(null);
                  }}
                />
                <HeadingMenuItem
                  label={t("pages.editor.alignRight")}
                  icon={<AlignRight size={16} />}
                  active={textAlign === "right"}
                  onClick={() => {
                    editor.chain().focus().setTextAlign("right").run();
                    setOpenMenu(null);
                  }}
                />
                <HeadingMenuItem
                  label={t("pages.editor.alignJustify")}
                  icon={<AlignJustify size={16} />}
                  active={textAlign === "justify"}
                  onClick={() => {
                    editor.chain().focus().setTextAlign("justify").run();
                    setOpenMenu(null);
                  }}
                />
              </div>
            )}
          </div>
        )}

        <ToolbarButton
          title={t("pages.editor.link")}
          active={editor.isActive("link")}
          onClick={setLink}
        >
          <Link2 size={16} />
        </ToolbarButton>

        {extended && (
          <>
            <ToolbarButton
              title={
                imageUploading
                  ? t("pages.editor.imageUploading")
                  : t("pages.editor.image")
              }
              disabled={imageUploading}
              onClick={setImage}
            >
              {imageUploading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <ImageIcon size={16} />
              )}
            </ToolbarButton>
            <ToolbarButton
              title={t("pages.editor.code")}
              active={editor.isActive("code")}
              onClick={() => editor.chain().focus().toggleCode().run()}
            >
              <Code size={16} />
            </ToolbarButton>
            <ToolbarButton
              title={t("pages.editor.codeBlock")}
              active={editor.isActive("codeBlock")}
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            >
              <SquareCode size={16} />
            </ToolbarButton>
            <ToolbarButton
              title={t("pages.editor.quote")}
              active={editor.isActive("blockquote")}
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
            >
              <Quote size={16} />
            </ToolbarButton>
            <ToolbarButton
              title={t("pages.editor.horizontalRule")}
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
            >
              <Minus size={16} />
            </ToolbarButton>
            <ToolbarButton
              title={t("pages.editor.clearFormatting")}
              onClick={() =>
                editor.chain().focus().unsetAllMarks().clearNodes().run()
              }
            >
              <RemoveFormatting size={16} />
            </ToolbarButton>
          </>
        )}
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

const ToolbarDivider = () => (
  <span className="w-px h-5 bg-slate-300 dark:bg-slate-600 mx-0.5" />
);

const ColorSwatches = ({
  colors,
  label,
  onPick,
}: {
  colors: { key: string; value: string }[];
  label: (key: string) => string;
  onPick: (value: string) => void;
}) => (
  <div className="absolute left-0 top-full mt-1 z-30 flex flex-wrap gap-1.5 p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg w-[180px]">
    {colors.map((color) => (
      <button
        key={color.key}
        type="button"
        title={label(color.key)}
        onMouseDown={(event) => event.preventDefault()}
        onClick={() => onPick(color.value)}
        className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${
          color.value
            ? "border-slate-200 dark:border-slate-600"
            : "border-dashed border-slate-400 bg-white dark:bg-slate-700"
        }`}
        style={color.value ? { backgroundColor: color.value } : undefined}
      />
    ))}
  </div>
);

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
