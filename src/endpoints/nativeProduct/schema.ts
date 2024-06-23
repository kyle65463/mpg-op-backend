import { z } from "zod";

import { NativeProduct } from "@/models/nativeProduct";
import { RequestProps } from "@/utils/api/schema";
import { Region, Source } from "@/utils/enums";

// #################################
// List native products
// #################################
export const ListNativeProductsRequestQuery = z.object({
  limit: z.coerce.number().min(1).max(40).default(30).optional(),
  name: z.string().optional(),
  productId: z.coerce.number().int().optional(),
  noProductId: z.coerce.boolean().optional(),
  region: z.nativeEnum(Region),
  source: z.nativeEnum(Source).optional(),
  offset: z.coerce.number().optional(),
});

export type ListNativeProductsRequestQuery = z.infer<
  typeof ListNativeProductsRequestQuery
>;

export const ListNativeProductsRequest = {
  query: z
    .object({ nextKey: z.string() })
    .or(ListNativeProductsRequestQuery)
    .openapi({ param: { name: "query" } }),
};

export type ListNativeProductsRequest = RequestProps<
  typeof ListNativeProductsRequest
>;

export const ListNativeProductsResponse = z.object({
  items: NativeProduct.array(),
  nextKey: z.string().nullable(),
});

export type ListNativeProductsResponse = z.infer<
  typeof ListNativeProductsResponse
>;
