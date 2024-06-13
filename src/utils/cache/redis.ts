import { Redis } from "ioredis";

/**
 * 在 JSON.parse 時，把時間字串轉換成 Date 物件
 */
const dateReviver = (key: string, value: unknown) => {
  if (typeof value === "string") {
    const dateRegex =
      /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}).(\d{3})Z$/;
    const match = dateRegex.exec(value);
    if (match) {
      return new Date(
        Date.UTC(
          parseInt(match[1], 10),
          parseInt(match[2], 10) - 1,
          parseInt(match[3], 10),
          parseInt(match[4], 10),
          parseInt(match[5], 10),
          parseInt(match[6], 10),
          parseInt(match[7], 10),
        ),
      );
    }
  }
  return value;
};

interface RedisClientConfig {
  /**
   * e.g. "192.168.70.200"
   */
  host: string;
  password: string;

  /**
   * Redis 的 logical database index，預設為 0
   * @see https://redis.io/commands/select/
   */
  dbIndex: number;
}

export function createRedisClient({
  host,
  password,
  dbIndex,
}: RedisClientConfig) {
  const redis = new Redis({
    host,
    password,
    db: dbIndex,
    maxRetriesPerRequest: 1,
    retryStrategy: (times) => {
      return Math.min(times * 50, 2000);
    },
  });

  return {
    get: async <T>(key: string): Promise<T> => {
      const value = await redis.get(key);
      if (value) {
        return JSON.parse(value, dateReviver);
      }
      return value as T;
    },

    set: async <T>(key: string, value: T, ttl?: number): Promise<void> => {
      if (ttl) {
        await redis.set(key, JSON.stringify(value), "EX", ttl);
      } else {
        await redis.set(key, JSON.stringify(value));
      }
    },

    delete: async (key: string): Promise<void> => {
      await redis.del(key);
    },

    clearAll: async (): Promise<void> => {
      await redis.flushall();
    },

    /**
     * 嘗試從 cache 取得資料，若沒有資料則執行 get() 取得資料，並存入 cache
     */
    getOrSet: async <T>({
      key,
      ttl,
      get,
    }: {
      key: string;
      ttl?: number;
      get: () => Promise<T>;
    }): Promise<T> => {
      // TODO: Add lock to prevent cache stampede
      // 先從 cache 取得資料，若有資料則回傳
      const cachedValue = await redis.get(key);
      if (cachedValue) return JSON.parse(cachedValue, dateReviver) as T;

      // 若沒有資料，則執行 get() 取得資料，並存入 cache
      const value = await get();
      const jsonValue = JSON.stringify(value);
      if (ttl) {
        await redis.set(key, jsonValue, "EX", ttl);
      } else {
        await redis.set(key, jsonValue);
      }

      return value;
    },

    mgetOrMset: async <T>({
      keys,
      ttl,
      getMany,
    }: {
      keys: string[];
      ttl?: number;
      getMany: (keys: string[]) => Promise<{ key: string; value: T }[]>;
    }): Promise<T[]> => {
      if (keys.length === 0) return [];

      // 先從 cache 用 mget 取得資料
      const cachedValues = await redis.mget(keys);
      const results: { [key: string]: T } = {};
      const uncachedKeys: string[] = [];
      for (let i = 0; i < keys.length; i++) {
        const value = cachedValues[i];
        if (value) {
          results[keys[i]] = JSON.parse(value, dateReviver) as T;
        } else {
          uncachedKeys.push(keys[i]);
        }
      }

      // 若所有資料都在 cache 中，則直接回傳
      if (uncachedKeys.length === 0) {
        return keys
          .map((key) => results[key])
          .filter((value) => value !== undefined || value !== null);
      }

      // 執行 getMany() 取得不在 cache 的資料，並用 mset 存入 cache
      const fetchedValues = await getMany(uncachedKeys);
      const msetArgs = [];

      for (const item of fetchedValues) {
        results[item.key] = item.value;
        if (ttl) {
          msetArgs.push(
            item.key,
            JSON.stringify(item.value),
            "EX",
            ttl.toString(),
          );
        } else {
          msetArgs.push(item.key, JSON.stringify(item.value));
        }
      }

      if (msetArgs.length > 0) {
        await redis.mset(...msetArgs);
      }

      return keys
        .map((key) => results[key])
        .filter((value) => value !== undefined && value !== null);
    },
  };
}

export type RedisClient = ReturnType<typeof createRedisClient>;
