import {
  Prisma,
  PrismaClient,
  Product as PrismaProduct,
} from "@prisma/pg/index";

import { Region } from "@/utils/enums";
import { handlePrismaError, PrismaError } from "@/utils/error/prisma";
import { RepoError } from "@/utils/error/repo";

import { RawPackage } from "./packageRepo";

export type RawProduct = PrismaProduct & {
  package?: RawPackage[];
};

const handleError = handlePrismaError({
  [PrismaError.NotFound]: RepoError.NotFound,
});

const handleLinkError = handlePrismaError({
  [PrismaError.ForeignKeyConstraint]: RepoError.NotFound,
  [PrismaError.NotFound]: RepoError.NativeProductNotFound,
});

interface GetProductOptions {
  withPackages?: boolean;
}

export interface ProductCreationData {
  name: string;
  region: Region;
}

export interface ProductUpdateData {
  name: string;
}

export interface ListProductsOptions {
  region?: Region;
  limit?: number;
  cursor?: number;
  withPackages?: boolean;
}

export function createProductRepo(db: PrismaClient) {
  return {
    get: async (
      id: number,
      options: GetProductOptions = {},
    ): Promise<RawProduct> => {
      return await db.product
        .findUniqueOrThrow({
          where: { id },
          include: { packages: options.withPackages },
        })
        .catch(handleError);
    },

    create: async (data: ProductCreationData): Promise<RawProduct> => {
      const product = await db.product
        .create({
          data: {
            name: data.name,
            region: data.region,
          },
        })
        .catch(handleError);
      return product;
    },

    list: async (options: ListProductsOptions): Promise<RawProduct[]> => {
      const query: Prisma.ProductFindManyArgs = {
        where: {},
        include: { packages: options.withPackages },
        orderBy: { id: "asc" },
      };

      if (options.region) {
        query.where!.region = options.region;
      }

      if (options.cursor) {
        query.cursor = {
          id: options.cursor,
        };
        query.skip = 1;
      }

      const products = await db.product.findMany({
        where: query.where,
        orderBy: query.orderBy,
        cursor: query.cursor,
        skip: query.skip,
        take: options.limit ?? 30,
      });

      return products;
    },

    update: async (
      id: number,
      data: ProductUpdateData,
    ): Promise<RawProduct> => {
      const product = await db.product
        .update({
          where: {
            id: id,
          },
          data: {
            name: data.name,
          },
        })
        .catch(handleError);
      return product;
    },

    delete: async (id: number): Promise<void> => {
      await db.$transaction(async (tx) => {
        // Ensure the product exists
        await tx.product
          .findUniqueOrThrow({ where: { id } })
          .catch(handleError);
        await db.product.delete({ where: { id } });
      });
    },

    link: async (
      productId: number,
      nativeProductId: string,
      source: string,
    ): Promise<void> => {
      await db.nativeProduct
        .update({
          where: {
            id_source: {
              id: nativeProductId,
              source,
            },
          },
          data: {
            product: {
              connect: {
                id: productId,
              },
            },
          },
        })
        .catch(handleLinkError);
    },

    unlink: async (
      productId: number,
      nativeProductId: string,
      source: string,
    ): Promise<void> => {
      await db.product
        .findUniqueOrThrow({ where: { id: productId } })
        .catch(handleError);
      await db.nativeProduct
        .update({
          where: {
            id_source: {
              id: nativeProductId,
              source,
            },
            productId,
          },
          data: {
            productId: null,
          },
        })
        .catch(handleLinkError);
    },
  };
}

export type ProductRepo = ReturnType<typeof createProductRepo>;
