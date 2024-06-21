import { formatPackage } from "@/models/package";
import { PackageRepo } from "@/repos/packageRepo";
import {
  decodeNextKey,
  encodeNextKey,
  hasNextKey,
} from "@/utils/api/pagination";
import { areErrorsEqual } from "@/utils/error/base";
import { RepoError } from "@/utils/error/repo";
import { ServiceError } from "@/utils/error/service";

import {
  CreatePackageRequest,
  DeletePackageRequest,
  ListPackagesRequest,
  ListPackagesRequestQuery,
  ListPackagesResponse,
} from "./schema";

function handleError(err: unknown): never {
  if (areErrorsEqual(err, RepoError.NotFound)) {
    throw ServiceError.PackageNotFound;
  }
  if (areErrorsEqual(err, RepoError.ProductNotFound)) {
    throw ServiceError.ProductNotFound;
  }
  throw err;
}

// #################################
// Service
// #################################
export const createPackageService = ({
  packageRepo,
}: {
  packageRepo: PackageRepo;
}) => {
  return {
    createPackage: async (data: CreatePackageRequest): Promise<void> => {
      await packageRepo.create(data).catch(handleError);
    },

    listPackages: async (
      req: ListPackagesRequest,
    ): Promise<ListPackagesResponse> => {
      const options = hasNextKey(req)
        ? decodeNextKey(req.nextKey, ListPackagesRequestQuery)
        : req;

      const packages = await packageRepo.list(options);
      const cursor =
        packages.length === options.limit
          ? packages[packages.length - 1].id
          : null;

      return {
        items: packages.map(formatPackage),
        nextKey: cursor ? encodeNextKey({ ...options, cursor }) : null,
      };
    },

    deletePackage: async (req: DeletePackageRequest): Promise<void> => {
      await packageRepo.delete(req.id).catch(handleError);
    },
  };
};

export type PackageService = ReturnType<typeof createPackageService>;
