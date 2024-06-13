export const RepoError = {
  // Common
  NotFound: new Error("Not found"),
  LimitExceeded: new Error("Limit exceeded"),
  Duplicated: new Error("Duplicated"),
  InvalidArgument: new Error("Invalid argument"),
  NoPermission: new Error("No permission"),

  // Post
  PostNotLiked: new Error("Post not liked"),
  PostNotFound: new Error("Post not found"),

  // Comment
  ParentCommentNotMatchWithPost: new Error("Comment not match"),
  CommentOnSubcomment: new Error("Comment on subcomment"),
};

export const defaultLimit = 15;
