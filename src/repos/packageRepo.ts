import {
  Package as PrismaPackage,
  Prisma,
  PrismaClient,
} from "@prisma/pg/index";

import { Region } from "@/utils/enums";
import { handlePrismaError, PrismaError } from "@/utils/error/prisma";
import { RepoError } from "@/utils/error/repo";

export type RawPackage = PrismaPackage;

const handleError = handlePrismaError({
  [PrismaError.ForeignKeyConstraint]: RepoError.ProductNotFound,
  [PrismaError.NotFound]: RepoError.NotFound,
});

const handlePairError = handlePrismaError({
  [PrismaError.ForeignKeyConstraint]: RepoError.NotFound,
  [PrismaError.NotFound]: RepoError.NativePackageNotFound,
});

export interface CreatePackageData {
  name: string;
  region: Region;
  productId: number;
}

export interface ListPackagesOptions {
  productId?: number;
  region?: Region;
  limit?: number;
  cursor?: number;
}

export function createPackageRepo(db: PrismaClient) {
  return {
    create: async (data: CreatePackageData): Promise<void> => {
      await db.package
        .create({
          data: {
            name: data.name,
            region: data.region,
            productId: data.productId,
          },
        })
        .catch(handleError);
    },

    list: async (options: ListPackagesOptions): Promise<RawPackage[]> => {
      const query: Prisma.PackageFindManyArgs = {
        where: {},
        orderBy: { id: "asc" },
      };

      if (options.productId) {
        query.where!.productId = options.productId;
      }

      if (options.region) {
        query.where!.region = options.region;
      }

      if (options.cursor) {
        query.cursor = {
          id: options.cursor,
        };
        query.skip = 1;
      }

      const packages = await db.package.findMany({
        where: query.where,
        orderBy: query.orderBy,
        cursor: query.cursor,
        skip: query.skip,
        take: options.limit ?? 30,
      });

      return packages;
    },

    delete: async (id: number): Promise<void> => {
      await db.$transaction(async (tx) => {
        // Ensure the package exists
        await tx.package
          .findUniqueOrThrow({ where: { id } })
          .catch(handleError);
        await db.package.delete({ where: { id } });
      });
    },

    pair: async (
      packageId: number,
      nativePackageId: string,
      source: string,
    ): Promise<void> => {
      await db.nativePackage
        .update({
          where: {
            id_source: {
              id: nativePackageId,
              source,
            },
          },
          data: {
            package: {
              connect: {
                id: packageId,
              },
            },
          },
        })
        .catch(handlePairError);
    },
  };
}

export type PackageRepo = ReturnType<typeof createPackageRepo>;
