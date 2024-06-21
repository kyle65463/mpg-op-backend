import { formatOrder, Order } from "@/models/order";
import { OrderRepo } from "@/repos/orderRepo";
import {
  decodeNextKey,
  encodeNextKey,
  hasNextKey,
} from "@/utils/api/pagination";
import { areErrorsEqual } from "@/utils/error/base";
import { RepoError } from "@/utils/error/repo";
import { ServiceError } from "@/utils/error/service";

import {
  GetOrderRequest,
  ListOrdersRequest,
  ListOrdersRequestQuery,
  ListOrdersResponse,
} from "./schema";

function handleError(err: unknown): never {
  if (areErrorsEqual(err, RepoError.NotFound)) {
    throw ServiceError.OrderNotFound;
  }
  throw err;
}

// #################################
// Service
// #################################
export const createOrderService = ({ orderRepo }: { orderRepo: OrderRepo }) => {
  return {
    getOrder: async (req: GetOrderRequest): Promise<Order> => {
      const order = await orderRepo.get(req.id).catch(handleError);

      return formatOrder(order);
    },

    listOrders: async (req: ListOrdersRequest): Promise<ListOrdersResponse> => {
      const options = hasNextKey(req)
        ? decodeNextKey(req.nextKey, ListOrdersRequestQuery)
        : req;

      const orders = await orderRepo.list(options);
      const cursor =
        orders.length === options.limit ? orders[orders.length - 1].id : null;

      return {
        items: orders.map(formatOrder),
        nextKey: cursor ? encodeNextKey({ ...options, cursor }) : null,
      };
    },
  };
};

export type OrderService = ReturnType<typeof createOrderService>;
