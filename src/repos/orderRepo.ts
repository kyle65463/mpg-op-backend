import { Prisma, PrismaClient } from "@prisma/pg/index";

import { Region } from "@/utils/enums";
import { handlePrismaError, PrismaError } from "@/utils/error/prisma";
import { RepoError } from "@/utils/error/repo";

const include: Prisma.OrderInclude = {
  nativePackage: {
    include: {
      package: true,
    },
  },
  nativeProduct: {
    include: {
      product: true,
    },
  },
};

export type RawOrder = Prisma.OrderGetPayload<{
  include: typeof include;
}>;

const handleError = handlePrismaError({
  [PrismaError.NotFound]: RepoError.NotFound,
});

export interface ListOrdersOptions {
  region?: Region;
  limit?: number;
  cursor?: number;
}

export function createOrderRepo(db: PrismaClient) {
  return {
    get: async (id: number): Promise<RawOrder> => {
      return await db.order
        .findUniqueOrThrow({
          where: { id },
          include,
        })
        .catch(handleError);
    },

    list: async (options: ListOrdersOptions): Promise<RawOrder[]> => {
      const query: Prisma.OrderFindManyArgs = {
        where: {},
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

      const orders = await db.order.findMany({
        include,
        where: query.where,
        orderBy: query.orderBy,
        cursor: query.cursor,
        skip: query.skip,
        take: options.limit ?? 30,
      });

      return orders;
    },
  };
}

export type OrderRepo = ReturnType<typeof createOrderRepo>;
