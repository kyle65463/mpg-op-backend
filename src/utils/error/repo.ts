export const RepoError = {
  // Common
  NotFound: new Error("Not found"),
  LimitExceeded: new Error("Limit exceeded"),
  Duplicated: new Error("Duplicated"),
  InvalidArgument: new Error("Invalid argument"),
  NoPermission: new Error("No permission"),
};

export const defaultLimit = 15;
