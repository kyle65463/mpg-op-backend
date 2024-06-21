import { z } from "zod";

import { Package } from "@/models/package";
import { RequestProps } from "@/utils/api/schema";
import { Region } from "@/utils/enums";

// #################################
// Create package
// #################################
export const CreatePackageRequest = {
  body: z.object({
    name: z.string(),
    region: z.nativeEnum(Region),
    productId: z.number().int(),
  }),
};

export type CreatePackageRequest = RequestProps<typeof CreatePackageRequest>;

// #################################
// List packages
// #################################
export const ListPackagesRequestQuery = z.object({
  region: z.nativeEnum(Region),
  productId: z.coerce.number().int().optional(),
  limit: z.coerce.number().min(1).max(40).default(30).optional(),
  cursor: z.coerce.number().int().optional(),
});

export type ListPackagesRequestQuery = z.infer<typeof ListPackagesRequestQuery>;

export const ListPackagesRequest = {
  query: z
    .object({ nextKey: z.string() })
    .or(ListPackagesRequestQuery.omit({ cursor: true }))
    .openapi({ param: { name: "query" } }),
};

export type ListPackagesRequest = RequestProps<typeof ListPackagesRequest>;

export const ListPackagesResponse = z.object({
  items: Package.array(),
  nextKey: z.string().nullable(),
});

export type ListPackagesResponse = z.infer<typeof ListPackagesResponse>;

// #################################
// Delete package
// #################################
export const DeletePackageRequest = {
  params: z.object({
    id: z.coerce.number().int(),
  }),
};

export type DeletePackageRequest = RequestProps<typeof DeletePackageRequest>;
