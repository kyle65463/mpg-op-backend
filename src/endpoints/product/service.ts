import { formatProduct, Product } from "@/models/product";
import { ProductRepo } from "@/repos/productRepo";
import {
  decodeNextKey,
  encodeNextKey,
  hasNextKey,
} from "@/utils/api/pagination";
import { areErrorsEqual } from "@/utils/error/base";
import { RepoError } from "@/utils/error/repo";
import { ServiceError } from "@/utils/error/service";

import {
  CreateProductRequest,
  DeleteProductRequest,
  GetProductRequest,
  ListProductsRequest,
  ListProductsRequestQuery,
  ListProductsResponse,
  PairProductRequest,
} from "./schema";

function handleError(err: unknown): never {
  if (areErrorsEqual(err, RepoError.NotFound)) {
    throw ServiceError.ProductNotFound;
  }
  if (areErrorsEqual(err, RepoError.NativeProductNotFound)) {
    throw ServiceError.NativeProductNotFound;
  }
  throw err;
}

// #################################
// Service
// #################################
export const createProductService = ({
  productRepo,
}: {
  productRepo: ProductRepo;
}) => {
  return {
    getProduct: async (req: GetProductRequest): Promise<Product> => {
      const product = await productRepo
        .get(req.id, {
          withPackages: req.withPackages,
        })
        .catch(handleError);

      return formatProduct(product);
    },

    createProduct: async (data: CreateProductRequest): Promise<Product> => {
      const product = await productRepo.create(data).catch(handleError);

      return formatProduct(product);
    },

    listProducts: async (
      req: ListProductsRequest,
    ): Promise<ListProductsResponse> => {
      const options = hasNextKey(req)
        ? decodeNextKey(req.nextKey, ListProductsRequestQuery)
        : req;

      const products = await productRepo.list(options);
      const cursor =
        products.length === options.limit
          ? products[products.length - 1].id
          : null;

      return {
        items: products.map(formatProduct),
        nextKey: cursor ? encodeNextKey({ ...options, cursor }) : null,
      };
    },

    deleteProduct: async (req: DeleteProductRequest): Promise<void> => {
      await productRepo.delete(req.id).catch(handleError);
    },

    pairProduct: async (req: PairProductRequest): Promise<void> => {
      await productRepo
        .pair(req.id, req.nativeProductId, req.source)
        .catch(handleError);
    },
  };
};

export type ProductService = ReturnType<typeof createProductService>;
