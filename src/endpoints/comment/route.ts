import { createRoute, CreateRoutes } from "@/utils/api/createRoute";
import { ServiceError } from "@/utils/error/service";

import {
  CreateCommentRequest,
  DeleteCommentRequest,
  ListCommentsRequest,
  ListCommentsResponse,
} from "./schema";
import { CommentService } from "./service";

export const createCommentRoutes: CreateRoutes<{
  commentService: CommentService;
}> = ({ commentService: service }) => {
  return async (server) => {
    createRoute({
      server,
      method: "post",
      path: "/api/v1/comments",
      summary: "Create a comment",
      needAuthenticated: true,
      schemas: {
        request: CreateCommentRequest,
        response: { statusCode: 201 },
      },
      errors: [
        ServiceError.PostNotFound,
        ServiceError.CommentNotFound,
        ServiceError.CommentOnSubcomment,
        ServiceError.ParentCommentNotMatchWithPost,
      ],
      handler: service.createComment,
    });

    createRoute({
      server,
      method: "get",
      path: "/api/v1/comments",
      summary: "List comments",
      needAuthenticated: false,
      schemas: {
        request: ListCommentsRequest,
        response: ListCommentsResponse,
      },
      errors: [ServiceError.PostNotFound],
      handler: service.listComments,
    });

    createRoute({
      server,
      method: "delete",
      path: "/api/v1/comments/:id",
      summary: "Delete a comment",
      needAuthenticated: true,
      schemas: {
        request: DeleteCommentRequest,
        response: { statusCode: 204 },
      },
      errors: [ServiceError.CommentNotFound, ServiceError.NoPermission],
      handler: service.deleteComment,
    });
  };
};
