import { z } from "zod";

import { RawNativeProduct } from "@/repos/nativeProductRepo";
import { registerModelToApiDocs } from "@/utils/api/openapi";
import { Region, Source } from "@/utils/enums";

import { formatNativePackage, NativePackage } from "./nativePackage";

export const NativeProduct = registerModelToApiDocs(
  "NativeProduct",
  z.object({
    id: z.string().uuid(),
    name: z.string(),
    source: z.nativeEnum(Source),
    region: z.nativeEnum(Region),
    packages: NativePackage.array(),
    productId: z.number().int().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
  }),
);

export type NativeProduct = z.infer<typeof NativeProduct>;

export function formatNativeProduct(raw: RawNativeProduct): NativeProduct {
  return {
    id: raw.id,
    name: raw.name,
    source: raw.source as Source,
    region: raw.region as Region,
    packages: raw.packages.map(formatNativePackage),
    productId: raw.productId,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}
