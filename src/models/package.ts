import { z } from "zod";

import { RawPackage } from "@/repos/packageRepo";
import { registerModelToApiDocs } from "@/utils/api/openapi";
import { Region } from "@/utils/enums";

export const Package = registerModelToApiDocs(
  "Package",
  z.object({
    id: z.number().int(),
    name: z.string(),
    region: z.nativeEnum(Region),
    productId: z.number().int(),
    createdAt: z.date(),
    updatedAt: z.date(),
  }),
);

export type Package = z.infer<typeof Package>;

export function formatPackage(raw: RawPackage): Package {
  return {
    id: raw.id,
    name: raw.name,
    region: raw.region as Region,
    productId: raw.productId,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}
