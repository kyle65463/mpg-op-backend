import { beforeAll, beforeEach, describe, expect, it, Mock, vi } from "vitest";

import { env } from "@/utils/env";

import { createRedisClient, RedisClient } from "./redis";

describe("RedisClient", () => {
  let redis: RedisClient;

  beforeAll(() => {
    redis = createRedisClient({
      host: env.redisUrl,
      password: env.redisPassword,
      dbIndex: env.redisDbIndex,
    });
  });

  beforeEach(async () => {
    await redis.clearAll();
  });

  describe("getOrSet", () => {
    let key: string;
    let mockValue: string;
    let mockGet: Mock;

    beforeEach(() => {
      key = "test";
      mockValue = "test";
      mockGet = vi.fn(async () => mockValue);
    });

    describe("already in cache", () => {
      beforeEach(async () => {
        await redis.set(key, mockValue);
      });

      it("should get value", async () => {
        const value = await redis.getOrSet({
          key: key,
          get: mockGet,
        });

        expect(value).toBe(mockValue);
      });

      it("should not call get", async () => {
        await redis.getOrSet({
          key: key,
          get: mockGet,
        });

        expect(mockGet).not.toHaveBeenCalled();
      });
    });

    describe("not in cache", () => {
      it("should get value", async () => {
        const value = await redis.getOrSet({
          key: key,
          get: mockGet,
        });

        expect(value).toBe(mockValue);
      });

      it("should call get", async () => {
        await redis.getOrSet({
          key: key,
          get: mockGet,
        });

        expect(mockGet).toHaveBeenCalledOnce();
      });

      it("should set cache", async () => {
        await redis.getOrSet({
          key: key,
          get: mockGet,
        });

        const value = await redis.get(key);
        expect(value).toBe(mockValue);
      });
    });
  });

  describe("mgetOrMset", () => {
    let keys: string[];
    let mockValues: string[];
    let mockGetMany: Mock;

    beforeEach(() => {
      keys = ["key1", "key2", "key3", "key4"];
      mockValues = ["value1", "value2", "value3", "value4"];
      const keyValueMap = {
        [keys[0]]: mockValues[0],
        [keys[1]]: mockValues[1],
        [keys[2]]: mockValues[2],
        [keys[3]]: mockValues[3],
      };
      mockGetMany = vi.fn(async (keys: string[]) =>
        keys.map((key) => ({ key, value: keyValueMap[key] })),
      );
    });

    describe("all already in cache", () => {
      beforeEach(async () => {
        for (let i = 0; i < keys.length; i++) {
          await redis.set(keys[i], mockValues[i]);
        }
      });

      it("should get values", async () => {
        const values = await redis.mgetOrMset({
          keys: keys,
          getMany: mockGetMany,
        });

        expect(values).toEqual(mockValues);
      });

      it("should not call getMany", async () => {
        await redis.mgetOrMset({
          keys: keys,
          getMany: mockGetMany,
        });

        expect(mockGetMany).not.toHaveBeenCalled();
      });
    });

    describe("partial in cache", () => {
      beforeEach(async () => {
        // Only set 2 keys
        for (let i = 1; i < 3; i++) {
          await redis.set(keys[i], mockValues[i]);
        }
      });

      it("should get values", async () => {
        const values = await redis.mgetOrMset({
          keys: keys,
          getMany: mockGetMany,
        });

        expect(values).toEqual(mockValues);
      });

      it("should call getMany", async () => {
        await redis.mgetOrMset({
          keys: keys,
          getMany: mockGetMany,
        });

        expect(mockGetMany).toHaveBeenCalledWith([keys[0], keys[3]]);
      });

      it("should set cache", async () => {
        await redis.mgetOrMset({
          keys: keys,
          getMany: mockGetMany,
        });

        for (let i = 0; i < keys.length; i++) {
          const value = await redis.get(keys[i]);
          expect(value).toBe(mockValues[i]);
        }
      });
    });

    describe("not in cache", () => {
      it("should get values", async () => {
        const values = await redis.mgetOrMset({
          keys: keys,
          getMany: mockGetMany,
        });

        expect(values).toEqual(mockValues);
      });

      it("should call getMany", async () => {
        await redis.mgetOrMset({
          keys: keys,
          getMany: mockGetMany,
        });

        expect(mockGetMany).toHaveBeenCalledWith(keys);
      });

      it("should set cache", async () => {
        await redis.mgetOrMset({
          keys: keys,
          getMany: mockGetMany,
        });

        for (let i = 0; i < keys.length; i++) {
          const value = await redis.get(keys[i]);
          expect(value).toBe(mockValues[i]);
        }
      });
    });
  });
});
