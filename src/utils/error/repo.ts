export const RepoError = {
  // Common
  NotFound: new Error("Not found"),
  LimitExceeded: new Error("Limit exceeded"),
  Duplicated: new Error("Duplicated"),
  InvalidArgument: new Error("Invalid argument"),
  NoPermission: new Error("No permission"),

  // Native Product
  NativeProductNotFound: new Error("Native product not found"),

  // Native Package
  NativePackageNotFound: new Error("Native package not found"),

  // Product
  ProductNotFound: new Error("Product not found"),
};

export const defaultLimit = 15;
