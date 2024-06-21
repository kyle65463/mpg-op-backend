import { Product } from "@/models/product";
import { createRoute, CreateRoutes } from "@/utils/api/createRoute";
import { ServiceError } from "@/utils/error/service";

import {
  CreateProductRequest,
  DeleteProductRequest,
  GetProductRequest,
  ListProductsRequest,
  ListProductsResponse,
} from "./schema";
import { ProductService } from "./service";

export const createProductRoutes: CreateRoutes<{
  productService: ProductService;
}> = ({ productService: service }) => {
  return async (server) => {
    createRoute({
      server,
      method: "get",
      path: "/api/v1/products/:id",
      summary: "Get a product",
      needAuthenticated: false,
      schemas: {
        request: GetProductRequest,
        response: Product,
      },
      errors: [ServiceError.ProductNotFound],
      handler: service.getProduct,
    });

    createRoute({
      server,
      method: "post",
      path: "/api/v1/products",
      summary: "Create a product",
      needAuthenticated: true,
      schemas: {
        request: CreateProductRequest,
        response: Product,
      },
      handler: service.createProduct,
    });

    createRoute({
      server,
      method: "get",
      path: "/api/v1/products",
      summary: "List products",
      needAuthenticated: false,
      schemas: {
        request: ListProductsRequest,
        response: ListProductsResponse,
      },
      handler: service.listProducts,
    });

    createRoute({
      server,
      method: "delete",
      path: "/api/v1/products/:id",
      summary: "Delete a product",
      needAuthenticated: true,
      schemas: {
        request: DeleteProductRequest,
        response: { statusCode: 204 },
      },
      errors: [ServiceError.ProductNotFound],
      handler: service.deleteProduct,
    });
  };
};
