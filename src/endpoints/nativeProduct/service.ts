import { formatNativeProduct } from "@/models/nativeProduct";
import { NativeProductRepo } from "@/repos/nativeProductRepo";
import {
  decodeNextKey,
  encodeNextKey,
  hasNextKey,
} from "@/utils/api/pagination";

import {
  ListNativeProductsRequest,
  ListNativeProductsRequestQuery,
  ListNativeProductsResponse,
} from "./schema";

export const createNativeProductService = ({
  nativeProductRepo,
}: {
  nativeProductRepo: NativeProductRepo;
}) => {
  return {
    listNativeProducts: async (
      req: ListNativeProductsRequest,
    ): Promise<ListNativeProductsResponse> => {
      const options = hasNextKey(req)
        ? decodeNextKey(req.nextKey, ListNativeProductsRequestQuery)
        : req;

      const nativeProducts = await nativeProductRepo.list(options);

      const offset =
        nativeProducts.length === options.limit
          ? (options.offset ?? 0) + options.limit
          : null;

      return {
        items: nativeProducts.map(formatNativeProduct),
        nextKey: offset ? encodeNextKey({ ...options, offset }) : null,
      };
    },
  };
};

export type NativeProductService = ReturnType<
  typeof createNativeProductService
>;
