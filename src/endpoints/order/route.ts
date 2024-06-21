import { Order } from "@/models/order";
import { createRoute, CreateRoutes } from "@/utils/api/createRoute";
import { ServiceError } from "@/utils/error/service";

import {
  GetOrderRequest,
  ListOrdersRequest,
  ListOrdersResponse,
} from "./schema";
import { OrderService } from "./service";

export const createOrderRoutes: CreateRoutes<{
  orderService: OrderService;
}> = ({ orderService: service }) => {
  return async (server) => {
    createRoute({
      server,
      method: "get",
      path: "/api/v1/orders/:id",
      summary: "Get a order",
      needAuthenticated: false,
      schemas: {
        request: GetOrderRequest,
        response: Order,
      },
      errors: [ServiceError.OrderNotFound],
      handler: service.getOrder,
    });

    createRoute({
      server,
      method: "get",
      path: "/api/v1/orders",
      summary: "List orders",
      needAuthenticated: false,
      schemas: {
        request: ListOrdersRequest,
        response: ListOrdersResponse,
      },
      handler: service.listOrders,
    });
  };
};
