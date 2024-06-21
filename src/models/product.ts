import { z } from "zod";

import { RawProduct } from "@/repos/productRepo";
import { registerModelToApiDocs } from "@/utils/api/openapi";
import { Region } from "@/utils/enums";

import { formatPackage, Package } from "./package";

export const Product = registerModelToApiDocs(
  "Product",
  z.object({
    id: z.number(),
    name: z.string(),
    region: z.nativeEnum(Region),
    package: Package.array().optional(),
    createdAt: z.date(),
    updatedAt: z.date(),
  }),
);

export type Product = z.infer<typeof Product>;

export function formatProduct(raw: RawProduct): Product {
  return {
    id: raw.id,
    name: raw.name,
    region: raw.region as Region,
    package: raw.package?.map(formatPackage),
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}
