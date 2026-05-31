import { getRedis, isRedisEnabled } from "../../utils/redis";

const PRESENCE_CONN_TTL_SECONDS = 120;

const presenceKey = (userId: number) => `presence:user:${userId}:sockets`;
const connKey = (socketId: string) => `presence:conn:${socketId}`;

// Fallback khi Redis chưa bật
const inMemorySockets = new Map<number, Set<string>>();

const pruneStaleRedisSockets = async (userId: number): Promise<boolean> => {
  const redis = getRedis();
  if (!redis) return false;

  const socketIds = await redis.sMembers(presenceKey(userId));
  if (socketIds.length === 0) return false;

  let hasAlive = false;
  for (const socketId of socketIds) {
    const alive = (await redis.exists(connKey(socketId))) === 1;
    if (alive) {
      hasAlive = true;
    } else {
      await redis.sRem(presenceKey(userId), socketId);
    }
  }

  if (!hasAlive) {
    await redis.del(presenceKey(userId));
  }

  return hasAlive;
};

export const addUserSocket = async (
  userId: number,
  socketId: string,
): Promise<boolean> => {
  if (!isRedisEnabled()) {
    let sockets = inMemorySockets.get(userId);
    if (!sockets) {
      sockets = new Set();
      inMemorySockets.set(userId, sockets);
    }
    const isFirstConnection = sockets.size === 0;
    sockets.add(socketId);
    return isFirstConnection;
  }

  const redis = getRedis();
  if (!redis) return false;

  const countBefore = await redis.sCard(presenceKey(userId));
  await redis.sAdd(presenceKey(userId), socketId);
  await redis.set(connKey(socketId), String(userId), {
    EX: PRESENCE_CONN_TTL_SECONDS,
  });
  return countBefore === 0;
};

export const refreshSocketPresence = async (
  userId: number,
  socketId: string,
): Promise<void> => {
  if (!isRedisEnabled()) return;

  const redis = getRedis();
  if (!redis) return;

  await redis.set(connKey(socketId), String(userId), {
    EX: PRESENCE_CONN_TTL_SECONDS,
  });
};

export const removeUserSocket = async (
  userId: number,
  socketId: string,
): Promise<boolean> => {
  if (!isRedisEnabled()) {
    const sockets = inMemorySockets.get(userId);
    if (!sockets) return false;

    sockets.delete(socketId);
    if (sockets.size > 0) return false;

    inMemorySockets.delete(userId);
    return true;
  }

  const redis = getRedis();
  if (!redis) return false;

  await redis.del(connKey(socketId));
  await redis.sRem(presenceKey(userId), socketId);
  const remaining = await redis.sCard(presenceKey(userId));
  if (remaining === 0) {
    await redis.del(presenceKey(userId));
    return true;
  }

  return false;
};

export const clearUserPresence = async (userId: number): Promise<void> => {
  if (!isRedisEnabled()) {
    inMemorySockets.delete(userId);
    return;
  }

  const redis = getRedis();
  if (!redis) return;

  const socketIds = await redis.sMembers(presenceKey(userId));
  if (socketIds.length > 0) {
    await Promise.all(socketIds.map((id) => redis.del(connKey(id))));
  }
  await redis.del(presenceKey(userId));
};

export const isUserOnline = async (userId: number): Promise<boolean> => {
  if (!isRedisEnabled()) {
    return inMemorySockets.has(userId);
  }

  return pruneStaleRedisSockets(userId);
};

export const filterOnlineUserIds = async (
  userIds: number[],
): Promise<number[]> => {
  if (userIds.length === 0) return [];

  if (!isRedisEnabled()) {
    return userIds.filter((id) => inMemorySockets.has(id));
  }

  const results = await Promise.all(
    userIds.map(async (userId) => ({
      userId,
      online: await isUserOnline(userId),
    })),
  );

  return results.filter((item) => item.online).map((item) => item.userId);
};

export const getAllOnlineUserIds = async (): Promise<number[]> => {
  if (!isRedisEnabled()) {
    return Array.from(inMemorySockets.keys());
  }

  const redis = getRedis();
  if (!redis) return [];

  const keys: string[] = [];
  for await (const key of redis.scanIterator({
    MATCH: "presence:user:*:sockets",
    COUNT: 100,
  })) {
    keys.push(String(key));
  }

  const userIds = keys
    .map((key) => {
      const match = key.match(/^presence:user:(\d+):sockets$/);
      return match ? Number(match[1]) : null;
    })
    .filter((id): id is number => id !== null);

  const online: number[] = [];
  for (const userId of userIds) {
    if (await isUserOnline(userId)) {
      online.push(userId);
    }
  }

  return online;
};
