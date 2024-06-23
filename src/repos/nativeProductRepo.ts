import {
  NativePackage as PrismaNativePackage,
  Prisma,
  PrismaClient,
} from "@prisma/pg/index";

import { Region, Source } from "@/utils/enums";

const include: Prisma.NativeProductInclude = {
  packages: true,
};

export type RawNativeProduct = Prisma.NativeProductGetPayload<{
  include: typeof include;
}>;
export type RawNativePackage = PrismaNativePackage;

export interface ListNativeProductsOptions {
  name?: string;
  productId?: number;
  noProductId?: boolean;
  region?: Region;
  source?: Source;
  limit?: number;
  offset?: number;
}

export function createNativeProductRepo(db: PrismaClient) {
  return {
    list: async (
      options: ListNativeProductsOptions,
    ): Promise<RawNativeProduct[]> => {
      const query: Prisma.NativeProductFindManyArgs = {
        where: {},
        orderBy: [
          {
            productId: {
              sort: "desc",
              nulls: "first",
            },
          },
          { createdAt: "desc" },
          { source: "desc" },
          { id: "desc" },
        ],
      };

      if (options.name) {
        query.where!.name = { contains: options.name };
      }

      if (options.productId) {
        query.where!.productId = options.productId;
      }
      // TODO: Handle cases when both productId and noProductId are provided

      if (options.noProductId) {
        query.where!.productId = null;
      }

      if (options.region) {
        query.where!.region = options.region;
      }

      if (options.offset) {
        query.skip = options.offset;
      }

      const products = await db.nativeProduct.findMany({
        include,
        where: query.where,
        orderBy: query.orderBy,
        cursor: query.cursor,
        skip: query.skip,
        take: options.limit ?? 30,
      });

      return products;
    },
  };
}

export type NativeProductRepo = ReturnType<typeof createNativeProductRepo>;
