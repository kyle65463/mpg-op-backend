import { z } from "zod";

import { Order } from "@/models/order";
import { RequestProps } from "@/utils/api/schema";
import { Region } from "@/utils/enums";

// #################################
// Get order
// #################################
export const GetOrderRequest = {
  params: z.object({
    id: z.coerce.number().int(),
  }),
};

export type GetOrderRequest = RequestProps<typeof GetOrderRequest>;

// #################################
// List orders
// #################################
export const ListOrdersRequestQuery = z.object({
  region: z.nativeEnum(Region),
  limit: z.coerce.number().min(1).max(40).default(30).optional(),
  offset: z.coerce.number().int().optional(),
});

export type ListOrdersRequestQuery = z.infer<typeof ListOrdersRequestQuery>;

export const ListOrdersRequest = {
  query: z
    .object({ nextKey: z.string() })
    .or(ListOrdersRequestQuery)
    .openapi({ param: { name: "query" } }),
};

export type ListOrdersRequest = RequestProps<typeof ListOrdersRequest>;

export const ListOrdersResponse = z.object({
  items: Order.array(),
  nextKey: z.string().nullable(),
});

export type ListOrdersResponse = z.infer<typeof ListOrdersResponse>;
