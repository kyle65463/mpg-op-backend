import { z } from "zod";

import { Product } from "@/models/product";
import { RequestProps } from "@/utils/api/schema";
import { Region, Source } from "@/utils/enums";

// #################################
// Get product
// #################################
export const GetProductRequest = {
  params: z.object({
    id: z.coerce.number().int(),
    withPackages: z.coerce.boolean().optional(),
  }),
};

export type GetProductRequest = RequestProps<typeof GetProductRequest>;

// #################################
// Create product
// #################################
export const CreateProductRequest = {
  body: z.object({
    name: z.string(),
    region: z.nativeEnum(Region),
  }),
};

export type CreateProductRequest = RequestProps<typeof CreateProductRequest>;

// #################################
// List products
// #################################
export const ListProductsRequestQuery = z.object({
  withPackages: z.coerce.boolean().optional(),
  region: z.nativeEnum(Region),
  limit: z.coerce.number().min(1).max(40).default(30).optional(),
  cursor: z.coerce.number().int().optional(),
});

export type ListProductsRequestQuery = z.infer<typeof ListProductsRequestQuery>;

export const ListProductsRequest = {
  query: z
    .object({ nextKey: z.string() })
    .or(ListProductsRequestQuery.omit({ cursor: true }))
    .openapi({ param: { name: "query" } }),
};

export type ListProductsRequest = RequestProps<typeof ListProductsRequest>;

export const ListProductsResponse = z.object({
  items: Product.array(),
  nextKey: z.string().nullable(),
});

export type ListProductsResponse = z.infer<typeof ListProductsResponse>;

// #################################
// Update product
// #################################
export const UpdateProductRequest = {
  params: z.object({
    id: z.coerce.number().int(),
  }),
  body: z.object({
    name: z.string(),
  }),
};

export type UpdateProductRequest = RequestProps<typeof UpdateProductRequest>;

// #################################
// Delete product
// #################################
export const DeleteProductRequest = {
  params: z.object({
    id: z.coerce.number().int(),
  }),
};

export type DeleteProductRequest = RequestProps<typeof DeleteProductRequest>;

// #################################
// Link product
// #################################
export const LinkProductRequest = {
  params: z.object({
    id: z.coerce.number().int(),
  }),
  body: z.object({
    nativeProductId: z.string(),
    source: z.nativeEnum(Source),
  }),
};

export type LinkProductRequest = RequestProps<typeof LinkProductRequest>;
