import { Post } from "@/models/post";
import { createRoute, CreateRoutes } from "@/utils/api/createRoute";
import { ServiceError } from "@/utils/error/service";

import {
  CreatePostRequest,
  DeletePostRequest,
  GetPostRequest,
  LikePostRequest,
  ListPostsRequest,
  ListPostsResponse,
  UnlikePostRequest,
} from "./schema";
import { PostService } from "./service";

export const createPostRoutes: CreateRoutes<{
  postService: PostService;
}> = ({ postService: service }) => {
  return async (server) => {
    createRoute({
      server,
      method: "get",
      path: "/api/v1/posts/:id",
      summary: "Get a post",
      needAuthenticated: false,
      schemas: {
        request: GetPostRequest,
        response: Post,
      },
      errors: [ServiceError.PostNotFound],
      handler: service.getPost,
    });

    createRoute({
      server,
      method: "post",
      path: "/api/v1/posts",
      summary: "Create a post",
      needAuthenticated: true,
      schemas: {
        request: CreatePostRequest,
        response: { statusCode: 201 },
      },
      handler: service.createPost,
    });

    createRoute({
      server,
      method: "get",
      path: "/api/v1/posts",
      summary: "List posts",
      needAuthenticated: false,
      schemas: {
        request: ListPostsRequest,
        response: ListPostsResponse,
      },
      handler: service.listPosts,
    });

    createRoute({
      server,
      method: "delete",
      path: "/api/v1/posts/:id",
      summary: "Delete a post",
      needAuthenticated: true,
      schemas: {
        request: DeletePostRequest,
        response: { statusCode: 204 },
      },
      errors: [ServiceError.PostNotFound, ServiceError.NoPermission],
      handler: service.deletePost,
    });

    createRoute({
      server,
      method: "put",
      path: "/api/v1/posts/like/:id",
      summary: "Like a post",
      needAuthenticated: true,
      schemas: {
        request: LikePostRequest,
        response: { statusCode: 204 },
      },
      errors: [ServiceError.PostNotFound, ServiceError.PostAlreadyLiked],
      handler: service.likePost,
    });

    createRoute({
      server,
      method: "delete",
      path: "/api/v1/posts/like/:id",
      summary: "Unlike a post",
      needAuthenticated: true,
      schemas: {
        request: UnlikePostRequest,
        response: { statusCode: 204 },
      },
      errors: [ServiceError.PostNotFound, ServiceError.PostNotLiked],
      handler: service.unlikePost,
    });
  };
};
