import { z } from "zod";

import { RawNativePackage } from "@/repos/nativeProductRepo";
import { registerModelToApiDocs } from "@/utils/api/openapi";
import { Region, Source } from "@/utils/enums";

export const NativePackage = registerModelToApiDocs(
  "NativePackage",
  z.object({
    id: z.string().uuid(),
    name: z.string(),
    source: z.nativeEnum(Source),
    region: z.nativeEnum(Region),
    packageId: z.number().int().nullable(),
    createdAt: z.date(),
    updatedAt: z.date(),
  }),
);

export type NativePackage = z.infer<typeof NativePackage>;

export function formatNativePackage(raw: RawNativePackage): NativePackage {
  return {
    id: raw.id,
    name: raw.name,
    source: raw.source as Source,
    region: raw.region as Region,
    packageId: raw.packageId,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}
