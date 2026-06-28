/** Format cũ: @[Tên](id) */
const LEGACY_MENTION_TOKEN_REGEX = /@\[([^\]]+)\]\((\d+)\)/g;

/** Format cũ: @Tên\u2063id\u2063 — id dính sát tên trên UI */
const MENTION_ID_MARKER = "\u2063";
const MARKER_MENTION_TOKEN_REGEX = new RegExp(
  `@([^@${MENTION_ID_MARKER}\\[\\n]+)${MENTION_ID_MARKER}(\\d+)${MENTION_ID_MARKER}`,
  "g",
);

const ENCODED_MENTION_REGEX = new RegExp(
  `@\\[([^\\]]+)\\]\\((\\d+)\\)|@([^@${MENTION_ID_MARKER}\\[\\n]+)${MENTION_ID_MARKER}(\\d+)${MENTION_ID_MARKER}`,
  "g",
);

export type MentionUser = {
  id: number;
  fullName: string;
  email?: string | null;
  avatarUrl?: string | null;
};

export const MENTION_ALL_SENTINEL_ID = -1;
export const MENTION_ALL_DATA_ID = "all";
export const MENTION_ALL_LABEL = "all";
export const MENTION_ALL_TOKEN = `@${MENTION_ALL_LABEL}`;
const MENTION_ALL_REGEX = /@all(?=$|\s|[.,!?;:])/i;

export const isMentionAllSearchUser = (user: { id: number }) =>
  user.id === MENTION_ALL_SENTINEL_ID;

export const textIncludesMentionAll = (text: string) =>
  MENTION_ALL_REGEX.test(text);

export const matchesMentionAllQuery = (query: string) => {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  return "all".startsWith(normalized);
};

export const createMentionAllSearchUser = (): MentionUser => ({
  id: MENTION_ALL_SENTINEL_ID,
  fullName: MENTION_ALL_LABEL,
  email: null,
  avatarUrl: null,
});

export const getMentionAllCandidateIds = (
  candidates: MentionUser[],
  excludeUserId?: number,
) =>
  candidates
    .filter((user) => user.id !== excludeUserId)
    .map((user) => user.id);

export type TrackedMention = {
  id: number;
  fullName: string;
};

export type MentionRef = TrackedMention;

export type MentionSegment =
  | { type: "text"; value: string }
  | { type: "mention"; userId: number; label: string };

export const buildMentionLabel = (user: Pick<MentionUser, "fullName">) =>
  `@${user.fullName}`;

export const buildMentionToken = (user: MentionUser) => buildMentionLabel(user);

export const normalizeMentionRefs = (mentions: unknown): MentionRef[] => {
  if (!Array.isArray(mentions)) return [];

  return mentions.flatMap((item) => {
    const row = item as {
      mentionedUser?: { id: number; fullName: string };
      id?: number;
      fullName?: string;
    };

    const user = row.mentionedUser ?? row;
    if (!user?.id || !user.fullName) return [];

    return [{ id: user.id, fullName: user.fullName }];
  });
};

export const mapGroupMembersToMentionCandidates = (
  members: Array<{
    user: Pick<MentionUser, "id" | "fullName" | "email" | "avatarUrl">;
  }>,
): MentionUser[] =>
  members.map((member) => ({
    id: member.user.id,
    fullName: member.user.fullName,
    email: member.user.email ?? null,
    avatarUrl: member.user.avatarUrl ?? null,
  }));

export const filterLocalMentionCandidates = (
  candidates: MentionUser[],
  query: string,
  excludeUserId?: number,
  limit = 8,
): MentionUser[] => {
  const normalized = query.trim().toLowerCase();

  let list = candidates.filter((user) => user.id !== excludeUserId);

  if (normalized) {
    list = list.filter((user) => {
      const name = user.fullName.toLowerCase();
      const email = user.email?.toLowerCase() ?? "";
      return name.includes(normalized) || email.includes(normalized);
    });
  }

  return list.slice(0, limit);
};

export const buildMentionAutocompleteUsers = (
  users: MentionUser[],
  options: {
    query: string | null;
    allowMentionAll?: boolean;
  },
): MentionUser[] => {
  if (options.query == null) return users;

  const list = [...users];
  if (
    options.allowMentionAll &&
    matchesMentionAllQuery(options.query) &&
    !list.some((user) => isMentionAllSearchUser(user))
  ) {
    list.unshift(createMentionAllSearchUser());
  }

  return list;
};

export const extractMentionMetaFromEncodedContent = (
  text: string,
): TrackedMention[] => {
  const mentions: TrackedMention[] = [];
  const regex = new RegExp(ENCODED_MENTION_REGEX.source, "g");
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const legacyName = match[1];
    const legacyId = match[2];
    mentions.push({
      fullName: legacyName ?? match[3],
      id: Number(legacyId ?? match[4]),
    });
  }

  return mentions;
};

export const syncTrackedMentions = (
  text: string,
  tracked: TrackedMention[],
): TrackedMention[] => {
  const merged = new Map<number, TrackedMention>();

  for (const mention of [
    ...tracked,
    ...extractMentionMetaFromEncodedContent(text),
  ]) {
    if (text.includes(buildMentionLabel(mention))) {
      merged.set(mention.id, mention);
    }
  }

  return [...merged.values()];
};

export const resolveMentionedUserIds = (
  text: string,
  tracked: TrackedMention[],
): number[] => syncTrackedMentions(text, tracked).map((mention) => mention.id);

const parseEncodedMentionSegments = (content: string): MentionSegment[] => {
  const nodes: MentionSegment[] = [];
  const regex = new RegExp(ENCODED_MENTION_REGEX.source, "g");
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      nodes.push({
        type: "text",
        value: content.slice(lastIndex, match.index),
      });
    }

    const legacyName = match[1];
    const legacyId = match[2];
    nodes.push({
      type: "mention",
      label: legacyName ?? match[3],
      userId: Number(legacyId ?? match[4]),
    });

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    nodes.push({ type: "text", value: content.slice(lastIndex) });
  }

  return nodes;
};

const parsePlainMentionsInText = (
  text: string,
  known: MentionRef[],
): MentionSegment[] => {
  if (!text) return [];

  if (!known.length) {
    return [{ type: "text", value: text }];
  }

  const sorted = [...known].sort(
    (a, b) => b.fullName.length - a.fullName.length,
  );
  const nodes: MentionSegment[] = [];
  let cursor = 0;

  while (cursor < text.length) {
    const atIndex = text.indexOf("@", cursor);

    if (atIndex === -1) {
      nodes.push({ type: "text", value: text.slice(cursor) });
      break;
    }

    if (atIndex > cursor) {
      nodes.push({ type: "text", value: text.slice(cursor, atIndex) });
    }

    let matched: MentionRef | null = null;

    if (text.startsWith(MENTION_ALL_TOKEN, atIndex)) {
      nodes.push({
        type: "mention",
        userId: MENTION_ALL_SENTINEL_ID,
        label: MENTION_ALL_LABEL,
      });
      cursor = atIndex + MENTION_ALL_TOKEN.length;
      continue;
    }

    for (const mention of sorted) {
      const label = buildMentionLabel(mention);
      if (text.startsWith(label, atIndex)) {
        matched = mention;
        break;
      }
    }

    if (matched) {
      nodes.push({
        type: "mention",
        userId: matched.id,
        label: matched.fullName,
      });
      cursor = atIndex + buildMentionLabel(matched).length;
    } else {
      nodes.push({ type: "text", value: "@" });
      cursor = atIndex + 1;
    }
  }

  return nodes;
};

export const parseMentionSegments = (
  content: string,
  knownMentions?: MentionRef[],
): MentionSegment[] => {
  const encoded = parseEncodedMentionSegments(content);

  if (!encoded.length) {
    return knownMentions?.length
      ? parsePlainMentionsInText(content, knownMentions)
      : content
        ? [{ type: "text", value: content }]
        : [];
  }

  if (!knownMentions?.length) {
    return encoded;
  }

  return encoded.flatMap((segment) =>
    segment.type === "mention"
      ? [segment]
      : parsePlainMentionsInText(segment.value, knownMentions),
  );
};

export const extractMentionedUserIds = (
  text: string,
  tracked: TrackedMention[] = [],
): number[] => {
  if (tracked.length > 0) {
    return resolveMentionedUserIds(text, tracked);
  }

  const ids = new Set<number>();
  for (const segment of parseMentionSegments(text)) {
    if (segment.type === "mention") {
      ids.add(segment.userId);
    }
  }
  return [...ids];
};

export const extractMentionedUserIdsFromHtml = (html: string): number[] => {
  if (!html?.trim()) return [];

  const doc = new DOMParser().parseFromString(html, "text/html");
  const spans = doc.querySelectorAll("[data-mention-id]");
  const ids = new Set<number>();

  spans.forEach((span) => {
    const rawId = span.getAttribute("data-mention-id");
    if (rawId === MENTION_ALL_DATA_ID) return;

    const id = Number(rawId);
    if (Number.isInteger(id) && id > 0) {
      ids.add(id);
    }
  });

  return [...ids];
};

export const extractMentionAllFromHtml = (html: string): boolean => {
  if (!html?.trim()) return false;

  const doc = new DOMParser().parseFromString(html, "text/html");
  return Boolean(
    doc.querySelector(`[data-mention-id="${MENTION_ALL_DATA_ID}"]`),
  );
};

export const extractMentionPayloadFromHtml = (html: string) => ({
  mentionedUserIds: extractMentionedUserIdsFromHtml(html),
  mentionAll: extractMentionAllFromHtml(html),
});

export const extractMentionPayloadFromText = (
  text: string,
  tracked: TrackedMention[] = [],
) => ({
  mentionedUserIds: textIncludesMentionAll(text)
    ? []
    : resolveMentionedUserIds(text, tracked),
  mentionAll: textIncludesMentionAll(text),
});

export const buildMentionAllHtml = () =>
  `<span data-mention-id="${MENTION_ALL_DATA_ID}" class="mention-tag mention-all">${MENTION_ALL_TOKEN}</span>&nbsp;`;

export const buildMentionHtml = (user: MentionUser) =>
  `<span data-mention-id="${user.id}" class="mention-tag">@${user.fullName}</span>&nbsp;`;

export const containsMentionHtml = (content: string) =>
  /<span[^>]*data-mention-id/i.test(content);

export const hasMentionTokens = (content: string) =>
  LEGACY_MENTION_TOKEN_REGEX.test(content) ||
  MARKER_MENTION_TOKEN_REGEX.test(content) ||
  content.includes("@");

export const replaceMentionTokensWithHtml = (content: string) =>
  content
    .replace(
      LEGACY_MENTION_TOKEN_REGEX,
      (_match, name, id) =>
        `<span data-mention-id="${id}" class="mention-tag">@${name}</span>`,
    )
    .replace(
      MARKER_MENTION_TOKEN_REGEX,
      (_match, name, id) =>
        `<span data-mention-id="${id}" class="mention-tag">@${name}</span>`,
    );

export const getMentionQueryAtCursor = (
  text: string,
  cursor: number,
): { query: string; start: number } | null => {
  const before = text.slice(0, cursor);
  const match = before.match(/@([\w\u00C0-\u1EF9\s.]*)$/i);
  if (!match) return null;

  return {
    query: match[1],
    start: cursor - match[0].length,
  };
};

export const insertMentionToken = (
  text: string,
  cursor: number,
  user: MentionUser,
): { nextText: string; nextCursor: number } => {
  const mentionInfo = getMentionQueryAtCursor(text, cursor);
  const token = `${buildMentionToken(user)} `;

  if (!mentionInfo) {
    return {
      nextText: `${text.slice(0, cursor)}${token}${text.slice(cursor)}`,
      nextCursor: cursor + token.length,
    };
  }

  const nextText =
    text.slice(0, mentionInfo.start) + token + text.slice(cursor);

  return {
    nextText,
    nextCursor: mentionInfo.start + token.length,
  };
};

export const insertMentionAllToken = (
  text: string,
  cursor: number,
): { nextText: string; nextCursor: number } => {
  const mentionInfo = getMentionQueryAtCursor(text, cursor);
  const token = `${MENTION_ALL_TOKEN} `;

  if (!mentionInfo) {
    return {
      nextText: `${text.slice(0, cursor)}${token}${text.slice(cursor)}`,
      nextCursor: cursor + token.length,
    };
  }

  const nextText =
    text.slice(0, mentionInfo.start) + token + text.slice(cursor);

  return {
    nextText,
    nextCursor: mentionInfo.start + token.length,
  };
};
