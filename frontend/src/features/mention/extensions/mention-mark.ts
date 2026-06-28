import { Mark, mergeAttributes } from "@tiptap/core";

export const MentionMark = Mark.create({
  name: "mention",
  inclusive: false,
  priority: 101,

  addAttributes() {
    return {
      userId: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-mention-id"),
        renderHTML: (attributes) => {
          if (!attributes.userId) {
            return {};
          }

          return { "data-mention-id": String(attributes.userId) };
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: "span[data-mention-id]" }];
  },

  renderHTML({ HTMLAttributes }) {
    const isMentionAll = HTMLAttributes["data-mention-id"] === "all";

    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        class: isMentionAll ? "mention-tag mention-all" : "mention-tag",
      }),
      0,
    ];
  },
});
