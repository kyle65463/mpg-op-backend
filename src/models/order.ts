import { z } from "zod";

import { RawOrder } from "@/repos/orderRepo";
import { registerModelToApiDocs } from "@/utils/api/openapi";
import { Region, Source } from "@/utils/enums";

export const Order = registerModelToApiDocs(
  "Order",
  z.object({
    id: z.number().int(),
    status: z.string(),
    quantity: z.number().int(),
    customer: z.object({
      name: z.string(),
      email: z.string(),
    }),
    bookedAt: z.date(),
    departureAt: z.date(),
    nativeId: z.string(),
    product: z.object({
      id: z.number().int().nullable(),
      name: z.string(),
    }),
    package: z.object({
      id: z.number().int().nullable(),
      name: z.string(),
    }),
    source: z.nativeEnum(Source),
    region: z.nativeEnum(Region),
    createdAt: z.date(),
    updatedAt: z.date(),
  }),
);

export type Order = z.infer<typeof Order>;

export function formatOrder(raw: RawOrder): Order {
  return {
    id: raw.id,
    status: raw.status,
    quantity: raw.quantity,
    customer: raw.customer as { name: string; email: string },
    bookedAt: raw.bookedAt,
    departureAt: raw.departureAt,
    nativeId: raw.nativeId,
    product: {
      id: raw.nativeProduct.productId,
      // TODO: Show the name of product instead of native product
      name: raw.nativeProduct.product?.name ?? raw.nativeProduct.name,
    },
    package: {
      id: raw.nativePackage.packageId,
      name: raw.nativePackage.package?.name ?? raw.nativePackage.name,
    },
    region: raw.region as Region,
    source: raw.source as Source,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}
