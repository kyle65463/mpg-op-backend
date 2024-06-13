import { z, ZodSchema } from "zod";

import { ServiceError } from "@/utils/error/service";

export function hasNextKey(
  item: Record<string, unknown> | { nextKey: string },
): item is { nextKey: string } {
  return "nextKey" in item;
}

export function encodeNextKey(options: Record<string, unknown>) {
  return Buffer.from(JSON.stringify(options)).toString("base64");
}

export function decodeNextKey<T extends ZodSchema>(
  nextKey: string,
  schema: T,
): z.infer<T> {
  try {
    const decoded = Buffer.from(nextKey, "base64").toString();
    return schema.parse(JSON.parse(decoded));
  } catch {
    throw ServiceError.InvalidNextKey;
  }
}
