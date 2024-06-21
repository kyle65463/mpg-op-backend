import {
  BadRequestError,
  InternalServerError,
  NoPermissionError,
  NotFoundError,
  NotImplementedError,
  UnauthorizedError,
} from "./base";

export const ServiceError = {
  // General
  InternalServerError: new InternalServerError("0000", "Internal server error"),
  RouteNotFound: new NotFoundError("0001", "Route not found"),
  InvalidArgument: new BadRequestError("0002", "Invalid argument"),
  NoPermission: new NoPermissionError("0003", "No permission"),
  NotImplementedError: new NotImplementedError("0004", "Not implemented"),
  Unauthorized: new UnauthorizedError("0005", "Unauthorized"),
  EmailNotVerified: new UnauthorizedError("0006", "Email not verified"),
  InvalidNextKey: new BadRequestError("0007", "Invalid next key"),
};
