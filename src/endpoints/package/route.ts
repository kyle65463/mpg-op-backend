import { createRoute, CreateRoutes } from "@/utils/api/createRoute";
import { ServiceError } from "@/utils/error/service";

import {
  CreatePackageRequest,
  DeletePackageRequest,
  ListPackagesRequest,
  ListPackagesResponse,
  PairPackageRequest,
} from "./schema";
import { PackageService } from "./service";

export const createPackageRoutes: CreateRoutes<{
  packageService: PackageService;
}> = ({ packageService: service }) => {
  return async (server) => {
    createRoute({
      server,
      method: "post",
      path: "/api/v1/packages",
      summary: "Create a package",
      needAuthenticated: false,
      schemas: {
        request: CreatePackageRequest,
        response: { statusCode: 201 },
      },
      errors: [ServiceError.ProductNotFound],
      handler: service.createPackage,
    });

    createRoute({
      server,
      method: "get",
      path: "/api/v1/packages",
      summary: "List packages",
      needAuthenticated: false,
      schemas: {
        request: ListPackagesRequest,
        response: ListPackagesResponse,
      },
      handler: service.listPackages,
    });

    createRoute({
      server,
      method: "delete",
      path: "/api/v1/packages/:id",
      summary: "Delete a package",
      needAuthenticated: false,
      schemas: {
        request: DeletePackageRequest,
        response: { statusCode: 204 },
      },
      errors: [ServiceError.PackageNotFound],
      handler: service.deletePackage,
    });

    createRoute({
      server,
      method: "post",
      path: "/api/v1/packages/:id/pair",
      summary: "Pair a package with a native package",
      needAuthenticated: false,
      schemas: {
        request: PairPackageRequest,
        response: { statusCode: 204 },
      },
      errors: [
        ServiceError.PackageNotFound,
        ServiceError.NativePackageNotFound,
      ],
      handler: service.pairPackage,
    });
  };
};
