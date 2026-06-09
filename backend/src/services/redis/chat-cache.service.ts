import { getRedis, isRedisEnabled } from "@/shared/utils/redis";
import prisma from "@/shared/utils/prisma";

export const CHAT_CACHE_TTL = {
  CONVERSATIONS: 60,
  MESSAGES: 30,
  CONVERSATION_DETAIL: 60,
} as const;

const conversationsKey = (
  userId: number,
  filter: string,
  page: number,
  limit: number,
) => `chat:conversations:${userId}:${filter}:${page}:${limit}`;

const messagesKey = (
  conversationId: number,
  cursor: number | "first",
  limit: number,
) => `chat:messages:${conversationId}:${cursor}:${limit}`;

const conversationDetailKey = (conversationId: number, userId: number) =>
  `chat:conversation:${conversationId}:${userId}`;

const conversationsPattern = (userId: number) =>
  `chat:conversations:${userId}:*`;

const messagesPattern = (conversationId: number) =>
  `chat:messages:${conversationId}:*`;

const conversationDetailPattern = (conversationId: number) =>
  `chat:conversation:${conversationId}:*`;

const deleteByPattern = async (pattern: string): Promise<void> => {
  const redis = getRedis();
  if (!redis) return;

  const keys: string[] = [];
  for await (const key of redis.scanIterator({ MATCH: pattern, COUNT: 100 })) {
    keys.push(String(key));
  }

  if (keys.length > 0) {
    await Promise.all(keys.map((key) => redis.del(key)));
  }
};

export const getCachedJson = async <T>(key: string): Promise<T | null> => {
  if (!isRedisEnabled()) return null;

  const redis = getRedis();
  if (!redis) return null;

  const raw = await redis.get(key);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as T;
  } catch {
    await redis.del(key);
    return null;
  }
};

export const setCachedJson = async <T>(
  key: string,
  value: T,
  ttlSeconds: number,
): Promise<void> => {
  if (!isRedisEnabled()) return;

  const redis = getRedis();
  if (!redis) return;

  await redis.setEx(key, ttlSeconds, JSON.stringify(value));
};

export const getCachedConversations = async <T>(
  userId: number,
  filter: string,
  page: number,
  limit: number,
): Promise<T | null> =>
  getCachedJson<T>(conversationsKey(userId, filter, page, limit));

export const setCachedConversations = async <T>(
  userId: number,
  filter: string,
  page: number,
  limit: number,
  value: T,
): Promise<void> =>
  setCachedJson(
    conversationsKey(userId, filter, page, limit),
    value,
    CHAT_CACHE_TTL.CONVERSATIONS,
  );

export const getCachedMessages = async <T>(
  conversationId: number,
  cursor: number | undefined,
  limit: number,
): Promise<T | null> =>
  getCachedJson<T>(messagesKey(conversationId, cursor ?? "first", limit));

export const setCachedMessages = async <T>(
  conversationId: number,
  cursor: number | undefined,
  limit: number,
  value: T,
): Promise<void> =>
  setCachedJson(
    messagesKey(conversationId, cursor ?? "first", limit),
    value,
    CHAT_CACHE_TTL.MESSAGES,
  );

export const getCachedConversationDetail = async <T>(
  conversationId: number,
  userId: number,
): Promise<T | null> =>
  getCachedJson<T>(conversationDetailKey(conversationId, userId));

export const setCachedConversationDetail = async <T>(
  conversationId: number,
  userId: number,
  value: T,
): Promise<void> =>
  setCachedJson(
    conversationDetailKey(conversationId, userId),
    value,
    CHAT_CACHE_TTL.CONVERSATION_DETAIL,
  );

export const invalidateUserConversations = async (
  userId: number,
): Promise<void> => deleteByPattern(conversationsPattern(userId));

export const invalidateConversationMessages = async (
  conversationId: number,
): Promise<void> => deleteByPattern(messagesPattern(conversationId));

export const invalidateConversationDetail = async (
  conversationId: number,
): Promise<void> => deleteByPattern(conversationDetailPattern(conversationId));

export const invalidateConversationForMembers = async (
  conversationId: number,
  memberUserIds: number[],
): Promise<void> => {
  await Promise.all([
    invalidateConversationMessages(conversationId),
    invalidateConversationDetail(conversationId),
    ...memberUserIds.map((userId) => invalidateUserConversations(userId)),
  ]);
};

export const getConversationMemberUserIds = async (
  conversationId: number,
): Promise<number[]> => {
  const members = await prisma.conversationMember.findMany({
    where: { conversationId, leftAt: null },
    select: { userId: true },
  });
  return members.map((member) => member.userId);
};
