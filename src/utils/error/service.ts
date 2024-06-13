import {
  BadRequestError,
  ConflictError,
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

  // Post
  PostNotFound: new NotFoundError("5000", "Post not found"),
  PostAlreadyLiked: new ConflictError("5001", "Post already liked"),
  PostNotLiked: new ConflictError("5002", "Post not liked"),

  // Comment
  CommentNotFound: new NotFoundError("5004", "Comment not found"),
  CommentOnSubcomment: new ConflictError("5005", "Comment on subcomment"),
  ParentCommentNotMatchWithPost: new ConflictError(
    "5006",
    "ParentCommentNotMatchWithPost",
  ),
};
