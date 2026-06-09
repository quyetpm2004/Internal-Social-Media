import { createClient, type RedisClientType } from "redis";
import { env } from "@/configs/env";

let cacheClient: RedisClientType | null = null;
let pubClient: RedisClientType | null = null;
let subClient: RedisClientType | null = null;

export const isRedisEnabled = (): boolean => Boolean(env.redisUrl);

export const getRedis = (): RedisClientType | null => cacheClient;

export const getRedisPubSub = (): {
  pubClient: RedisClientType;
  subClient: RedisClientType;
} | null => {
  if (!pubClient || !subClient) return null;
  return { pubClient, subClient };
};

export const connectRedis = async (): Promise<boolean> => {
  if (!env.redisUrl) {
    console.warn(
      "REDIS_URL chưa cấu hình — dùng in-memory fallback cho presence/cache",
    );
    return false;
  }

  cacheClient = createClient({ url: env.redisUrl });
  pubClient = createClient({ url: env.redisUrl });
  subClient = pubClient.duplicate();

  cacheClient.on("error", (error) => {
    console.error("Redis cache client error:", error);
  });
  pubClient.on("error", (error) => {
    console.error("Redis pub client error:", error);
  });
  subClient.on("error", (error) => {
    console.error("Redis sub client error:", error);
  });

  await Promise.all([
    cacheClient.connect(),
    pubClient.connect(),
    subClient.connect(),
  ]);

  console.log("Redis connected successfully");
  return true;
};

export const disconnectRedis = async (): Promise<void> => {
  await Promise.all(
    [cacheClient, pubClient, subClient]
      .filter((client): client is RedisClientType => client !== null)
      .map((client) => client.quit()),
  );

  cacheClient = null;
  pubClient = null;
  subClient = null;
};
