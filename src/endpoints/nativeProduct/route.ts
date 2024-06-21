import { createRoute, CreateRoutes } from "@/utils/api/createRoute";

import {
  ListNativeProductsRequest,
  ListNativeProductsResponse,
} from "./schema";
import { NativeProductService } from "./service";

export const createNativeProductRoutes: CreateRoutes<{
  nativeProductService: NativeProductService;
}> = ({ nativeProductService: service }) => {
  return async (server) => {
    createRoute({
      server,
      method: "get",
      path: "/api/v1/native-products",
      summary: "List native products",
      needAuthenticated: false,
      schemas: {
        request: ListNativeProductsRequest,
        response: ListNativeProductsResponse,
      },
      handler: service.listNativeProducts,
    });
  };
};
